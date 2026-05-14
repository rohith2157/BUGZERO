import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Lightbulb, Rocket, Brain, Target, Sparkles, Eye,
    TrendingUp, ArrowLeft, Zap, Shield, Globe, FlaskConical,
    ChevronRight, Quote
} from 'lucide-react';
import { AnimatedThemeToggle } from '../components/ui/animated-theme-toggle';
import { StarButton } from '../components/ui/star-button';
import { CinematicFooter } from '../components/ui/motion-footer';
import useThemeStore from '../store/themeStore';
import { useRef, useState, useEffect } from 'react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const principles = [
    { icon: Target, title: 'Zero Configuration', desc: 'Give it a URL. That\'s it. No setup files, no selectors, no test plans. The engine figures everything out.', accent: 'var(--color-accent-gold)' },
    { icon: Brain, title: 'AI-First, Not AI-Assisted', desc: 'Every decision — what to test, how to test, what\'s a bug, how severe — is made by AI, not prompted by humans.', accent: 'var(--color-accent-purple)' },
    { icon: TrendingUp, title: 'Self-Improving', desc: 'Every test run teaches the engine. It gets smarter about your specific application over time.', accent: 'var(--color-accent-cyan)' },
    { icon: Eye, title: 'Human-Readable Output', desc: 'Engineers and non-engineers both understand the reports. No raw logs. No cryptic error codes.', accent: 'var(--color-accent-emerald)' },
    { icon: Shield, title: 'Enterprise-Ready from Day 1', desc: 'Authentication, compliance, performance, security — all handled out of the box, not as add-ons.', accent: 'var(--color-accent-gold-bright)' },
    { icon: Rocket, title: 'Built to Scale', desc: 'From a 10-page startup site to a 10,000-page enterprise app — same engine, same quality, same speed.', accent: 'var(--color-accent-blue)' },
];

const stats = [
    { value: '40-60%', label: 'QA time wasted on broken scripts', color: 'var(--color-accent-gold)' },
    { value: '$2.8T', label: 'Annual cost of poor software quality globally', color: 'var(--color-error)' },
    { value: '82%', label: 'Teams skip tests due to time pressure', color: 'var(--color-accent-purple)' },
    { value: '3-5×', label: 'Costlier to fix bugs in production', color: 'var(--color-accent-cyan)' },
];

const roadmap = [
    { version: 'v1.0 — MVP', timeline: 'Months 1-4', desc: 'All 6 core features, web dashboard, basic CI/CD integration', status: 'Building', color: 'var(--color-accent-gold)' },
    { version: 'v1.5 — Integrations', timeline: 'Months 5-6', desc: 'Jira/Linear sync, Slack/Teams notifications, GitHub PR comments', status: 'Planned', color: 'var(--color-accent-purple)' },
    { version: 'v2.0 — Intelligence', timeline: 'Months 7-9', desc: 'AI-generated test recommendations, auto-fix suggestions with code diffs', status: 'Vision', color: 'var(--color-accent-cyan)' },
    { version: 'v2.5 — Mobile', timeline: 'Months 10-12', desc: 'iOS and Android app testing via Appium integration', status: 'Vision', color: 'var(--color-accent-emerald)' },
    { version: 'v3.0 — Platform', timeline: 'Year 2', desc: 'Marketplace for custom test plugins, API for third-party integrations', status: 'Future', color: 'var(--color-accent-gold-bright)' },
];

