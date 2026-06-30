import { http_backend } from "@/config";
import axios from "axios";

import { isPointInsideShape } from "./hitDetection";
import {
  getShapeBoundingBox,
  getResizeHandles,
  hitTestHandle,
  applyResize,
  translateShape,
  drawSelectionOverlay,
  BoundingBox,
  ResizeHandle,
} from "./selectionUtils";

export type { Rectangle, Square, Circle, Line, Pencil, Shape } from "./types";
import type { Shape } from "./types";

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomid: string,
  socket: WebSocket,
  selectedTool: "rectangle" | "square" | "circle" | "line" | "eraser" | "pencil" | "select" | "text"
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const ensureShapeId = (shape: any) => {
    if (shape && !shape.id) {
      shape.id = generateId();
    }
    return shape as Shape;
  };

  let existingShapes: Shape[] = await getExistingShapes(roomid);
  existingShapes = existingShapes.map(ensureShapeId);

  let selectedShapeId: string | null = null;
  let activeHandles: ResizeHandle[] = [];
  let resizingHandle: ResizeHandle | null = null;
  
  let resizeShapeSnapshot: Shape | null = null;
  
  let resizeBboxSnapshot: BoundingBox | null = null;
  
  let resizeDragStart: { x: number; y: number } | null = null;
  
  let moveShapeSnapshot: Shape | null = null;
  
  let moveDragStart: { x: number; y: number } | null = null;

  

  const redrawWithSelection = (previewShape?: Shape) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const shapes = previewShape
      ? existingShapes.map((s) => (s.id === previewShape.id ? previewShape : s))
      : existingShapes;
    drawExistingShapes(ctx, shapes);

    if (selectedShapeId) {
      const sel = shapes.find((s) => s.id === selectedShapeId);
      if (sel) {
        drawSelectionOverlay(ctx, sel);

        const bbox = getShapeBoundingBox(sel);
        const padding = 6;
        activeHandles = getResizeHandles({
          x: bbox.x - padding,
          y: bbox.y - padding,
          width: bbox.width + padding * 2,
          height: bbox.height + padding * 2,
        });
      } else {

        selectedShapeId = null;
        activeHandles = [];
      }
    }
  };

  drawExistingShapes(ctx, existingShapes);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "canvas_update") {
        const shape = ensureShapeId(JSON.parse(data.elementData));

        const idx = existingShapes.findIndex((s) => s.id === shape.id);
        if (idx !== -1) {
          existingShapes[idx] = shape;
        } else {
          existingShapes.push(shape);
        }
        redrawWithSelection();
      } else if (data.type === "delete_shape") {
        existingShapes = existingShapes.filter((s) => s.id !== data.shapeId);
        if (selectedShapeId === data.shapeId) {
          selectedShapeId = null;
          activeHandles = [];
        }
        redrawWithSelection();
      } else if (data.type === "room_closed") {
        alert("This room has been closed by the admin.");
        window.location.href = "/";
      }
    } catch (e) {
      console.error("Error parsing remote shape update:", e);
    }
  };

  let clicked = false;
  let startX = 0;
  let startY = 0;
  const deletedDuringDrag = new Set<string>();
  let pencilPoints: { x: number; y: number }[] = [];

  const getTool = () => (canvas.dataset.selectedTool as any) || selectedTool;
  const getBrushSize = () => Number(canvas.dataset.brushSize) || 2;
  const getStrokeStyle = () => (canvas.dataset.strokeStyle as any) || "solid";
  const getStrokeColor = () => canvas.dataset.strokeColor || "#ffffff";
  const getFillColor = () => canvas.dataset.fillColor || "transparent";

  const eraseAtPoint = (x: number, y: number) => {
    const hitShape = existingShapes.find(
      (shape) => !deletedDuringDrag.has(shape.id) && isPointInsideShape(x, y, shape)
    );
    if (hitShape) {
      deletedDuringDrag.add(hitShape.id);
      if (selectedShapeId === hitShape.id) {
        selectedShapeId = null;
        activeHandles = [];
      }
      existingShapes = existingShapes.filter((s) => s.id !== hitShape.id);
      redrawWithSelection();

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "delete_shape",
            roomId: roomid,
            room_id: roomid,
            shapeId: hitShape.id,
            shape: hitShape,
          })
        );
      }
    }
  };

  const getCanvasXY = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    if (window.TouchEvent && e instanceof TouchEvent) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    const me = e as MouseEvent;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  };

  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    const { x, y } = getCanvasXY(e);
    clicked = true;
    startX = x;
    startY = y;

    const tool = getTool();

    if (tool === "text") {

      e.preventDefault();

      const input = document.createElement("textarea");

      input.style.position = "absolute";
      input.style.left = `${x}px`;
      input.style.top = `${y}px`;
      input.style.width = "150px";
      input.style.height = "50px";
      input.style.font = "16px sans-serif";
      input.style.background = "#121212";
      input.style.color = getStrokeColor();
      input.style.border = "1px solid #7c3aed";
      input.style.outline = "none";
      input.style.padding = "4px";
      input.style.borderRadius = "4px";
      input.style.resize = "both";
      input.style.zIndex = "1000";
      
      const parent = canvas.parentElement || document.body;
      parent.appendChild(input);
      

      input.focus();

      let finished = false;
      const finalizeText = () => {
        if (finished) return;
        finished = true;
        
        const textValue = input.value.trim();
        if (parent.contains(input)) {
          parent.removeChild(input);
        }

        if (textValue) {
          ctx.save();
          ctx.font = "16px sans-serif";
          const metrics = ctx.measureText(textValue);
          const textWidth = metrics.width;
          const textHeight = 16 * 1.2;
          ctx.restore();

          const newTextShape: Shape = {
            id: generateId(),
            type: "text",
            x,
            y,
            text: textValue,
            fontSize: 16,
            width: textWidth,
            height: textHeight,
            strokeWidth: getBrushSize(),
            strokeColor: getStrokeColor()
          };

          existingShapes.push(newTextShape);

          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "canvas_update",
                roomId: roomid,
                room_id: roomid,
                elementData: JSON.stringify(newTextShape)
              })
            );
          }
          redrawWithSelection();
        }
      };

      input.addEventListener("blur", finalizeText);
      input.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" && !evt.shiftKey) {
          evt.preventDefault();
          finalizeText();
        }
      });
      return;
    }

    if (tool === "select") {

      if (selectedShapeId && activeHandles.length) {
        const hit = hitTestHandle(x, y, activeHandles);
        if (hit) {
          resizingHandle = hit;
          const sel = existingShapes.find((s) => s.id === selectedShapeId)!;
          resizeShapeSnapshot = { ...sel } as Shape;
          resizeBboxSnapshot = getShapeBoundingBox(sel);
          resizeDragStart = { x, y };
          return;
        }
      }

      if (selectedShapeId) {
        const sel = existingShapes.find((s) => s.id === selectedShapeId);
        if (sel && isPointInsideShape(x, y, sel)) {
          moveShapeSnapshot = { ...sel } as Shape;
          moveDragStart = { x, y };
          return;
        }
      }

      const hit = [...existingShapes].reverse().find((s) => isPointInsideShape(x, y, s));
      if (hit) {
        selectedShapeId = hit.id;
      } else {
        selectedShapeId = null;
        activeHandles = [];
      }
      redrawWithSelection();
      return;
    }

    if (tool === "eraser") {
      deletedDuringDrag.clear();
      eraseAtPoint(x, y);
    } else if (tool === "pencil") {
      pencilPoints = [{ x, y }];
    }
  };

  const handleMouseUp = (e: MouseEvent | TouchEvent) => {
    clicked = false;
    const { x, y } = getCanvasXY(e);

    const tool = getTool();

    if (tool === "select" && moveShapeSnapshot && moveDragStart) {
      const dx = x - moveDragStart.x;
      const dy = y - moveDragStart.y;

      if (dx !== 0 || dy !== 0) {
        const moved = translateShape(moveShapeSnapshot, dx, dy);

        const idx = existingShapes.findIndex((s) => s.id === moved.id);
        if (idx !== -1) existingShapes[idx] = moved;

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "canvas_update",
              roomId: roomid,
              room_id: roomid,
              elementData: JSON.stringify(moved),
            })
          );
        }
      }

      moveShapeSnapshot = null;
      moveDragStart = null;
      redrawWithSelection();
      return;
    }

    if (tool === "select" && resizingHandle && resizeShapeSnapshot && resizeBboxSnapshot && resizeDragStart) {
      const dx = x - resizeDragStart.x;
      const dy = y - resizeDragStart.y;
      const resized = applyResize(resizeShapeSnapshot, resizingHandle.id, dx, dy, resizeBboxSnapshot);

      const idx = existingShapes.findIndex((s) => s.id === resized.id);
      if (idx !== -1) existingShapes[idx] = resized;

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "canvas_update",
            roomId: roomid,
            room_id: roomid,
            elementData: JSON.stringify(resized),
          })
        );
      }

      resizingHandle = null;
      resizeShapeSnapshot = null;
      resizeBboxSnapshot = null;
      resizeDragStart = null;

      redrawWithSelection();
      return;
    }

    if (tool === "eraser") {
      deletedDuringDrag.clear();
      return;
    }

    if (tool === "select") return;

    const width = x - startX;
    const height = y - startY;
    const currentBrushSize = getBrushSize();
    let newShape: Shape | null = null;

    const strokeColor = getStrokeColor();
    const fillColor = getFillColor();
    const strokeStyle = getStrokeStyle();

    if (tool === "pencil") {
      if (pencilPoints.length > 0) {
        newShape = {
          id: generateId(),
          type: "pencil",
          points: [...pencilPoints],
          strokeWidth: currentBrushSize,
          strokeColor,
          strokeStyle,
        };
      }
      pencilPoints = [];
    } else if (tool === "rectangle") {
      newShape = {
        id: generateId(),
        type: "rect",
        x: startX,
        y: startY,
        width: width,
        height: height,
        strokeWidth: currentBrushSize,
        strokeColor,
        fillColor,
        strokeStyle,
      };
    } else if (tool === "square") {
      const side = Math.max(Math.abs(width), Math.abs(height));
      const sWidth = width < 0 ? -side : side;
      const sHeight = height < 0 ? -side : side;
      newShape = {
        id: generateId(),
        type: "rect",
        x: startX,
        y: startY,
        width: sWidth,
        height: sHeight,
        strokeWidth: currentBrushSize,
        strokeColor,
        fillColor,
        strokeStyle,
      };
    } else if (tool === "circle") {
      const dx = x - startX;
      const dy = y - startY;
      const radius = Math.sqrt(dx * dx + dy * dy);
      newShape = {
        id: generateId(),
        type: "circle",
        centreX: startX,
        centreY: startY,
        radius: radius,
        strokeWidth: currentBrushSize,
        strokeColor,
        fillColor,
        strokeStyle,
      };
    } else if (tool === "line") {
      newShape = {
        id: generateId(),
        type: "line",
        x1: startX,
        y1: startY,
        x2: x,
        y2: y,
        strokeWidth: currentBrushSize,
        strokeColor,
        strokeStyle,
      };
    }

    if (!newShape) return;

    existingShapes.push(newShape);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "canvas_update",
          roomId: roomid,
          room_id: roomid,
          elementData: JSON.stringify(newShape),
        })
      );
    }

    redrawWithSelection();
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    const { x, y } = getCanvasXY(e);

    const tool = getTool();

    if (tool === "select" && clicked && moveShapeSnapshot && moveDragStart) {
      const dx = x - moveDragStart.x;
      const dy = y - moveDragStart.y;
      const preview = translateShape(moveShapeSnapshot, dx, dy);
      redrawWithSelection(preview);
      return;
    }

    if (
      tool === "select" &&
      clicked &&
      resizingHandle &&
      resizeShapeSnapshot &&
      resizeBboxSnapshot &&
      resizeDragStart
    ) {
      const dx = x - resizeDragStart.x;
      const dy = y - resizeDragStart.y;
      const preview = applyResize(resizeShapeSnapshot, resizingHandle.id, dx, dy, resizeBboxSnapshot);
      redrawWithSelection(preview);
      return;
    }

    if (!clicked) return;

    if (tool === "eraser") {
      eraseAtPoint(x, y);
    } else if (tool === "pencil") {
      pencilPoints.push({ x, y });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawExistingShapes(ctx, existingShapes);

      ctx.strokeStyle = "lightgray";
      ctx.lineWidth = getBrushSize();
      ctx.beginPath();
      ctx.moveTo(pencilPoints[0].x, pencilPoints[0].y);
      for (let i = 1; i < pencilPoints.length; i++) {
        ctx.lineTo(pencilPoints[i].x, pencilPoints[i].y);
      }
      ctx.stroke();
    } else {
      const width = x - startX;
      const height = y - startY;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawExistingShapes(ctx, existingShapes);
      ctx.strokeStyle = "lightgray";
      ctx.lineWidth = getBrushSize();

      if (tool === "rectangle") {
        ctx.strokeRect(startX, startY, width, height);
      } else if (tool === "square") {
        const side = Math.max(Math.abs(width), Math.abs(height));
        const sWidth = width < 0 ? -side : side;
        const sHeight = height < 0 ? -side : side;
        ctx.strokeRect(startX, startY, sWidth, sHeight);
      } else if (tool === "circle") {
        const dx = x - startX;
        const dy = y - startY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    handleMouseDown(e);
  };
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    handleMouseUp(e);
  };
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleMouseMove(e);
  };

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawWithSelection();
  };
  window.addEventListener("resize", handleResize);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);

  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchend", handleTouchEnd);
    canvas.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("resize", handleResize);
  };
}

