import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Settings2, Play, ChevronDown, Shield, Layers, MonitorSmartphone, Gauge } from 'lucide-react';
import { SecureMessageGateway } from '../components/ui/secure-message-gateway';
import { useNavigate } from 'react-router-dom';
import { tests as testsApi, playbooks as playbooksApi } from '../lib/api';

const browsers = ['Chromium', 'Firefox', 'WebKit'];
const depths = ['Shallow (top-level only)', 'Standard (3 levels deep)', 'Deep (entire site)'];

export default function NewTest() {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [browser, setBrowser] = useState('Chromium');
    const [depth, setDepth] = useState('Standard (3 levels deep)');
    const [playbook, setPlaybook] = useState('');
    const [launching, setLaunching] = useState(false);
    const [playbooks, setPlaybooks] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => { document.title = 'New Test — AutonomousQA'; }, []);

    useEffect(() => {
        playbooksApi.list()
            .then(data => setPlaybooks(data.playbooks || []))
            .catch(() => { });
    }, []);

    const [features, setFeatures] = useState({
        functional: true, accessibility: true, performance: true,
        seo: true, visual: false, compliance: true,
    });

    const toggleFeature = (key) => setFeatures(prev => ({ ...prev, [key]: !prev[key] }));

    const handleLaunch = async (targetUrl) => {
        if (!targetUrl) return;

        let formattedUrl = targetUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        try {
            new URL(formattedUrl);
        } catch {
            setError('Please enter a valid URL (e.g. https://example.com)');
            return;
        }

        setLaunching(true);
        setError('');

        try {
            const enabledModules = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
            const result = await testsApi.create({
                url: formattedUrl,
                config: {
                    browser: 'chromium', // Default
                    crawl_depth: 'standard', // Default
                    modules: enabledModules,
                    playbook_id: playbook || undefined,
                },
            });
            const testId = result?.testRun?.id;
            if (!testId) throw new Error('Unexpected response — no test ID returned');
            navigate(`/tests/${testId}`);
        } catch (err) {
            setError(err.message || 'Failed to start test. Is the backend running?');
        } finally {
            setLaunching(false);
        }
    };

    const featureList = [
        { key: 'functional', icon: Layers, label: 'Functional Testing', desc: 'Button clicks, form submissions, navigation' },
        { key: 'accessibility', icon: Shield, label: 'Accessibility (WCAG)', desc: 'Full WCAG 2.1 AA compliance scan' },
        { key: 'performance', icon: Gauge, label: 'Performance Audit', desc: 'Core Web Vitals, loading analysis' },
        { key: 'seo', icon: Globe, label: 'SEO Analysis', desc: 'Meta tags, heading structure, alt text' },
        { key: 'visual', icon: MonitorSmartphone, label: 'Visual Regression', desc: 'Screenshot comparison with AI diff' },
        { key: 'compliance', icon: Shield, label: 'GDPR Compliance', desc: 'Cookie consent, data exposure checks' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: 800, margin: '0 auto' }}
        >
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
                    Start New Test Run
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Enter a URL and configure your test parameters. The AI engine will handle everything else.
                </p>
            </div>

            {/* Target Entry Gateway */}
            <div style={{ marginBottom: 40 }}>
                <SecureMessageGateway onSubmit={handleLaunch} isPending={launching} />
            </div>

            {/* Auth Playbook */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-card"
                style={{ padding: '24px', marginBottom: 20 }}
            >
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Auth Playbook (Optional)
                </label>
                <select
                    value={playbook}
                    onChange={(e) => setPlaybook(e.target.value)}
                    style={{
                        width: '100%', padding: '12px 16px', fontSize: 14,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                    }}
                >
                    <option value="">No authentication required</option>
                    {playbooks.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {p.domain}</option>
                    ))}
                </select>
            </motion.div>

            {/* Test Features */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
                style={{ padding: '24px', marginBottom: 28 }}
            >
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Test Modules
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {featureList.map(({ key, icon: Icon, label, desc }) => (
                        <div
                            key={key}
                            onClick={() => toggleFeature(key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '14px',
                                borderRadius: 'var(--radius-md)',
                                background: features[key] ? 'rgba(212, 168, 83, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                                border: `1px solid ${features[key] ? 'rgba(212, 168, 83, 0.18)' : 'rgba(255,255,255,0.05)'}`,
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                            }}
                        >
                            <div style={{
                                width: 20, height: 20, borderRadius: 5,
                                border: `2px solid ${features[key] ? 'var(--color-accent-gold)' : 'var(--text-tertiary)'}`,
                                background: features[key] ? 'var(--color-accent-gold)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all var(--transition-fast)',
                            }}>
                                {features[key] && (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: features[key] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Start Button & Errors */}
            {error && (
                <div style={{
                    padding: '12px 16px', marginBottom: 16,
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: '#EF4444', fontSize: 13,
                }}>
                    {error}
                </div>
            )}
        </motion.div>
    );
}
