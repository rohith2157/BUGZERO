"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  Sparkles, Lightbulb, Layers, Instagram, Linkedin, Github,
  ArrowUp, FlaskConical, Mail, Brain
} from "lucide-react";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  /* Dynamic Variables using project's CSS tokens */
  --pill-bg-1: rgba(212, 168, 83, 0.06);
  --pill-bg-2: rgba(212, 168, 83, 0.02);
  --pill-shadow: rgba(0, 0, 0, 0.4);
  --pill-highlight: rgba(255, 255, 255, 0.06);
  --pill-inset-shadow: rgba(0, 0, 0, 0.3);
  --pill-border: rgba(255, 255, 255, 0.08);
  
  --pill-bg-1-hover: rgba(212, 168, 83, 0.12);
  --pill-bg-2-hover: rgba(212, 168, 83, 0.04);
  --pill-border-hover: rgba(212, 168, 83, 0.3);
  --pill-shadow-hover: rgba(0, 0, 0, 0.6);
  --pill-highlight-hover: rgba(212, 168, 83, 0.15);
}

[data-theme="light"] .cinematic-footer-wrapper {
  --pill-bg-1: rgba(184, 134, 11, 0.06);
  --pill-bg-2: rgba(184, 134, 11, 0.02);
  --pill-shadow: rgba(0, 0, 0, 0.08);
  --pill-highlight: rgba(255, 255, 255, 0.8);
  --pill-inset-shadow: rgba(255, 255, 255, 0.5);
  --pill-border: rgba(0, 0, 0, 0.08);
  
  --pill-bg-1-hover: rgba(184, 134, 11, 0.1);
  --pill-bg-2-hover: rgba(184, 134, 11, 0.04);
  --pill-border-hover: rgba(184, 134, 11, 0.3);
  --pill-shadow-hover: rgba(0, 0, 0, 0.12);
  --pill-highlight-hover: rgba(184, 134, 11, 0.12);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(212, 168, 83, 0.5)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(212, 168, 83, 0.8)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
    linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow — Gold */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(212, 168, 83, 0.12) 0%, 
    rgba(167, 139, 250, 0.06) 40%, 
    transparent 70%
  );
}

[data-theme="light"] .footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(184, 134, 11, 0.08) 0%, 
    rgba(167, 139, 250, 0.04) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: 20vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px var(--border-subtle);
  background: linear-gradient(180deg, var(--border-default) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, var(--text-primary) 0%, var(--text-tertiary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px rgba(212, 168, 83, 0.15));
  /* Allow glyph descenders and glows to render without being clipped */
  display: inline-block;
  position: relative;
  overflow: visible;
}

