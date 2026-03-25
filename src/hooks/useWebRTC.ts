import { useEffect, useRef, useState, useCallback } from "react";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} from "react-native-webrtc";
import {
  streamingService,
  StreamingSession,
} from "@/api/services/streaming.service";
// ─── Configuración ────────────────────────────────────────────────────────────

const GROOMER_TIMEOUT_MS = 15_000; // tiempo máx esperando que el ally aparezca
const HEARTBEAT_INTERVAL_MS = 10_000; // ping cada 10s para detectar WS zombie
const HEARTBEAT_TIMEOUT_MS = 8_000; // si no llega pong en 8s → caída silenciosa
const MAX_RETRIES = 4; // máximo de reconexiones automáticas
const retryDelay = (attempt: number) =>
  Math.min(2000 * Math.pow(2, attempt), 30_000); // 2s, 4s, 8s, 16s

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type WebRTCConnectionState =
  | "idle"
  | "fetching_session" // GET /streaming/orders/{id}/session
  | "connecting" // WS abierto, esperando offer del ally
  | "calling" // ICE checking en curso
  | "connected" // video activo ✅
  | "disconnected" // caída temporal detectada
  | "groomer_absent" // timeout: ally no está en la sala
  | "order_not_active" // 409: orden no en in_service
  | "reconnecting" // reintento automático en curso
  | "failed" // agotó reintentos o error irrecuperable
  | "closed"; // cerrado manualmente por el usuario

export interface UseWebRTCResult {
  remoteStream: MediaStream | null;
  connectionState: WebRTCConnectionState;
  retryCount: number;
  connect: () => void;
  disconnect: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWebRTC = (orderId: string): UseWebRTCResult => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState>("idle");
  const [retryCount, setRetryCount] = useState(0);

  // Refs — valores mutables sin re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionRef = useRef<StreamingSession | null>(null);
  const groomerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatSendRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatPongRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const isCleanedUpRef = useRef(false); // true = salida manual, no reconectar
  const isConnectedRef = useRef(false); // true = ICE connected/completed

  // ── Helpers de timers ─────────────────────────────────────────────────────

