"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface HeroTextProps {
    text?: string;
    className?: string;
    /** Font size — pass any CSS value, defaults to inherit */
    fontSize?: string;
    /** Text color for the main characters */
    color?: string;
    /** Color for the shutter sweep slices */
    accentColor?: string;
}

export default function HeroText({
    text = "IMMERSE",
    className = "",
    fontSize,
    color,
    accentColor,
}: HeroTextProps) {
    const [count, setCount] = useState(0);
    const characters = text.split("");

    return (
        <span
            className={cn("relative inline-flex cursor-pointer", className)}
            onClick={() => setCount((c) => c + 1)}
            title="Click to re-shutter"
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={count}
                    className="inline-flex flex-wrap items-center"
                >
                    {characters.map((char, i) => (
                        <span
                            key={i}
                            className="relative overflow-hidden"
                            style={{ lineHeight: "inherit" }}
                        >
                            {/* Main Character */}
                            <motion.span
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ delay: i * 0.04 + 0.3, duration: 0.8 }}
                                style={{
                                    fontSize: fontSize || "inherit",
                                    fontWeight: "inherit",
                                    letterSpacing: "inherit",
                                    lineHeight: "inherit",
                                    color: color || "inherit",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>

                            {/* Top Slice Layer */}
                            <motion.span
                                initial={{ x: "-100%", opacity: 0 }}
                                animate={{ x: "100%", opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 0.7,
                                    delay: i * 0.04,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    fontSize: fontSize || "inherit",
                                    fontWeight: "inherit",
                                    letterSpacing: "inherit",
                                    lineHeight: "inherit",
                                    color: accentColor || "var(--color-accent-gold)",
                                    clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>

                            {/* Middle Slice Layer */}
                            <motion.span
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: "-100%", opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 0.7,
                                    delay: i * 0.04 + 0.1,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    fontSize: fontSize || "inherit",
                                    fontWeight: "inherit",
                                    letterSpacing: "inherit",
                                    lineHeight: "inherit",
                                    color: color || "inherit",
                                    opacity: 0.7,
                                    clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>

                            {/* Bottom Slice Layer */}
                            <motion.span
                                initial={{ x: "-100%", opacity: 0 }}
                                animate={{ x: "100%", opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 0.7,
                                    delay: i * 0.04 + 0.2,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    fontSize: fontSize || "inherit",
                                    fontWeight: "inherit",
                                    letterSpacing: "inherit",
                                    lineHeight: "inherit",
                                    color: accentColor || "var(--color-accent-gold)",
                                    clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        </span>
                    ))}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}
