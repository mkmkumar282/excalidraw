import { Shape } from "./types";

export function distanceToLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

export function getPencilBoundingBox(
  points: { x: number; y: number }[]
): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function isPointInsideShape(x: number, y: number, shape: Shape, threshold = 6): boolean {
  switch (shape.type) {
    case "rect": {
      const minX = Math.min(shape.x, shape.x + shape.width);
      const maxX = Math.max(shape.x, shape.x + shape.width);
      const minY = Math.min(shape.y, shape.y + shape.height);
      const maxY = Math.max(shape.y, shape.y + shape.height);
      

      return (
        x >= minX - threshold &&
        x <= maxX + threshold &&
        y >= minY - threshold &&
        y <= maxY + threshold
      );
    }
    case "circle": {
      const dx = x - shape.centreX;
      const dy = y - shape.centreY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      return dist <= shape.radius + threshold;
    }
    case "line": {
      return distanceToLineSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2) <= threshold;
    }
    case "pencil": {
      const points = shape.points;
      if (!points || points.length === 0) return false;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= threshold) {
          return true;
        }
      }
      if (points.length === 1) {
        const dist = Math.sqrt((x - points[0].x) ** 2 + (y - points[0].y) ** 2);
        return dist <= threshold;
      }
      return false;
    }
    case "text": {
      const minX = shape.x;
      const maxX = shape.x + shape.width;
      const minY = shape.y;
      const maxY = shape.y + shape.height;
      
      return (
        x >= minX - threshold &&
        x <= maxX + threshold &&
        y >= minY - threshold &&
        y <= maxY + threshold
      );
    }
    default:
      return false;
  }
}
