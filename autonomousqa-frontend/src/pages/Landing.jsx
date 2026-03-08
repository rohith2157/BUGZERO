import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Zap, Shield, Eye, BarChart3, Gauge, Scale,
    ArrowRight, Github, Chrome, Mail, FlaskConical,
    Sparkles, Bot, Globe, ChevronRight, Sun, Moon
} from 'lucide-react';
import { WarpBackground } from '../components/ui/WarpBackground';
import HeroText from '../components/ui/hero-shutter-text';
import FlipTextReveal from '../components/ui/next-reveal';
import { Spotlight } from '../components/ui/Spotlight';
import useThemeStore from '../store/themeStore';

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
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg-primary)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.3s ease',
        }}>
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
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                    position: 'fixed', top: 12, left: 20, right: 20, zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 24px',
                    background: 'var(--glass-navbar)',
                    backdropFilter: 'blur(24px) saturate(1.2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 16,
                    transition: 'background 0.3s ease, border-color 0.3s ease',
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
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        style={{
                            width: 34, height: 34,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--glass-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </motion.button>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '7px 18px', fontSize: 13, fontWeight: 600,
                            background: 'var(--color-accent-gold)',
                            color: 'var(--on-accent)',
                            border: 'none', borderRadius: 'var(--radius-full)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-glow-gold)',
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        Launch App →
                    </button>
                </div>
            </motion.nav>

            {/* Hero */}
            <section style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '140px 24px 80px',
                position: 'relative', zIndex: 1,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(212,168,83,0.25)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '13px 30px', fontSize: 14, fontWeight: 700,
                                background: 'var(--color-accent-gold)',
                                color: 'var(--on-accent)',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: 'var(--shadow-glow-gold)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            <Bot size={17} /> Start Testing Free <ArrowRight size={15} />
                        </motion.button>
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
                                whileHover={{ scale: 1.03, borderColor: 'var(--border-default)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/login')}
                                style={{
                                    padding: '9px 18px', fontSize: 13, fontWeight: 500,
                                    background: 'var(--glass-muted)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all var(--transition-fast)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <Icon size={15} /> Continue with {label}
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* Stats bar */}
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
                            background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            {value}<span style={{ fontSize: 20 }}>{suffix}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {label}
                        </div>
                    </motion.div>
                ))}
            </motion.section>

            {/* Divider */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
                <div className="glow-line" />
            </div>

            {/* Features grid */}
            <section style={{
                maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px',
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
                        <motion.div key={title} variants={item}>
                            <WarpBackground
                                beamsPerSide={3}
                                beamSize={5}
                                beamDuration={3}
                                beamDelayMax={3}
                                perspective={100}
                                gridColor="var(--border-default)"
                                className="!p-8 group"
                                style={{ borderColor: 'var(--border-subtle)', minHeight: 280, overflow: 'hidden' }}
                            >
                                <Spotlight
                                    className="-top-40 left-0 md:left-32 md:-top-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                    fill={accent}
                                />
                                <div style={{
                                    position: 'relative', zIndex: 2,
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '24px 20px',
                                    backdropFilter: 'blur(12px)',
                                    display: 'flex', flexDirection: 'column', gap: 12,
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)',
                                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
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
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                        {desc}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: accent, fontWeight: 600, marginTop: 4 }}>
                                        Learn more <ChevronRight size={13} />
                                    </div>
                                </div>
                            </WarpBackground>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

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
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(212,168,83,0.25)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '13px 32px', fontSize: 14, fontWeight: 700,
                                background: 'var(--color-accent-gold)', color: 'var(--on-accent)',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: 'var(--shadow-glow-gold)',
                                margin: '0 auto',
                            }}
                        >
                            Get Started Free <ArrowRight size={15} />
                        </motion.button>
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
    );
}
