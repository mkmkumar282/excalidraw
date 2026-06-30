"use client";

import { useRef, useEffect, useState } from "react";
import { initDraw } from "@/draw";
import { Square, Circle, Slash, RectangleHorizontal, Eraser, Pencil, MousePointer2, Type, Download } from "lucide-react";
import axios from "axios";
import { http_backend } from "@/config";

interface CanvasProps {
  roomId: string;
  socket: WebSocket;
}

export function Canvas({ roomId, socket }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<
    "rectangle" | "square" | "circle" | "line" | "eraser" | "pencil" | "select" | "text"
  >("rectangle");
  const [brushSize, setBrushSize] = useState<number>(2);
  const [strokeStyle, setStrokeStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [strokeColor, setStrokeColor] = useState<string>("#ffffff");
  const [fillColor, setFillColor] = useState<string>("transparent");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await axios.get(`${http_backend}/canvas-room-admin/${roomId}`, {
          headers: {
            Authorization: token
          }
        });
        setIsAdmin(res.data.isAdmin);
      } catch (err) {
        console.error("Failed to verify admin status:", err);
      }
    };
    checkAdmin();
  }, [roomId]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.selectedTool = selectedTool;
    }
  }, [selectedTool]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.brushSize = String(brushSize);
    }
  }, [brushSize]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.strokeStyle = strokeStyle;
    }
  }, [strokeStyle]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.strokeColor = strokeColor;
    }
  }, [strokeColor]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.fillColor = fillColor;
    }
  }, [fillColor]);

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.fillStyle = "#090909";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `canvas-${roomId}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleLeaveRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "leave_room",
          roomId: roomId,
          room_id: roomId,
        })
      );
    }
    window.location.href = "/";
  };

  const handleCloseRoom = () => {
    const confirmClose = window.confirm(
      "Are you sure you want to close this room? This will delete all drawings and disconnect all users."
    );
    if (confirmClose) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "close_room",
            roomId: roomId,
            room_id: roomId,
          })
        );
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let active = true;
    let cleanupFn: (() => void) | undefined;

    initDraw(canvas, roomId, socket, selectedTool).then((cleanup) => {
      if (!active) {
        if (cleanup) cleanup();
        return;
      }
      cleanupFn = cleanup;
    });

    return () => {
      active = false;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [canvasRef, roomId, socket]);

  return (
    <div id="q3a3zr" className="relative w-screen h-screen bg-[#090909] overflow-hidden">
      {}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-neutral-800/80 bg-[#121212]/90 p-2 shadow-2xl backdrop-blur-md">
        {(["select", "rectangle", "square", "circle", "line", "pencil", "eraser", "text"] as const).map((tool) => {
          const isActive = selectedTool === tool;
          let Icon;
          let label = "";

          switch (tool) {
            case "select":
              Icon = MousePointer2;
              label = "Select";
              break;
            case "rectangle":
              Icon = RectangleHorizontal;
              label = "Rectangle";
              break;
            case "square":
              Icon = Square;
              label = "Square";
              break;
            case "circle":
              Icon = Circle;
              label = "Circle";
              break;
            case "line":
              Icon = Slash;
              label = "Line";
              break;
            case "pencil":
              Icon = Pencil;
              label = "Pencil";
              break;
            case "eraser":
              Icon = Eraser;
              label = "Eraser";
              break;
            case "text":
              Icon = Type;
              label = "Text Tool";
              break;
          }

          return (
            <div key={tool} className="relative group">
              <button
                onClick={() => setSelectedTool(tool)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 ${
                  isActive
                    ? "bg-[#242424] text-white border-neutral-700 shadow-lg shadow-purple-500/10"
                    : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200 border border-transparent"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
              {}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-50">
                {label}
              </div>
            </div>
          );
        })}

        {}
        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {}
        {([2, 5, 8] as const).map((size) => {
          const isActive = brushSize === size;
          return (
            <div key={size} className="relative group">
              <button
                onClick={() => setBrushSize(size)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 ${
                  isActive
                    ? "bg-[#242424] text-white border-neutral-700 shadow-lg shadow-purple-500/10"
                    : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200 border border-transparent"
                }`}
              >
                <div
                  className="rounded-full bg-current transition-all duration-150"
                  style={{
                    width: size === 2 ? "4px" : size === 5 ? "8px" : "12px",
                    height: size === 2 ? "4px" : size === 5 ? "8px" : "12px",
                  }}
                />
              </button>
              {}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-50">
                {size === 2 ? "Thin" : size === 5 ? "Medium" : "Thick"} ({size}px)
              </div>
            </div>
          );
        })}

        {}
        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {}
        {(["solid", "dashed", "dotted"] as const).map((style) => {
          const isActive = strokeStyle === style;
          return (
            <div key={style} className="relative group">
              <button
                onClick={() => setStrokeStyle(style)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 text-sm font-bold ${
                  isActive
                    ? "bg-[#242424] text-white border-neutral-700 shadow-lg shadow-purple-500/10"
                    : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200 border border-transparent"
                }`}
              >
                {style === "solid" ? "━" : style === "dashed" ? "╍" : "‥"}
              </button>
              {}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-50">
                {style.charAt(0).toUpperCase() + style.slice(1)} Line
              </div>
            </div>
          );
        })}

        {}
        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {}
        <div className="flex flex-col items-center gap-1 px-1">
          <div className="flex items-center gap-1.5">
            {["#ffffff", "#ff4a4a", "#3b82f6", "#10b981", "#fbbf24"].map((color) => {
              const isActive = strokeColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    isActive ? "border-purple-500 scale-125 ring-2 ring-purple-500/20" : "border-neutral-700 hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
          <span className="text-[10px] text-neutral-400/80 font-medium select-none pointer-events-none tracking-wide text-center">
            Boundary Color
          </span>
        </div>

        {}
        <div className="h-6 w-px bg-neutral-800 mx-1" />

        {}
        <div className="flex flex-col items-center gap-1 px-1">
          <div className="flex items-center gap-1.5">
            {["transparent", "rgba(255, 255, 255, 0.2)", "rgba(255, 74, 74, 0.2)", "rgba(59, 130, 246, 0.2)", "rgba(16, 185, 129, 0.2)", "rgba(251, 191, 36, 0.2)"].map((color) => {
              const isActive = fillColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setFillColor(color)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    isActive ? "border-purple-500 scale-125 ring-2 ring-purple-500/20" : "border-neutral-700 hover:scale-110"
                  }`}
                  style={{ 
                    backgroundColor: color === "transparent" ? "#121212" : color,
                    borderColor: color === "transparent" ? "#404040" : "transparent"
                  }}
                />
              );
            })}
          </div>
          <span className="text-[10px] text-neutral-400/80 font-medium select-none pointer-events-none tracking-wide text-center">
            Fill Color
          </span>
        </div>
      </div>

      {}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={handleExportPNG}
          className="flex h-10 px-4 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-[#121212]/90 text-neutral-300 hover:bg-neutral-800/40 hover:text-white transition-all duration-150 text-sm font-medium shadow-2xl backdrop-blur-md"
        >
          <Download className="h-4.5 w-4.5" />
          <span>Export PNG</span>
        </button>
        <button
          onClick={handleLeaveRoom}
          className="flex h-10 px-4 items-center justify-center rounded-xl border border-neutral-800 bg-[#121212]/90 text-neutral-300 hover:bg-neutral-800/40 hover:text-white transition-all duration-150 text-sm font-medium shadow-2xl backdrop-blur-md"
        >
          Leave Room
        </button>
        {isAdmin && (
          <button
            onClick={handleCloseRoom}
            className="flex h-10 px-4 items-center justify-center rounded-xl border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-150 text-sm font-medium shadow-2xl backdrop-blur-md"
          >
            Close Room
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className={`bg-transparent select-none block w-full h-full ${
          selectedTool === "select" ? "cursor-default" : "cursor-crosshair"
        }`}
      />

      {}
      <div className="absolute bottom-4 left-4 text-xs text-neutral-500 pointer-events-none">
        Click and drag to draw shapes. Drawing sync is active.
      </div>
    </div>
  );
}