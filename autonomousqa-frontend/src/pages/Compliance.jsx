import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Eye, Filter, Loader2 } from 'lucide-react';
import HygieneScoreGauge from '../components/ui/HygieneScoreGauge';
import StatusBadge from '../components/ui/StatusBadge';
import { tests as testsApi } from '../lib/api';

function safePath(url) { try { return new URL(url).pathname || url; } catch { return url; } }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Compliance() {
    const { id } = useParams();
    const [filter, setFilter] = useState('all');
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { document.title = 'Compliance — AutonomousQA'; }, []);

    useEffect(() => {
        testsApi.compliance(id).then(data => {
            setComplianceData({
                overallScore: Math.min(100, data.scores?.overall ?? 0),
                wcagScore: Math.min(100, data.scores?.wcag ?? 0),
                gdprScore: Math.min(100, data.scores?.gdpr ?? 0),
                violations: (data.violations || []).map((v, i) => ({
                    id: v.id || i,
                    standard: v.standard,
                    criterion: v.criterion,
                    severity: v.severity,
                    page: v.pageUrl ? safePath(v.pageUrl) : '/',
                    description: v.description,
                    remediation: v.remediation || 'Review and fix the identified issue',
                    count: 1,
                })),
            });
        }).catch(() => {
            setComplianceData({ overallScore: 100, wcagScore: 100, gdprScore: 100, violations: [] });
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading compliance...</span>
            </div>
        );
    }

    const filtered = !complianceData ? [] : filter === 'all'
        ? complianceData.violations
        : complianceData.violations.filter(v => v.standard === filter);

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={complianceData.overallScore} size={160} label="Overall" />
                </motion.div>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={complianceData.wcagScore} size={160} label="WCAG 2.1 AA" />
                </motion.div>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={complianceData.gdprScore} size={160} label="GDPR" />
                </motion.div>
            </div>

            {/* Violations */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                        Violations ({filtered.length})
                    </h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'WCAG', 'GDPR'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 14px', fontSize: 12, fontWeight: 600,
                                    background: filter === f ? 'rgba(212, 168, 83, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${filter === f ? 'rgba(212, 168, 83, 0.2)' : 'rgba(255,255,255,0.05)'}`,
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

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Standard', 'Criterion', 'Severity', 'Page', 'Description', 'Count'].map(h => (
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
                            {filtered.map((v, i) => (
                                <motion.tr
                                    key={v.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.04 }}
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
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{v.criterion}</td>
                                    <td style={{ padding: '14px' }}><StatusBadge status={v.severity} size="sm" /></td>
                                    <td style={{ padding: '14px', fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>{v.page}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300 }}>{v.description}</td>
                                    <td style={{ padding: '14px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{v.count}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Remediation Panel */}
                <div style={{ marginTop: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                        Remediation Guidance
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filtered.slice(0, 4).map(v => (
                            <div key={v.id} style={{
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.12)',
                                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                            }}>
                                <strong style={{ color: 'var(--color-success)' }}>{v.criterion}:</strong> {v.remediation}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
