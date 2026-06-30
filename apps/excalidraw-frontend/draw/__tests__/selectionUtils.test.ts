import { describe, it, expect } from "vitest";

import {
  getShapeBoundingBox,
  getResizeHandles,
  hitTestHandle,
  applyResize,
  translateShape,
  BoundingBox,
} from "../selectionUtils";
import { getPencilBoundingBox } from "../hitDetection";
import type { Shape } from "../types";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rect = (): Extract<Shape, { type: "rect" }> => ({
  id: "r1",
  type: "rect",
  x: 10,
  y: 20,
  width: 100,
  height: 60,
  strokeWidth: 2,
});

const negativeRect = (): Shape => ({
  id: "r2",
  type: "rect",
  x: 110,
  y: 80,
  width: -100, // drawn right-to-left / bottom-to-top
  height: -60,
  strokeWidth: 2,
});

const circle = (): Extract<Shape, { type: "circle" }> => ({
  id: "c1",
  type: "circle",
  centreX: 50,
  centreY: 50,
  radius: 30,
  strokeWidth: 2,
});

const line = (): Shape => ({
  id: "l1",
  type: "line",
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 80,
  strokeWidth: 2,
});

const pencil = (): Extract<Shape, { type: "pencil" }> => ({
  id: "p1",
  type: "pencil",
  points: [
    { x: 10, y: 10 },
    { x: 50, y: 30 },
    { x: 90, y: 10 },
  ],
  strokeWidth: 2,
});

const textShape = (): Extract<Shape, { type: "text" }> => ({
  id: "t1",
  type: "text",
  x: 10,
  y: 20,
  text: "Hello World",
  width: 80,
  height: 20,
  fontSize: 16,
  strokeWidth: 2,
});

// ---------------------------------------------------------------------------
// getShapeBoundingBox
// ---------------------------------------------------------------------------

describe("getShapeBoundingBox", () => {
  it("returns correct bbox for rect", () => {
    const bbox = getShapeBoundingBox(rect());
    expect(bbox).toEqual({ x: 10, y: 20, width: 100, height: 60 });
  });

  it("handles negative-dimension rect (drawn backwards)", () => {
    const bbox = getShapeBoundingBox(negativeRect());
    expect(bbox.x).toBe(10);
    expect(bbox.y).toBe(20);
    expect(bbox.width).toBe(100);
    expect(bbox.height).toBe(60);
  });

  it("returns correct bbox for circle", () => {
    const bbox = getShapeBoundingBox(circle());
    expect(bbox).toEqual({ x: 20, y: 20, width: 60, height: 60 });
  });

  it("returns correct bbox for line", () => {
    const bbox = getShapeBoundingBox(line());
    expect(bbox).toEqual({ x: 0, y: 0, width: 100, height: 80 });
  });

  it("returns correct bbox for pencil", () => {
    const bbox = getShapeBoundingBox(pencil());
    expect(bbox).toEqual({ x: 10, y: 10, width: 80, height: 20 });
  });
});

// ---------------------------------------------------------------------------
// getPencilBoundingBox
// ---------------------------------------------------------------------------

