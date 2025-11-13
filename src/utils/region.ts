import { Rect, ScreenFrame } from "../types";

export type DragSelection = {
  start: { x: number; y: number };
  current: { x: number; y: number };
};

export type CanvasDimensions = { width: number; height: number };

export function dragToScreenRect(
  selection: DragSelection,
  frame: ScreenFrame,
  canvas: CanvasDimensions,
): Rect | null {
  if (canvas.width <= 0 || canvas.height <= 0) {
    return null;
  }
  const minX = clamp(Math.min(selection.start.x, selection.current.x), 0, canvas.width);
  const maxX = clamp(Math.max(selection.start.x, selection.current.x), 0, canvas.width);
  const minY = clamp(Math.min(selection.start.y, selection.current.y), 0, canvas.height);
  const maxY = clamp(Math.max(selection.start.y, selection.current.y), 0, canvas.height);
  const widthPx = maxX - minX;
  const heightPx = maxY - minY;
  if (widthPx < 1 || heightPx < 1) {
    return null;
  }
  const scaleX = frame.width / canvas.width;
  const scaleY = frame.height / canvas.height;
  const rectX = Math.round(frame.display.x + minX * scaleX);
  const rectY = Math.round(frame.display.y + minY * scaleY);
  const rectWidth = Math.max(1, Math.round(widthPx * scaleX));
  const rectHeight = Math.max(1, Math.round(heightPx * scaleY));
  return { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
