import { useEffect, useRef, useState, useCallback } from "react";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} from "react-native-webrtc";

// ─── Config ───────────────────────────────────────────────────────────────────

const SIGNALING_URL = "wss://stream.dev-qa.site/ws";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: [
        "turn:stream.dev-qa.site:3478?transport=udp",
        "turn:stream.dev-qa.site:3478?transport=tcp",
      ],
      username: "webrtc",
      credential: "webrtc123",
    },
  ],
};

// Tiempo máximo esperando al groomer antes de mostrar "no iniciado"
const GROOMER_TIMEOUT_MS = 15000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebRTCConnectionState =
  | "idle" // antes de conectar
  | "connecting" // WebSocket conectado, esperando groomer
  | "calling" // offer enviado, esperando answer
  | "connected" // ICE connected — video activo
  | "disconnected" // caída temporal
  | "groomer_absent" // timeout: el groomer no está en la sala
  | "failed" // fallo definitivo
  | "closed"; // salida limpia

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

  // ── Reconexión — cierra todo y vuelve a conectar ───────────────────────────
  const reconnect = useCallback(() => {
    if (isCleanedUpRef.current) return;
    cleanup();
    isCleanedUpRef.current = false;
    setTimeout(() => connect(), 1000);
  }, [cleanup]);

  // ── Conexión principal ─────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!orderId) return;
    isCleanedUpRef.current = false;

    setConnectionState("connecting");
    setRemoteStream(null);

    // 1. WebSocket de señalización
    const ws = new WebSocket(`${SIGNALING_URL}?room=${orderId}`);
    wsRef.current = ws;

    // 2. PeerConnection
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // ── Eventos del PeerConnection ─────────────────────────────────────────

    // Video remoto llegando del groomer
    pc.addEventListener("track", (event: any) => {
      if (isCleanedUpRef.current) return;
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    });

    // ICE candidates listos para enviar al groomer
    pc.addEventListener("icecandidate", (event: any) => {
      if (isCleanedUpRef.current) return;
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        );
      }
    });

    // Estado de la conexión ICE
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

    ws.onopen = async () => {
      if (isCleanedUpRef.current) return;

      // El usuario es el segundo en entrar → genera el offer
      try {
        const offer = await pc.createOffer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify(offer));

        // Iniciar timeout: si en GROOMER_TIMEOUT_MS no hay answer → groomer ausente
        groomerTimeoutRef.current = setTimeout(() => {
          if (
            !isCleanedUpRef.current &&
            pc.iceConnectionState !== "connected" &&
            pc.iceConnectionState !== "completed"
          ) {
            setConnectionState("groomer_absent");
          }
        }, GROOMER_TIMEOUT_MS);
      } catch (err) {
        console.error("[WebRTC] Error creando offer:", err);
        setConnectionState("failed");
      }
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
        if (msg.type === "answer") {
          // Groomer respondió → establecer remote description
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
        } else if (msg.type === "candidate") {
          // ICE candidate del groomer
          if (msg.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        }
      } catch (err) {
        console.error("[WebRTC] Error procesando mensaje:", err);
      }
    };

    ws.onerror = (err) => {
      if (isCleanedUpRef.current) return;
      console.error("[WebRTC] WebSocket error:", err);
      setConnectionState("failed");
    };

    ws.onclose = () => {
      if (isCleanedUpRef.current) return;
      // WS cerrado inesperadamente — si no estamos connected, marcar como failed
      if (
        pc.iceConnectionState !== "connected" &&
        pc.iceConnectionState !== "completed"
      ) {
        setConnectionState("failed");
      }
    };
  }, [orderId, cleanup]);

  // ── Desconexión limpia (llamada por el usuario al salir) ───────────────────
  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("closed");
  }, [cleanup]);

  // ── Cleanup automático al desmontar el componente ─────────────────────────
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
