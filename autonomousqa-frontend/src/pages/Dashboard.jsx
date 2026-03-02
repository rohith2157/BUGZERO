import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, Bug, Shield, Gauge, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/ui/KPICard';
import StatusBadge from '../components/ui/StatusBadge';
import { kpiData as mockKpi, hygieneHistory as mockHistory, recentRuns as mockRuns } from '../data/mockData';
import { tests as testsApi } from '../lib/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.[0]) {
        return (
            <div style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 13,
            }}>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 700, color: 'var(--color-accent-gold)' }}>Score: {payload[0].value}</div>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [kpiData, setKpiData] = useState(mockKpi);
    const [hygieneHistory, setHygieneHistory] = useState(mockHistory);
    const [recentRuns, setRecentRuns] = useState(mockRuns);

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
                    ? completedRuns.reduce((s, r) => s + r.score, 0) / completedRuns.length
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
                        score: Math.round(r.score),
                    })));
                }
            }
        }).catch(() => {
            // Keep mock data
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={hygieneHistory}>
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D4A853" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#D4A853" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[60, 100]} tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="score" stroke="#D4A853" strokeWidth={2} fill="url(#scoreGradient)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
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
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}}
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
                                    {run.url.replace('https://', '')}
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
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}}
                                >
                            <td style={{ padding: '14px', fontSize: 13, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--color-accent-gold)' }}>
                                {run.url.replace('https://', '')}
                            </td>
                            <td style={{ padding: '14px' }}><StatusBadge status={run.status} size="sm" /></td>
                            <td style={{
                                padding: '14px', fontSize: 14, fontWeight: 700,
                                color: run.score ? (run.score >= 85 ? '#10B981' : run.score >= 70 ? '#F59E0B' : '#EF4444') : 'var(--text-tertiary)',
                            }}>
                                {run.score || '—'}
                            </td>
                            <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>{run.defects}</td>
                            <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>{run.pages}</td>
                            <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>{run.duration}</td>
                            <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-tertiary)' }}>{run.date}</td>
                        </motion.tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
        </motion.div >
    );
}
