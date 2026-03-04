import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * TextShimmer — animated light-sweep effect over text.
 * Works in both light and dark mode via CSS variables.
 *
 * Props:
 *   children  string   — the text to shimmer
 *   as        string   — HTML tag to render (default: 'span')
 *   duration  number   — seconds per cycle (default: 2)
 *   spread    number   — multiplier for sweep width (default: 2)
 *   className string   — extra CSS class
 *   style     object   — extra inline styles
 */
export function TextShimmer({
    children,
    as: Tag = 'span',
    duration = 2,
    spread = 2,
    className = '',
    style = {},
}) {
    const MotionTag = motion(Tag);

    // Width of the travelling light sweep scales with text length
    const spreadPx = useMemo(() => `${String(children).length * spread}px`, [children, spread]);

    return (
        <MotionTag
            className={className}
            initial={{ backgroundPosition: '100% center' }}
            animate={{ backgroundPosition: '0% center' }}
            transition={{ repeat: Infinity, duration, ease: 'linear' }}
            style={{
                // The shimmer sweep colour adapts per theme via CSS vars
                '--shimmer-base': 'var(--shimmer-text-base, #71717a)',
                '--shimmer-highlight': 'var(--shimmer-text-highlight, #ffffff)',
                '--spread': spreadPx,

                display: 'inline-block',
                backgroundImage: [
                    // sweep gradient (travelling light band)
                    'linear-gradient(90deg, transparent calc(50% - var(--spread)), var(--shimmer-highlight) 50%, transparent calc(50% + var(--spread)))',
                    // base text colour (always visible behind the sweep)
                    'linear-gradient(var(--shimmer-base), var(--shimmer-base))',
                ].join(', '),
                backgroundSize: '250% 100%, auto',
                backgroundRepeat: 'no-repeat, padding-box',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                ...style,
            }}
        >
            {children}
        </MotionTag>
    );
}

export default TextShimmer;
