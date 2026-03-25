import { useState, useRef, useCallback, useEffect } from "react";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  mediaDevices,
} from "react-native-webrtc";
import {
  streamingService,
  StreamingSession,
} from "@/api/services/streaming.service";

// ─── Configuración ────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const retryDelay = (n: number) => Math.min(2000 * Math.pow(2, n), 16_000);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type GroomerStreamState =
  | "idle" // sin iniciar
  | "requesting_perms" // pidiendo permisos de cámara/mic
  | "preview" // cámara activa, aún no transmitiendo
  | "fetching_session" // GET /session
  | "connecting" // WS abierto, enviando offer
  | "live" // transmitiendo ✅
  | "reconnecting" // reintentando tras caída
  | "failed" // agotó reintentos
  | "ended"; // detenido por el groomer

export interface UseGroomerStreamingResult {
  localStream: MediaStream | null;
  streamState: GroomerStreamState;
  isMuted: boolean;
  isFrontCamera: boolean;
  retryCount: number;
  // Acciones
  startPreview: () => Promise<void>;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  toggleMic: () => void;
  flipCamera: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGroomerStreaming(
  orderId: string,
): UseGroomerStreamingResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streamState, setStreamState] = useState<GroomerStreamState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionRef = useRef<StreamingSession | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const isStoppedRef = useRef(false); // true = groomer detuvo manualmente

  // ── Helpers ──────────────────────────────────────────────────────────────

  const closeWsAndPc = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  // ── Obtener stream de cámara ──────────────────────────────────────────────

  const startPreview = useCallback(async () => {
    setStreamState("requesting_perms");
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: isFrontCamera ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setStreamState("preview");
    } catch (err) {
      console.error("[Groomer] Error accediendo a cámara:", err);
      setStreamState("failed");
    }
  }, [isFrontCamera]);

  // ── Lógica principal de conexión ──────────────────────────────────────────

  const connectInternal = useCallback(async () => {
    if (isStoppedRef.current || !orderId) return;

    closeWsAndPc();

    // PASO 1 — Sesión del backend
    if (!sessionRef.current) {
      setStreamState("fetching_session");
      try {
        sessionRef.current = await streamingService.getSession(orderId);
        if (sessionRef.current.role !== "host") {
          console.error(
            "[Groomer] El backend asignó rol viewer — esperando host",
          );
          setStreamState("failed");
          return;
        }
      } catch (err: any) {
        if (isStoppedRef.current) return;
        scheduleReconnect();
        return;
      }
    }

    if (isStoppedRef.current) return;
    const session = sessionRef.current!;
    setStreamState("connecting");

    // PASO 2 — RTCPeerConnection (ANTES del WS para que el offer incluya los tracks)
    // react-native-webrtc crashea si cualquier servidor ICE tiene username/credential null
    // Solución: remover esas keys si son null en lugar de filtrar el servidor entero
    const safeIceServers = (session.ice_servers ?? []).map((srv: any) => {
      const clean: any = { urls: srv.urls };
      if (srv.username != null && srv.username !== "")
        clean.username = srv.username;
      if (srv.credential != null && srv.credential !== "")
        clean.credential = srv.credential;
      return clean;
    });

    console.log(
      "[Groomer] ICE servers saneados:",
      JSON.stringify(safeIceServers),
    );

    const pc = new RTCPeerConnection({
      iceServers:
        safeIceServers.length > 0
          ? safeIceServers
          : [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // Agregar tracks al PC ANTES de abrir el WS
    // Así cuando se cree el offer ya tendrá los tracks incluidos
    const stream = localStreamRef.current;
    if (!stream) {
      setStreamState("failed");
      return;
    }
    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

    // PASO 3 — WebSocket con autenticación
    // El signaling server requiere el stream_token.
    // Estrategia: intentar query param primero, y también enviarlo como primer mensaje
    // al abrir el WS (el signaling acepta cualquiera de las dos).
    const streamToken = session.stream_token;
    let wsUrl = session.ws_url;

    // Opción A: token como query param (si el signaling lo acepta así)
    if (streamToken && !wsUrl.includes("token=")) {
      const separator = wsUrl.includes("?") ? "&" : "?";
      wsUrl = `${wsUrl}${separator}token=${streamToken}`;
    }

    console.log("[Groomer] Conectando WS — tiene stream_token:", !!streamToken);
    console.log("[Groomer] ws_url original:", session.ws_url);
    console.log(
      "[Groomer] ws_url final:",
      wsUrl.replace(streamToken ?? "", "***TOKEN***"),
    );
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e: any) {
      console.error("[Groomer] Error creando WS:", e?.message);
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    // ── Eventos PC ────────────────────────────────────────────────────────

    pc.addEventListener("icecandidate", (event: any) => {
      if (isStoppedRef.current || !event.candidate) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate }),
        );
      }
    });

    pc.addEventListener("iceconnectionstatechange", () => {
      if (isStoppedRef.current) return;
      const state = pc.iceConnectionState;
      console.log(`[Groomer] ICE: ${state}`);

      switch (state) {
        case "connected":
        case "completed":
          setStreamState("live");
          retryCountRef.current = 0;
          setRetryCount(0);
          break;
        case "disconnected":
          setStreamState("reconnecting");
          break;
        case "failed":
          sessionRef.current = null;
          scheduleReconnect();
          break;
      }
    });

    // ── Eventos WS ────────────────────────────────────────────────────────

    ws.onopen = async () => {
      if (isStoppedRef.current) return;
      console.log("[Groomer] WS conectado");

      // Opción B: enviar token como primer mensaje (el signaling puede requerir esto)
      if (streamToken) {
        ws.send(JSON.stringify({ type: "auth", token: streamToken }));
        console.log("[Groomer] Token enviado como primer mensaje");
      }

      console.log("[Groomer] Creando offer...");
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const payload = JSON.stringify({
          type: "offer",
          sdp: pc.localDescription,
        });
        console.log("[Groomer] Enviando offer, tamaño SDP:", payload.length);
        ws.send(payload);
      } catch (err) {
        console.error("[Groomer] Error creando offer:", err);
        scheduleReconnect();
      }
    };

    ws.onmessage = async (event) => {
      if (isStoppedRef.current) return;
      let msg: any;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      console.log("[Groomer] Mensaje WS recibido — type:", msg.type);

      try {
        // Answer del viewer
        if (msg.type === "answer") {
          console.log("[Groomer] Answer recibido — aplicando...");
          const sdp = msg.sdp ?? msg;
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log("[Groomer] Answer aplicado OK");
        }

        // ICE candidate del viewer — formato doc
        if (msg.type === "ice-candidate" && msg.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }

        // ICE candidate — formato raw
        if (msg.candidate !== undefined && msg.type === undefined) {
          await pc.addIceCandidate(new RTCIceCandidate(msg));
        }
      } catch (err) {
        console.error("[Groomer] Error procesando señalización:", err);
      }
    };

    ws.onerror = (err: any) => {
      console.error("[Groomer] WS error:", JSON.stringify(err?.message ?? err));
    };

    ws.onclose = (event: any) => {
      console.warn(
        "[Groomer] WS cerrado — code:",
        event?.code,
        "reason:",
        event?.reason,
        "wasClean:",
        event?.wasClean,
      );
      if (isStoppedRef.current) return;
      sessionRef.current = null;
      scheduleReconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, closeWsAndPc]);

  // ── Reconexión con backoff ────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scheduleReconnect = useCallback(() => {
    if (isStoppedRef.current) return;
    const attempt = retryCountRef.current;
    if (attempt >= MAX_RETRIES) {
      setStreamState("failed");
      return;
    }
    const delay = retryDelay(attempt);
    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);
    setStreamState("reconnecting");
    console.log(
      `[Groomer] Reintento ${retryCountRef.current}/${MAX_RETRIES} en ${delay}ms`,
    );
    setTimeout(() => {
      if (!isStoppedRef.current) connectInternal();
    }, delay);
  }, [connectInternal]);

  // ── API pública ───────────────────────────────────────────────────────────

  const startStreaming = useCallback(async () => {
    if (!localStreamRef.current) await startPreview();
    isStoppedRef.current = false;
    retryCountRef.current = 0;
    sessionRef.current = null;
    setRetryCount(0);
    await connectInternal();
  }, [startPreview, connectInternal]);

  const stopStreaming = useCallback(() => {
    isStoppedRef.current = true;
    closeWsAndPc();
    stopLocalStream();
    setStreamState("ended");
  }, [closeWsAndPc, stopLocalStream]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const flipCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const newFacing = !isFrontCamera;
    setIsFrontCamera(newFacing);

    // Detener tracks de video actuales
    stream.getVideoTracks().forEach((t: any) => t.stop());

    // Obtener nuevo stream con la cámara opuesta
    try {
      const newStream = await mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: newFacing ? "user" : "environment" },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      // Reemplazar el track en el peer connection
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s: any) => s.track?.kind === "video");
        if (videoSender) await videoSender.replaceTrack(newVideoTrack);
      }

      // Actualizar el stream local en estado
      const audioTracks = stream.getAudioTracks();
      const updatedStream = new MediaStream([...audioTracks, newVideoTrack]);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    } catch (err) {
      console.error("[Groomer] Error al cambiar cámara:", err);
      setIsFrontCamera(!newFacing); // revertir
    }
  }, [isFrontCamera]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      closeWsAndPc();
      stopLocalStream();
    };
  }, [closeWsAndPc, stopLocalStream]);

  return {
    localStream,
    streamState,
    isMuted,
    isFrontCamera,
    retryCount,
    startPreview,
    startStreaming,
    stopStreaming,
    toggleMic,
    flipCamera,
  };
}
