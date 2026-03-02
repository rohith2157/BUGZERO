import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Zap, Shield, Eye, BarChart3, Gauge, Scale,
    ArrowRight, Github, Chrome, Mail, FlaskConical,
    Sparkles, Bot, Globe
} from 'lucide-react';

const features = [
    { icon: Zap, title: 'Self-Healing Tests', desc: 'Tests that auto-repair when UI changes. Zero maintenance.', color: '#3B82F6' },
    { icon: Shield, title: 'Auth Navigator', desc: 'Logs into SSO, OAuth, MFA — automatically.', color: '#8B5CF6' },
    { icon: Eye, title: 'Visual Regression AI', desc: 'Semantic visual diff, not pixel noise.', color: '#06B6D4' },
    { icon: BarChart3, title: 'Risk Prioritization', desc: 'AI decides what to test first based on risk.', color: '#F59E0B' },
    { icon: Gauge, title: 'Performance Chaos', desc: 'Core Web Vitals on every page, every run.', color: '#10B981' },
    { icon: Scale, title: 'Compliance Engine', desc: 'WCAG + GDPR audit on every test run.', color: '#EF4444' },
];

const stats = [
    { value: '247', label: 'Test Runs' },
    { value: '98%', label: 'Accuracy' },
    { value: '60%', label: 'Time Saved' },
    { value: '<20m', label: 'Full Audit' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } }
};

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg-primary)',
            position: 'relative',
            overflow: 'hidden',
        }} className="grid-pattern">
            {/* Ambient orbs */}
            <div style={{
                position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', bottom: '-20%', left: '-10%', width: 500, height: 500,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0,
            }} />

            {/* Navbar */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    position: 'fixed', top: 16, left: 16, right: 16, zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 28px',
                    background: 'rgba(6, 9, 15, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow-blue)',
                    }}>
                        <FlaskConical size={17} color="#fff" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
                        Autonomous<span style={{ color: 'var(--color-accent-blue)' }}>QA</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '8px 20px', fontSize: 13, fontWeight: 600,
                            background: 'var(--gradient-primary)', color: '#fff',
                            border: 'none', borderRadius: 'var(--radius-full)',
                            cursor: 'pointer', boxShadow: 'var(--shadow-glow-blue)',
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        Launch App
                    </button>
                </div>
            </motion.nav>

            {/* Hero */}
            <section style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '120px 24px 60px',
                position: 'relative', zIndex: 1,
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px', borderRadius: 'var(--radius-full)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            fontSize: 13, fontWeight: 500, color: 'var(--text-accent)',
                            marginBottom: 28,
                        }}
                    >
                        <Sparkles size={14} /> Zero-Touch • Zero-Script • Zero-Compromise
                    </motion.div>

                    <h1 style={{
                        fontSize: 'clamp(40px, 6vw, 76px)',
                        fontWeight: 900,
                        lineHeight: 1.05,
                        letterSpacing: '-0.04em',
                        maxWidth: 900,
                        margin: '0 auto 24px',
                    }}>
                        <span style={{ color: 'var(--text-primary)' }}>AI That Tests</span><br />
                        <span className="text-gradient-accent">Your Entire App</span><br />
                        <span style={{ color: 'var(--text-primary)' }}>Autonomously</span>
                    </h1>

                    <p style={{
                        fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)',
                        maxWidth: 560, margin: '0 auto 40px', fontWeight: 400,
                    }}>
                        Give it a URL. It crawls, authenticates, tests every page, classifies defects with AI, and delivers an executive report — in under 20 minutes.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '14px 32px', fontSize: 15, fontWeight: 700,
                                background: 'var(--gradient-primary)', color: '#fff',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: 'var(--shadow-glow-blue)',
                            }}
                        >
                            <Bot size={18} /> Start Testing Free <ArrowRight size={16} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                padding: '14px 32px', fontSize: 15, fontWeight: 600,
                                background: 'rgba(148, 163, 184, 0.08)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-full)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <Globe size={18} /> Watch Demo
                        </motion.button>
                    </div>

                    {/* Auth buttons */}
                    <div style={{
                        display: 'flex', gap: 10, justifyContent: 'center',
                        marginTop: 32, flexWrap: 'wrap',
                    }}>
                        {[
                            { icon: Chrome, label: 'Continue with Google', bg: 'rgba(234,67,53,0.08)', border: 'rgba(234,67,53,0.2)' },
                            { icon: Github, label: 'Continue with GitHub', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
                            { icon: Mail, label: 'Sign up with Email', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
                        ].map(({ icon: Icon, label, bg, border }) => (
                            <motion.button
                                key={label}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/login')}
                                style={{
                                    padding: '10px 20px', fontSize: 13, fontWeight: 500,
                                    background: bg, border: `1px solid ${border}`,
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <Icon size={16} /> {label}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Stats bar */}
            <motion.section
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 24, maxWidth: 900, margin: '0 auto', padding: '0 24px 80px',
                    position: 'relative', zIndex: 1,
                }}
            >
                {stats.map(({ value, label }) => (
                    <motion.div key={label} variants={item} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">
                            {value}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 4 }}>
                            {label}
                        </div>
                    </motion.div>
                ))}
            </motion.section>

            {/* Features grid */}
            <section style={{
                maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px',
                position: 'relative', zIndex: 1,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: 60 }}
                >
                    <h2 style={{
                        fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em',
                        marginBottom: 12,
                    }}>
                        6 AI Agents. <span className="text-gradient">One Platform.</span>
                    </h2>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
                        Each feature is an autonomous AI agent that works without human intervention.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 20,
                    }}
                >
                    {features.map(({ icon: Icon, title, desc, color }) => (
                        <motion.div
                            key={title}
                            variants={item}
                            whileHover={{ y: -4, borderColor: `${color}40` }}
                            className="glass-card"
                            style={{
                                padding: '28px',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: -20, right: -20,
                                width: 100, height: 100, borderRadius: '50%',
                                background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
                            }} />
                            <div style={{
                                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                                background: `${color}14`, border: `1px solid ${color}25`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16,
                            }}>
                                <Icon size={22} style={{ color }} />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>
                                {title}
                            </h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {desc}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Footer */}
            <footer style={{
                textAlign: 'center', padding: '40px 24px',
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)', fontSize: 13,
                position: 'relative', zIndex: 1,
            }}>
                <p>© 2026 AutonomousQA — Zero-Touch Quality Assurance Engine</p>
            </footer>
        </div>
    );
}
