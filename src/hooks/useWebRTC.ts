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

const GROOMER_TIMEOUT_MS = 15000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebRTCConnectionState =
  | "idle"
  | "fetching_session" // llamando al endpoint /session
  | "connecting" // WebSocket conectado, esperando
  | "calling" // ICE checking
  | "connected" // video activo
  | "disconnected" // caída temporal
  | "groomer_absent" // timeout: el ally no está en la sala
  | "order_not_active" // 409: orden no está en in_service
  | "failed"
  | "closed";

export interface UseWebRTCResult {
  remoteStream: MediaStream | null;
  connectionState: WebRTCConnectionState;
  connect: () => void;
  disconnect: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWebRTC = (orderId: string): UseWebRTCResult => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState>("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const groomerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCleanedUpRef = useRef(false);

  // ── Limpieza completa ──────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    isCleanedUpRef.current = true;

    if (groomerTimeoutRef.current) {
      clearTimeout(groomerTimeoutRef.current);
      groomerTimeoutRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setRemoteStream(null);
  }, []);

  // ── Conexión principal ─────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!orderId) return;
    isCleanedUpRef.current = false;

    // PASO 1 — obtener sesión del backend
    setConnectionState("fetching_session");

    let session: StreamingSession;
    try {
      session = await streamingService.getSession(orderId);
    } catch (error: any) {
      if (isCleanedUpRef.current) return;
      const status = error?.response?.status;
      if (status === 409) {
        setConnectionState("order_not_active");
      } else {
        setConnectionState("failed");
      }
      return;
    }

    if (isCleanedUpRef.current) return;
    setConnectionState("connecting");

    // PASO 2 — WebSocket con la URL del backend
    const ws = new WebSocket(session.ws_url);
    wsRef.current = ws;

    // PASO 3 — RTCPeerConnection con ice_servers del backend
    const pc = new RTCPeerConnection({ iceServers: session.ice_servers });
    pcRef.current = pc;

    // ── Eventos del PeerConnection ─────────────────────────────────────────

    pc.addEventListener("track", (event: any) => {
      if (isCleanedUpRef.current) return;
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    });

    pc.addEventListener("icecandidate", (event: any) => {
      if (isCleanedUpRef.current) return;
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event.candidate));
      }
    });

    pc.addEventListener("iceconnectionstatechange", () => {
      if (isCleanedUpRef.current) return;
      const state = pc.iceConnectionState;

      switch (state) {
        case "checking":
          setConnectionState("calling");
          break;
        case "connected":
        case "completed":
          setConnectionState("connected");
          if (groomerTimeoutRef.current) {
            clearTimeout(groomerTimeoutRef.current);
            groomerTimeoutRef.current = null;
          }
          break;
        case "disconnected":
          setConnectionState("disconnected");
          break;
        case "failed":
          setConnectionState("failed");
          break;
        case "closed":
          setConnectionState("closed");
          break;
      }
    });

    // ── Eventos del WebSocket ──────────────────────────────────────────────

    ws.onopen = () => {
      if (isCleanedUpRef.current) return;

      // viewer siempre espera — el timeout empieza aquí
      groomerTimeoutRef.current = setTimeout(() => {
        if (
          !isCleanedUpRef.current &&
          pc.iceConnectionState !== "connected" &&
          pc.iceConnectionState !== "completed"
        ) {
          setConnectionState("groomer_absent");
        }
      }, GROOMER_TIMEOUT_MS);
    };

    ws.onmessage = async (event) => {
      if (isCleanedUpRef.current) return;

      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      try {
        // viewer recibe offer del host (ally)
        if (msg.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify(answer));
        }

        // por si acaso — no debería llegar al viewer
        if (msg.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
        }

        // ICE candidate del ally — formato envuelto
        if (msg.type === "candidate" && msg.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }

        // ICE candidate del ally — formato raw
        if (msg.candidate !== undefined && msg.type === undefined) {
          await pc.addIceCandidate(new RTCIceCandidate(msg));
        }
      } catch (err) {
        console.error("[WebRTC] Error procesando mensaje:", err);
      }
    };

    ws.onerror = () => {
      if (isCleanedUpRef.current) return;
      setConnectionState("failed");
    };

    ws.onclose = () => {
      if (isCleanedUpRef.current) return;
      if (
        pc.iceConnectionState !== "connected" &&
        pc.iceConnectionState !== "completed"
      ) {
        setConnectionState("failed");
      }
    };
  }, [orderId, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("closed");
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    remoteStream,
    connectionState,
    connect,
    disconnect,
  };
};
