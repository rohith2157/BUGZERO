import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bug, Clock, Globe, Loader2, CheckCircle2, AlertTriangle, XCircle, StopCircle } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { tests as testsApi } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';

function safePath(url) { try { return new URL(url).pathname || url; } catch { return url; } }

export default function LiveTest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pollRef = useRef(null);
    const elapsedRef = useRef(null);
    const [elapsed, setElapsed] = useState('—');

    const fetchData = useCallback(() => {
        testsApi.get(id).then(({ testRun }) => {
            const pages = (testRun.pages || []).map(p => ({
                url: safePath(p.url),
                type: p.pageType || 'Unknown',
                status: p.status === 'tested' ? 'tested' : 'queued',
                score: p.hygieneScore ? Math.min(100, Math.round(p.hygieneScore)) : null,
            }));
            const defects = (testRun.defects || []).map(d => ({
                id: d.id,
                page: d.pageUrl ? safePath(d.pageUrl) : '/',
                type: d.type,
                severity: d.severity,
                message: d.message,
                time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString() : '',
            }));

            const totalPages = testRun.totalPages || pages.length || 1;
            const testedPages = testRun.testedPages || pages.filter(p => p.status === 'tested').length;
            const progress = totalPages > 0 ? Math.round((testedPages / totalPages) * 100) : 0;

            setData({
                url: testRun.url,
                status: testRun.status,
                totalPages,
                testedPages,
                defectsFound: testRun.defectCount || defects.length,
                duration: testRun.duration || '—',
                startedAt: testRun.startedAt,
                progress: testRun.status === 'completed' ? 100 : progress,
                pagesDiscovered: pages,
                liveDefects: defects,
                overallScore: testRun.overallScore,
            });

            // Stop polling if test is done
            if (['completed', 'failed', 'cancelled'].includes(testRun.status) && pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        }).catch((err) => { setError(err.message || 'Failed to load test'); }).finally(() => setLoading(false));
    }, [id]);

    // WebSocket for real-time updates
    const { connected, cancel } = useWebSocket(id, {
        onPageComplete: () => fetchData(),
        onDefectFound: () => fetchData(),
        onComplete: () => fetchData(),
        onFailed: () => fetchData(),
        onCancelled: () => fetchData(),
    });

    useEffect(() => {
        fetchData();
        // Poll every 3 seconds for live updates
        pollRef.current = setInterval(fetchData, 3000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (elapsedRef.current) clearInterval(elapsedRef.current);
        };
    }, [id, fetchData]);

    // Live elapsed timer
    useEffect(() => {
        if (data?.startedAt && (data.status === 'running' || data.status === 'queued')) {
            const tick = () => {
                const secs = Math.round((Date.now() - new Date(data.startedAt).getTime()) / 1000);
                setElapsed(`${Math.floor(secs / 60)}m ${secs % 60}s`);
            };
            tick();
            elapsedRef.current = setInterval(tick, 1000);
            return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
        } else if (data?.duration && data.duration !== '—') {
            setElapsed(data.duration);
        }
    }, [data?.startedAt, data?.status, data?.duration]);

    const getSeverityColor = (s) => {
        if (s === 'critical') return '#EF4444';
        if (s === 'major') return '#F97316';
        if (s === 'minor') return '#EAB308';
        return '#F59E0B';
    };

    const getStatusIcon = () => {
        if (data?.status === 'completed') return <CheckCircle2 size={20} style={{ color: '#10B981' }} />;
        if (data?.status === 'failed') return <XCircle size={20} style={{ color: '#EF4444' }} />;
        if (data?.status === 'cancelled') return <StopCircle size={20} style={{ color: '#64748B' }} />;
        return <Loader2 size={20} style={{ color: 'var(--color-accent-gold)', animation: 'spin-slow 2s linear infinite' }} />;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading test...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
                {error ? `Error: ${error}` : 'Test not found.'}
            </div>
        );
    }

    const isRunning = data.status === 'running' || data.status === 'queued';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '24px', marginBottom: 20 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 10,
                            background: 'rgba(212, 168, 83, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {getStatusIcon()}
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{isRunning ? 'Test in Progress' : `Test ${data.status === 'completed' ? 'Complete' : data.status}`}</div>
                            <div style={{ fontSize: 13, color: 'var(--color-accent-gold)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>{data.url}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <StatusBadge status={data.status} />
                        {isRunning && (
                            <button onClick={() => { cancel(); testsApi.cancel(id).catch(() => { }); }} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', cursor: 'pointer' }}>Cancel</button>
                        )}
                        {data.status === 'completed' && (
                            <button onClick={() => navigate(`/tests/${id}/report`)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(212,168,83,0.12)', border: '1px solid rgba(212,168,83,0.25)', borderRadius: 8, color: 'var(--color-accent-gold)', cursor: 'pointer' }}>View Report</button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                        <span>Progress</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-accent-gold)' }}>{data.progress}%</span>
                    </div>
                    <div style={{
                        height: 5, borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden',
                    }}>
                        <motion.div
                            animate={{ width: `${data.progress}%` }}
                            transition={{ duration: 0.5 }}
                            style={{
                                height: '100%', borderRadius: 3,
                                background: 'linear-gradient(90deg, var(--color-accent-gold), var(--color-accent-gold-bright))',
                                boxShadow: '0 0 10px rgba(212,168,83,0.3)',
                            }}
                        />
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
                    {[
                        { icon: Globe, label: 'Pages Found', value: data.totalPages, color: 'var(--color-accent-gold)' },
                        { icon: CheckCircle2, label: 'Tested', value: data.testedPages, color: '#10B981' },
                        { icon: Bug, label: 'Defects', value: data.defectsFound, color: '#EF4444' },
                        { icon: Clock, label: 'Elapsed', value: elapsed, color: '#F59E0B' },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} style={{
                            textAlign: 'center', padding: '14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 10,
                        }}>
                            <Icon size={18} style={{ color, marginBottom: 6 }} />
                            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Pages Discovered */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card"
                    style={{ padding: '24px' }}
                >
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe size={16} style={{ color: 'var(--color-accent-gold)' }} />
                        Pages Discovered
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                        {data.pagesDiscovered.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>Discovering pages...</div>
                        )}
                        {data.pagesDiscovered.map((page, i) => (
                            <motion.div
                                key={page.url}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: page.status === 'testing' ? 'rgba(212, 168, 83, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                    border: page.status === 'testing' ? '1px solid rgba(212, 168, 83, 0.15)' : '1px solid transparent',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 13, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
                                        {page.url}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{page.type}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {page.score && (
                                        <span style={{
                                            fontSize: 13, fontWeight: 700,
                                            color: page.score >= 85 ? '#10B981' : page.score >= 70 ? '#F59E0B' : '#EF4444'
                                        }}>
                                            {page.score}
                                        </span>
                                    )}
                                    <StatusBadge status={page.status} size="sm" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Live Defects Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card"
                    style={{ padding: '24px' }}
                >
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bug size={16} style={{ color: '#EF4444' }} />
                        Live Defects Feed
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                        <AnimatePresence>
                            {data.liveDefects.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>No defects found yet.</div>
                            )}
                            {data.liveDefects.map((defect, i) => (
                                <motion.div
                                    key={defect.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                                    style={{
                                        padding: '14px',
                                        borderRadius: 10,
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderLeft: `3px solid ${getSeverityColor(defect.severity)}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <StatusBadge status={defect.severity} size="sm" />
                                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, padding: '2px 6px', background: 'rgba(148,163,184,0.08)', borderRadius: 4 }}>
                                                {defect.type}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>
                                            {defect.time}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {defect.message}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>
                                        {defect.page}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
