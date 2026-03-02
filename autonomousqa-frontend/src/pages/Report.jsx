import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileJson, FileText, FileSpreadsheet, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import HygieneScoreGauge from '../components/ui/HygieneScoreGauge';
import StatusBadge from '../components/ui/StatusBadge';
import { severityConfig, defectTypeColors } from '../data/mockData';
import { tests as testsApi } from '../lib/api';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function safePath(url) { try { return new URL(url).pathname || url; } catch { return url; } }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Report() {
    const { id } = useParams();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        testsApi.get(id).then(({ testRun }) => {
            // Build score breakdown from page scores by type
            const scoresByType = {};
            (testRun.pages || []).forEach(p => {
                const t = p.pageType || 'other';
                if (!scoresByType[t]) scoresByType[t] = [];
                scoresByType[t].push(p.hygieneScore || 0);
            });

            // Build category scores from defects
            const defectsByType = {};
            (testRun.defects || []).forEach(d => {
                const t = d.type || 'Other';
                defectsByType[t] = (defectsByType[t] || 0) + 1;
            });
            const totalDefects = testRun.defects?.length || 0;
            const categories = ['Accessibility', 'Performance', 'SEO', 'Functional', 'Compliance'];
            const scoreBreakdown = {};
            categories.forEach(cat => {
                const count = defectsByType[cat] || 0;
                scoreBreakdown[cat] = Math.max(0, Math.round(100 - (count / Math.max(totalDefects, 1)) * 100));
            });

            // Build heatmap from pages
            const heatmapData = (testRun.pages || []).map(p => {
                const pageDefects = (testRun.defects || []).filter(d => d.pageId === p.id).length;
                const score = Math.min(100, Math.round(p.hygieneScore || 0));
                return {
                    page: safePath(p.url),
                    score,
                    defects: pageDefects,
                    risk: score < 70 ? 'high' : score < 85 ? 'medium' : 'low',
                };
            });

            setReportData({
                runId: testRun.id,
                url: testRun.url,
                overallScore: Math.min(100, Math.round(testRun.overallScore || 0)),
                totalDefects,
                totalPages: testRun.totalPages || testRun.pages?.length || 0,
                duration: testRun.duration || '—',
                date: testRun.createdAt?.split('T')[0] || '',
                scoreBreakdown,
                defects: (testRun.defects || []).map(d => ({
                    id: d.id,
                    page: d.pageUrl ? safePath(d.pageUrl) : '/',
                    type: d.type,
                    severity: d.severity,
                    message: d.message,
                    fix: d.fix || 'Review and fix the identified issue',
                })),
                heatmapData,
            });
        }).catch(() => {
            setReportData(null);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading report...</span>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
                Test report not found.
            </div>
        );
    }

    const scoreData = Object.entries(reportData.scoreBreakdown).map(([key, val]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        score: val,
        color: val >= 85 ? '#10B981' : val >= 70 ? '#F59E0B' : '#EF4444',
    }));

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Header */}
            <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Test Report</h2>
                    <div style={{ fontSize: 13, color: 'var(--color-accent-gold)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>
                        {reportData.url} • {reportData.date} • {reportData.duration}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { icon: FileText, label: 'PDF' },
                        { icon: FileJson, label: 'JSON' },
                        { icon: FileSpreadsheet, label: 'CSV' },
                    ].map(({ icon: Icon, label }) => (
                        <motion.button
                            key={label}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (label === 'JSON') {
                                    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report-${id}.json`; a.click();
                                } else if (label === 'CSV') {
                                    const rows = [['Type', 'Severity', 'Page', 'Message', 'Fix']];
                                    reportData.defects.forEach(d => rows.push([d.type, d.severity, d.page, d.message, d.fix]));
                                    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report-${id}.csv`; a.click();
                                }
                            }}
                            style={{
                                padding: '8px 14px', fontSize: 12, fontWeight: 600,
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 8,
                                color: 'var(--text-secondary)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            <Icon size={14} /> {label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Score Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>
                <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HygieneScoreGauge score={reportData.overallScore} size={200} />
                </motion.div>

                <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Score Breakdown</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreData} layout="vertical">
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-elevated)', border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)', fontSize: 13,
                                }}
                            />
                            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
                                {scoreData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Risk Heatmap */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Page Risk Heatmap</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 10,
                }}>
                    {reportData.heatmapData.map((page) => {
                        const riskColor = page.risk === 'high' ? '#EF4444' : page.risk === 'medium' ? '#F59E0B' : '#10B981';
                        return (
                            <motion.div
                                key={page.page}
                                whileHover={{ scale: 1.04, y: -2 }}
                                style={{
                                    padding: '16px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${riskColor}08`,
                                    border: `1px solid ${riskColor}25`,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <div style={{ fontSize: 24, fontWeight: 800, color: riskColor, marginBottom: 4 }}>{page.score}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", marginBottom: 6 }}>
                                    {page.page}
                                </div>
                                <div style={{
                                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                    color: riskColor, letterSpacing: '0.05em',
                                }}>
                                    {page.defects} defects
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Defects List */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>
                    Defects ({reportData.defects.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reportData.defects.map((defect, i) => {
                        const sev = severityConfig[defect.severity];
                        return (
                            <motion.div
                                key={defect.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    padding: '18px',
                                    borderRadius: 10,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderLeft: `3px solid ${sev?.color || '#64748B'}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <StatusBadge status={defect.severity} size="sm" />
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                            borderRadius: 4,
                                            background: `${defectTypeColors[defect.type] || '#64748B'}14`,
                                            color: defectTypeColors[defect.type] || '#64748B',
                                        }}>
                                            {defect.type}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>
                                        {defect.page}
                                    </span>
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}>
                                    {defect.message}
                                </div>
                                <div style={{
                                    fontSize: 12, color: 'var(--text-secondary)',
                                    padding: '10px 12px',
                                    background: 'rgba(16, 185, 129, 0.06)',
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                    borderRadius: 'var(--radius-sm)',
                                    lineHeight: 1.5,
                                }}>
                                    💡 <strong>Fix:</strong> {defect.fix}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}
