"use client";

import React from "react";
import { motion } from "framer-motion";
import { Folder, HeartHandshakeIcon, SparklesIcon, ActivityIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface HygieneConnectionProps {
    className?: string;
    overallScore?: number;
    categories?: { label: string; score: number; color: string }[];
    title?: string;
    lightColor?: string;
}

const DatabaseWithRestApi = ({
    className,
    overallScore = 0,
    categories = [
        { label: "Access", score: 90, color: "#10B981" },
        { label: "Perform", score: 80, color: "#34D399" },
        { label: "SEO", score: 95, color: "#F59E0B" },
        { label: "Function", score: 70, color: "#EF4444" },
        { label: "Comply", score: 100, color: "#10B981" }
    ],
    title,
    lightColor,
}: HygieneConnectionProps) => {

    // SVG Centers: 50, 150, 250, 350, 450
    const centers = [50, 150, 250, 350, 450];

    const getScoreColor = (s: number) => {
        if (s >= 85) return '#10B981';
        if (s >= 70) return '#F59E0B';
        return '#EF4444';
    };
    const scoreColor = getScoreColor(overallScore);

    return (
        <div
            className={cn(
                "relative flex h-[420px] w-full flex-col items-center mx-auto overflow-visible",
                className
            )}
        >
            {/* SVG Paths  */}
            <svg
                className="h-full sm:w-full text-muted"
                width="100%"
                height="100%"
                viewBox="0 0 500 200"
            >
                <g
                    stroke="rgba(128,128,128,0.45)"
                    fill="none"
                    strokeWidth="1.5"
                    strokeDasharray="300 300"
                    pathLength="300"
                >
                    {/* Accessibility (outermost left) — drops deepest: v22 before h, horizontal at y=56 */}
                    <path d="M 50 22 v 22 q 0 12 12 12 h 178 q 10 0 10 12 v 12" />
                    {/* Performance (inner left) — drops shallower: v10, horizontal at y=44 */}
                    <path d="M 150 22 v 10 q 0 12 12 12 h 78 q 10 0 10 12 v 24" />
                    {/* SEO (center) — straight down */}
                    <path d="M 250 22 v 68" />
                    {/* Functional (inner right) — mirrors Performance */}
                    <path d="M 350 22 v 10 q 0 12 -12 12 h -78 q -10 0 -10 12 v 24" />
                    {/* Compliance (outermost right) — mirrors Accessibility */}
                    <path d="M 450 22 v 22 q 0 12 -12 12 h -178 q -10 0 -10 12 v 12" />
                    {/* Animation For Path Starting */}
                    <animate
                        attributeName="stroke-dashoffset"
                        from="300"
                        to="0"
                        dur="1.5s"
                        fill="freeze"
                        calcMode="spline"
                        keySplines="0.25,0.1,0.5,1"
                        keyTimes="0; 1"
                    />
                </g>

                {/* Animated Light Dots */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <g mask={`url(#db-mask-${i})`} key={i}>
                        <circle
                            className={`database db-light-${i}`}
                            cx="0"
                            cy="0"
                            r="8"
                            fill="url(#db-blue-grad)"
                        />
                    </g>
                ))}

                {/* Top Badges for 5 Scores */}
                {categories.map((cat, i) => {
                    const cx = centers[i];
                    const label = cat.label.slice(0, 15);
                    return (
                        <g key={i}>
                            <rect
                                fill={cat.color}
                                fillOpacity="0.08"
                                x={cx - 48}
                                y="10"
                                width="96"
                                height="24"
                                rx="12"
                                stroke={cat.color}
                                strokeWidth="1.5"
                            />
                            <circle cx={cx - 32} cy="22" r="4.5" fill={cat.color} stroke="none" />
                            <text
                                x={cx - 22}
                                y="24.5"
                                fill="var(--text-primary)"
                                stroke="none"
                                fontSize="7"
                                fontWeight="700"
                            >
                                {label}
                            </text>
                            <text
                                x={cx + 40}
                                y="24.5"
                                fill={cat.color}
                                stroke="none"
                                fontSize="8.5"
                                fontWeight="800"
                                textAnchor="end"
                            >
                                {Math.min(100, cat.score)}
                            </text>
                        </g>
                    );
                })}

                <defs>
                    <mask id="db-mask-1">
                        <path d="M 50 22 v 22 q 0 12 12 12 h 178 q 10 0 10 12 v 12" strokeWidth="2" stroke="white" />
                    </mask>
                    <mask id="db-mask-2">
                        <path d="M 150 22 v 10 q 0 12 12 12 h 78 q 10 0 10 12 v 24" strokeWidth="2" stroke="white" />
                    </mask>
                    <mask id="db-mask-3">
                        <path d="M 250 22 v 68" strokeWidth="2" stroke="white" />
                    </mask>
                    <mask id="db-mask-4">
                        <path d="M 350 22 v 10 q 0 12 -12 12 h -78 q -10 0 -10 12 v 24" strokeWidth="2" stroke="white" />
                    </mask>
                    <mask id="db-mask-5">
                        <path d="M 450 22 v 22 q 0 12 -12 12 h -178 q -10 0 -10 12 v 12" strokeWidth="2" stroke="white" />
                    </mask>

                    <radialGradient id="db-blue-grad" fx="1">
                        <stop offset="0%" stopColor={lightColor || scoreColor} />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                </defs>
            </svg>
            {/* Main Bottom Box */}
            <div className="absolute bottom-10 flex w-full flex-col items-center">
                {/* bottom shadow */}
                <div className="absolute -bottom-4 h-[100px] w-[50%] rounded-lg bg-accent/20 blur-[12px]" />

                {/* box title */}
                <div className="absolute -top-3 z-20 flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 shadow-lg">
                    <ActivityIcon className="size-3.5" style={{ color: scoreColor }} />
                    <span className="ml-2 text-xs font-semibold text-[var(--text-primary)]">
                        {title ? title : "Aggregated Hygiene Score Connection"}
                    </span>
                </div>

                {/* box outter circle */}
                <div
                    className="absolute -bottom-8 z-30 flex h-[70px] w-[70px] flex-col items-center justify-center rounded-full border-t bg-[var(--color-bg-elevated)]"
                    style={{
                        borderColor: scoreColor,
                        boxShadow: `0 0 20px ${scoreColor}25`,
                    }}
                >
                    <span className="font-bold text-[24px] leading-none" style={{ color: scoreColor }}>{overallScore}</span>
                    <span className="text-[9px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">Score</span>
                </div>

                {/* box content */}
                <div
                    className="relative z-10 flex h-[160px] w-[80%] items-center justify-center overflow-hidden rounded-xl border backdrop-blur-md shadow-xl"
                    style={{
                        borderColor: `${scoreColor}30`,
                        background: `radial-gradient(circle at center, ${scoreColor}0e 0%, var(--color-bg-card) 100%)`,
                        boxShadow: `0 10px 30px ${scoreColor}0b`,
                    }}
                >
                    {/* Arc layer is clipped by this box to prevent layout overflow */}
                    <div className="absolute inset-0 z-[5] pointer-events-none">
                        {[1, 2, 3, 4].map((i) => {
                            const arcSize = 70 + (i * 40);
                            const arcBottom = -35 + (i * -12);
                            const arcOpacity = 0.35 - (i * 0.06);

                            return (
                                <React.Fragment key={`arc-pair-${i}`}>
                                    <motion.div
                                        className="absolute"
                                        style={{
                                            bottom: arcBottom,
                                            left: '50%',
                                            marginLeft: 10,
                                            width: arcSize,
                                            height: arcSize,
                                            borderTop: `1px solid ${scoreColor}`,
                                            borderRight: `1px solid ${scoreColor}`,
                                            borderTopRightRadius: arcSize,
                                            opacity: arcOpacity,
                                        }}
                                        animate={{
                                            scale: i % 2 === 0 ? [1, 1.02, 1] : [0.98, 1, 0.98],
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                                    />

                                    <motion.div
                                        className="absolute"
                                        style={{
                                            bottom: arcBottom,
                                            right: '50%',
                                            marginRight: 10,
                                            width: arcSize,
                                            height: arcSize,
                                            borderTop: `1px solid ${scoreColor}`,
                                            borderLeft: `1px solid ${scoreColor}`,
                                            borderTopLeftRadius: arcSize,
                                            opacity: arcOpacity,
                                        }}
                                        animate={{
                                            scale: i % 2 === 0 ? [1, 1.02, 1] : [0.98, 1, 0.98],
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Decorative Badges */}
                    <div className="absolute bottom-8 left-8 z-10 h-8 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--border-subtle)] px-4 text-xs flex items-center gap-2 shadow-md">
                        <ShieldCheck className="size-4 text-emerald-400" />
                        <span className="font-medium text-[var(--text-secondary)]">All Checks Passed</span>
                    </div>
                    <div className="absolute right-8 z-10 hidden h-8 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--border-subtle)] px-4 text-xs sm:flex items-center gap-2 shadow-md">
                        <SparklesIcon className="size-4" style={{ color: scoreColor }} />
                        <span className="font-medium text-[var(--text-secondary)]">AI Evaluated</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseWithRestApi;
