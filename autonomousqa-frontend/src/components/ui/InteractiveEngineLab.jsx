import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Eye, BarChart3, ShieldCheck, Play, RotateCcw,
    CheckCircle2, AlertTriangle, ArrowRight, Code, Sparkles,
    Layers, Cpu, Activity, Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const scenarios = [
    {
        id: 'healing',
        label: 'Self-Healing Engine',
        icon: Zap,
        badge: 'Zero-Script Auto-Repair',
        title: 'Instant DOM Selector Auto-Healing',
        description: 'When UI classes change during production deploys, BugZero computes Levenshtein vector distance and structural geometry to repair selectors in sub-milliseconds without breaking test pipelines.',
        beforeCode: '<button id="btn-checkout-legacy" class="btn-primary-v1">\n  Complete Purchase\n</button>',
        afterCode: '<button id="checkout-cta-2026" class="btn-primary-glow">\n  Complete Purchase\n</button>',
        meta: {
            confidence: '98.4%',
            algorithm: 'Levenshtein + DOM Proximity Matrix',
            executionTime: '1.2ms',
            aiTokensUsed: '0 (Algorithmic stdlib)',
        }
    },
    {
        id: 'vision',
        label: 'Visual AI Diff',
        icon: Eye,
        badge: 'Pixel + Layout Shift',
        title: 'Algorithmic Visual Regression',
        description: 'Differentiates intentional cosmetic styling updates from critical layout breakage, 2D component overlap collisions, and mobile viewport clipping.',
        beforeCode: '/* Baseline Viewport: 1440x900 */\n.hero-cta { margin-top: 32px; z-index: 10; }',
        afterCode: '/* Tested Layout: 390x844 (Mobile) */\n.hero-cta { margin-top: 12px; overlap-risk: 0%; }',
        meta: {
            confidence: '99.1%',
            algorithm: 'Pillow PIL ImageChops + Bounding Box Collision',
            executionTime: '4.8ms',
            aiTokensUsed: '0 tokens',
        }
    },
    {
        id: 'pagerank',
        label: '4-Factor Risk Model',
        icon: BarChart3,
        badge: 'Smart Test Prioritization',
        title: 'PageRank & Defect Density Graph',
        description: 'Prioritizes deep crawling on high-velocity code paths, authentication boundaries, and revenue-critical checkout funnels instead of shallow brute force.',
        beforeCode: '// Traditional Brute-Force\nCrawlQueue.run(urls.slice(0, 100)); // Slow O(N)',
        afterCode: '// BugZero 4-Factor Weighted Queue\nQueue.prioritize({ pageRank: 0.88, churn: 0.74, defectDensity: 0.62 });',
        meta: {
            confidence: '96.7%',
            algorithm: 'Eigenvector Centrality (NetworkX PageRank)',
            executionTime: '3.1ms',
            aiTokensUsed: '0 tokens',
        }
    },
    {
        id: 'compliance',
        label: 'WCAG 2.1 AA Fixer',
        icon: ShieldCheck,
        badge: 'Automated Remediation',
        title: 'Zero-Compromise Accessibility & Privacy',
        description: 'Auto-detects contrast violations, missing semantic landmarks, and GDPR cookie gaps, generating copyable remediation code for your frontend team.',
        beforeCode: '<div onclick="openModal()" class="clickable-icon">\n  <svg ...></svg>\n</div>',
        afterCode: '<button type="button" aria-label="Open Navigation Modal" class="clickable-icon">\n  <svg aria-hidden="true" ...></svg>\n</button>',
        meta: {
            confidence: '100%',
            algorithm: 'axe-core Automated Assertion Rule Engine',
            executionTime: '6.5ms',
            aiTokensUsed: '0 tokens',
        }
    }
];