export default function Inspiration() {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', position: 'relative', overflowX: 'hidden' }}>
            {/* Grid */}
            <div className="grid-pattern" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

            {/* Ambient orbs */}
            <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(212,168,83,0.06) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(167,139,250,0.03) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Navbar */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 20px', pointerEvents: 'none' }}>
                <motion.nav
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{
                        margin: '0 auto', pointerEvents: 'auto', width: '100%',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-gold)' }}>
                            <FlaskConical size={15} color="var(--on-accent)" />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Bug<span style={{ color: 'var(--color-accent-gold)' }}>Zero</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <AnimatedThemeToggle />
                        <StarButton title="Launch App" onClick={() => setTimeout(() => navigate('/login'), 400)} />
                    </div>
                </motion.nav>
            </div>

            {/* Hero */}
            <section style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '160px 24px 80px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ position: 'relative', zIndex: 2 }}>
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'var(--glass-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 40, backdropFilter: 'blur(10px)' }}
                    >
                        <ArrowLeft size={15} /> Back to Home
                    </motion.button>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(212, 168, 83, 0.08)', border: '1px solid rgba(212, 168, 83, 0.18)', fontSize: 12, fontWeight: 600, color: 'var(--color-accent-gold)', marginBottom: 32, letterSpacing: '0.02em' }}
                    >
                        <Lightbulb size={14} /> The Vision Behind BugZero
                    </motion.div>

                    <h1 style={{ fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.045em', maxWidth: 800, margin: '0 auto 24px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Quality should be </span>
                        <span style={{ background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>automatic.</span>
                    </h1>

                    <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', fontWeight: 400 }}>
                        We believe testing must be zero touch because human time is better spent building. This is the north star that guides every decision we make.
                    </p>
                </motion.div>
            </section>

            {/* Vision + Mission */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                    {[
                        { tag: 'VISION', text: 'A world where every web application ships with perfect quality — automatically, without a single human writing a test script.', accent: 'var(--color-accent-gold)' },
                        { tag: 'MISSION', text: 'Build an AI engine that autonomously crawls, tests, classifies defects, and reports on any web application — making quality engineering accessible to every team.', accent: 'var(--color-accent-purple)' },
                    ].map(({ tag, text, accent }) => (
                        <motion.div key={tag} variants={item} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>{tag}</span>
                            <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-primary)', fontWeight: 500 }}>{text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* The Crisis Stats */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        The QA Crisis <span style={{ background: 'linear-gradient(135deg, var(--color-error), #FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>is Real.</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>The numbers behind why we built BugZero.</p>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {stats.map(({ value, label, color }) => (
                        <motion.div key={label} variants={item} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '32px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color, marginBottom: 8 }}>{value}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Core Principles */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        Core <span style={{ background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Principles.</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto' }}>The philosophy behind every feature and every line of code.</p>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {principles.map(({ icon: Icon, title, desc, accent }) => (
                        <motion.div key={title} variants={item} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.3s' }}
                            whileHover={{ borderColor: accent, y: -4 }}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--glass-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={20} style={{ color: accent }} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Roadmap Timeline */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        The <span style={{ background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-emerald))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Roadmap.</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>From MVP to platform — our journey to redefine quality engineering.</p>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                    {/* Timeline line */}
                    <div style={{ position: 'absolute', left: 28, top: 20, bottom: 20, width: 2, background: 'var(--border-subtle)', zIndex: 0 }} />

                    {roadmap.map(({ version, timeline, desc, status, color }, i) => (
                        <motion.div key={version} variants={item} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                            <div style={{ width: 56, minWidth: 56, display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}`, border: '2px solid var(--color-bg-primary)' }} />
                            </div>
                            <div style={{ flex: 1, background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{version}</h3>
                                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: `${color}15`, border: `1px solid ${color}30` }}>{status}</span>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>{timeline}</span>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>{desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Closing Quote */}
            <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', padding: '60px 40px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                    <Quote size={40} style={{ color: 'var(--color-accent-gold)', opacity: 0.3, marginBottom: 20 }} />
                    <p style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, lineHeight: 1.5, color: 'var(--text-primary)', letterSpacing: '-0.02em', maxWidth: 600, margin: '0 auto 16px' }}>
                        The QA engineer of the future does not write test scripts. They deploy an agent that thinks, tests, and reports — <span style={{ color: 'var(--color-accent-gold)' }}>autonomously.</span>
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>— BugZero Vision, 2026</p>
                </motion.div>
            </section>

            {/* Footer */}
            <CinematicFooter onNavigate={(path) => navigate(path)} />
        </div>
    );
}
