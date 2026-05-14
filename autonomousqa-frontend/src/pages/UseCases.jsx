import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Layers, Zap, Shield, Eye, BarChart3, Gauge, Scale,
    ArrowLeft, FlaskConical, ChevronRight, Users, Building2,
    Code2, Briefcase, FileCheck, Lightbulb, CheckCircle2
} from 'lucide-react';
import { AnimatedThemeToggle } from '../components/ui/animated-theme-toggle';
import { StarButton } from '../components/ui/star-button';
import { CinematicFooter } from '../components/ui/motion-footer';
import useThemeStore from '../store/themeStore';
import { useState, useEffect } from 'react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const features = [
    {
        icon: Zap, tag: 'Feature 1', title: 'Self-Healing Test Intelligence', accent: 'var(--color-accent-gold)',
        problem: 'A developer renames a button from "Submit" to "Save & Continue". Every test that clicked that button fails. QA spends a day fixing selectors.',
        solution: 'BugZero creates Semantic Fingerprints for every element — visual position, surrounding text, ARIA labels, functional role. When UI changes, it auto-heals with confidence scoring.',
        highlights: ['Semantic Fingerprinting', 'Confidence-Scored Healing', 'Zero False Positives', 'Full Healing Audit Trail'],
        impact: 'Eliminates 60% of test maintenance effort'
    },
    {
        icon: Shield, tag: 'Feature 2', title: 'Autonomous Auth Navigator', accent: 'var(--color-accent-purple)',
        problem: 'Modern apps use Google SSO, OAuth2, MFA with TOTP codes, CAPTCHA. Setting up test automation for these requires dedicated engineering effort.',
        solution: 'The Auth Navigator uses computer vision, DOM analysis, and LLM reasoning to navigate any login flow autonomously — SSO, MFA, CAPTCHA — and stores strategies as reusable playbooks.',
        highlights: ['SSO & OAuth Navigation', 'MFA/TOTP Handling', 'JWT Lifecycle Management', 'Reusable Auth Playbooks'],
        impact: 'Set once, run forever — zero auth setup per environment'
    },
    {
        icon: Eye, tag: 'Feature 3', title: 'Visual Regression AI Engine', accent: 'var(--color-accent-cyan)',
        problem: 'Traditional tools compare screenshots pixel by pixel. A single font rendering difference generates hundreds of false positives. Teams turn off visual testing.',
        solution: 'BugZero uses vision models to understand the meaning of visual changes like a human designer — distinguishing cosmetic noise from real usability-breaking issues.',
        highlights: ['Semantic Visual Diff', 'AI Change Classification', 'Annotated Reports', 'Automatic Baseline Management'],
        impact: 'Only real problems surface — zero false positive mode'
    },
    {
        icon: BarChart3, tag: 'Feature 4', title: 'Risk-Scored Test Prioritization', accent: 'var(--color-accent-gold-bright)',
        problem: '500 pages, 2 hours available. Most teams test the same familiar pages every time. Critical paths like payment flows go undertested.',
        solution: 'BugZero builds a Risk Model factoring change frequency, defect history, user traffic, and business criticality — generating a dynamic Priority Queue per run.',
        highlights: ['Change-Aware Prioritization', 'Defect History Weighting', 'Traffic-Impact Scoring', 'Risk Heatmap Visualization'],
        impact: 'Critical pages always tested first — dynamically'
    },
    {
        icon: Gauge, tag: 'Feature 5', title: 'Performance Chaos Agent', accent: 'var(--color-accent-emerald)',
        problem: 'A new feature adds 800ms to checkout. Nobody notices. Two weeks later, conversion drops 12%. Emergency rollback costs two weeks of development.',
        solution: 'Runs alongside every test cycle — measuring Core Web Vitals, network waterfalls, JS profiling, and memory usage. Alerts on any metric regression before shipping.',
        highlights: ['Core Web Vitals Tracking', 'Network Waterfall Analysis', 'JavaScript Profiling', 'Performance Budget Enforcement'],
        impact: 'Catch performance regressions before they cost revenue'
    },
    {
        icon: Scale, tag: 'Feature 6', title: 'Compliance Intelligence Layer', accent: 'var(--color-error)',
        problem: 'WCAG audits happen once a year, cost a fortune, and find hundreds of violations. GDPR checks are manual, inconsistent, and often skipped.',
        solution: 'Every single test cycle is also a full compliance audit — WCAG 2.1 AA violations and GDPR risks scanned automatically, classified by regulatory severity.',
        highlights: ['WCAG 2.1 AA Full Scan', 'GDPR Risk Detection', 'Audit-Ready Reports', 'Remediation Guidance'],
        impact: 'Compliance on every run — no extra work, no consultants'
    },
];

const personas = [
    { icon: Code2, role: 'Startup CTO', problem: 'No dedicated QA team. Developers test their own code.', solution: 'Full QA coverage without hiring a QA engineer', accent: 'var(--color-accent-gold)' },
    { icon: Users, role: 'QA Lead at MNC', problem: 'Team drowns in script maintenance instead of finding real bugs.', solution: 'Eliminate 60% of maintenance work, focus on strategy', accent: 'var(--color-accent-purple)' },
    { icon: Building2, role: 'DevOps Engineer', problem: 'QA is the last bottleneck before every release.', solution: 'Plug into CI/CD — auto-test on every PR', accent: 'var(--color-accent-cyan)' },
    { icon: Briefcase, role: 'Product Manager', problem: 'No visibility into quality until customers complain.', solution: 'Real-time hygiene scores and quality dashboards', accent: 'var(--color-accent-emerald)' },
    { icon: FileCheck, role: 'Compliance Officer', problem: 'WCAG and GDPR audits are manual, slow, expensive.', solution: 'Automated compliance report on every test run', accent: 'var(--color-accent-gold-bright)' },
];

