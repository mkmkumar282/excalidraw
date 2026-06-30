"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { HTTP_URL } from "@/lib/api";
import { WS_URL } from "@/config";

interface RoomModalProps {
  mode: "create" | "join";
  isOpen: boolean;
  onClose: () => void;
}

export function RoomModal({ mode, isOpen, onClose }: RoomModalProps) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = roomName.trim();
    if (!trimmedName) {
      setError("Room name cannot be empty");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token") || "";

    try {
      let roomId = "";

      if (mode === "create") {
        const res = await axios.post(
          `${HTTP_URL}/canvas-room`,
          { slug: trimmedName },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        roomId = res.data.roomId;
      } else {
        try {
          const res = await axios.get(`${HTTP_URL}/canvas-room/${trimmedName}`, {
            headers: {
              Authorization: token,
            },
          });
          roomId = res.data.roomId;
        } catch (err: any) {
          if (err.response?.status === 404) {
            setError("Canvas room not found");
          } else {
            setError(err.response?.data?.message || "Failed to find canvas room");
          }
          setIsLoading(false);
          return;
        }
      }

      const wsUrl = token ? `${WS_URL}?token=${token}` : WS_URL;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "join_room",
            roomId: roomId,
          })
        );

        router.push(`/canvas/${roomId}`);
        onClose();
        setIsLoading(false);
      };

      socket.onerror = (err) => {
        console.error("WS error during modal join:", err);

        router.push(`/canvas/${roomId}`);
        onClose();
        setIsLoading(false);
      };
    } catch (err: any) {
      console.error("Room action failed:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/signin");
        onClose();
        return;
      }
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800/80 bg-[#0a0a0a] p-6 shadow-2xl text-white animate-in fade-in zoom-in duration-200">
        <h2 id={mode === "create" ? "ofijva" : "lcb9c5"} className="text-xl font-bold tracking-tight text-neutral-100">
          {mode === "create" ? "Create a Canvas Room" : "Join a Canvas Room"}
        </h2>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="room-name" className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Canvas Room Name
            </label>
            <input
              id={mode === "create" ? "n9f1t5" : "lq4xgi"}
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={mode === "create" ? "Enter new canvas room name" : "Enter canvas room name"}
              className="mt-2 w-full rounded-xl border border-neutral-800 bg-[#121212] px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 shadow-sm focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors"
              disabled={isLoading}
            />
            {error && (
              <p id={mode === "join" && error === "Canvas room not found" ? "7vnn4l" : undefined} className="mt-2 text-xs font-medium text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/10 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : mode === "create" ? (
                "Create"
              ) : (
                "Join"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