describe("getPencilBoundingBox", () => {
  it("handles empty points array", () => {
    expect(getPencilBoundingBox([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it("handles single point", () => {
    expect(getPencilBoundingBox([{ x: 5, y: 7 }])).toEqual({ x: 5, y: 7, width: 0, height: 0 });
  });
});

// ---------------------------------------------------------------------------
// getResizeHandles
// ---------------------------------------------------------------------------

describe("getResizeHandles", () => {
  const bbox: BoundingBox = { x: 0, y: 0, width: 100, height: 50 };

  it("returns exactly 8 handles", () => {
    expect(getResizeHandles(bbox)).toHaveLength(8);
  });

  it("includes all expected handle IDs", () => {
    const ids = getResizeHandles(bbox).map((h) => h.id);
    expect(ids).toEqual(expect.arrayContaining(["tl", "tc", "tr", "ml", "mr", "bl", "bc", "br"]));
  });

  it("tl handle is at top-left corner", () => {
    const tl = getResizeHandles(bbox).find((h) => h.id === "tl")!;
    expect(tl.x).toBe(0);
    expect(tl.y).toBe(0);
  });

  it("br handle is at bottom-right corner", () => {
    const br = getResizeHandles(bbox).find((h) => h.id === "br")!;
    expect(br.x).toBe(100);
    expect(br.y).toBe(50);
  });

  it("tc handle is horizontally centred on top edge", () => {
    const tc = getResizeHandles(bbox).find((h) => h.id === "tc")!;
    expect(tc.x).toBe(50);
    expect(tc.y).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// hitTestHandle
// ---------------------------------------------------------------------------

describe("hitTestHandle", () => {
  const bbox: BoundingBox = { x: 0, y: 0, width: 100, height: 50 };
  const handles = getResizeHandles(bbox);

  it("returns the handle when pointer is exactly on it", () => {
    const tl = handles.find((h) => h.id === "tl")!;
    const result = hitTestHandle(tl.x, tl.y, handles);
    expect(result?.id).toBe("tl");
  });

  it("returns a handle within hitRadius", () => {
    const br = handles.find((h) => h.id === "br")!;
    const result = hitTestHandle(br.x + 5, br.y + 5, handles, 8);
    expect(result?.id).toBe("br");
  });

  it("returns null when pointer is far from all handles", () => {
    const result = hitTestHandle(200, 200, handles);
    expect(result).toBeNull();
  });

  it("returns null just outside hitRadius", () => {
    const tl = handles.find((h) => h.id === "tl")!;
    const result = hitTestHandle(tl.x + 9, tl.y + 9, handles, 8); // sqrt(81+81) ≈ 12.7 > 8
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyResize — rect
// ---------------------------------------------------------------------------

describe("applyResize — rect", () => {
  const shape = rect();
  const bbox = getShapeBoundingBox(shape);

  it("dragging br enlarges width and height", () => {
    const result = applyResize(shape, "br", 20, 10, bbox);
    if (result.type !== "rect") throw new Error("wrong type");
    expect(result.width).toBe(120);
    expect(result.height).toBe(70);
    expect(result.x).toBe(10); // anchor stays at tl
    expect(result.y).toBe(20);
  });

  it("dragging tl moves origin and reduces size", () => {
    const result = applyResize(shape, "tl", 10, 10, bbox);
    if (result.type !== "rect") throw new Error("wrong type");
    expect(result.x).toBe(20);
    expect(result.y).toBe(30);
    expect(result.width).toBe(90);
    expect(result.height).toBe(50);
  });

  it("clamped to minimum size of 1px", () => {
    // Drag br so far left it would invert
    const result = applyResize(shape, "br", -200, -200, bbox);
    if (result.type !== "rect") throw new Error("wrong type");
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it("does not mutate the original shape", () => {
    const original = rect();
    applyResize(original, "br", 20, 10, bbox);
    expect(original.width).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// applyResize — circle
// ---------------------------------------------------------------------------

describe("applyResize — circle", () => {
  const shape = circle();
  const bbox = getShapeBoundingBox(shape);

  it("dragging br enlarges radius", () => {
    const result = applyResize(shape, "br", 20, 20, bbox);
    if (result.type !== "circle") throw new Error("wrong type");
    expect(result.radius).toBeGreaterThan(30);
  });

  it("centre follows the bounding box centre", () => {
    const result = applyResize(shape, "br", 10, 10, bbox);
    if (result.type !== "circle") throw new Error("wrong type");
    const newBboxW = bbox.width + 10;
    const newBboxH = bbox.height + 10;
    expect(result.centreX).toBeCloseTo(bbox.x + newBboxW / 2);
    expect(result.centreY).toBeCloseTo(bbox.y + newBboxH / 2);
  });
});

// ---------------------------------------------------------------------------
// applyResize — line
// ---------------------------------------------------------------------------

describe("applyResize — line", () => {
  const shape = line();
  const bbox = getShapeBoundingBox(shape);

  it("dragging tl corner moves the nearest endpoint", () => {
    const result = applyResize(shape, "tl", -10, -10, bbox);
    if (result.type !== "line") throw new Error("wrong type");
    // The nearest endpoint to tl (0,0) is (0,0) = x1,y1
    expect(result.x1).toBe(-10);
    expect(result.y1).toBe(-10);
    // Far endpoint is unchanged
    expect(result.x2).toBe(100);
    expect(result.y2).toBe(80);
  });

  it("dragging br corner moves the far endpoint", () => {
    const result = applyResize(shape, "br", 10, 10, bbox);
    if (result.type !== "line") throw new Error("wrong type");
    expect(result.x2).toBe(110);
    expect(result.y2).toBe(90);
    expect(result.x1).toBe(0);
    expect(result.y1).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyResize — pencil
// ---------------------------------------------------------------------------

describe("applyResize — pencil", () => {
  const shape = pencil();
  const bbox = getShapeBoundingBox(shape); // {x:10, y:10, w:80, h:20}

  it("all points scale proportionally on br drag", () => {
    const result = applyResize(shape, "br", 80, 20, bbox);
    if (result.type !== "pencil") throw new Error("wrong type");
    // New bbox should be 160×40
    // Point at (10,10) stays at tl = (10,10)
    expect(result.points[0].x).toBeCloseTo(10);
    expect(result.points[0].y).toBeCloseTo(10);
    // Middle point was at relative (40,20) out of (80,20) → scaled to (80,40) of (160,40)
    expect(result.points[1].x).toBeCloseTo(90); // 10 + 80
    expect(result.points[1].y).toBeCloseTo(50); // 10 + 40
  });

  it("does not mutate original points", () => {
    const original = pencil();
    applyResize(original, "br", 20, 10, bbox);
    expect(original.points[0]).toEqual({ x: 10, y: 10 });
  });
});

// ---------------------------------------------------------------------------
// translateShape
// ---------------------------------------------------------------------------

describe("translateShape", () => {
  it("translates a rect by (dx, dy)", () => {
    const s = rect();
    const result = translateShape(s, 10, 20);
    if (result.type !== "rect") throw new Error("wrong type");
    expect(result.x).toBe(20);   // 10 + 10
    expect(result.y).toBe(40);   // 20 + 20
    expect(result.width).toBe(100);  // unchanged
    expect(result.height).toBe(60);  // unchanged
  });

  it("translates a circle by moving centreX/centreY", () => {
    const s = circle();
    const result = translateShape(s, -5, 15);
    if (result.type !== "circle") throw new Error("wrong type");
    expect(result.centreX).toBe(45); // 50 - 5
    expect(result.centreY).toBe(65); // 50 + 15
    expect(result.radius).toBe(30);  // unchanged
  });

  it("translates a line by shifting both endpoints", () => {
    const s = line();
    const result = translateShape(s, 3, -7);
    if (result.type !== "line") throw new Error("wrong type");
    expect(result.x1).toBe(3);   // 0 + 3
    expect(result.y1).toBe(-7);  // 0 - 7
    expect(result.x2).toBe(103); // 100 + 3
    expect(result.y2).toBe(73);  // 80 - 7
  });

  it("translates a pencil by shifting all points", () => {
    const s = pencil();
    const result = translateShape(s, 5, 5);
    if (result.type !== "pencil") throw new Error("wrong type");
    expect(result.points[0]).toEqual({ x: 15, y: 15 });
    expect(result.points[1]).toEqual({ x: 55, y: 35 });
    expect(result.points[2]).toEqual({ x: 95, y: 15 });
  });

  it("does not mutate the original shape", () => {
    const original = rect();
    translateShape(original, 99, 99);
    expect(original.x).toBe(10);
    expect(original.y).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// applyResize — circle ml / mr (the horizontal edge-handle bug fix)
// ---------------------------------------------------------------------------

describe("applyResize — circle ml/mr edge handles", () => {
  // Circle: centreX=50, centreY=50, radius=30 → raw bbox {x:20, y:20, w:60, h:60}
  const shape = circle();
  const bbox = getShapeBoundingBox(shape); // {x:20, y:20, width:60, height:60}

  it("ml drag left: radius grows, right edge stays anchored", () => {
    // Drag ml left by 10px → left edge moves from 20 → 10, right stays at 80
    // new diameter = 70, radius = 35, centreX = 10 + 35 = 45, centreY = 50 (unchanged)
    const result = applyResize(shape, "ml", -10, 0, bbox);
    if (result.type !== "circle") throw new Error("wrong type");
    expect(result.radius).toBeCloseTo(35);
    expect(result.centreX).toBeCloseTo(45);
    expect(result.centreY).toBe(50); // vertical centre unchanged
  });

  it("mr drag right: radius grows, left edge stays anchored", () => {
    // Drag mr right by 10px → right edge moves from 80 → 90, left stays at 20
    // new diameter = 70, radius = 35, centreX = 20 + 35 = 55, centreY = 50 (unchanged)
    const result = applyResize(shape, "mr", 10, 0, bbox);
    if (result.type !== "circle") throw new Error("wrong type");
    expect(result.radius).toBeCloseTo(35);
    expect(result.centreX).toBeCloseTo(55);
    expect(result.centreY).toBe(50); // vertical centre unchanged
  });

  it("ml/mr radius is based on new width, not min(w,h)", () => {
    // If the old code ran: min(new_width, height)/2 = min(70,60)/2 = 30 (WRONG)
    // The fixed code:      new_width/2 = 70/2 = 35 (CORRECT)
    const result = applyResize(shape, "mr", 10, 0, bbox);
    if (result.type !== "circle") throw new Error("wrong type");
    expect(result.radius).not.toBe(30); // regression guard: old buggy value
    expect(result.radius).toBeCloseTo(35);
  });

  it("tc drag up: radius grows, bottom edge stays anchored", () => {
    // Drag tc up by 10px → top moves from 20 → 10, bottom stays at 80
    // new diameter = 70, radius = 35, centreY = 10 + 35 = 45, centreX = 50 (unchanged)
    const result = applyResize(shape, "tc", 0, -10, bbox);
    if (result.type !== "circle") throw new Error("wrong type");
    expect(result.radius).toBeCloseTo(35);
    expect(result.centreY).toBeCloseTo(45);
    expect(result.centreX).toBe(50); // horizontal centre unchanged
  });

  it("does not mutate the original circle", () => {
    applyResize(shape, "ml", -20, 0, bbox);
    expect(shape.centreX).toBe(50);
    expect(shape.radius).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Text Geometry Tests
// ---------------------------------------------------------------------------

describe("Text shape geometry", () => {
  it("computes bounding box of a text shape", () => {
    const t = textShape();
    const bbox = getShapeBoundingBox(t);
    expect(bbox).toEqual({ x: 10, y: 20, width: 80, height: 20 });
  });

  it("translates a text shape", () => {
    const t = textShape();
    const result = translateShape(t, 25, -15);
    if (result.type !== "text") throw new Error("wrong type");
    expect(result.x).toBe(35); // 10 + 25
    expect(result.y).toBe(5);  // 20 - 15
    expect(result.text).toBe("Hello World");
    expect(result.fontSize).toBe(16);
  });

  it("resizes a text shape scaling the font size proportionately", () => {
    const t = textShape();
    const bbox = getShapeBoundingBox(t); // {x:10, y:20, width:80, height:20}
    // Resize by expanding right bottom edge (br) to {width: 160, height: 40} (scale is 2.0)
    const result = applyResize(t, "br", 80, 20, bbox);
    if (result.type !== "text") throw new Error("wrong type");
    expect(result.fontSize).toBe(32); // 16 * 2.0
    expect(result.width).toBe(160);
    expect(result.height).toBe(40);
  });
});