  const clearTimers = useCallback(() => {
    if (groomerTimerRef.current) {
      clearTimeout(groomerTimerRef.current);
      groomerTimerRef.current = null;
    }
    if (heartbeatSendRef.current) {
      clearInterval(heartbeatSendRef.current);
      heartbeatSendRef.current = null;
    }
    if (heartbeatPongRef.current) {
      clearTimeout(heartbeatPongRef.current);
      heartbeatPongRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // ── Cerrar PC + WS sin afectar el flujo de reconexión ────────────────────

  const closePeerAndSocket = useCallback(() => {
    clearTimers();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // evitar que dispare reconexión doble
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setRemoteStream(null);
    isConnectedRef.current = false;
  }, [clearTimers]);

  // ── Limpieza total (salida manual del usuario) ────────────────────────────

  const cleanup = useCallback(() => {
    isCleanedUpRef.current = true;
    closePeerAndSocket();
  }, [closePeerAndSocket]);

  // ── Heartbeat — detecta WS zombie (abierto pero sin tráfico) ─────────────

  const startHeartbeat = useCallback((ws: WebSocket) => {
    heartbeatSendRef.current = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      try {
        ws.send(JSON.stringify({ type: "ping" }));
      } catch {
        return;
      }

      // Si no llega pong en HEARTBEAT_TIMEOUT_MS → cerrar y reconectar
      heartbeatPongRef.current = setTimeout(() => {
        if (isCleanedUpRef.current) return;
        console.warn("[WebRTC] Heartbeat timeout — cerrando WS zombie");
        ws.close();
      }, HEARTBEAT_TIMEOUT_MS);
    }, HEARTBEAT_INTERVAL_MS);
  }, []);

  // ── Backoff exponencial para reconexión ──────────────────────────────────

  const scheduleReconnect = useCallback(() => {
    if (isCleanedUpRef.current) return;
    const attempt = retryCountRef.current;

    if (attempt >= MAX_RETRIES) {
      console.warn(`[WebRTC] Max reintentos (${MAX_RETRIES}) alcanzado`);
      setConnectionState("failed");
      return;
    }

    const delay = retryDelay(attempt);
    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);
    setConnectionState("reconnecting");
    console.log(
      `[WebRTC] Reintento ${retryCountRef.current}/${MAX_RETRIES} en ${delay}ms`,
    );

    retryTimerRef.current = setTimeout(() => {
      if (!isCleanedUpRef.current) connectInternal();
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lógica principal de conexión ──────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const connectInternal = useCallback(async () => {
    if (isCleanedUpRef.current || !orderId) return;

    closePeerAndSocket();

    // PASO 1 — Sesión del backend
    // Si ya tenemos sesión (reintento por caída de WS), reutilizarla
    if (!sessionRef.current) {
      setConnectionState("fetching_session");
      try {
        sessionRef.current = await streamingService.getSession(orderId);
      } catch (error: any) {
        if (isCleanedUpRef.current) return;
        if (error?.response?.status === 409) {
          setConnectionState("order_not_active");
          return; // no reintentar — la orden no está activa
        }
        scheduleReconnect();
        return;
      }
    }

    if (isCleanedUpRef.current) return;
    const session = sessionRef.current!;
    setConnectionState("connecting");

    // PASO 2 — WebSocket con stream_token del backend
    const streamToken = session.stream_token;
    let wsUrl = session.ws_url;

    // Opción A: token como query param
    if (streamToken && !wsUrl.includes("token=")) {
      const separator = wsUrl.includes("?") ? "&" : "?";
      wsUrl = `${wsUrl}${separator}token=${streamToken}`;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    // PASO 3 — RTCPeerConnection con STUN/TURN del backend
    // react-native-webrtc crashea si cualquier servidor ICE tiene username/credential null
    const safeIceServers = (session.ice_servers ?? []).map((srv: any) => {
      const clean: any = { urls: srv.urls };
      if (srv.username != null && srv.username !== "")
        clean.username = srv.username;
      if (srv.credential != null && srv.credential !== "")
        clean.credential = srv.credential;
      return clean;
    });

    console.log(
      "[WebRTC] ICE servers saneados:",
      JSON.stringify(safeIceServers),
    );

    const pc = new RTCPeerConnection({
      iceServers:
        safeIceServers.length > 0
          ? safeIceServers
          : [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // ── Eventos del PeerConnection ─────────────────────────────────────────

    pc.addEventListener("track", (event: any) => {
      if (isCleanedUpRef.current) return;
      const stream = event.streams?.[0];
      if (stream) setRemoteStream(stream);
    });

    pc.addEventListener("icecandidate", (event: any) => {
      if (isCleanedUpRef.current || !event.candidate) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate }),
        );
      }
    });

    pc.addEventListener("iceconnectionstatechange", () => {
      if (isCleanedUpRef.current) return;
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE state: ${state}`);

      switch (state) {
        case "checking":
          setConnectionState("calling");
          break;

        case "connected":
        case "completed":
          isConnectedRef.current = true;
          setConnectionState("connected");
          // Resetear contador de reintentos al conectar exitosamente
          retryCountRef.current = 0;
          setRetryCount(0);
          clearTimers();
          startHeartbeat(ws);
          break;

        case "disconnected":
          // Puede ser transitorio (ej. cambio de red) — esperar antes de actuar
          setConnectionState("disconnected");
          break;

        case "failed":
          // ICE failed es irrecuperable en esta sesión → nueva sesión completa
          sessionRef.current = null;
          scheduleReconnect();
          break;

        case "closed":
          if (!isCleanedUpRef.current) setConnectionState("closed");
          break;
      }
    });

    // Renegociación: el ally puede cambiar cámara o stream en mitad de la sesión
    pc.addEventListener("negotiationneeded", () => {
      if (isCleanedUpRef.current || !isConnectedRef.current) return;
      // Como viewer nunca iniciamos — simplemente esperamos el nuevo offer del ally
      console.log(
        "[WebRTC] negotiationneeded — esperando offer de renegociación del ally",
      );
    });

    // ── Eventos del WebSocket ──────────────────────────────────────────────

    ws.onopen = () => {
      if (isCleanedUpRef.current) return;
      console.log("[WebRTC] WS conectado");

      // Opción B: enviar token como primer mensaje
      if (streamToken) {
        ws.send(JSON.stringify({ type: "auth", token: streamToken }));
        console.log("[WebRTC] Token enviado como primer mensaje");
      }

      // Timeout: si el groomer no aparece en GROOMER_TIMEOUT_MS → groomer_absent
      // Solo activar si es la primera vez (no en reconexiones)
      if (retryCountRef.current === 0) {
        groomerTimerRef.current = setTimeout(() => {
          if (isCleanedUpRef.current || isConnectedRef.current) return;
          setConnectionState("groomer_absent");
        }, GROOMER_TIMEOUT_MS);
      }
    };

    ws.onmessage = async (event) => {
      if (isCleanedUpRef.current) return;

      let msg: any;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      // Pong del heartbeat → cancelar el timeout de caída silenciosa
      if (msg.type === "pong") {
        if (heartbeatPongRef.current) {
          clearTimeout(heartbeatPongRef.current);
          heartbeatPongRef.current = null;
        }
        return;
      }

      // El ally notifica que cerró la transmisión limpiamente
      if (msg.type === "stream_ended") {
        console.log("[WebRTC] Ally terminó la transmisión");
        setConnectionState("closed");
        cleanup();
        return;
      }

      // Señalización WebRTC
      try {
        // Offer del ally (host) → crear y enviar answer
        if (msg.type === "offer") {
          // el SDP puede venir como msg.sdp.sdp o directo en msg.sdp
          const sdpPayload = msg.sdp ?? msg;
          await pc.setRemoteDescription(new RTCSessionDescription(sdpPayload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({ type: "answer", sdp: pc.localDescription }),
            );
          }
        }

        // Answer (no esperado en viewer, pero por robustez)
        if (msg.type === "answer") {
          const sdpPayload = msg.sdp ?? msg;
          await pc.setRemoteDescription(new RTCSessionDescription(sdpPayload));
        }

        // ICE candidate del ally — formato doc: { type: "ice-candidate", candidate: {...} }
        if (msg.type === "ice-candidate" && msg.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }

        // ICE candidate — formato legacy envuelto { type: "candidate", candidate: {...} }
        if (msg.type === "candidate" && msg.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }

        // ICE candidate — formato raw (sin type)
        if (msg.candidate !== undefined && msg.type === undefined) {
          await pc.addIceCandidate(new RTCIceCandidate(msg));
        }
      } catch (err) {
        console.error("[WebRTC] Error procesando señalización:", err);
      }
    };

    ws.onerror = (err) => {
      if (isCleanedUpRef.current) return;
      console.warn("[WebRTC] WS error:", err);
      // No reconectar aquí — siempre llega un onclose después del onerror
    };

    ws.onclose = (event) => {
      if (isCleanedUpRef.current) return;
      console.log(
        `[WebRTC] WS cerrado — code=${event.code} wasConnected=${isConnectedRef.current}`,
      );

      // Limpiar heartbeat
      if (heartbeatSendRef.current) {
        clearInterval(heartbeatSendRef.current);
        heartbeatSendRef.current = null;
      }
      if (heartbeatPongRef.current) {
        clearTimeout(heartbeatPongRef.current);
        heartbeatPongRef.current = null;
      }

      const currentState = connectionState;
      if (
        currentState === "groomer_absent" ||
        currentState === "order_not_active"
      ) {
        return; // estados terminales — no reconectar
      }

      if (isConnectedRef.current) {
        // Estábamos con video → reconectar con nueva sesión
        sessionRef.current = null;
        scheduleReconnect();
      } else {
        // No llegamos a conectar → reconectar
        scheduleReconnect();
      }
    };
  }, [
    orderId,
    closePeerAndSocket,
    clearTimers,
    startHeartbeat,
    scheduleReconnect,
    cleanup,
  ]);

  // ── API pública ───────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    isCleanedUpRef.current = false;
    retryCountRef.current = 0;
    sessionRef.current = null;
    setRetryCount(0);
    setConnectionState("idle");
    connectInternal();
  }, [connectInternal]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("closed");
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { remoteStream, connectionState, retryCount, connect, disconnect };
};
