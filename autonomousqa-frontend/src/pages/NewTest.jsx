import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Settings2, Play, ChevronDown, Shield, Layers, MonitorSmartphone, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Slider } from '../components/ui/slider';
import { tests as testsApi, playbooks as playbooksApi } from '../lib/api';

const browsers = ['Chromium', 'Firefox', 'WebKit'];
const depths = ['Shallow (top-level only)', 'Standard (3 levels deep)', 'Deep (entire site)'];

export default function NewTest() {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [browser, setBrowser] = useState('Chromium');
    const [depth, setDepth] = useState('Standard (3 levels deep)');
    const [maxPages, setMaxPages] = useState(50);
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

    const handleLaunch = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!url) return;
        // Auto-prefix protocol if missing
        let targetUrl = url.trim().replace(/\/+$/, ''); // trim trailing slashes and whitespace
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }
        // Basic URL validation
        try {
            new URL(targetUrl);
        } catch {
            setError('Please enter a valid URL (e.g. https://example.com)');
            return;
        }
        setLaunching(true);
        setError('');
        try {
            const depthMap = { 'Shallow (top-level only)': 'shallow', 'Standard (3 levels deep)': 'standard', 'Deep (entire site)': 'deep' };
            const enabledModules = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
            const result = await testsApi.create({
                url: targetUrl,
                config: {
                    browser: browser.toLowerCase(),
                    crawl_depth: depthMap[depth] || 'standard',
                    max_pages: maxPages,
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
        { key: 'functional', icon: Layers, label: 'Functional Testing', desc: 'Button clicks, form submissions, navigation', hex: '#60a5fa' },
        { key: 'accessibility', icon: Shield, label: 'Accessibility (WCAG)', desc: 'Full WCAG 2.1 AA compliance scan', hex: '#e879f9' },
        { key: 'performance', icon: Gauge, label: 'Performance Audit', desc: 'Core Web Vitals, loading analysis', hex: '#34d399' },
        { key: 'seo', icon: Globe, label: 'SEO Analysis', desc: 'Meta tags, heading structure, alt text', hex: '#fbbf24' },
        { key: 'visual', icon: MonitorSmartphone, label: 'Visual Regression', desc: 'Screenshot comparison with AI diff', hex: '#a78bfa' },
        { key: 'compliance', icon: Shield, label: 'GDPR Compliance', desc: 'Cookie consent, data exposure checks', hex: '#fb7185' },
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

            {/* URL Input */}
            <form onSubmit={handleLaunch}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card"
                    style={{ padding: '28px', marginBottom: 20 }}
                >
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Target URL
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 10,
                            background: 'rgba(212, 168, 83, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Globe size={20} style={{ color: 'var(--color-accent-gold)' }} />
                        </div>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); setError(''); }}
                            placeholder="https://your-application.com"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLaunch(e); } }}
                            style={{
                                flex: 1, padding: '14px 18px', fontSize: 15,
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 10,
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                                transition: 'border-color var(--transition-fast)',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-gold)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                        />
                    </div>
                </motion.div>
            </form>

            {/* Config Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Browser Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-card"
                    style={{ padding: '24px' }}
                >
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Browser Engine
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {browsers.map(b => (
                            <div
                                key={b}
                                onClick={() => setBrowser(b)}
                                style={{
                                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                    background: browser === b ? 'rgba(212, 168, 83, 0.08)' : 'var(--color-bg-elevated)',
                                    border: `1px solid ${browser === b ? 'rgba(212, 168, 83, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                    cursor: 'pointer', fontSize: 14, fontWeight: browser === b ? 600 : 400,
                                    color: browser === b ? 'var(--color-accent-gold)' : 'var(--text-secondary)',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                {b}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Crawl Depth */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card"
                    style={{ padding: '24px' }}
                >
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Crawl Depth
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {depths.map(d => (
                            <div
                                key={d}
                                onClick={() => setDepth(d)}
                                style={{
                                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                    background: depth === d ? 'rgba(212, 168, 83, 0.08)' : 'var(--color-bg-elevated)',
                                    border: `1px solid ${depth === d ? 'rgba(212, 168, 83, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                    cursor: 'pointer', fontSize: 14, fontWeight: depth === d ? 600 : 400,
                                    color: depth === d ? 'var(--color-accent-gold)' : 'var(--text-secondary)',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Max Pages Slider */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="glass-card"
                style={{ padding: '24px', marginBottom: 20 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Max Pages to Test
                    </label>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-accent-gold)' }}>
                        {maxPages}
                    </span>
                </div>
                <div style={{ padding: '0 8px' }}>
                    <Slider
                        value={maxPages}
                        onChange={(v) => setMaxPages(v)}
                        min={1}
                        max={100}
                        step={1}
                        valuePosition="tooltip"
                        formatValue={(v) => `${v}`}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 16 }}>
                    <span>1 page (Fast)</span>
                    <span>100 pages (Comprehensive)</span>
                </div>
            </motion.div>

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
                        background: 'var(--color-bg-elevated)',
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
                    {featureList.map(({ key, icon: Icon, label, desc, hex }) => (
                        <div
                            key={key}
                            onClick={() => toggleFeature(key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '14px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                            }}
                            className="group"
                        >
                            <div className="relative flex items-center justify-center flex-shrink-0 mr-1">
                                <div 
                                    className={`w-6 h-6 rounded-full border-2 transition-all duration-500 ease-out flex items-center justify-center ${features[key] ? 'scale-90' : 'border-gray-500 scale-100 group-hover:border-gray-400 group-hover:scale-110'}`}
                                    style={features[key] ? { borderColor: hex } : {}}
                                >
                                    <div 
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${features[key] ? 'scale-100' : 'scale-0 bg-gray-500'}`} 
                                        style={features[key] ? { backgroundColor: hex } : {}}
                                    />
                                    {features[key] && (
                                        <div 
                                            className="absolute w-9 h-9 rounded-full border-2 border-transparent animate-spin shadow-lg" 
                                            style={{ borderTopColor: hex, boxShadow: `0 0 15px ${hex}80`, animationDuration: '2s' }} 
                                        />
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: features[key] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Start Button */}
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
            <motion.button
                type="button"
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(212,168,83,0.25)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLaunch}
                disabled={!url || launching}
                style={{
                    width: '100%', padding: '16px', fontSize: 16, fontWeight: 700,
                    background: !url ? 'rgba(212,168,83,0.3)' : 'var(--color-accent-gold)', color: 'var(--on-accent)',
                    border: 'none', borderRadius: 12,
                    cursor: !url || launching ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: url ? '0 0 24px rgba(212,168,83,0.2)' : 'none',
                    opacity: launching ? 0.7 : 1,
                }}
            >
                <Play size={20} /> {launching ? 'Launching...' : 'Launch Autonomous Test'}
            </motion.button>
        </motion.div>
    );
}
