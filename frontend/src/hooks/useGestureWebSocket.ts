"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TelemetryPacket, ActionEvent } from "../lib/types";
import { sonicAudio } from "../lib/audio";

interface UseGestureWebSocketReturn {
  telemetry: TelemetryPacket | null;
  isConnected: boolean;
  latencyMs: number;
  recentEvents: ActionEvent[];
  sendWakeState: (state: "ACTIVE" | "SLEEPING") => void;
  sendAction: (action: string, params?: Record<string, any>) => void;
  setTarget: (targetId: string) => void;
  setTargetProfile: (profile: string) => void;
  setMediaDetection: (enabled: boolean) => void;
  setCamera: (enabled: boolean) => void;
  reconnect: () => void;
}

export function useGestureWebSocket(): UseGestureWebSocketReturn {
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [recentEvents, setRecentEvents] = useState<ActionEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const prevWakeStateRef = useRef<string>("SLEEPING");
  const prevClutchRef = useRef<boolean>(false);
  const prevPinchRef = useRef<boolean>(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingSentTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !isMountedRef.current) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        return;
      }
      try {
        wsRef.current.close();
      } catch (e) {
        // quiet
      }
    }

    try {
      const wsUrl = "ws://localhost:8000/ws";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingSentTimeRef.current = performance.now();
            ws.send(JSON.stringify({ type: "ping", time: pingSentTimeRef.current }));
          }
        }, 2500);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === "pong") {
            const now = performance.now();
            setLatencyMs(Math.round(now - (data.time || pingSentTimeRef.current)));
            return;
          }

          if (data.type === "action_result" && data.result) {
            const res = data.result as ActionEvent;
            setRecentEvents((prev) => [res, ...prev.slice(0, 19)]);
            sonicAudio.playAction(res.action || "action");
            return;
          }

          if (data.type === "telemetry") {
            const packet = data as TelemetryPacket;
            setTelemetry(packet);

            // Audio cues on state changes
            if (packet.wake_state !== prevWakeStateRef.current) {
              if (packet.wake_state === "ACTIVE") {
                sonicAudio.playWake();
              } else if (packet.wake_state === "SLEEPING") {
                sonicAudio.playSleep();
              }
              prevWakeStateRef.current = packet.wake_state;
            }

            if (packet.clutch && packet.clutch.is_engaged !== prevClutchRef.current) {
              sonicAudio.playClutch(packet.clutch.is_engaged);
              prevClutchRef.current = packet.clutch.is_engaged;
            }

            if (packet.is_pinch && !prevPinchRef.current) {
              sonicAudio.playPinch();
            }
            prevPinchRef.current = packet.is_pinch;

            if (packet.scrub && packet.scrub.is_scrubbing) {
              sonicAudio.playScrubTick(packet.scrub.delta_seconds);
            }

            if (packet.action_event) {
              const ev = packet.action_event;
              setRecentEvents((prev) => [ev, ...prev.slice(0, 19)]);
              if (ev.action) {
                sonicAudio.playAction(ev.action);
              }
            }
          }
        } catch (err) {
          // parse error ignored
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (isMountedRef.current && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 2500);
        }
      };

      ws.onerror = () => {
        // Let onclose handle reconnection cleanly
      };
    } catch (err) {
      console.warn("[useGestureWebSocket] Connect error:", err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // quiet
        }
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendWakeState = useCallback((state: "ACTIVE" | "SLEEPING") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "set_wake", state }));
    }
  }, []);

  const sendAction = useCallback((action: string, params?: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "trigger_action", action, params }));
    }
  }, []);

  const setTarget = useCallback((targetId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "set_target", target_id: targetId }));
    }
  }, []);

  const setTargetProfile = useCallback((profile: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "set_target_profile", profile }));
    }
  }, []);

  const setMediaDetection = useCallback((enabled: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "set_media_detection", enabled }));
    }
  }, []);

  const setCamera = useCallback((enabled: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "set_camera", enabled }));
    }
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // quiet
      }
      wsRef.current = null;
    }
    connect();
  }, [connect]);

  return {
    telemetry,
    isConnected,
    latencyMs,
    recentEvents,
    sendWakeState,
    sendAction,
    setTarget,
    setTargetProfile,
    setMediaDetection,
    setCamera,
    reconnect,
  };
}
