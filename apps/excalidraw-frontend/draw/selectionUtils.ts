import { Shape } from "./types";
import { getPencilBoundingBox } from "./hitDetection";

export type BoundingBox = { x: number; y: number; width: number; height: number };

export type HandleId =
  | "tl" | "tc" | "tr"
  | "ml" |         "mr"
  | "bl" | "bc" | "br";

export type ResizeHandle = { id: HandleId; x: number; y: number };

export function getShapeBoundingBox(shape: Shape): BoundingBox {
  switch (shape.type) {
    case "rect": {
      const x = Math.min(shape.x, shape.x + shape.width);
      const y = Math.min(shape.y, shape.y + shape.height);
      const width = Math.abs(shape.width);
      const height = Math.abs(shape.height);
      return { x, y, width, height };
    }
    case "circle": {
      return {
        x: shape.centreX - shape.radius,
        y: shape.centreY - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
      };
    }
    case "line": {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const width = Math.abs(shape.x2 - shape.x1);
      const height = Math.abs(shape.y2 - shape.y1);
      return { x, y, width, height };
    }
    case "pencil": {
      return getPencilBoundingBox(shape.points);
    }
    case "text": {
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    }
  }
}

const HANDLE_SIZE = 8;

export function getResizeHandles(bbox: BoundingBox): ResizeHandle[] {
  const { x, y, width, height } = bbox;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return [
    { id: "tl", x: x,      y: y       },
    { id: "tc", x: cx,     y: y       },
    { id: "tr", x: x + width, y: y    },
    { id: "ml", x: x,      y: cy      },
    { id: "mr", x: x + width, y: cy   },
    { id: "bl", x: x,      y: y + height },
    { id: "bc", x: cx,     y: y + height },
    { id: "br", x: x + width, y: y + height },
  ];
}

export function hitTestHandle(
  mx: number,
  my: number,
  handles: ResizeHandle[],
  hitRadius = HANDLE_SIZE
): ResizeHandle | null {
  for (const h of handles) {
    const dx = mx - h.x;
    const dy = my - h.y;
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
      return h;
    }
  }
  return null;
}

