import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gauge, AlertTriangle, TrendingDown, Loader2, Zap, Eye, MousePointerClick, Move } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { tests as testsApi } from '../lib/api';
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from '../components/ui/area-chart';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// document.title set inside component below

const vitalConfig = {
    ttfb: { label: 'Time to First Byte', unit: 'ms', icon: Zap, good: 200, mid: 600, desc: 'Server response time — how fast the first byte arrives' },
    lcp: { label: 'Largest Contentful Paint', unit: 's', icon: Eye, good: 2.5, mid: 4.0, desc: 'Time to render the biggest visible element on the page' },
    fid: { label: 'First Input Delay', unit: 'ms', icon: MousePointerClick, good: 100, mid: 300, desc: 'Delay before the page responds to the first user interaction' },
    cls: { label: 'Cumulative Layout Shift', unit: '', icon: Move, good: 0.1, mid: 0.25, desc: 'How much the page layout shifts during load' },
};

function getStatus(key, value) {
    const cfg = vitalConfig[key];
    if (!cfg || value == null) return 'unknown';
    if (value <= cfg.good) return 'good';
    if (value <= cfg.mid) return 'needs-improvement';
    return 'poor';
}

function getStatusColor(status) {
    return status === 'good' ? '#10B981' : status === 'needs-improvement' ? '#F59E0B' : status === 'poor' ? '#EF4444' : 'var(--text-tertiary)';
}

