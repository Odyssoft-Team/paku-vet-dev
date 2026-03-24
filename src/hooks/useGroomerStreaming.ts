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

    // PASO 2 — WebSocket
    let ws: WebSocket;
    try {
      ws = new WebSocket(session.ws_url);
    } catch {
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    // PASO 3 — RTCPeerConnection
    const pc = new RTCPeerConnection({ iceServers: session.ice_servers });
    pcRef.current = pc;

    // Agregar todos los tracks del stream local
    const stream = localStreamRef.current;
    if (!stream) {
      setStreamState("failed");
      return;
    }
    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

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

    // Renegociación — si se agrega/cambia track (ej: flip cámara)
    pc.addEventListener("negotiationneeded", async () => {
      if (isStoppedRef.current) return;
      // Re-enviar offer con el nuevo estado
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
        }
      } catch (err) {
        console.error("[Groomer] Error en renegociación:", err);
      }
    });

    // ── Eventos WS ────────────────────────────────────────────────────────

    ws.onopen = async () => {
      if (isStoppedRef.current) return;
      try {
        // Crear y enviar offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
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

      try {
        // Answer del viewer
        if (msg.type === "answer") {
          const sdp = msg.sdp ?? msg;
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
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

    ws.onerror = () => {
      /* onclose siempre sigue */
    };

    ws.onclose = () => {
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