function drawExistingShapes(ctx: CanvasRenderingContext2D, existingShapes: Shape[]) {
  existingShapes.forEach((shape) => {
    ctx.save();

    ctx.strokeStyle = shape.strokeColor || "lightgray";
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.fillStyle = (shape as any).fillColor || "transparent";

    if ((shape as any).strokeStyle === "dashed") {
      ctx.setLineDash([12, 8]);
    } else if ((shape as any).strokeStyle === "dotted") {
      ctx.setLineDash([3, 6]);
    } else {
      ctx.setLineDash([]);
    }

    switch (shape.type) {
      case "rect":
        if (shape.fillColor && shape.fillColor !== "transparent") {
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        }
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(shape.centreX, shape.centreY, shape.radius, 0, 2 * Math.PI);
        if (shape.fillColor && shape.fillColor !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
        break;
      case "line":
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
        break;
      case "pencil":
        if (shape.points && shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          ctx.stroke();
        }
        break;
      case "text":
        ctx.font = `${shape.fontSize}px sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillStyle = shape.strokeColor || "lightgray";
        ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }

    ctx.restore();
  });
}

async function getExistingShapes(roomid: string) {
  try {
    const token = localStorage.getItem("token") || "";

    const res = await axios.get(`${http_backend}/elements/${roomid}`, {
      headers: {
        Authorization: token,
      },
    });

    const elements = res.data.elements || res.data.chats || res.data.messages || [];

    const shapes = elements.map((x: any) => {
      try {
        const elementDataStr = x.elementData || x.message;
        const messageData = JSON.parse(elementDataStr);
        return messageData;
      } catch (jsonErr) {
        console.error("Malformed shape message:", x.elementData || x.message, jsonErr);
        return null;
      }
    }).filter(Boolean);

    return shapes;
  } catch (e) {
    console.error("Failed to retrieve existing shapes:", e);
    return [];
  }
}