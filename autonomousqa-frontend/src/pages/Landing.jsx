import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuroraHero } from '../components/ui/aurora-hero-bg';
import {
    Zap, Shield, Eye, BarChart3, Gauge, Scale,
    ArrowRight, Github, Chrome, Mail, FlaskConical,
    Sparkles, Bot, Globe, ChevronRight, Sun, Moon
} from 'lucide-react';
import MotionButton from '../components/ui/motion-button';
import { WarpBackground } from '../components/ui/WarpBackground';
import HeroText from '../components/ui/hero-shutter-text';
import FlipTextReveal from '../components/ui/next-reveal';
import { Spotlight } from '../components/ui/Spotlight';
import { TiltCard } from '../components/ui/tilt-card';
import { AnimatedThemeToggle } from '../components/ui/animated-theme-toggle';
import { StarButton } from '../components/ui/star-button';
import useThemeStore from '../store/themeStore';
import DotPattern from '../components/ui/dot-pattern-1';
import { useRef, useState, useEffect } from 'react';
import { DynamicArrow } from '../components/ui/dynamic-arrow';
import { ParticleTextLayer } from '../components/ui/particle-hero-background';
import Prism from '../components/ui/Prism';
import { StripeGradientShader } from '../components/ui/stripe-like-gradient-shader';

const features = [
    { icon: Zap, title: 'Self-Healing Tests', desc: 'Tests that auto-repair when UI changes. Zero maintenance.', accent: 'var(--color-accent-gold)' },
    { icon: Shield, title: 'Auth Navigator', desc: 'Logs into SSO, OAuth, MFA — automatically.', accent: 'var(--color-accent-purple)' },
    { icon: Eye, title: 'Visual Regression AI', desc: 'Semantic visual diff, not pixel noise.', accent: 'var(--color-accent-cyan)' },
    { icon: BarChart3, title: 'Risk Prioritization', desc: 'AI decides what to test first based on risk.', accent: 'var(--color-accent-gold-bright)' },
    { icon: Gauge, title: 'Performance Chaos', desc: 'Core Web Vitals on every page, every run.', accent: 'var(--color-accent-emerald)' },
    { icon: Scale, title: 'Compliance Engine', desc: 'WCAG + GDPR audit on every test run.', accent: 'var(--color-error)' },
];

