import { animate, motion } from 'framer-motion';
import { useEffect, useId, useRef, useState, useMemo } from 'react';

function Beam({ width, delay, duration, hue, reverse = false, style: beamStyle }) {
    const el = useRef(null);
    const [isInView, setIsInView] = useState(false);
    const id = useId();

    useEffect(() => {
        if (!el.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        });
        observer.observe(el.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!el.current || !isInView) return;
        const controls = animate(
            el.current,
            { opacity: [0, 1, 1, 0] },
            { duration, delay, repeat: Infinity }
        );
        return () => controls.stop();
    }, [duration, delay, isInView]);

    return (
        <div
            ref={el}
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                opacity: 0,
                height: typeof width === 'number' ? `${width}px` : width,
                transform: reverse ? 'rotate(180deg)' : undefined,
                ...beamStyle,
            }}
        >
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
            >
                <defs>
                    <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: `hsl(${hue}, 80%, 60%)`, stopOpacity: 0 }} />
                        <stop offset="20%" style={{ stopColor: `hsl(${hue}, 80%, 60%)`, stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: `hsl(${hue}, 80%, 60%)`, stopOpacity: 1 }} />
                        <stop offset="80%" style={{ stopColor: `hsl(${hue}, 80%, 60%)`, stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: `hsl(${hue}, 80%, 60%)`, stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill={`url(#grad-${id})`} />
            </svg>
        </div>
    );
}

export default function WarpBackground({
    children,
    perspective = 100,
    style,
    beamsPerSide = 3,
    beamSize = 5,
    beamDelayMax = 3,
    beamDelayMin = 0,
    beamDuration = 3,
    gridColor = 'var(--grid-line-color)',
}) {
    const allBeams = useMemo(() => {
        const getBeams = (side) => {
            return Array.from({ length: beamsPerSide }, (_, i) => {
                const isVertical = side === 'left' || side === 'right';
                const isReverse = side === 'bottom' || side === 'right';
                const hue = 40 + Math.random() * 40;

                return {
                    width: beamSize,
                    delay: beamDelayMin + Math.random() * (beamDelayMax - beamDelayMin),
                    duration: beamDuration + Math.random() * 1,
                    hue,
                    reverse: isReverse,
                    style: {
                        [isVertical ? 'top' : 'left']: `${((i + 0.5) / beamsPerSide) * 100}%`,
                        ...(side === 'top' && { top: 0 }),
                        ...(side === 'bottom' && { bottom: 0, top: 'auto' }),
                        ...(side === 'left' && { left: 0 }),
                        ...(side === 'right' && { right: 0, left: 'auto' }),
                        ...(isVertical && { writingMode: 'vertical-lr' }),
                    },
                };
            });
        };

        return [
            ...getBeams('top'),
            ...getBeams('right'),
            ...getBeams('bottom'),
            ...getBeams('left'),
        ];
    }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin, beamDuration]);

    return (
        <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            ...style,
        }}>
            {/* perspective container */}
            <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                perspective: `${perspective}px`,
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformStyle: 'preserve-3d',
                    transform: 'rotateX(45deg)',
                    transformOrigin: 'center center',
                }}>
                    {/* grid */}
                    <div style={{
                        position: 'absolute',
                        width: '200%',
                        height: '200%',
                        backgroundImage: `
                            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                        `,
                        backgroundSize: '5% 5%',
                    }} />
                </div>
            </div>

            {/* beams */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                {allBeams.map((beam, i) => (
                    <Beam key={i} {...beam} />
                ))}
            </div>

            {/* content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ position: 'relative', zIndex: 10 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
