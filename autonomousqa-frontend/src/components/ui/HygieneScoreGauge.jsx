import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function HygieneScoreGauge({ score = 0, size = 180, label = 'Hygiene Score' }) {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = score / 100;

    const getColor = (s) => {
        if (s >= 85) return '#10B981';
        if (s >= 70) return '#F59E0B';
        return '#EF4444';
    };

    const color = getColor(score);
    const motionScore = useMotionValue(0);
    const displayScore = useTransform(motionScore, (v) => Math.round(v));

    const scoreRef = useRef(null);

    useEffect(() => {
        const animation = animate(motionScore, score, {
            duration: 1.5,
            ease: [0.34, 1.56, 0.64, 1],
        });

        const unsubscribe = displayScore.on('change', (v) => {
            if (scoreRef.current) scoreRef.current.textContent = v;
        });

        return () => {
            animation.stop();
            unsubscribe();
        };
    }, [score]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                    {/* background track */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.04)"
                        strokeWidth={10}
                    />
                    {/* progress arc */}
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - progress) }}
                        transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{
                            filter: `drop-shadow(0 0 8px ${color}40) drop-shadow(0 0 20px ${color}20)`,
                        }}
                    />
                </svg>
                {/* Center text */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span
                        ref={scoreRef}
                        style={{
                            fontSize: size * 0.26,
                            fontWeight: 800,
                            color: color,
                            lineHeight: 1,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            filter: `drop-shadow(0 0 10px ${color}30)`,
                        }}
                    >
                        0
                    </span>
                    <span style={{
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        marginTop: 4,
                        fontWeight: 500,
                    }}>
                        / 100
                    </span>
                </div>
            </div>
            <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
            }}>
                {label}
            </span>
        </div>
    );
}
