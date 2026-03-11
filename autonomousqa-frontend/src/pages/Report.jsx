import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileJson, FileText, FileSpreadsheet, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import HygieneScoreGauge from '../components/ui/HygieneScoreGauge';
import StatusBadge from '../components/ui/StatusBadge';
import { severityConfig, defectTypeColors } from '../data/mockData';
import { tests as testsApi } from '../lib/api';

import { BarChart, Bar, BarYAxis, Grid, ChartTooltip } from '../components/ui/bar-chart';
import DatabaseWithRestApi from '../components/ui/database-with-rest-api';

function safePath(url) { try { return new URL(url).pathname || url; } catch { return url; } }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Report() {
    const { id } = useParams();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('visual');

    useEffect(() => { document.title = 'Test Report — AutonomousQA'; }, []);

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
                // Avoid division by zero if totalDefects is 0. If 0 defects, score is 100.
                if (totalDefects === 0) {
                    scoreBreakdown[cat] = 100;
                } else {
                    scoreBreakdown[cat] = Math.max(0, Math.round(100 - (count / totalDefects) * 100));
                }
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
                                    
                                    // Prevent CSV Formula Injection
                                    const sanitizeCsv = (val) => {
                                        let str = String(val).replace(/"/g, '""');
                                        if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
                                        return `"${str}"`;
                                    };

                                    reportData.defects.forEach(d => rows.push([d.type, d.severity, d.page, d.message, d.fix]));
                                    const csv = rows.map(r => r.map(sanitizeCsv).join(',')).join('\n');
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

            {/* Score Section Overview */}
            <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Score Overview</h3>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
                    <button
                        onClick={() => setViewMode('visual')}
                        style={{
                            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: 'none', transition: 'all 0.2s',
                            background: viewMode === 'visual' ? 'var(--color-accent-gold)' : 'transparent',
                            color: viewMode === 'visual' ? '#000' : 'var(--text-secondary)',
                        }}
                    >
                        Visual
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        style={{
                            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: 'none', transition: 'all 0.2s',
                            background: viewMode === 'chart' ? 'var(--color-accent-gold)' : 'transparent',
                            color: viewMode === 'chart' ? '#000' : 'var(--text-secondary)',
                        }}
                    >
                        Chart
                    </button>
                </div>
            </motion.div>

            {viewMode === 'visual' ? (
                <div style={{ marginBottom: 24 }}>
                    <motion.div variants={item} className="glass-card" style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <DatabaseWithRestApi
                            overallScore={reportData.overallScore}
                            categories={scoreData.map(s => ({ label: s.name, score: s.score, color: s.color }))}
                            title="Aggregated Hygiene Score Connection"
                            lightColor="var(--color-accent-gold)"
                        />
                    </motion.div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>
                    <motion.div variants={item} className="glass-card" style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HygieneScoreGauge score={reportData.overallScore} size={200} />
                    </motion.div>

                    <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Score Breakdown</h3>
                        <BarChart
                            data={scoreData}
                            xDataKey="name"
                            orientation="horizontal"
                            aspectRatio="2.5 / 1"
                            barGap={0.3}
                            yMax={100}
                            margin={{ top: 10, right: 50, bottom: 10, left: 100 }}
                        >
                            <Grid vertical numTicksColumns={5} fadeVertical={false} horizontal={false} strokeDasharray="2,4" />
                            <Bar dataKey="score" fillKey="color" fill="#10B981" lineCap={4} />
                            <BarYAxis />
                            <ChartTooltip
                                showCrosshair={false}
                                showDots={false}
                                rows={(point) => [
                                    {
                                        color: point.score >= 85 ? '#10B981' : point.score >= 70 ? '#F59E0B' : '#EF4444',
                                        label: String(point.name),
                                        value: `${point.score}/100`,
                                    },
                                ]}
                            />
                        </BarChart>
                    </motion.div>
                </div>
            )}

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
                    {reportData.defects.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10 }}>
                            No defects found. Excellent job!
                        </div>
                    ) : (
                        reportData.defects.map((defect, i) => {
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
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
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
                                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                                            {defect.page}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 8, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                        {defect.message}
                                    </div>
                                    <div style={{
                                        fontSize: 12, color: 'var(--text-secondary)',
                                        padding: '10px 12px',
                                        background: 'rgba(16, 185, 129, 0.06)',
                                        border: '1px solid rgba(16, 185, 129, 0.15)',
                                        borderRadius: 'var(--radius-sm)',
                                        lineHeight: 1.5,
                                        wordBreak: 'break-word'
                                    }}>
                                        💡 <strong>Fix:</strong> {defect.fix}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