export default function Performance() {
    const { id } = useParams();
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { document.title = 'Performance — AutonomousQA'; }, []);

    useEffect(() => {
        testsApi.performance(id).then(data => {
            // Normalize web vitals — always provide all 4
            const rawVitals = {};
            for (const name of ['TTFB', 'LCP', 'FID', 'CLS']) {
                const v = data.webVitals?.[name];
                const key = name.toLowerCase();
                if (v && v.value != null) {
                    const val = Math.round(v.value * 100) / 100;
                    rawVitals[key] = { value: val, status: getStatus(key, val) };
                } else {
                    rawVitals[key] = null; // will show "N/A"
                }
            }

            // Build per-page data
            const history = Object.entries(data.byPage || {}).map(([url, metrics], idx) => {
                let path;
                try { path = new URL(url).pathname; } catch { path = url; }
                return {
                    date: new Date(Date.now() - (Object.keys(data.byPage).length - idx) * 24 * 60 * 60 * 1000),
                    label: path.length > 20 ? '…' + path.slice(-18) : path,
                    fullPath: path,
                    lcp: Math.round((metrics.LCP?.value || 0) * 100) / 100,
                    fid: Math.round((metrics.FID?.value || 0) * 100) / 100,
                    cls: Math.round((metrics.CLS?.value || 0) * 1000) / 1000,
                    ttfb: Math.round((metrics.TTFB?.value || 0) * 100) / 100,
                };
            });

            // Compute page scores (percentage of good metrics per page)
            const pageScores = history.map(h => {
                let good = 0, total = 0;
                if (h.ttfb > 0) { total++; if (h.ttfb <= 200) good++; }
                if (h.lcp > 0) { total++; if (h.lcp <= 2.5) good++; }
                if (h.fid > 0) { total++; if (h.fid <= 100) good++; }
                if (h.cls > 0) { total++; if (h.cls <= 0.1) good++; }
                const score = total > 0 ? Math.round((good / total) * 100) : 0;
                return { page: h.fullPath || h.label, score };
            });

            setPerformanceData({ webVitals: rawVitals, history, pageScores, totalPages: history.length });
        }).catch(() => {
            setPerformanceData({ webVitals: {}, history: [], pageScores: [], totalPages: 0 });
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading performance...</span>
            </div>
        );
    }

    const vitals = performanceData?.webVitals || {};

    // Count statuses for summary
    const statusCounts = { good: 0, 'needs-improvement': 0, poor: 0, unknown: 0 };
    Object.values(vitals).forEach(v => {
        const s = v ? v.status : 'unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const overallScore = Math.round(((statusCounts.good * 100) + (statusCounts['needs-improvement'] * 50)) / 4);

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Web Vitals Cards — always show all 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {['ttfb', 'lcp', 'fid', 'cls'].map((key, i) => {
                    const cfg = vitalConfig[key];
                    const Icon = cfg.icon;
                    const vital = vitals[key];
                    const hasValue = vital && vital.value != null;
                    const status = hasValue ? vital.status : 'unknown';
                    const color = getStatusColor(status);

                    return (
                        <motion.div key={key} variants={item} className="glass-card" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {key.toUpperCase()}
                                </div>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    background: `${color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={15} style={{ color }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: hasValue ? color : 'var(--text-tertiary)', letterSpacing: '-0.03em' }}>
                                    {hasValue ? vital.value : 'N/A'}
                                </span>
                                {hasValue && cfg.unit && (
                                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 }}>{cfg.unit}</span>
                                )}
                            </div>

                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{cfg.label}</div>

                            <StatusBadge status={status === 'unknown' ? 'pending' : status} size="sm" />

                            {/* Threshold guide */}
                            <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', gap: 10 }}>
                                <span>Good: ≤{cfg.good}{cfg.unit}</span>
                                <span>Mid: ≤{cfg.mid}{cfg.unit}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Overall Performance Score Bar */}
            <motion.div variants={item} className="glass-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Gauge size={18} style={{ color: 'var(--color-accent-gold)' }} />
                        <span style={{ fontSize: 15, fontWeight: 700 }}>Overall Performance Score</span>
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: overallScore >= 75 ? '#10B981' : overallScore >= 50 ? '#F59E0B' : '#EF4444' }}>
                        {overallScore}%
                    </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallScore}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            height: '100%', borderRadius: 4,
                            background: overallScore >= 75 ? 'linear-gradient(90deg, #10B981, #34D399)' : overallScore >= 50 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{statusCounts.good} Good</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{statusCounts['needs-improvement']} Needs Work</span>
                    <span style={{ color: '#EF4444', fontWeight: 600 }}>{statusCounts.poor} Poor</span>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{statusCounts.unknown} No Data</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>{performanceData.totalPages} pages analyzed</span>
                </div>
            </motion.div>

            {/* Trend Chart */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Performance by Page</h3>
                {performanceData.history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No per-page data available.</div>
                ) : (
                    <AreaChart data={performanceData.history} aspectRatio="2.5 / 1" margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
                        <Grid horizontal numTicksRows={4} />
                        <Area
                            dataKey="lcp"
                            fill="var(--chart-line-primary)"
                            fillOpacity={0.2}
                            stroke="var(--chart-line-primary)"
                            fadeEdges
                        />
                        <Area
                            dataKey="ttfb"
                            fill="var(--chart-line-secondary)"
                            fillOpacity={0.2}
                            stroke="var(--chart-line-secondary)"
                            fadeEdges
                        />
                        <Area
                            dataKey="fid"
                            fill="#34D399"
                            fillOpacity={0.15}
                            stroke="#34D399"
                            fadeEdges
                        />
                        <XAxis numTicks={4} />
                        <ChartTooltip
                            rows={(point) => [
                                { color: 'var(--chart-line-primary)', label: 'LCP', value: `${point.lcp}s` },
                                { color: 'var(--chart-line-secondary)', label: 'TTFB', value: `${point.ttfb}ms` },
                                { color: '#34D399', label: 'FID', value: `${point.fid}ms` },
                            ]}
                        />
                    </AreaChart>
                )}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Page Health Scores */}
                <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Page Health Scores</h3>
                    {performanceData.pageScores.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>No page data available.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {performanceData.pageScores.map((ps, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 130, fontSize: 11, color: 'var(--text-secondary)',
                                        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
                                    }} title={ps.page}>
                                        {ps.page.length > 18 ? '…' + ps.page.slice(-16) : ps.page}
                                    </div>
                                    <div style={{ flex: 1, height: 14, position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${ps.score}%` }}
                                            transition={{ delay: i * 0.06, duration: 0.6 }}
                                            style={{
                                                height: '100%', borderRadius: 4,
                                                background: ps.score >= 75 ? '#10B981' : ps.score >= 50 ? '#F59E0B' : '#EF4444',
                                                opacity: 0.75,
                                            }}
                                        />
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, width: 36, textAlign: 'right', flexShrink: 0,
                                        color: ps.score >= 75 ? '#10B981' : ps.score >= 50 ? '#F59E0B' : '#EF4444',
                                    }}>
                                        {ps.score}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Recommendations */}
                <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                        Recommendations
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {vitals.ttfb && vitals.ttfb.status !== 'good' && (
                            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #F59E0B' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Slow Server Response</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>TTFB is {vitals.ttfb.value}ms (target: ≤200ms). Consider server caching, CDN, or upgrading hosting.</div>
                            </div>
                        )}
                        {vitals.lcp && vitals.lcp.status !== 'good' && (
                            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid #EF4444' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Large Content Slow</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>LCP is {vitals.lcp.value}s (target: ≤2.5s). Optimize images, use lazy loading, reduce render-blocking resources.</div>
                            </div>
                        )}
                        {vitals.cls && vitals.cls.status !== 'good' && (
                            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #F59E0B' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Layout Instability</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CLS is {vitals.cls.value} (target: ≤0.1). Add width/height to images, avoid injecting content above the fold.</div>
                            </div>
                        )}
                        {vitals.fid && vitals.fid.status !== 'good' && (
                            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid #EF4444' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Slow Interactivity</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>FID is {vitals.fid.value}ms (target: ≤100ms). Reduce JS execution time, break long tasks, defer non-critical scripts.</div>
                            </div>
                        )}
                        {statusCounts.good === 4 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#10B981', fontWeight: 600 }}>
                                All vitals passing — great performance! 🎉
                            </div>
                        )}
                        {statusCounts.unknown === 4 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                                No metrics available to generate recommendations.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
