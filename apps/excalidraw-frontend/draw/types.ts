

export type Rectangle = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeStyle?: "solid" | "dashed" | "dotted";
};

export type Square = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeStyle?: "solid" | "dashed" | "dotted";
};

export type Circle = {
  id: string;
  type: "circle";
  centreX: number;
  centreY: number;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeStyle?: "solid" | "dashed" | "dotted";
};

export type Line = {
  id: string;
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth?: number;
  strokeColor?: string;
  strokeStyle?: "solid" | "dashed" | "dotted";
};

export type Pencil = {
  id: string;
  type: "pencil";
  points: { x: number; y: number }[];
  strokeWidth?: number;
  strokeColor?: string;
  strokeStyle?: "solid" | "dashed" | "dotted";
};

export type Text = {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  fontSize: number;
  strokeWidth?: number;
  strokeColor?: string;
};

export type Shape = Rectangle | Square | Circle | Line | Pencil | Text;
