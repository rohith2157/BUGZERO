import { useEffect, useRef } from "react";

export const useMousePositionRef = (containerRef) => {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (x, y) => {
      if (containerRef && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = { x: x - rect.left, y: y - rect.top };
      } else {
        positionRef.current = { x, y };
      }
    };

    const handleMouseMove = (ev) => updatePosition(ev.clientX, ev.clientY);
    const handleTouchMove = (ev) => {
      const touch = ev.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
};
