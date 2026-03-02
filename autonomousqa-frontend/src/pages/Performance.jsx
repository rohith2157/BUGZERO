import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gauge, AlertTriangle, TrendingDown, Loader2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { tests as testsApi } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const vitalInfo = {
    lcp: { label: 'Largest Contentful Paint', desc: 'Time to render largest visible element' },
    fid: { label: 'First Input Delay', desc: 'Time to first interactive response' },
    cls: { label: 'Cumulative Layout Shift', desc: 'Visual stability during load' },
    ttfb: { label: 'Time to First Byte', desc: 'Server response time' },
    LCP: { label: 'Largest Contentful Paint', desc: 'Time to render largest visible element' },
    FID: { label: 'First Input Delay', desc: 'Time to first interactive response' },
    CLS: { label: 'Cumulative Layout Shift', desc: 'Visual stability during load' },
    TTFB: { label: 'Time to First Byte', desc: 'Server response time' },
};

export default function Performance() {
    const { id } = useParams();
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        testsApi.performance(id).then(data => {
            // Normalize web vitals
            const webVitals = {};
            const vitalNames = ['LCP', 'TTFB', 'FID', 'CLS'];
            for (const name of vitalNames) {
                const v = data.webVitals?.[name];
                if (v) {
                    const key = name.toLowerCase();
                    const thresholds = { lcp: 2.5, fid: 100, cls: 0.1, ttfb: 200 };
                    const units = { lcp: 's', fid: 'ms', cls: '', ttfb: 'ms' };
                    const val = typeof v.value === 'number' ? Math.round(v.value * 100) / 100 : v.value;
                    webVitals[key] = {
                        value: val,
                        unit: units[key] || '',
                        status: v.rating || (val <= thresholds[key] ? 'good' : 'needs-improvement'),
                        threshold: thresholds[key],
                    };
                }
            }

            // Build per-page data as "history" points
            const history = Object.entries(data.byPage || {}).map(([url, metrics]) => {
                let path;
                try { path = new URL(url).pathname; } catch { path = url; }
                return {
                    date: path,
                    lcp: metrics.LCP?.value || 0,
                    fid: metrics.FID?.value || 0,
                    cls: metrics.CLS?.value || 0,
                    ttfb: metrics.TTFB?.value || 0,
                };
            });

            setPerformanceData({ webVitals, history, waterfall: [], regressions: [] });
        }).catch(() => {
            setPerformanceData({ webVitals: {}, history: [], waterfall: [], regressions: [] });
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

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Web Vitals Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {Object.keys(vitals).length === 0 && (
                    <motion.div variants={item} className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
                        <div style={{ color: 'var(--text-tertiary)' }}>No performance metrics recorded for this test.</div>
                    </motion.div>
                )}
                {Object.entries(vitals).map(([key, vital], i) => {
                    const info = vitalInfo[key] || { label: key, desc: '' };
                    const color = vital.status === 'good' ? '#10B981' : vital.status === 'needs-improvement' ? '#F59E0B' : '#EF4444';
                    return (
                        <motion.div key={key} variants={item} className="glass-card" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                {key.toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: '-0.03em' }}>
                                    {vital.value}
                                </span>
                                <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 }}>{vital.unit}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{info.label}</div>
                            <StatusBadge status={vital.status} size="sm" />
                        </motion.div>
                    );
                })}
            </div>

            {/* Trend Chart */}
            <motion.div variants={item} className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Performance by Page</h3>
                {performanceData.history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No per-page data available.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={performanceData.history}>
                            <defs>
                                <linearGradient id="lcpGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D4A853" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#D4A853" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="ttfbGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{
                                background: 'var(--color-bg-elevated)', border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)', fontSize: 13,
                            }} />
                            <Area type="monotone" dataKey="lcp" stroke="#D4A853" fill="url(#lcpGrad)" strokeWidth={2} dot={false} name="LCP (s)" />
                            <Line type="monotone" dataKey="fid" stroke="#34D399" strokeWidth={2} dot={false} name="FID (ms)" />
                            <Area type="monotone" dataKey="ttfb" stroke="#A78BFA" fill="url(#ttfbGrad)" strokeWidth={2} dot={false} name="TTFB (ms)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Waterfall */}
                <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Resource Waterfall</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {performanceData.waterfall.map((res, i) => {
                            const maxDur = Math.max(...performanceData.waterfall.map(r => r.start + r.duration));
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 120, fontSize: 11, color: 'var(--text-secondary)',
                                        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
                                    }}>
                                        {res.resource}
                                    </div>
                                    <div style={{ flex: 1, height: 18, position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(res.duration / maxDur) * 100}%` }}
                                            transition={{ delay: i * 0.08, duration: 0.6 }}
                                            style={{
                                                position: 'absolute',
                                                left: `${(res.start / maxDur) * 100}%`,
                                                height: '100%',
                                                background: res.color,
                                                borderRadius: 3,
                                                opacity: 0.7,
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", width: 50, textAlign: 'right', flexShrink: 0 }}>
                                        {res.duration}ms
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Regressions */}
                <motion.div variants={item} className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                        Regression Alerts
                    </h3>
                    {performanceData.regressions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                            No regressions detected 🎉
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {performanceData.regressions.map((reg, i) => (
                                <div key={i} style={{
                                    padding: '16px',
                                    borderRadius: 'var(--radius-md)',
                                    background: reg.severity === 'critical' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                                    borderLeft: `3px solid ${reg.severity === 'critical' ? '#EF4444' : '#F59E0B'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{reg.metric}</span>
                                        <StatusBadge status={reg.severity} size="sm" />
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", marginBottom: 6 }}>
                                        {reg.page}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>{reg.before}</span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                                        <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>{reg.after}</span>
                                        <span style={{
                                            color: '#EF4444', fontWeight: 700, fontSize: 12,
                                            padding: '2px 6px', background: 'rgba(239,68,68,0.1)', borderRadius: 4,
                                        }}>
                                            {reg.change}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
