import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bug, Shield, Gauge, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/ui/KPICard';
import StatusBadge from '../components/ui/StatusBadge';
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from '../components/ui/area-chart';
import { kpiData as mockKpi, hygieneHistory as mockHistory, recentRuns as mockRuns } from '../data/mockData';
import { tests as testsApi } from '../lib/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [kpiData, setKpiData] = useState({ totalRuns: 0, avgHygieneScore: 0, totalDefects: 0, complianceScore: 0, complianceChange: null, runsChange: null, hygieneChange: null, defectsChange: null });
    const [hygieneHistory, setHygieneHistory] = useState([]);
    const [recentRuns, setRecentRuns] = useState([]);
    const [quickUrl, setQuickUrl] = useState('');

    useEffect(() => { document.title = 'Dashboard — AutonomousQA'; }, []);

    useEffect(() => {
        // Fetch real test runs from API, fall back to mock
        testsApi.list({ limit: 20 }).then((data) => {
            if (data.testRuns && data.testRuns.length > 0) {
                const runs = data.testRuns.map((r) => ({
                    id: r.id,
                    url: r.url || '',
                    status: r.status,
                    score: r.overallScore,
                    defects: r.defectCount || r._count?.defects || 0,
                    pages: r.totalPages || r._count?.pages || 0,
                    duration: r.duration || '—',
                    date: r.createdAt?.split('T')[0] || '',
                    pagesDiscovered: r.totalPages || 0,
                }));
                setRecentRuns(runs.slice(0, 8));

                // Compute KPIs from real data
                const totalRuns = data.total || runs.length;
                const completedRuns = runs.filter((r) => r.score != null);
                const avgScore = completedRuns.length > 0
                    ? Math.min(100, completedRuns.reduce((s, r) => s + r.score, 0) / completedRuns.length)
                    : 0;
                const totalDefects = runs.reduce((s, r) => s + r.defects, 0);

                setKpiData((prev) => ({
                    ...prev,
                    totalRuns,
                    avgHygieneScore: Math.round(avgScore * 10) / 10 || prev.avgHygieneScore,
                    totalDefects: totalDefects || prev.totalDefects,
                    complianceScore: Math.round(avgScore * 10) / 10 || prev.complianceScore,
                    complianceChange: null,
                    runsChange: null,
                    hygieneChange: null,
                    defectsChange: null,
                }));

                // Build hygiene history from completed runs (real data)
                const completedWithScores = runs
                    .filter(r => r.score != null && r.date)
                    .sort((a, b) => a.date.localeCompare(b.date));
                if (completedWithScores.length > 0) {
                    setHygieneHistory(completedWithScores.map(r => ({
                        date: r.date,
                        score: Math.min(100, Math.round(r.score)),
                    })));
                }
            }
        }).catch(() => {
            // Error silently, leave empty
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Convert hygieneHistory to Date objects for the visx chart
    const chartData = hygieneHistory.map(h => ({
        date: new Date(h.date),
        score: h.score,
    }));

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* KPI Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
                marginBottom: 28,
            }}>
                <KPICard icon={Activity} label="Total Test Runs" value={kpiData.totalRuns} change={kpiData.runsChange} delay={0} />
                <KPICard icon={Gauge} label="Avg Hygiene Score" value={kpiData.avgHygieneScore} change={kpiData.hygieneChange} suffix="" delay={0.1} />
                <KPICard icon={Bug} label="Total Defects Found" value={kpiData.totalDefects} change={kpiData.defectsChange} delay={0.2} />
                <KPICard icon={Shield} label="Compliance Score" value={kpiData.complianceScore} change={kpiData.complianceChange} suffix="%" delay={0.3} />
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                {/* Hygiene Trend Chart */}
                <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Hygiene Score Trend</h2>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Last 60 days</span>
                    </div>
                    <AreaChart data={chartData} aspectRatio="2.2 / 1" margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
                        <Grid horizontal numTicksRows={4} />
                        <Area
                            dataKey="score"
                            fill="var(--chart-line-primary)"
                            fillOpacity={0.25}
                            stroke="var(--chart-line-primary)"
                            fadeEdges
                        />
                        <XAxis numTicks={4} />
                        <ChartTooltip
                            rows={(point) => [
                                {
                                    color: 'var(--chart-line-primary)',
                                    label: 'Score',
                                    value: point.score != null ? point.score : '—',
                                },
                            ]}
                        />
                    </AreaChart>
                </motion.div>

                {/* Quick Start */}
                <motion.div variants={item} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Quick Start</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Enter a URL and let the AI test it autonomously.
                    </p>
                    <div style={{
                        display: 'flex', gap: 10, marginBottom: 20,
                    }}>
                        <input
                            type="url"
                            placeholder="https://your-app.com"
                            value={quickUrl}
                            onChange={(e) => setQuickUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && quickUrl) navigate('/tests/new', { state: { url: quickUrl } }); }}
                            style={{
                                flex: 1, padding: '12px 16px', fontSize: 14,
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color var(--transition-fast)',
                                fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-gold)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                        />
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate('/tests/new')}
                            style={{
                                padding: '12px 24px', fontWeight: 600, fontSize: 14,
                                background: 'var(--gradient-primary)', color: '#fff',
                                border: 'none', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 0 20px rgba(212,168,83,0.15)',
                                flexShrink: 0,
                            }}
                        >
                            Test Now <ArrowRight size={16} />
                        </motion.button>
                    </div>

                    {/* Recent quick links */}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Recent URLs
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        {recentRuns.slice(0, 3).map(run => (
                            <div
                                key={run.id}
                                onClick={() => navigate(`/tests/${run.id}/report`)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)',
                                    border: '1px solid transparent',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(212, 168, 83, 0.04)';
                                    e.currentTarget.style.borderColor = 'rgba(212,168,83,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>
                                    {(run.url || '').replace('https://', '')}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <StatusBadge status={run.status} size="sm" />
                                    <ExternalLink size={13} style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent Test Runs Table */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Test Runs</h2>
                    <button
                        onClick={() => navigate('/history')}
                        style={{
                            fontSize: 13, color: 'var(--text-accent)', fontWeight: 500,
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        View All <ArrowRight size={14} />
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['URL', 'Status', 'Score', 'Defects', 'Pages', 'Duration', 'Date'].map(h => (
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
                            {recentRuns.map((run, i) => (
                                <motion.tr
                                    key={run.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(`/tests/${run.id}/report`)}
                                    style={{ cursor: 'pointer', transition: 'background var(--transition-fast)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 168, 83, 0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px', fontSize: 13, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--color-accent-gold)' }}>
                                        {(run.url || '').replace('https://', '') || '—'}
                                    </td>
                                    <td style={{ padding: '14px' }}><StatusBadge status={run.status} size="sm" /></td>
                                    <td style={{
                                        padding: '14px', fontSize: 14, fontWeight: 700,
                                        color: run.score ? (run.score >= 85 ? '#10B981' : run.score >= 70 ? '#F59E0B' : '#EF4444') : 'var(--text-tertiary)',
                                    }}>
                                        {run.score != null ? run.score : '—'}
                                    </td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>{run.defects}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>{run.pages}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>{run.duration}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-tertiary)' }}>{run.date}</td>
                                </motion.tr>
                            ))}
                            {recentRuns.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                                        No test runs yet. Start your first test above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div >
    );
}