export function applyResize(
  shape: Shape,
  handleId: HandleId,
  dx: number,
  dy: number,
  bbox: BoundingBox
): Shape {

  const newBbox = resizeBbox(bbox, handleId, dx, dy);

  switch (shape.type) {
    case "rect":
      return { ...shape, x: newBbox.x, y: newBbox.y, width: newBbox.width, height: newBbox.height };

    case "circle": {

      let newRadius: number;
      let newCentreX: number;
      let newCentreY: number;

      if (handleId === "ml" || handleId === "mr") {

        newRadius = Math.max(newBbox.width / 2, 1);
        newCentreX = newBbox.x + newBbox.width / 2;
        newCentreY = shape.centreY;
      } else if (handleId === "tc" || handleId === "bc") {

        newRadius = Math.max(newBbox.height / 2, 1);
        newCentreX = shape.centreX;
        newCentreY = newBbox.y + newBbox.height / 2;
      } else {

        newRadius = Math.max(Math.min(newBbox.width, newBbox.height) / 2, 1);
        newCentreX = newBbox.x + newBbox.width / 2;
        newCentreY = newBbox.y + newBbox.height / 2;
      }

      return { ...shape, centreX: newCentreX, centreY: newCentreY, radius: newRadius };
    }

    case "line": {

      const origW = bbox.width  || 1;
      const origH = bbox.height || 1;

      if (handleId === "tl") {

        const [near, far] = nearEndpoint(shape, bbox, "tl");
        return moveLine(shape, near, far, newBbox.x, newBbox.y);
      } else if (handleId === "tr") {
        const [near, far] = nearEndpoint(shape, bbox, "tr");
        return moveLine(shape, near, far, newBbox.x + newBbox.width, newBbox.y);
      } else if (handleId === "bl") {
        const [near, far] = nearEndpoint(shape, bbox, "bl");
        return moveLine(shape, near, far, newBbox.x, newBbox.y + newBbox.height);
      } else if (handleId === "br") {
        const [near, far] = nearEndpoint(shape, bbox, "br");
        return moveLine(shape, near, far, newBbox.x + newBbox.width, newBbox.y + newBbox.height);
      } else {

        const scaleX = newBbox.width  / origW;
        const scaleY = newBbox.height / origH;
        return {
          ...shape,
          x1: newBbox.x + (shape.x1 - bbox.x) * scaleX,
          y1: newBbox.y + (shape.y1 - bbox.y) * scaleY,
          x2: newBbox.x + (shape.x2 - bbox.x) * scaleX,
          y2: newBbox.y + (shape.y2 - bbox.y) * scaleY,
        };
      }
    }

    case "pencil": {

      const origW = bbox.width  || 1;
      const origH = bbox.height || 1;
      const scaleX = newBbox.width  / origW;
      const scaleY = newBbox.height / origH;
      const newPoints = shape.points.map((p) => ({
        x: newBbox.x + (p.x - bbox.x) * scaleX,
        y: newBbox.y + (p.y - bbox.y) * scaleY,
      }));
      return { ...shape, points: newPoints };
    }

    case "text": {
      const scale = Math.min(newBbox.width / bbox.width, newBbox.height / bbox.height);
      const newFontSize = Math.max(Math.round((shape.fontSize || 16) * scale), 8);
      return {
        ...shape,
        x: newBbox.x,
        y: newBbox.y,
        fontSize: newFontSize,
        width: newBbox.width,
        height: newBbox.height
      };
    }
  }
}

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.type) {
    case "rect":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case "circle":
      return { ...shape, centreX: shape.centreX + dx, centreY: shape.centreY + dy };
    case "line":
      return {
        ...shape,
        x1: shape.x1 + dx,
        y1: shape.y1 + dy,
        x2: shape.x2 + dx,
        y2: shape.y2 + dy,
      };
    case "pencil":
      return {
        ...shape,
        points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    case "text":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
}

function resizeBbox(
  bbox: BoundingBox,
  handleId: HandleId,
  dx: number,
  dy: number
): BoundingBox {
  let { x, y, width, height } = bbox;
  const right  = x + width;
  const bottom = y + height;
  const MIN = 1;

  switch (handleId) {
    case "tl": x += dx; y += dy; width -= dx; height -= dy; break;
    case "tc":           y += dy;              height -= dy; break;
    case "tr":           y += dy; width += dx; height -= dy; break;
    case "ml": x += dx;           width -= dx;               break;
    case "mr":                    width += dx;               break;
    case "bl": x += dx;           width -= dx; height += dy; break;
    case "bc":                                 height += dy; break;
    case "br":                    width += dx; height += dy; break;
  }

  if (width < MIN) {
    if (["tl","ml","bl"].includes(handleId)) x = right - MIN;
    width = MIN;
  }
  if (height < MIN) {
    if (["tl","tc","tr"].includes(handleId)) y = bottom - MIN;
    height = MIN;
  }

  return { x, y, width, height };
}

type EndpointKey = "p1" | "p2";

function nearEndpoint(
  shape: Extract<Shape, { type: "line" }>,
  bbox: BoundingBox,
  corner: "tl" | "tr" | "bl" | "br"
): [EndpointKey, EndpointKey] {
  const cornerX = corner.includes("r") ? bbox.x + bbox.width : bbox.x;
  const cornerY = corner.includes("b") ? bbox.y + bbox.height : bbox.y;
  const d1 = (shape.x1 - cornerX) ** 2 + (shape.y1 - cornerY) ** 2;
  const d2 = (shape.x2 - cornerX) ** 2 + (shape.y2 - cornerY) ** 2;
  return d1 <= d2 ? ["p1", "p2"] : ["p2", "p1"];
}

function moveLine(
  shape: Extract<Shape, { type: "line" }>,
  near: EndpointKey,
  _far: EndpointKey,
  nx: number,
  ny: number
): Shape {
  if (near === "p1") {
    return { ...shape, x1: nx, y1: ny };
  } else {
    return { ...shape, x2: nx, y2: ny };
  }
}

export function drawSelectionOverlay(ctx: CanvasRenderingContext2D, shape: Shape): void {
  const bbox = getShapeBoundingBox(shape);
  const padding = 6;
  const rx = bbox.x - padding;
  const ry = bbox.y - padding;
  const rw = bbox.width + padding * 2;
  const rh = bbox.height + padding * 2;

  ctx.save();
  ctx.strokeStyle = "rgba(99, 179, 237, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.setLineDash([]);
  ctx.restore();

  const paddedBbox: BoundingBox = { x: rx, y: ry, width: rw, height: rh };
  const handles = getResizeHandles(paddedBbox);
  const half = HANDLE_SIZE / 2;

  ctx.save();
  for (const h of handles) {

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(66, 153, 225, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(h.x - half, h.y - half, HANDLE_SIZE, HANDLE_SIZE, 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
