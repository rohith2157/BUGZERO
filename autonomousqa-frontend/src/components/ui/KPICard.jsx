import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ icon: Icon, label, value, change, prefix = '', suffix = '', delay = 0 }) {
    const motionVal = useMotionValue(0);
    const valRef = useRef(null);

    const isPositive = change >= 0;
    const numericValue = typeof value === 'number' ? value : parseFloat(value);

    useEffect(() => {
        const anim = animate(motionVal, numericValue, {
            duration: 1.8,
            ease: [0.34, 1.56, 0.64, 1],
            delay: delay,
        });

        const unsub = motionVal.on('change', (v) => {
            if (valRef.current) {
                valRef.current.textContent = prefix + (Number.isInteger(numericValue) ? Math.round(v) : v.toFixed(1)) + suffix;
            }
        });

        return () => { anim.stop(); unsub(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numericValue, delay, prefix, suffix]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="glass-card noise-overlay"
            style={{
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
            }}
        >
            {/* Accent gradient top border */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'var(--gradient-accent)',
                opacity: 0.6,
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Icon size={20} style={{ color: 'var(--color-accent-blue)' }} />
                </div>
                {change != null && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: isPositive ? 'var(--color-success)' : 'var(--color-error)',
                    }}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isPositive ? '+' : ''}{change}%
                    </div>
                )}
            </div>

            <div
                ref={valRef}
                style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    marginBottom: 4,
                }}
            >
                {prefix}0{suffix}
            </div>
            <div style={{
                fontSize: 13,
                color: 'var(--text-tertiary)',
                fontWeight: 500,
            }}>
                {label}
            </div>
        </motion.div>
    );
}
