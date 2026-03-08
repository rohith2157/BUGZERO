"use client";

import React, { useState, useEffect, useId } from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FlipTextProps {
    word?: string;
    className?: string;
    /** Font size override — inherits from parent by default */
    fontSize?: string;
    /** Text color — inherits from parent by default */
    color?: string;
    /** Stagger delay per character in seconds */
    stagger?: number;
}

export default function FlipTextReveal({
    word = "DIGITAL REALITY",
    className = "",
    fontSize,
    color,
    stagger = 0.06,
}: FlipTextProps) {
    const [key, setKey] = useState(0);
    const animId = useId().replace(/:/g, "");

    // Inject the keyframes once
    useEffect(() => {
        const styleId = `flip-text-keyframes-${animId}`;
        if (document.getElementById(styleId)) return;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
      @keyframes flip-up-${animId} {
        0% { opacity: 0; transform: rotateX(-90deg) translateY(40px); }
        100% { opacity: 1; transform: rotateX(0deg) translateY(0); }
      }
    `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById(styleId);
            if (el) el.remove();
        };
    }, [animId]);

    return (
        <span
            className={cn("inline-flex flex-wrap cursor-pointer", className)}
            onClick={() => setKey((prev) => prev + 1)}
            title="Click to replay"
            style={{ perspective: 800 }}
        >
            {word.split("").map((char, i) => (
                <span
                    key={`${key}-${i}`}
                    style={{
                        display: "inline-block",
                        fontSize: fontSize || "inherit",
                        fontWeight: "inherit",
                        letterSpacing: "inherit",
                        lineHeight: "inherit",
                        color: color || "inherit",
                        transformOrigin: "bottom center",
                        opacity: 0,
                        transform: "rotateX(-90deg) translateY(20px)",
                        animation: `flip-up-${animId} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
                        animationDelay: `${stagger * i}s`,
                        willChange: "transform, opacity",
                    }}
                >
                    {char === " " ? "\u00A0" : char}
                </span>
            ))}
        </span>
    );
}
