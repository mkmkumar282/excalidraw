"use client";

import { useEffect, useState } from "react";
import { WS_URL } from "@/config";
import { Canvas } from "./Canvas";

interface RoomCanvasProps {
  roomId: string;
}

export function RoomCanvas({ roomId }: RoomCanvasProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let isUnmounted = false;

    try {
      const token = localStorage.getItem("token") || "";
      const wsUrl = `${WS_URL}?token=${token}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isUnmounted) {
          ws?.close();
          return;
        }

        ws?.send(
          JSON.stringify({
            type: "join_room",
            room_id: roomId,
            roomId: roomId,
          })
        );

        setSocket(ws);
        setLoading(false);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        if (!isUnmounted) {
          setError("WebSocket connection failed. Make sure server is running.");
          setLoading(false);
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          console.log("WebSocket connection closed.");
          setSocket(null);
          setLoading(true);
        }
      };
    } catch (err: any) {
      console.error("Error creating WebSocket:", err);
      if (!isUnmounted) {
        setError(err.message || "Failed to initialize WebSocket.");
        setLoading(false);
      }
    }

    return () => {
      isUnmounted = true;
      if (ws) {
        ws.close();
      }
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#090909] text-white">
        <svg
          className="animate-spin h-8 w-8 text-purple-500 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm font-medium tracking-wide animate-pulse">
          Connecting to room...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#090909] text-white p-4">
        <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-6 py-4 text-center max-w-sm">
          <p className="text-red-400 font-semibold mb-2">Connection Error</p>
          <p className="text-xs text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!socket) {
    return null;
  }

  return <Canvas socket={socket} roomId={roomId} />;
}
