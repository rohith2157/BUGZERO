import * as React from "react";
import { cn } from "../../lib/utils";

export function GridBackground({ title, description, showAvailability = true, className, children }) {
    return (
        <div
            className={cn(
                "px-10 py-8 rounded-xl relative flex flex-col",
                className
            )}
            style={{
                backgroundColor: "var(--color-bg-secondary)",
                backgroundImage: `
          linear-gradient(var(--grid-line-color) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
        `,
                backgroundSize: "20px 20px",
            }}
        >
            {/* Animated dot that follows the border */}
            <div
                className="w-3 h-3 rounded-full absolute z-10 bg-current"
                style={{
                    boxShadow: "0 0 15px currentColor",
                    animation: "border-follow 6s linear infinite, color-change 6s linear infinite",
                }}
            />

            {/* Animated border */}
            <div
                className="absolute inset-0 border-2 rounded-xl pointer-events-none"
                style={{ animation: "border-color-change 6s linear infinite" }}
            />

            {/* Header */}
            {(title || description) && (
                <div className="relative z-20 text-center mb-6">
                    {title && (
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                            {description}
                        </p>
                    )}
                    {showAvailability && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#20bb5a", fontWeight: 600 }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: "50%", background: "#20bb5a",
                                boxShadow: "0 0 8px #20bb5a",
                                animation: "pulse-glow 1.5s ease-in-out infinite",
                            }} />
                            Live
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-20 w-full">
                {children}
            </div>
        </div>
    );
}

export default GridBackground;
