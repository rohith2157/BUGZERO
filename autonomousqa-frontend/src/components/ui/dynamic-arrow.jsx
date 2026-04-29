import React, { useEffect, useRef, useCallback } from 'react';

// Helper to parse 'rgb(r, g, b)' or 'rgba(r, g, b, a)' string to {r, g, b}
const parseRgbColor = (colorString) => {
    if (!colorString) return null;
    const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
        };
    }
    return null;
};

export const DynamicArrow = ({ targetRef, containerRef }) => {
    const canvasRef = useRef(null);
    const mousePosRef = useRef({ x: null, y: null, hovering: false });
    const ctxRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    const resolvedCanvasColorsRef = useRef({
        strokeStyle: { r: 200, g: 200, b: 200 },
    });

    useEffect(() => {
        const updateResolvedColors = () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const isDark = theme === 'dark';
            const color = isDark ? { r: 255, g: 255, b: 255 } : { r: 255, g: 0, b: 0 };
            resolvedCanvasColorsRef.current.strokeStyle = color; 
        };
        
        updateResolvedColors();
        
        const observer = new MutationObserver(updateResolvedColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        
        return () => observer.disconnect();
    }, []);

    const drawArrow = useCallback(() => {
        if (!canvasRef.current || !targetRef.current || !ctxRef.current) return;

        const targetEl = targetRef.current;
        const ctx = ctxRef.current;
        const mouse = mousePosRef.current;

        // Only draw if hovering over the container
        if (!mouse.hovering || mouse.x === null || mouse.y === null) return;

        const x0 = mouse.x;
        const y0 = mouse.y;

        const rect = targetEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const a = Math.atan2(cy - y0, cx - x0);
        
        // Accurate rectangular edge calculation
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        const rx = Math.abs((rect.width / 2 + 12) / (dx || 0.0001));
        const ry = Math.abs((rect.height / 2 + 12) / (dy || 0.0001));
        const distanceToEdge = Math.min(rx, ry);

        const x1 = cx - dx * distanceToEdge;
        const y1 = cy - dy * distanceToEdge;

        const midX = (x0 + x1) / 2;
        const midY = (y0 + y1) / 2;
        const offset = Math.min(200, Math.hypot(x1 - x0, y1 - y0) * 0.5);
        const t = Math.max(-1, Math.min(1, (y0 - y1) / 200));
        const controlX = midX;
        const controlY = midY + offset * t;
        
        const opacity = 0.95; // Increased from 0.6 for much brighter, vibrant colors

        const arrowColor = resolvedCanvasColorsRef.current.strokeStyle;
        ctx.strokeStyle = `rgba(${arrowColor.r}, ${arrowColor.g}, ${arrowColor.b}, ${opacity})`;
        ctx.lineWidth = 2.5; // Make the line slightly thicker for better visibility

        // Draw curve
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(controlX, controlY, x1, y1);
        ctx.setLineDash([10, 8]);
        ctx.stroke();
        ctx.restore();

        // Draw arrowhead
        const angle = Math.atan2(y1 - controlY, x1 - controlX);
        const headLength = 12 * (ctx.lineWidth / 1.5); // Slightly larger arrowhead
        
        ctx.save();
        ctx.strokeStyle = `rgba(${arrowColor.r}, ${arrowColor.g}, ${arrowColor.b}, 1)`; // Solid head opacity
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(
            x1 - headLength * Math.cos(angle - Math.PI / 6),
            y1 - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x1, y1);
        ctx.lineTo(
            x1 - headLength * Math.cos(angle + Math.PI / 6),
            y1 - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        ctx.restore();
    }, [targetRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !targetRef.current || !containerRef?.current) return;

        ctxRef.current = canvas.getContext("2d");
        const ctx = ctxRef.current;

        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const container = containerRef.current;

        const handleMouseMove = (e) => {
            mousePosRef.current.x = e.clientX;
            mousePosRef.current.y = e.clientY;
        };
        const handleMouseEnter = () => {
            mousePosRef.current.hovering = true;
        };
        const handleMouseLeave = () => {
            mousePosRef.current.hovering = false;
            mousePosRef.current.x = null;
            mousePosRef.current.y = null;
        };

        window.addEventListener("resize", updateCanvasSize);
        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseenter", handleMouseEnter);
        container.addEventListener("mouseleave", handleMouseLeave);
        updateCanvasSize();

        const animateLoop = () => {
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawArrow();
            }
            animationFrameIdRef.current = requestAnimationFrame(animateLoop);
        };
        
        animateLoop();

        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseenter", handleMouseEnter);
            container.removeEventListener("mouseleave", handleMouseLeave);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [drawArrow, targetRef, containerRef]);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50"></canvas>;
};
