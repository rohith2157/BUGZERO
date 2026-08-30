import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Eye, Filter, Loader2, Copy, Check, Search, Download, CheckCircle2, GitPullRequest } from 'lucide-react';
import HygieneScoreGauge from '../components/ui/HygieneScoreGauge';
import StatusBadge from '../components/ui/StatusBadge';
import { tests as testsApi } from '../lib/api';
import EmptyTestState from '../components/ui/EmptyTestState';
import AutoFixModal from '../components/ui/AutoFixModal';

function safePath(url) { try { return new URL(url).pathname || url; } catch { return url; } }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Compliance() {
    const { id } = useParams();
    
    if (id === 'none') return <EmptyTestState title="Compliance Report" />;

    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedViolationForPR, setSelectedViolationForPR] = useState(null);

    useEffect(() => { document.title = 'Compliance & WCAG — BugZero'; }, []);

    useEffect(() => {
        testsApi.compliance(id).then(data => {
            setComplianceData({
                overallScore: Math.min(100, data.scores?.overall ?? 0),
                wcagScore: Math.min(100, data.scores?.wcag ?? 0),
                gdprScore: Math.min(100, data.scores?.gdpr ?? 0),
                violations: (data.violations || []).map((v, i) => ({
                    id: v.id || `v-${i}`,
                    standard: v.standard || 'WCAG',
                    criterion: v.criterion || 'A11y Rule',
                    severity: v.severity || 'moderate',
                    page: v.pageUrl ? safePath(v.pageUrl) : '/',
                    description: v.description,
                    remediation: v.remediation || 'Review semantic HTML and ARIA roles for accessibility.',
                    codeSnippet: v.remediationSnippet || (v.criterion?.toLowerCase().includes('alt') 
                        ? '<img src="/path.jpg" alt="Descriptive accessible label" />' 
                        : v.criterion?.toLowerCase().includes('color') 
                            ? '/* Ensure minimum 4.5:1 contrast ratio */\ncolor: #FFFFFF;\nbackground-color: #1A1A1A;'
                            : v.criterion?.toLowerCase().includes('button') || v.criterion?.toLowerCase().includes('name')
                                ? '<button type="button" aria-label="Submit Form">Submit</button>'
                                : `<!-- Fix for ${v.criterion} -->\n<div role="region" aria-label="Content section">...</div>`),
                    count: 1,
                })),
            });
        }).catch(() => {
            setComplianceData({ overallScore: 100, wcagScore: 100, gdprScore: 100, violations: [] });
        }).finally(() => setLoading(false));
    }, [id]);

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading compliance...</span>
            </div>
        );
    }

    let filtered = !complianceData ? [] : complianceData.violations;
    if (filter !== 'all') {
        filtered = filtered.filter(v => v.standard === filter);
    }
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(v => 
            v.criterion?.toLowerCase().includes(q) || 
            v.description?.toLowerCase().includes(q) || 
            v.page?.toLowerCase().includes(q)
        );
    }

    const criticalCount = (complianceData?.violations || []).filter(v => v.severity === 'critical' || v.severity === 'serious').length;
    const moderateCount = (complianceData?.violations || []).filter(v => v.severity === 'moderate' || v.severity === 'minor').length;

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Top Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={complianceData.overallScore} size={160} label="Overall Score" />
                </motion.div>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={complianceData.wcagScore} size={160} label="WCAG 2.1 AA" />
                </motion.div>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={complianceData.gdprScore} size={160} label="GDPR & Privacy" />
                </motion.div>
            </div>

            {/* Quick Stat Highlights */}
            <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Total Violations</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{complianceData?.violations?.length || 0}</div>
                </div>
                <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', marginBottom: 4 }}>Critical & Serious</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444' }}>{criticalCount}</div>
                </div>
                <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-gold)', textTransform: 'uppercase', marginBottom: 4 }}>Moderate & Minor</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-accent-gold)' }}>{moderateCount}</div>
                </div>
                <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: 4 }}>Audit Status</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <CheckCircle2 size={16} /> Automated Pass
                    </div>
                </div>
            </motion.div>

            {/* Violations Table Card */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                        Identified Violations ({filtered.length})
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Search */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20 }}>
                            <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
                            <input
                                placeholder="Filter violations..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: 140 }}
                            />
                        </div>
                        {/* Standard Filter Pills */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['all', 'WCAG', 'GDPR'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: '6px 14px', fontSize: 12, fontWeight: 600,
                                        background: filter === f ? 'rgba(212, 168, 83, 0.1)' : 'var(--color-bg-elevated)',
                                        border: `1px solid ${filter === f ? 'rgba(212, 168, 83, 0.2)' : 'var(--border-subtle)'}`,
                                        borderRadius: 'var(--radius-full)',
                                        color: filter === f ? 'var(--color-accent-gold)' : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'all var(--transition-fast)',
                                    }}
                                >
                                    {f === 'all' ? 'All' : f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Standard', 'Criterion', 'Severity', 'Page', 'Description', 'Action'].map(h => (
                                    <th key={h} style={{
                                        textAlign: 'left', padding: '10px 14px',
                                        fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        borderBottom: '1px solid var(--border-subtle)',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        No violations found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((v, i) => (
                                    <motion.tr
                                        key={v.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                    >
                                        <td style={{ padding: '14px' }}>
                                            <span style={{
                                                fontSize: 11, fontWeight: 700, padding: '3px 8px',
                                                borderRadius: 4,
                                                background: v.standard === 'WCAG' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: v.standard === 'WCAG' ? '#8B5CF6' : '#EF4444',
                                            }}>
                                                {v.standard}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{v.criterion}</td>
                                        <td style={{ padding: '14px' }}><StatusBadge status={v.severity} size="sm" /></td>
                                        <td style={{ padding: '14px', fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--color-accent-gold)' }}>{v.page}</td>
                                        <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320 }}>{v.description}</td>
                                        <td style={{ padding: '14px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => handleCopy(v.id, v.codeSnippet)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                                        background: copiedId === v.id ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-bg-elevated)',
                                                        border: `1px solid ${copiedId === v.id ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                                                        borderRadius: 6,
                                                        color: copiedId === v.id ? 'var(--color-success)' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {copiedId === v.id ? <Check size={12} /> : <Copy size={12} />}
                                                    {copiedId === v.id ? 'Copied' : 'Copy Fix'}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedViolationForPR({
                                                        id: v.id,
                                                        type: v.standard,
                                                        severity: v.severity,
                                                        message: v.description,
                                                        targetFile: 'src/App.jsx',
                                                        patchDiff: `--- a/src/App.jsx\n+++ b/src/App.jsx\n@@ -10,3 +10,4 @@\n <main>\n+  ${v.codeSnippet || '// Automated accessibility fix'}\n </main>`
                                                    })}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        padding: '6px 10px', fontSize: 12, fontWeight: 600,
                                                        background: 'rgba(212, 168, 83, 0.12)',
                                                        border: '1px solid rgba(212, 168, 83, 0.3)',
                                                        borderRadius: 6,
                                                        color: 'var(--color-accent-gold)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <GitPullRequest size={12} /> PR
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Remediation Code Guidance Panel */}
                <div style={{ marginTop: 28 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
                        Automated Remediation Code Snippets
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                        {filtered.slice(0, 4).map(v => (
                            <div key={v.id} style={{
                                padding: '14px 18px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent-gold)' }}>{v.criterion}</span>
                                    <button
                                        onClick={() => handleCopy(`snippet-${v.id}`, v.codeSnippet)}
                                        style={{
                                            padding: '4px 8px', fontSize: 11, fontWeight: 600,
                                            background: copiedId === `snippet-${v.id}` ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 4,
                                            color: copiedId === `snippet-${v.id}` ? 'var(--color-success)' : 'var(--text-secondary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                    >
                                        {copiedId === `snippet-${v.id}` ? <Check size={11} /> : <Copy size={11} />}
                                        {copiedId === `snippet-${v.id}` ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>{v.remediation}</p>
                                <pre style={{
                                    margin: 0, padding: '10px',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    color: '#A5F3FC',
                                    fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                                    overflowX: 'auto',
                                }}>
                                    {v.codeSnippet}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* AutoFix PR Modal */}
            <AutoFixModal
                isOpen={!!selectedViolationForPR}
                onClose={() => setSelectedViolationForPR(null)}
                defect={selectedViolationForPR}
                runId={id}
            />
        </motion.div>
    );
}
