import React, { useEffect, useState } from "react";
import { CursorDrivenParticleTypography } from "./cursor-driven-particles-typography";

interface ParticleTextProps {
  isDark: boolean;
  text: string;
  fontSize?: number;
  opacity?: number;
  top?: string | number;
  bottom?: string | number;
  height?: string | number;
  position?: "absolute" | "relative";
}

/**
 * Reusable particle text layer that can be positioned absolutely within any relative section.
 */
export function ParticleTextLayer({ isDark, text, fontSize = 160, opacity = 0.35, top, bottom, height = "100%", position = "absolute" }: ParticleTextProps) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey((k) => k + 1);
  }, [isDark]);

  const particleColor = isDark ? "#FFD700" : "#000000";
  
  // Custom particle settings based on text for variety
  const isMain = text === "Zero-Touch QA";
  const pSize = isMain ? 1.8 : 1.6;
  const pDensity = 4;
  const dispStrength = isMain ? 22 : 18;
  const rSpeed = isMain ? 0.08 : 0.06;

  return (
    <div
      key={`particle-${key}`}
      style={{
        position: position,
        top,
        bottom,
        left: 0,
        width: "100%",
        height,
        opacity,
        transition: "opacity 0.5s ease",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div style={{ width: "100%", height: "100%", minHeight: 350 }}>
        <CursorDrivenParticleTypography
          text={text}
          fontSize={fontSize}
          fontFamily="'Plus Jakarta Sans', Inter, sans-serif"
          particleDensity={pDensity}
          particleSize={pSize}
          dispersionStrength={dispStrength}
          returnSpeed={rSpeed}
          color={particleColor}
        />
      </div>
    </div>
  );
}
