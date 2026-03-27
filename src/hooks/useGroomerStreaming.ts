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
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppedRef = useRef(false); // true = groomer detuvo manualmente

  // ── Helpers ──────────────────────────────────────────────────────────────

  const closeWsAndPc = useCallback(() => {
    // Cancelar cualquier reintento pendiente
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      wsRef.current.close(1000, "closing");
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
    // Reset SÍNCRONO inmediato — antes de cualquier operación async
    isStoppedRef.current = false;
    retryCountRef.current = 0;
    sessionRef.current = null;

    // Cancelar reintentos pendientes del intento anterior
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Cerrar conexiones anteriores si quedaron abiertas
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.close(1000, "reset");
      wsRef.current = null;
    }

    // Detener stream de cámara anterior
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;

    setRetryCount(0);
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

      if (isStoppedRef.current) {
        // Si el usuario salió durante el getUserMedia, limpiar y no continuar
        stream.getTracks().forEach((t: any) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setStreamState("preview");
    } catch (err) {
      console.error("[Groomer] Error accediendo a cámara:", err);
      if (!isStoppedRef.current) setStreamState("failed");
    }
  }, [isFrontCamera]);

  // ── Lógica principal de conexión ──────────────────────────────────────────

  const connectInternal = useCallback(async () => {
    if (isStoppedRef.current || !orderId) return;

    closeWsAndPc();

    // PASO 1 — Sesión del backend
    // Siempre pedir sesión nueva — el stream_token expira en 5 min
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
      console.log(
        "[Groomer] Sesión obtenida, token:",
        !!sessionRef.current.stream_token,
      );
    } catch (err: any) {
      if (isStoppedRef.current) return;
      scheduleReconnect();
      return;
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
      // iceTransportPolicy: "relay", // activar cuando el TURN esté estable en OCI
    } as any);
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
    // El signaling cambió la ruta a wss://stream.dev-qa.site/ws/realtime?token=<JWT>
    // El token va como query param — el room está en los claims del JWT
    const streamToken = session.stream_token;
    let wsUrl = session.ws_url;

    if (streamToken) {
      // Construir URL correcta: extraer host base y usar /ws/realtime
      const baseUrl = wsUrl.replace(/\/ws.*$/, "");
      wsUrl = `${baseUrl}/ws/realtime?token=${streamToken}`;
    }

    console.log("[Groomer] WS URL:", wsUrl.split("token=")[0] + "token=***");
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
          // ICE Restart — reabrir puertos sin reconectar todo el WS
          console.log("[Groomer] ICE disconnected — intentando ICE restart...");
          try {
            pc.restartIce();
            (pc.createOffer({ iceRestart: true } as any) as Promise<any>)
              .then((offer: any) => pc.setLocalDescription(offer))
              .then(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({ type: "offer", sdp: pc.localDescription }),
                  );
                  console.log("[Groomer] ICE restart offer enviado");
                }
              })
              .catch((err: any) =>
                console.warn("[Groomer] ICE restart falló:", err),
              );
          } catch (err) {
            console.warn("[Groomer] restartIce no soportado:", err);
          }
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
      console.log("[Groomer] WS conectado — creando offer...");
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

      // Responder pong al ping del signaling para mantener la conexión viva
      if (msg.type === "ping") {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "pong" }));
        }
        return;
      }

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
    retryTimerRef.current = setTimeout(() => {
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

  // Limpiar al desmontar — garantiza que al volver a la vista todo esté fresco
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      retryCountRef.current = 0;
      sessionRef.current = null;
      closeWsAndPc(); // cancela retryTimerRef internamente
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
