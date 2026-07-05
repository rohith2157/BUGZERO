import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Layers, Zap, Shield, Eye, BarChart3, Gauge, Scale,
    ArrowLeft, FlaskConical, ChevronRight, Users, Building2,
    Code2, Briefcase, FileCheck, CheckCircle2, ArrowRight,
    Wrench, GitCompare, TrendingUp, Activity, Cpu, Database,
    Sparkles, Target, Lock, Brain
} from 'lucide-react';
import { AnimatedThemeToggle } from '../components/ui/animated-theme-toggle';
import { StarButton } from '../components/ui/star-button';
import { CinematicFooter } from '../components/ui/motion-footer';
import useThemeStore from '../store/themeStore';
import { useState, useEffect, useRef } from 'react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const features = [
    {
        icon: Zap, secondaryIcon: Wrench, tag: 'AGENT 01', title: 'Self-Healing Test Intelligence', accent: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
        problem: 'A developer renames a button from "Submit" to "Save & Continue". Every test that clicked that button fails. QA spends a day fixing selectors.',
        solution: 'BugZero creates Semantic Fingerprints for every element — visual position, surrounding text, ARIA labels, functional role. When UI changes, it auto-heals using a Fuzzy Scoring Matrix (Levenshtein Distance + Pythagorean Spatial Decay).',
        highlights: ['Semantic Fingerprinting', 'Levenshtein Text Matching', 'Spatial Decay Algorithms', 'Deterministic Healing'],
        impact: 'Eliminates 60% of test maintenance effort',
        techFlow: ['fingerprint_DOM()', '→ node_missing_exception', '→ init_fuzzy_score_matrix()', '→ match = max_score(candidates)', '→ update_selector(match)'],
        metric: { value: '0', label: 'Scripts to maintain' },
    },
    {
        icon: Shield, secondaryIcon: Lock, tag: 'AGENT 02', title: 'Autonomous Auth Navigator', accent: '#A78BFA', gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
        problem: 'Modern apps use Google SSO, OAuth2, MFA with TOTP codes, CAPTCHA. Setting up test automation for these requires dedicated engineering effort.',
        solution: 'The Auth Navigator uses deterministic DOM traversal and structural heuristics to navigate any login flow autonomously — SSO, MFA, CAPTCHA — and stores strategies as reusable playbooks.',
        highlights: ['SSO & OAuth Navigation', 'MFA/TOTP Handling', 'JWT Lifecycle Management', 'Reusable Auth Playbooks'],
        impact: 'Set once, run forever — zero auth setup per environment',
        techFlow: ['detect_auth_gate()', '→ classify_auth_type()', '→ execute_sso_oauth_flow()', '→ inject_totp_seed()', '→ persist_session_state()'],
        metric: { value: '∞', label: 'Auth flows supported' },
    },
    {
        icon: Eye, secondaryIcon: GitCompare, tag: 'AGENT 03', title: 'Visual Regression AI Engine', accent: '#22D3EE', gradient: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
        problem: 'Traditional tools compare screenshots pixel by pixel. A single font rendering difference generates hundreds of false positives. Teams turn off visual testing.',
        solution: 'BugZero uses Structural Image Differencing (Gaussian Blur preprocessing + ImageChops Subtraction + SSIM) to mathematically distinguish cosmetic noise from real layout-breaking defects.',
        highlights: ['Structural Differencing', 'Gaussian Pre-processing', 'SSIM Thresholding', 'Zero AI Hallucination'],
        impact: 'Only real problems surface — zero false positive mode',
        techFlow: ['capture_viewport()', '→ apply_gaussian_blur(radius=5)', '→ ImageChops.difference(base, new)', '→ calculate_SSIM()', '→ if SSIM < 0.95: flag_defect()'],
        metric: { value: '0', label: 'False positives' },
    },
    {
        icon: BarChart3, secondaryIcon: TrendingUp, tag: 'AGENT 04', title: 'Risk-Scored Test Prioritization', accent: '#FBBF24', gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
        problem: '500 pages, 2 hours available. Most teams test the same familiar pages every time. Critical paths like payment flows go undertested.',
        solution: 'BugZero builds a 4-Factor Risk Model: PageRank importance + page type boost + defect history recidivism + change detection regression — generating a dynamic Priority Queue per run.',
        highlights: ['PageRank Graph Analysis', 'Defect History Weighting', 'Change-Aware Prioritization', 'Risk Heatmap Visualization'],
        impact: 'Critical pages always tested first — dynamically',
        techFlow: ['PageRank scoring', '→ type boost (+0.15)', '→ defect history (+0.20)', '→ change detection (+0.15)', '→ greedy sort'],
        metric: { value: '4', label: 'Risk factors' },
    },
    {
        icon: Gauge, secondaryIcon: Cpu, tag: 'AGENT 05', title: 'Performance Chaos Agent', accent: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)',
        problem: 'A new feature adds 800ms to checkout. Nobody notices. Two weeks later, conversion drops 12%. Emergency rollback costs two weeks of development.',
        solution: 'Runs alongside every test cycle — measuring Core Web Vitals, network waterfalls, JS profiling, and memory usage. Chaos mode injects Slow 3G + CPU throttling.',
        highlights: ['Core Web Vitals Tracking', 'Slow 3G Network Chaos', '4x CPU Throttling', 'Performance Budget Enforcement'],
        impact: 'Catch performance regressions before they cost revenue',
        techFlow: ['inject chaos (optional)', '→ measure LCP/CLS/FID', '→ network waterfall', '→ compare budgets', '→ alert on regression'],
        metric: { value: '<20', label: 'Minutes per audit' },
    },
    {
        icon: Scale, secondaryIcon: Database, tag: 'AGENT 06', title: 'Compliance Intelligence Layer', accent: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
        problem: 'WCAG audits happen once a year, cost a fortune, and find hundreds of violations. GDPR checks are manual, inconsistent, and often skipped.',
        solution: 'Every single test cycle is also a full compliance audit — WCAG 2.1 AA violations and GDPR risks scanned automatically via axe-core, classified by regulatory severity.',
        highlights: ['WCAG 2.1 AA Full Scan', 'GDPR Risk Detection', 'Audit-Ready Reports', 'Remediation Guidance'],
        impact: 'Compliance on every run — no extra work, no consultants',
        techFlow: ['inject axe-core', '→ scan DOM tree', '→ classify violations', '→ map to WCAG criteria', '→ remediation tips'],
        metric: { value: '100%', label: 'WCAG coverage' },
    },
];

