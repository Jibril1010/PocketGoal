import { useCallback, useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

// Lightweight pointer-events drag: tracks position as a percentage of a
// bounding container while dragging, and reports the final position on drop.
export function useDraggableSprite(
  containerRef: React.RefObject<HTMLElement>,
  initial: Position,
  onDrop: (pos: Position) => void,
) {
  const [pos, setPos] = useState<Position>(initial);
  const [dragging, setDragging] = useState(false);
  const posRef = useRef(pos);
  posRef.current = pos;

  const clamp = (v: number) => Math.min(96, Math.max(4, v));

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);

      const move = (ev: PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = clamp(((ev.clientX - rect.left) / rect.width) * 100);
        const y = clamp(((ev.clientY - rect.top) / rect.height) * 100);
        setPos({ x, y });
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        onDrop(posRef.current);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [containerRef, onDrop],
  );

  return { pos, dragging, onPointerDown, setPos };
}
