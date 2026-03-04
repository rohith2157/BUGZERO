import { useRef, useState, useEffect } from "react";
import { useMousePositionRef } from "../../hooks/useMousePositionRef";

/**
 * GradientCard — drop-in replacement for glass-card divs.
 * Renders a gold radial gradient that follows your cursor inside the card.
 *
 * Props:
 *  - className   : extra class names (e.g. "noise-overlay")
 *  - style       : inline styles passed to the outer div
 *  - children    : card content
 *  - color       : override gradient color (default gold)
 *  - spread      : gradient radius in px (default 300)
 *  - ...rest     : any other div props (variants, onClick, etc.)
 */
export default function GradientCard({
  className = "",
  style = {},
  children,
  color = "rgba(212, 168, 83, 0.08)",
  spread = 300,
  ...rest
}) {
  const containerRef = useRef(null);
  const positionRef = useMousePositionRef(containerRef);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    let raf;
    const tick = () => {
      setPos({ ...positionRef.current });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered, positionRef]);

  return (
    <div
      ref={containerRef}
      className={`glass-card ${className}`}
      style={{ position: "relative", overflow: "hidden", ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPos({ x: -9999, y: -9999 });
      }}
      {...rest}
    >
      {/* Mouse-tracking radial gradient overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(${spread}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)`,
          transition: "background 0.05s ease",
        }}
      />
      {/* Actual content sits above the gradient */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