const personas = [
    { icon: Code2, role: 'Startup CTO', problem: 'No dedicated QA team. Developers test their own code.', solution: 'Full QA coverage without hiring a QA engineer', accent: '#F59E0B' },
    { icon: Users, role: 'QA Lead at Enterprise', problem: 'Team drowns in script maintenance instead of finding real bugs.', solution: 'Eliminate 60% of maintenance work, focus on strategy', accent: '#A78BFA' },
    { icon: Building2, role: 'DevOps Engineer', problem: 'QA is the last bottleneck before every release.', solution: 'Plug into CI/CD — auto-test on every PR', accent: '#22D3EE' },
    { icon: Briefcase, role: 'Product Manager', problem: 'No visibility into quality until customers complain.', solution: 'Real-time hygiene scores and quality dashboards', accent: '#10B981' },
    { icon: FileCheck, role: 'Compliance Officer', problem: 'WCAG and GDPR audits are manual, slow, expensive.', solution: 'Automated compliance report on every test run', accent: '#FBBF24' },
];

const comparison = [
    { dimension: 'Setup Required', traditional: 'Days of scripting', bugzero: 'Just a URL', icon: '⏱️' },
    { dimension: 'Script Maintenance', traditional: 'Every UI change breaks tests', bugzero: 'Self-healing — auto-repairs', icon: '🔧' },
    { dimension: 'Auth Handling', traditional: 'Manual every time', bugzero: 'Autonomous SSO, OAuth2, MFA', icon: '🔐' },
    { dimension: 'Visual Testing', traditional: 'Pixel noise — disabled by teams', bugzero: 'Semantic AI diff with baselines', icon: '👁️' },
    { dimension: 'Prioritization', traditional: 'Same pages every time', bugzero: '4-factor risk scoring per run', icon: '📊' },
    { dimension: 'Compliance', traditional: 'Quarterly manual audit', bugzero: 'Every test run, automatically', icon: '⚖️' },
    { dimension: 'Performance', traditional: 'Separate tool required', bugzero: 'Built-in chaos agent', icon: '⚡' },
    { dimension: 'Reporting', traditional: 'Raw logs & screenshots', bugzero: 'Executive dashboard + hygiene score', icon: '📋' },
];

// Animated counter component
function AnimatedCounter({ value, suffix = '', duration = 2 }) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    const numVal = parseInt(value.replace(/[^0-9]/g, ''));
                    if (isNaN(numVal)) { setCount(value); return; }
                    const step = Math.ceil(numVal / (duration * 60));
                    let current = 0;
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= numVal) { setCount(numVal); clearInterval(timer); }
                        else setCount(current);
                    }, 1000 / 60);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, duration, hasAnimated]);

    return <span ref={ref}>{typeof count === 'number' ? count : value}{suffix}</span>;
}