const comparison = [
    { dimension: 'Setup Required', traditional: 'Days of scripting', bugzero: 'Just a URL' },
    { dimension: 'Script Maintenance', traditional: 'Every UI change breaks tests', bugzero: 'Self-healing — auto-repairs' },
    { dimension: 'Auth Handling', traditional: 'Manual every time', bugzero: 'Autonomous SSO, OAuth2, MFA' },
    { dimension: 'Bug Classification', traditional: 'Human interprets logs', bugzero: 'AI classifies by type & severity' },
    { dimension: 'Compliance', traditional: 'Quarterly manual audit', bugzero: 'Every test run, automatically' },
    { dimension: 'Performance', traditional: 'Separate tool required', bugzero: 'Built-in chaos agent' },
    { dimension: 'Reporting', traditional: 'Raw logs & screenshots', bugzero: 'Executive dashboard + hygiene score' },
];

export default function UseCases() {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [isScrolled, setIsScrolled] = useState(false);
    const [expandedFeature, setExpandedFeature] = useState(null);

    useEffect(() => {
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
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.18)', fontSize: 12, fontWeight: 600, color: 'var(--color-accent-purple)', marginBottom: 32, letterSpacing: '0.02em' }}
                    >
                        <Layers size={14} /> 6 AI Agents · One Platform
                    </motion.div>

                    <h1 style={{ fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.045em', maxWidth: 800, margin: '0 auto 24px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>What BugZero </span>
                        <span style={{ background: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>actually does.</span>
                    </h1>

                    <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontWeight: 400 }}>
                        A 2-week manual QA cycle compressed into a 20-minute automated report. Here's every feature, every use case, and who it's built for.
                    </p>
                </motion.div>
            </section>

            {/* Comparison Table */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        Traditional QA <span style={{ color: 'var(--text-tertiary)' }}>vs</span> <span style={{ color: 'var(--color-accent-gold)' }}>BugZero</span>
                    </h2>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}
                >
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Dimension</span>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Traditional</span>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-accent-gold)', textTransform: 'uppercase' }}>BugZero</span>
                    </div>
                    {comparison.map(({ dimension, traditional, bugzero }, i) => (
                        <div key={dimension} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '16px 24px', borderBottom: i < comparison.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{dimension}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{traditional}</span>
                            <span style={{ fontSize: 13, color: 'var(--color-accent-gold)', fontWeight: 600 }}>{bugzero}</span>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* 6 Features Deep Dive */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        6 AI Agents. <span style={{ background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Deep Dive.</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>Each feature addresses a real, painful QA problem. Click to expand.</p>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {features.map(({ icon: Icon, tag, title, accent, problem, solution, highlights, impact }, i) => (
                        <motion.div key={title} variants={item}
                            onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                            style={{ background: 'var(--color-bg-card)', border: expandedFeature === i ? `1px solid ${accent}40` : '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.3s, box-shadow 0.3s', boxShadow: expandedFeature === i ? `0 0 30px ${accent}10` : 'none' }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 28px' }}>
                                <div style={{ width: 44, height: 44, minWidth: 44, borderRadius: 12, background: `${accent}12`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={22} style={{ color: accent }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{tag}</span>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginTop: 2 }}>{title}</h3>
                                </div>
                                <ChevronRight size={20} style={{ color: 'var(--text-tertiary)', transform: expandedFeature === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                            </div>

                            {/* Expanded Content */}
                            <motion.div
                                initial={false}
                                animate={{ height: expandedFeature === i ? 'auto' : 0, opacity: expandedFeature === i ? 1 : 0 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-error)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>THE PROBLEM</span>
                                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{problem}</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-accent-emerald)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>OUR SOLUTION</span>
                                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{solution}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>HOW IT WORKS</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {highlights.map(h => (
                                                <span key={h} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: `${accent}10`, border: `1px solid ${accent}20`, fontSize: 12, fontWeight: 600, color: accent }}>
                                                    <CheckCircle2 size={12} /> {h}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ padding: '14px 20px', borderRadius: 'var(--radius-lg)', background: `${accent}08`, border: `1px solid ${accent}15` }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>⚡ Impact: </span>
                                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{impact}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Who Is This For */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 12, color: 'var(--text-primary)' }}>
                        Built for <span style={{ background: 'linear-gradient(135deg, var(--color-accent-emerald), var(--color-accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>every team.</span>
                    </h2>
                </motion.div>

                <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {personas.map(({ icon: Icon, role, problem, solution, accent }) => (
                        <motion.div key={role} variants={item}
                            whileHover={{ y: -4, borderColor: `${accent}40` }}
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'all 0.3s' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}12`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={20} style={{ color: accent }} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{role}</h3>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{problem}"</p>
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
                    <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: 'var(--on-accent)', letterSpacing: '-0.03em', marginBottom: 16 }}>Ready to eliminate QA bottlenecks?</h2>
                    <p style={{ fontSize: 15, color: 'rgba(9,9,11,0.7)', marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>Give BugZero a URL. Get a full quality report in under 20 minutes.</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/login')}
                        style={{ padding: '16px 40px', fontSize: 15, fontWeight: 700, background: 'var(--color-bg-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', boxShadow: 'var(--shadow-lg)' }}
                    >
                        Start Testing Free →
                    </motion.button>
                </motion.div>
            </section>

            {/* Footer */}
            <CinematicFooter onNavigate={(path) => navigate(path)} />
        </div>
    );
}