export default function InteractiveEngineLab() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(scenarios[0].id);
    const [simulating, setSimulating] = useState(false);
    const [simulationDone, setSimulationDone] = useState(true);
    const [terminalLogs, setTerminalLogs] = useState([
        '[ENGINE] Ready for autonomous simulation.',
        '[INFO] Connected to Playwright Chromium cluster.',
    ]);

    const activeScenario = scenarios.find(s => s.id === activeTab) || scenarios[0];

    const runSimulation = () => {
        setSimulating(true);
        setSimulationDone(false);
        setTerminalLogs([
            `[INIT] Launching ${activeScenario.title}...`,
            `[CRAWL] Intercepting DOM tree at /checkout`,
        ]);

        setTimeout(() => {
            setTerminalLogs(prev => [
                ...prev,
                `[ANALYZE] Applying ${activeScenario.meta.algorithm}...`,
            ]);
        }, 400);

        setTimeout(() => {
            setTerminalLogs(prev => [
                ...prev,
                `[MATCH] Confidence score: ${activeScenario.meta.confidence}`,
                `[RESOLVE] ✅ Successfully resolved in ${activeScenario.meta.executionTime}. AI Tokens: ${activeScenario.meta.aiTokensUsed}`,
            ]);
            setSimulating(false);
            setSimulationDone(true);
        }, 900);
    };

    return (
        <section style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '60px 24px 100px',
            position: 'relative',
            zIndex: 2,
        }}>
            {/* Header Badge & Title */}
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(212, 168, 83, 0.08)',
                    border: '1px solid rgba(212, 168, 83, 0.25)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-accent-gold)',
                    marginBottom: 16,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                }}>
                    <Sparkles size={14} /> Interactive Autonomous Engine Lab
                </div>
                <h2 style={{
                    fontSize: 'clamp(28px, 4vw, 42px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: 12,
                    color: 'var(--text-primary)',
                }}>
                    See How the Engine Works <span style={{
                        background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Under the Hood</span>
                </h2>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto' }}>
                    Simulate real-world production defects, selector breakages, and automated visual regressions live.
                </p>
            </div>

            {/* Interactive Lab Container */}
            <div style={{
                background: 'var(--glass-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 24,
                boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.6), 0 0 40px rgba(212, 168, 83, 0.08)',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
            }}>
                {/* Lab Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    overflowX: 'auto',
                }}>
                    {scenarios.map((sc) => {
                        const Icon = sc.icon;
                        const isActive = activeTab === sc.id;
                        return (
                            <button
                                key={sc.id}
                                onClick={() => { setActiveTab(sc.id); setSimulationDone(true); }}
                                style={{
                                    flex: 1,
                                    minWidth: 180,
                                    padding: '18px 20px',
                                    background: isActive ? 'rgba(212, 168, 83, 0.1)' : 'transparent',
                                    border: 'none',
                                    borderBottom: `2px solid ${isActive ? 'var(--color-accent-gold)' : 'transparent'}`,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: 14,
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <Icon size={16} style={{ color: isActive ? 'var(--color-accent-gold)' : 'var(--text-tertiary)' }} />
                                {sc.label}
                            </button>
                        );
                    })}
                </div>

                {/* Lab Main Content Area */}
                <div style={{ padding: '36px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 32, alignItems: 'center' }}>
                    {/* Left: Interactive Explanation & Metadata */}
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 12px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--color-success)',
                            marginBottom: 14,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}>
                            <CheckCircle2 size={13} /> {activeScenario.badge}
                        </div>

                        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            {activeScenario.title}
                        </h3>

                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 24 }}>
                            {activeScenario.description}
                        </p>

                        {/* Metadata Metric Pills */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
                            <div style={{ padding: '12px 14px', background: 'var(--color-bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Confidence Match</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-success)' }}>{activeScenario.meta.confidence}</div>
                            </div>
                            <div style={{ padding: '12px 14px', background: 'var(--color-bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Execution Latency</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-accent-gold)' }}>{activeScenario.meta.executionTime}</div>
                            </div>
                            <div style={{ padding: '12px 14px', background: 'var(--color-bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Core Algorithm</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeScenario.meta.algorithm}</div>
                            </div>
                            <div style={{ padding: '12px 14px', background: 'var(--color-bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>AI Token Cost</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA' }}>{activeScenario.meta.aiTokensUsed}</div>
                            </div>
                        </div>

                        {/* Trigger Controls */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={runSimulation}
                                disabled={simulating}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    background: 'var(--gradient-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: simulating ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    boxShadow: 'var(--shadow-glow-gold)',
                                }}
                            >
                                <Play size={16} fill="white" /> {simulating ? 'Simulating Fix...' : 'Run Simulation'}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/login')}
                                style={{
                                    padding: '12px 20px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    background: 'var(--glass-subtle)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                Test Your App <ArrowRight size={15} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Right: Code Diff Inspector & Live Terminal */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Interactive Code Window */}
                        <div style={{
                            background: '#0B0F19',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 14,
                            overflow: 'hidden',
                            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
                        }}>
                            <div style={{
                                padding: '10px 16px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                                </div>
                                <span style={{ fontSize: 11, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                                    autonomous_engine_diff.tsx
                                </span>
                            </div>

                            <div style={{ padding: '16px', fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                                <div style={{ color: '#EF4444', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: 4, marginBottom: 8 }}>
                                    <span style={{ fontWeight: 700, marginRight: 6 }}>- [MUTATED]</span>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{activeScenario.beforeCode}</pre>
                                </div>
                                <div style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: 4 }}>
                                    <span style={{ fontWeight: 700, marginRight: 6 }}>+ [AUTONOMOUS FIX]</span>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{activeScenario.afterCode}</pre>
                                </div>
                            </div>
                        </div>

                        {/* Live Terminal Stream */}
                        <div style={{
                            background: '#070A11',
                            border: '1px solid rgba(212, 168, 83, 0.2)',
                            borderRadius: 14,
                            padding: '14px 18px',
                            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                            fontSize: 12,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-accent-gold)', marginBottom: 8, fontSize: 11, fontWeight: 700 }}>
                                <Terminal size={13} /> STREAM LOGS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {terminalLogs.map((log, i) => (
                                    <div key={i} style={{ color: log.includes('✅') ? '#10B981' : log.includes('[INIT]') ? '#60A5FA' : 'var(--text-secondary)' }}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
