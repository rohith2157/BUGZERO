import { useMemo } from 'react';

/**
 * TextShimmer — pure CSS light-sweep effect over text.
 * Switches colours automatically in light + dark mode via CSS vars.
 * Uses a CSS @keyframes animation (defined in index.css) — NOT framer-motion,
 * because framer-motion does not reliably animate backgroundPosition.
 */
export function TextShimmer({
    children,
    as: Tag = 'span',
    duration = 2,
    spread = 2,
    className = '',
    style = {},
}) {
    const spreadPx = useMemo(
        () => `${String(children).length * spread}px`,
        [children, spread]
    );

    return (
        <Tag
            className={className}
            style={{
                '--spread': spreadPx,
                display: 'inline-block',
                backgroundImage: [
                    'linear-gradient(90deg, transparent calc(50% - var(--spread)), var(--shimmer-text-highlight, #ffffff) 50%, transparent calc(50% + var(--spread)))',
                    'linear-gradient(var(--shimmer-text-base, #71717a), var(--shimmer-text-base, #71717a))',
                ].join(', '),
                backgroundSize: '250% 100%, auto',
                backgroundRepeat: 'no-repeat, padding-box',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                animation: `text-shimmer ${duration}s linear infinite`,
                ...style,
            }}
        >
            {children}
        </Tag>
    );
}

export default TextShimmer;