export default function UseCases() {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [isScrolled, setIsScrolled] = useState(false);
    const [expandedFeature, setExpandedFeature] = useState(null);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

    useEffect(() => {
        document.title = 'Use Cases — BugZero';
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', position: 'relative', overflowX: 'hidden' }}>
            <div className="grid-pattern" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
            <div style={{ position: 'fixed', top: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(212,168,83,0.05) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(184,134,11,0.03) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

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

            {/* Hero with parallax */}
            <motion.section ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale, minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '160px 24px 60px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ position: 'relative', zIndex: 2 }}>
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'var(--glass-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 40, backdropFilter: 'blur(10px)' }}
                    >
                        <ArrowLeft size={15} /> Back to Home
                    </motion.button>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.18)', fontSize: 12, fontWeight: 600, color: '#A78BFA', marginBottom: 32, letterSpacing: '0.02em' }}
                    >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse 2s infinite' }} />
                        <Layers size={14} /> 6 AI Agents · Fully Integrated · Production-Ready
                    </motion.div>

                    <h1 style={{ fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.045em', maxWidth: 850, margin: '0 auto 24px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>What BugZero </span>
                        <span style={{ background: 'linear-gradient(135deg, #A78BFA, #22D3EE, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%', animation: 'gradient-shift 4s ease infinite' }}>actually does.</span>
                    </h1>

                    <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto 48px', fontWeight: 400 }}>
                        A 2-week manual QA cycle compressed into a 20-minute automated report. Every claim backed by real, production code.
                    </p>

                    {/* Animated stat counters */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 700, margin: '0 auto' }}
                    >
                        {[
                            { value: '6', suffix: '', label: 'AI Agents', color: '#A78BFA' },
                            { value: '13', suffix: '', label: 'DB Models', color: '#22D3EE' },
                            { value: '4', suffix: '', label: 'Risk Factors', color: '#F59E0B' },
                            { value: '0', suffix: '', label: 'Scripts Needed', color: '#10B981' },
                        ].map(({ value, suffix, label, color }, i) => (
                            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                                style={{ flex: '1 1 130px', padding: '24px 16px', textAlign: 'center', position: 'relative' }}
                            >
                                {i > 0 && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 1, background: 'var(--border-subtle)' }} />}
                                <div style={{ fontSize: 36, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                                    <AnimatedCounter value={value} suffix={suffix} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* Comparison Table with enhanced styling */}
            <section style={{ maxWidth: 940, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        Traditional QA <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>vs</span> <span style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BugZero</span>
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', maxWidth: 400, margin: '0 auto' }}>Every dimension where autonomous AI outperforms manual QA.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
                >
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <span />
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Dimension</span>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Traditional</span>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#F59E0B', textTransform: 'uppercase' }}>BugZero</span>
                    </div>
                    {comparison.map(({ dimension, traditional, bugzero, icon }, i) => (
                        <motion.div key={dimension}
                            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                            style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr', padding: '16px 24px', borderBottom: i < comparison.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s', alignItems: 'center' }}
                        >
                            <span style={{ fontSize: 16 }}>{icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{dimension}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', textDecoration: 'line-through', opacity: 0.6 }}>{traditional}</span>
                            <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle2 size={13} /> {bugzero}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 6 Features Deep Dive — Enhanced */}
            <section style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        6 AI Agents. <span style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Deep Dive.</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>Each agent addresses a real, painful QA problem. Click to expand the full technical breakdown.</p>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {features.map(({ icon: Icon, secondaryIcon: SecIcon, tag, title, accent, gradient, problem, solution, highlights, impact, techFlow, metric }, i) => (
                        <motion.div key={title} variants={item}
                            onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                            style={{
                                background: 'var(--color-bg-card)',
                                border: expandedFeature === i ? `1px solid ${accent}50` : '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'pointer',
                                transition: 'border-color 0.3s, box-shadow 0.3s',
                                boxShadow: expandedFeature === i ? `0 0 40px ${accent}15, 0 20px 40px rgba(0,0,0,0.1)` : '0 4px 20px rgba(0,0,0,0.05)',
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 28px' }}>
                                <div style={{
                                    width: 48, height: 48, minWidth: 48, borderRadius: 14,
                                    background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 8px 24px ${accent}30`,
                                }}>
                                    <Icon size={22} style={{ color: '#fff' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>{tag}</span>
                                        <div style={{ height: 1, flex: 1, background: `${accent}20` }} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginTop: 4 }}>{title}</h3>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                }}>
                                    {/* Quick metric badge */}
                                    <div style={{
                                        padding: '6px 14px', borderRadius: 'var(--radius-full)',
                                        background: `${accent}10`, border: `1px solid ${accent}20`,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: accent, lineHeight: 1 }}>{metric.value}</div>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: `${accent}aa`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.label}</div>
                                    </div>
                                    <ChevronRight size={20} style={{
                                        color: 'var(--text-tertiary)',
                                        transform: expandedFeature === i ? 'rotate(90deg)' : 'none',
                                        transition: 'transform 0.3s'
                                    }} />
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedFeature === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                                            {/* Problem / Solution side-by-side */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                <div style={{ padding: '20px', borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.08)' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#EF4444', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#EF4444' }} /> THE PROBLEM
                                                    </span>
                                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 8 }}>{problem}</p>
                                                </div>
                                                <div style={{ padding: '20px', borderRadius: 12, background: isDark ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.08)' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#10B981', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#10B981' }} /> OUR SOLUTION
                                                    </span>
                                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 8 }}>{solution}</p>
                                                </div>
                                            </div>

                                            {/* Technical flow — Terminal Visualization */}
                                            <div style={{ marginTop: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Activity size={12} /> ALGORITHMIC EXECUTION PIPELINE
                                                </span>
                                                <div style={{
                                                    display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8,
                                                    padding: '20px', borderRadius: 10,
                                                    background: '#0F172A',
                                                    border: '1px solid var(--border-subtle)',
                                                    fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                                                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 6 }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#EF4444' }} />
                                                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#F59E0B' }} />
                                                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#10B981' }} />
                                                    </div>
                                                    {techFlow.map((step, si) => (
                                                        <motion.div key={si}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: si * 0.15 }}
                                                            style={{
                                                                fontSize: 13, fontWeight: 500,
                                                                color: step.startsWith('→') ? '#94A3B8' : accent,
                                                            }}
                                                        >
                                                            <span style={{ color: '#475569', marginRight: 12 }}>{si + 1 > 9 ? si + 1 : `0${si + 1}`}</span> 
                                                            {step}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* How it works pills */}
                                            <div>
                                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>CAPABILITIES</span>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {highlights.map(h => (
                                                        <span key={h} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                                            padding: '7px 16px', borderRadius: 'var(--radius-full)',
                                                            background: `${accent}0c`, border: `1px solid ${accent}18`,
                                                            fontSize: 12, fontWeight: 600, color: accent,
                                                        }}>
                                                            <CheckCircle2 size={12} /> {h}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Impact bar */}
                                            <div style={{
                                                padding: '16px 22px', borderRadius: 12,
                                                background: gradient, position: 'relative', overflow: 'hidden',
                                            }}>
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmer 2s infinite' }} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                                                    <Sparkles size={16} style={{ color: '#fff' }} />
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Impact: </span>
                                                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{impact}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Who Is This For — Enhanced */}
            <section style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        Built for <span style={{ background: 'linear-gradient(135deg, #10B981, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>every team.</span>
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', maxWidth: 400, margin: '0 auto' }}>From solo founders to enterprise compliance officers.</p>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {personas.map(({ icon: Icon, role, problem, solution, accent }, pi) => (
                        <motion.div key={role} variants={item}
                            whileHover={{ y: -6, boxShadow: `0 20px 40px ${accent}15` }}
                            style={{
                                background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-lg)', padding: '28px 24px',
                                display: 'flex', flexDirection: 'column', gap: 14,
                                transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {/* Subtle gradient corner accent */}
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: `${accent}08`, filter: 'blur(20px)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}12`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={20} style={{ color: accent }} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</h3>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: `2px solid ${accent}30`, paddingLeft: 12 }}>"{problem}"</p>
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <CheckCircle2 size={16} style={{ color: accent, marginTop: 2, minWidth: 16 }} />
                                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 600, margin: 0 }}>{solution}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Bottom CTA */}
            <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ textAlign: 'center', padding: '60px 40px', borderRadius: 'var(--radius-xl)', background: 'var(--gradient-primary)', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', animation: 'shimmer 3s infinite' }} />
                    <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: 'var(--on-accent)', letterSpacing: '-0.03em', marginBottom: 16, position: 'relative' }}>Ready to eliminate QA bottlenecks?</h2>
                    <p style={{ fontSize: 15, color: 'rgba(9,9,11,0.7)', marginBottom: 32, maxWidth: 460, margin: '0 auto 32px', position: 'relative' }}>Give BugZero a URL. Get a full quality report in under 20 minutes.</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/login')}
                        style={{ padding: '16px 40px', fontSize: 15, fontWeight: 700, background: 'var(--color-bg-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', boxShadow: 'var(--shadow-lg)', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        Start Testing Free <ArrowRight size={16} />
                    </motion.button>
                </motion.div>
            </section>

            {/* Footer */}
            <CinematicFooter onNavigate={(path) => navigate(path)} />

            {/* CSS Animations */}
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    );
}