const stats = [
    { value: '247', label: 'Test Runs', suffix: '' },
    { value: '98', label: 'Accuracy', suffix: '%' },
    { value: '60', label: 'Time Saved', suffix: '%' },
    { value: '<20', label: 'Full Audit', suffix: 'm' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

export default function Landing() {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const getStartedRef = useRef(null);
    const quoteContainerRef = useRef(null);

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg-primary)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.3s ease',
        }}>
            <DynamicArrow targetRef={getStartedRef} containerRef={quoteContainerRef} />
            
            {/* Subtle grid */}
            <div className="grid-pattern" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

            {/* Ambient orbs — gold theme */}
            <div style={{
                position: 'fixed', top: '-18%', right: '-8%', width: 700, height: 700,
                borderRadius: '50%', background: isDark
                    ? 'radial-gradient(circle, rgba(212,168,83,0.06) 0%, transparent 65%)'
                    : 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 65%)',
                pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', bottom: '-15%', left: '-8%', width: 500, height: 500,
                borderRadius: '50%', background: isDark
                    ? 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)'
                    : 'radial-gradient(circle, rgba(167,139,250,0.03) 0%, transparent 65%)',
                pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 900,
                borderRadius: '50%', background: isDark
                    ? 'radial-gradient(circle, rgba(212,168,83,0.03) 0%, transparent 50%)'
                    : 'radial-gradient(circle, rgba(184,134,11,0.02) 0%, transparent 50%)',
                pointerEvents: 'none', zIndex: 0,
            }} />

            {/* Navbar */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 20px', pointerEvents: 'none' }}>
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{
                        margin: '0 auto',
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: isScrolled ? 896 : 1200,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: isScrolled ? '12px 24px' : '16px 12px',
                        background: isScrolled ? 'var(--glass-navbar)' : 'transparent',
                        backdropFilter: isScrolled ? 'blur(32px) saturate(1.5)' : 'none',
                        border: isScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
                        borderRadius: isScrolled ? 24 : 12,
                        transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow-gold)',
                    }}>
                        <FlaskConical size={15} color="var(--on-accent)" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        Autonomous<span style={{ color: 'var(--color-accent-gold)' }}>QA</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontWeight: 500 }}>Docs</span>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontWeight: 500 }}>Pricing</span>
                    <AnimatedThemeToggle />
                    <StarButton 
                        title="Launch App" 
                        onClick={() => {
                            setTimeout(() => navigate('/login'), 400); 
                        }} 
                    />
                </div>
                </motion.nav>
            </div>

            {/* Hero */}
            <section style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '140px 24px 80px',
                position: 'relative', zIndex: 1,
            }}>
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: isDark ? 0.9 : 1 }}>
                    <Prism
                        animationType="rotate"
                        timeScale={0.5}
                        height={3.5}
                        baseWidth={5.5}
                        scale={3.6}
                        hueShift={0}
                        colorFrequency={1.6}
                        noise={0.5}
                        glow={isDark ? 1 : 2}
                    />
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)',
                            background: 'rgba(212, 168, 83, 0.08)',
                            border: '1px solid rgba(212, 168, 83, 0.18)',
                            fontSize: 12, fontWeight: 600, color: 'var(--color-accent-gold)',
                            marginBottom: 32, letterSpacing: '0.02em',
                        }}
                    >
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--color-accent-gold)',
                            boxShadow: '0 0 8px var(--color-accent-gold)',
                            display: 'inline-block',
                        }} />
                        Zero-Touch · Zero-Script · Zero-Compromise
                    </motion.div>

                    <h1 style={{
                        fontSize: 'clamp(42px, 5.5vw, 72px)',
                        fontWeight: 800,
                        lineHeight: 1.06,
                        letterSpacing: '-0.045em',
                        maxWidth: 840,
                        margin: '0 auto 24px',
                    }}>
                        <FlipTextReveal word="AI That Tests" color="var(--text-primary)" /><br />
                        <FlipTextReveal word="Your Entire App" color="var(--color-accent-gold)" stagger={0.05} /><br />
                        <HeroText text="Autonomously" color="var(--text-primary)" accentColor="var(--color-accent-gold)" />
                    </h1>

                    <p style={{
                        fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)',
                        maxWidth: 520, margin: '0 auto 44px', fontWeight: 400,
                    }}>
                        Give it a URL. It crawls, authenticates, tests every page, classifies defects with AI, and delivers an executive report — in under 20 minutes.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <MotionButton
                            label="Start Testing Free"
                            onClick={() => navigate('/login')}
                        />
                        <motion.button
                            whileHover={{ scale: 1.03, borderColor: 'var(--border-default)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                padding: '13px 30px', fontSize: 14, fontWeight: 600,
                                background: 'var(--glass-subtle)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-full)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <Globe size={17} /> Watch Demo
                        </motion.button>
                    </div>

                    {/* Social proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        style={{
                            display: 'flex', gap: 10, justifyContent: 'center',
                            marginTop: 36, flexWrap: 'wrap',
                        }}
                    >
                        {[
                            { icon: Chrome, label: 'Google' },
                            { icon: Github, label: 'GitHub' },
                            { icon: Mail, label: 'Email' },
                        ].map(({ icon: Icon, label }) => (
                            <motion.button
                                key={label}
                                className="group relative flex shrink-0 whitespace-nowrap cursor-pointer items-center justify-center gap-3 overflow-hidden"
                                whileHover={{ scale: 1.03, borderColor: 'var(--border-default)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/login')}
                                style={{
                                    padding: '9px 18px', fontSize: 13, fontWeight: 500,
                                    background: 'var(--glass-muted)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
                                    transition: 'all var(--transition-fast)',
                                    backdropFilter: 'blur(8px)',
                                    transform: 'translateZ(0)',
                                }}
                            >
                                <Icon strokeWidth={2} className="relative z-10 size-[16px] transition-all duration-500 group-hover:text-amber-500" />
                                <div className="relative z-10 transition-all duration-300 group-hover:text-black">
                                    Continue with {label}
                                </div>
                                <div className="absolute inset-0 z-0 bg-white transition-transform duration-500 scale-x-0 group-hover:scale-x-100 rounded-md" style={{ transformOrigin: 'left center' }} />
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* Curved container wrapper for content below Hero */}
            <StripeGradientShader 
                className="relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] dark:shadow-[0_-20px_40px_rgba(0,0,0,0.5)]"
                style={{
                    marginTop: '-60px',
                    paddingTop: '60px',
                    borderTopLeftRadius: '60px',
                    borderTopRightRadius: '60px',
                }}
            >
                {/* Stats bar with flanking Particle Texts */}
                <div style={{ position: 'relative', width: '100%', padding: '140px 0 160px 0', zIndex: 0 }}>
                {/* Top Particle Text (Above Stats) */}
                <ParticleTextLayer 
                    isDark={isDark} 
                    text="Zero-Touch QA" 
                    fontSize={160} 
                    top={0}
                    height="350px" 
                    opacity={1} 
                />

                <motion.section
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-100px' }}
                    style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1, maxWidth: 800, margin: '0 auto', padding: '0 24px 80px',
                        position: 'relative', zIndex: 1,
                    }}
                >
                {stats.map(({ value, label, suffix }, i) => (
                    <motion.div key={label} variants={item} style={{
                        textAlign: 'center', padding: '24px 16px',
                        borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                    }}>
                        <div style={{
                            fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em',
                            color: '#FFFFFF',
                            textShadow: '0px 8px 16px rgba(0, 0, 0, 0.6), 0px 2px 4px rgba(0, 0, 0, 0.8)',
                        }}>
                            {value}<span style={{ fontSize: 20 }}>{suffix}</span>
                        </div>
                        <div style={{ 
                            fontSize: 13, color: '#FFFFFF', fontWeight: 700, marginTop: 6, 
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            textShadow: '0px 2px 8px rgba(0, 0, 0, 0.7)'
                        }}>
                            {label}
                        </div>
                    </motion.div>
                ))}
                </motion.section>

                {/* Bottom Particle Text (Below Stats) */}
                <ParticleTextLayer 
                    isDark={isDark} 
                    text="AI · Autonomous" 
                    fontSize={130} 
                    bottom={0}
                    height="350px" 
                    opacity={1} 
                />
                </div>
            </StripeGradientShader>
            
            {/* Container for the rest of the content */}
            <div style={{
                background: 'var(--color-bg-primary)',
                borderTopLeftRadius: '60px',
                borderTopRightRadius: '60px',
                position: 'relative',
                zIndex: 10,
                marginTop: '-60px',
                paddingTop: '0px',
                overflow: 'hidden',
                boxShadow: isDark ? '0 -20px 40px rgba(0,0,0,0.5)' : '0 -10px 30px rgba(0,0,0,0.05)',
            }}>

            {/* Features & Quote Section wrapped in AuroraHero */}
            <AuroraHero isDark={isDark} className="py-24 h-auto min-h-0 block items-start justify-start">
                <section style={{
                    maxWidth: 1200, margin: '0 auto', padding: '40px 24px',
                    position: 'relative', zIndex: 1,
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        style={{ textAlign: 'center', marginBottom: 56 }}
                    >
                        <h2 style={{
                            fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em',
                            marginBottom: 12, color: 'var(--text-primary)',
                        }}>
                            6 AI Agents. <span style={{
                                background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>One Platform.</span>
                        </h2>
                        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto' }}>
                            Each feature is an autonomous AI agent working without human intervention.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 24,
                        }}
                    >
                        {features.map(({ icon: Icon, title, desc, accent }) => (
                            <motion.div key={title} variants={item} style={{ display: 'flex' }}>
                                <TiltCard className="w-full h-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden bg-[var(--color-bg-card)]/50 backdrop-blur-md" effect="evade" scale={1.02} tiltLimit={6}>
                                    <WarpBackground
                                        beamsPerSide={3}
                                        beamSize={5}
                                        beamDuration={3}
                                        beamDelayMax={3}
                                        perspective={100}
                                        gridColor="var(--border-default)"
                                        className="!p-8 group h-full"
                                        style={{ minHeight: 280, width: '100%' }}
                                    >
                                        <Spotlight
                                            className="-top-40 left-0 md:left-32 md:-top-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                            fill={accent}
                                        />
                                        <div style={{ position: 'relative', flex: 1, display: 'flex' }} className="mt-2">
                                            {/* Colored 3D backing / shadow layer */}
                                            <div 
                                                className="absolute inset-0 transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1 opacity-70 group-hover:opacity-100"
                                                style={{
                                                    zIndex: 1,
                                                    background: accent,
                                                    borderRadius: 'var(--radius-lg)',
                                                }}
                                            />
                                            <div className="transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" style={{
                                                position: 'relative', zIndex: 2,
                                                background: 'var(--color-bg-card)',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: 'var(--radius-lg)',
                                                padding: '24px 20px',
                                                backdropFilter: 'blur(12px)',
                                                display: 'flex', flexDirection: 'column', gap: 12,
                                                cursor: 'pointer',
                                                boxShadow: 'var(--shadow-md)',
                                                flex: 1,
                                            }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: 'var(--glass-subtle)',
                                                border: '1px solid var(--border-subtle)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={20} style={{ color: accent }} />
                                            </div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                                                {title}
                                            </h3>
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flexGrow: 1 }}>
                                                {desc}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: accent, fontWeight: 600, marginTop: 4 }}>
                                                Learn more <ChevronRight size={13} />
                                            </div>
                                            </div>
                                        </div>
                                    </WarpBackground>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                <section className="relative z-10 mb-16 mt-16" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
                    <div 
                        ref={quoteContainerRef}
                        className="relative flex flex-col items-center border border-red-500/30" 
                        style={{ background: 'var(--color-bg-primary)' }}
                    >
                        <DotPattern width={5} height={5} className="opacity-50" />

                        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-red-500/50 text-white" />
                        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-red-500/50 text-white" />
                        <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-red-500/50 text-white" />
                        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-red-500/50 text-white" />

                        <div className="relative z-20 mx-auto max-w-7xl rounded-[40px] w-full" style={{ padding: '80px 40px' }}>
                            <p className="text-red-500 text-xl font-medium tracking-wide mb-6">
                                We believe
                            </p>
                            <div className="text-2xl tracking-tighter md:text-5xl lg:text-7xl xl:text-8xl" style={{ color: 'var(--text-primary)' }}>
                                <div className="flex gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                                    <h1 className="font-semibold">"Testing must be</h1>
                                    <p className="font-thin">zero</p>
                                </div>
                                <div className="flex gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                                    <p className="font-thin">touch</p>
                                    <h1 className="font-semibold">because</h1>
                                    <p className="font-thin">human</p>
                                </div>
                                <div className="flex gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                                    <p className="font-thin">time</p>
                                    <h1 className="font-semibold">is better spent</h1>
                                </div>
                                <h1 className="font-semibold">building..."</h1>
                            </div>
                        </div>
                    </div>
                </section>
            </AuroraHero>

            {/* Bottom CTA */}
            <section style={{
                maxWidth: 700, margin: '0 auto', padding: '60px 24px 80px',
                textAlign: 'center', position: 'relative', zIndex: 1,
            }}>
                <WarpBackground
                    beamsPerSide={3}
                    beamSize={5}
                    beamDuration={4}
                    beamDelayMax={4}
                    perspective={120}
                    gridColor="var(--border-default)"
                    className="!p-0"
                    style={{
                        borderColor: 'var(--border-accent)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-glow-gold)',
                    }}
                >
                    <Spotlight
                        className="-top-40 left-0 md:left-48 md:-top-20"
                        fill="var(--color-accent-gold)"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                            padding: '52px 44px',
                            position: 'relative',
                            zIndex: 2,
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(212,168,83,0.04) 0%, rgba(9,9,11,0.7) 100%)'
                                : 'linear-gradient(135deg, rgba(184,134,11,0.04) 0%, rgba(255,255,255,0.7) 100%)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--text-primary)' }}>
                            Ready to ship with confidence?
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                            Join teams using AI-powered QA to find bugs before users do.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div ref={getStartedRef} style={{ display: 'inline-flex', position: 'relative' }}>
                                <MotionButton
                                    label="Get Started Free"
                                    onClick={() => navigate('/login')}
                                />
                            </div>
                        </div>
                    </motion.div>
                </WarpBackground>
            </section>

            {/* Footer */}
            <footer style={{
                textAlign: 'center', padding: '32px 24px',
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)', fontSize: 12,
                position: 'relative', zIndex: 1,
                letterSpacing: '0.02em',
            }}>
                <p>© 2026 AutonomousQA — Zero-Touch Quality Assurance</p>
            </footer>
            </div>
        </div>
    );
}