[data-theme="light"] .footer-text-glow {
  filter: drop-shadow(0px 0px 20px rgba(184, 134, 11, 0.1));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MARQUEE ITEMS — BugZero BRANDED
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Zero-Touch Testing</span> <span style={{ color: 'var(--color-accent-gold)' }}>✦</span>
    <span>Self-Healing Tests</span> <span style={{ color: 'var(--color-accent-purple)' }}>✦</span>
    <span>AI-Powered QA</span> <span style={{ color: 'var(--color-accent-gold)' }}>✦</span>
    <span>Visual Regression</span> <span style={{ color: 'var(--color-accent-cyan)' }}>✦</span>
    <span>Autonomous Crawling</span> <span style={{ color: 'var(--color-accent-gold)' }}>✦</span>
    <span>WCAG Compliance</span> <span style={{ color: 'var(--color-accent-emerald)' }}>✦</span>
    <span>Risk Prioritization</span> <span style={{ color: 'var(--color-accent-gold)' }}>✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN COMPONENT — Adapted for BugZero
// -------------------------------------------------------------------------
interface CinematicFooterProps {
  onNavigate?: (path: string) => void;
}

export function CinematicFooter({ onNavigate }: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box. 
      */}
      <div
        ref={wrapperRef}
        className="relative w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)", height: '100vh' }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer
          className="fixed bottom-0 left-0 flex w-full flex-col justify-between overflow-hidden cinematic-footer-wrapper"
          style={{
            height: '100vh',
            background: 'var(--color-bg-primary)',
            color: 'var(--text-primary)',
          }}
        >

          {/* Ambient Light & Grid Background */}
          <div
            className="footer-aurora absolute left-1/2 top-1/2 animate-footer-breathe pointer-events-none"
            style={{
              height: '60vh', width: '80vw',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              filter: 'blur(80px)',
              zIndex: 0,
            }}
          />
          <div className="footer-bg-grid absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />

          {/* Giant background text */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute whitespace-nowrap pointer-events-none select-none"
            style={{
              bottom: '-5vh', left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 0,
            }}
          >
            BUGZERO
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div
            className="absolute left-0 w-full overflow-hidden"
            style={{
              top: '48px',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '16px 0',
              zIndex: 10,
              transform: 'rotate(-2deg) scale(1.1)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className="flex animate-footer-scroll-marquee"
              style={{
                width: 'max-content',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.3em',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
              }}
            >
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div
            className="relative flex flex-1 flex-col items-center justify-center"
            style={{
              zIndex: 10,
              padding: '0 24px',
              marginTop: '80px',
              maxWidth: '1000px',
              width: '100%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {/* Logo Mark */}
            <div
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-glow-gold)',
                marginBottom: 24,
              }}
            >
              <FlaskConical size={22} color="var(--on-accent)" />
            </div>

            <h2
              ref={headingRef}
              className="footer-text-glow"
              style={{
                fontSize: 'clamp(40px, 8vw, 96px)',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                marginBottom: 48,
                textAlign: 'center',
                lineHeight: 1.05,
                wordBreak: 'keep-all', // Prevents arbitrary mid-word wrapping
                overflowWrap: 'normal',
                hyphens: 'none',
              }}
            >
              Ship <span style={{ whiteSpace: "nowrap" }}>fearlessly.</span>
            </h2>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center w-full" style={{ gap: 24 }}>

              {/* Primary Action Pills — Inspiration & Use Cases */}
              <div className="flex flex-wrap justify-center w-full" style={{ gap: 16 }}>
                <MagneticButton
                  as="a"
                  href="/inspiration"
                  className="footer-glass-pill flex items-center group"
                  style={{
                    padding: '18px 36px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '15px',
                    gap: 12,
                    textDecoration: 'none',
                  }}
                >
                  <Lightbulb
                    size={20}
                    style={{ color: 'var(--color-accent-gold)', transition: 'color 0.3s' }}
                  />
                  Inspiration
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="/use-cases"
                  className="footer-glass-pill flex items-center group"
                  style={{
                    padding: '18px 36px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '15px',
                    gap: 12,
                    textDecoration: 'none',
                  }}
                >
                  <Layers
                    size={20}
                    style={{ color: 'var(--color-accent-purple)', transition: 'color 0.3s' }}
                  />
                  Use Cases
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="/algorithms"
                  className="footer-glass-pill flex items-center group"
                  style={{
                    padding: '18px 36px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '15px',
                    gap: 12,
                    textDecoration: 'none',
                  }}
                >
                  <Brain
                    size={20}
                    style={{ color: 'var(--color-accent-cyan)', transition: 'color 0.3s' }}
                  />
                  Algorithms
                </MagneticButton>

                <MagneticButton
                  as="button"
                  onClick={() => onNavigate?.('/login')}
                  className="footer-glass-pill flex items-center group"
                  style={{
                    padding: '18px 36px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--on-accent)',
                    fontWeight: 700,
                    fontSize: '15px',
                    gap: 12,
                    background: 'var(--gradient-primary)',
                    border: '1px solid rgba(212, 168, 83, 0.4)',
                    boxShadow: 'var(--shadow-glow-gold)',
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={20} />
                  Start Testing Free
                </MagneticButton>
              </div>

              {/* Secondary Links — Social + Contact */}
              <div className="flex flex-wrap justify-center w-full" style={{ gap: 12, marginTop: 8 }}>
                <MagneticButton
                  as="a"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill flex items-center"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    gap: 8,
                    textDecoration: 'none',
                  }}
                >
                  <Instagram size={16} />
                  Instagram
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill flex items-center"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    gap: 8,
                    textDecoration: 'none',
                  }}
                >
                  <Linkedin size={16} />
                  LinkedIn
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill flex items-center"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    gap: 8,
                    textDecoration: 'none',
                  }}
                >
                  <Github size={16} />
                  GitHub
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="mailto:hello@autonomousqa.com"
                  className="footer-glass-pill flex items-center"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    gap: 8,
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={16} />
                  Contact
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div
            className="relative flex flex-col items-center justify-between"
            style={{
              zIndex: 20,
              width: '100%',
              padding: '0 24px 32px',
              gap: 24,
            }}
          >
            <div
              className="flex flex-col items-center justify-between w-full"
              style={{ gap: 24, maxWidth: 1000 }}
            >
              {/* Desktop: row layout */}
              <div
                className="flex items-center justify-between w-full flex-wrap"
                style={{ gap: 16 }}
              >
                {/* Copyright */}
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}
                >
                  © 2026 BugZero. All rights reserved.
                </div>

                {/* "Crafted with" Badge */}
                <div
                  className="footer-glass-pill flex items-center"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    gap: 8,
                    cursor: 'default',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                  }}>
                    Crafted with love
                  </span>
                  <span className="animate-footer-heartbeat" style={{ fontSize: '14px' }}>
                    ❤️
                  </span>
                  <span style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                  }}>
                    by
                  </span>
                  <span style={{
                    color: 'var(--text-primary)',
                    fontWeight: 900,
                    fontSize: '12px',
                    marginLeft: 4,
                  }}>
                    Rohith
                  </span>
                </div>

                {/* Back to top */}
                <MagneticButton
                  as="button"
                  onClick={scrollToTop}
                  className="footer-glass-pill flex items-center justify-center group"
                  style={{
                    width: 44, height: 44,
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                  }}
                >
                  <ArrowUp
                    size={18}
                    className="transform transition-transform duration-300 group-hover:-translate-y-1.5"
                  />
                </MagneticButton>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
