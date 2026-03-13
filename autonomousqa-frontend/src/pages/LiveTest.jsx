import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bug, Clock, Globe, Loader2, CheckCircle2, AlertTriangle, XCircle, StopCircle, ChevronDown } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { GridBackground } from '../components/ui/GridBackground';
import { TextShimmer } from '../components/ui/TextShimmer';
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
    const [expandedPageUrl, setExpandedPageUrl] = useState(null);
    const [expandedDefectId, setExpandedDefectId] = useState(null);

    const fetchData = useCallback(() => {
        testsApi.get(id).then(({ testRun }) => {
            const pages = (testRun.pages || []).map(p => ({
                id: p.id,
                url: safePath(p.url),
                fullUrl: p.url || '',
                type: p.pageType || 'Unknown',
                status: p.status === 'tested' ? 'tested' : 'queued',
                score: p.hygieneScore != null ? Math.min(100, Math.round(p.hygieneScore)) : null,
                rawScore: p.hygieneScore,
                defectCount: p._count?.defects ?? 0,
                createdAt: p.createdAt || null,
                // Performance metrics per page (from gateway include)
                performanceMetrics: (p.performanceMetrics || []).reduce((acc, m) => {
                    acc[m.metricName] = { value: m.value, rating: m.rating };
                    return acc;
                }, {}),
            }));
            const defects = (testRun.defects || []).map(d => ({
                id: d.id,
                page: d.pageUrl ? safePath(d.pageUrl) : '/',
                fullPageUrl: d.pageUrl || '',
                type: d.type,
                severity: d.severity,
                message: d.message,
                fix: d.fix || null,
                confidence: d.confidence != null ? Math.round(d.confidence * 100) : null,
                screenshot: d.screenshot || null,
                time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString() : '',
                timestamp: d.createdAt || '',
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
        onStarted: () => fetchData(),
        onCrawlComplete: () => fetchData(), // immediately show page count when crawl finishes
        onPageComplete: () => fetchData(),
        onDefectFound: () => fetchData(),
        onComplete: () => fetchData(),
        onFailed: () => fetchData(),
        onCancelled: () => fetchData(),
    });

    useEffect(() => {
        document.title = 'Live Test — AutonomousQA';
        fetchData();
        // Poll every 3 seconds for live updates
        pollRef.current = setInterval(fetchData, 3000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (elapsedRef.current) clearInterval(elapsedRef.current);
            cancel(); // Clean up WebSocket on unmount
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
            {error && data && (
                <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, color: '#F87171', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500 }}>
                    <AlertTriangle size={16} /> Connection dropped or failed to poll updates: {error}
                </div>
            )}
            {/* Header info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '24px',
                    marginBottom: 20,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'var(--color-bg-secondary)',
                }}
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
                            <div style={{ fontSize: 16, fontWeight: 700 }}>
                                {isRunning
                                    ? <TextShimmer duration={2} spread={3}>Test in Progress</TextShimmer>
                                    : `Test ${data.status === 'completed' ? 'Complete' : data.status}`
                                }
                            </div>
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
                        {isRunning
                            ? <TextShimmer duration={2.5} spread={2}>Progress</TextShimmer>
                            : <span>Progress</span>
                        }
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
                            background: 'transparent',
                            borderRadius: 10,
                        }}>
                            <Icon size={18} style={{ color, marginBottom: 6 }} />
                            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <GridBackground
                title={isRunning ? `Testing ${data.url}…` : `Test ${data.status === 'completed' ? 'Complete' : data.status}`}
                description={isRunning ? 'Live activity — results appear as each page is tested' : `${data.testedPages} pages tested · ${data.defectsFound} defects found`}
                showAvailability={isRunning}
                className="mt-4 !px-4 !py-6"
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Pages Discovered */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            padding: '20px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'transparent',
                        }}
                    >
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={16} style={{ color: 'var(--color-accent-gold)' }} />
                            {isRunning
                                ? <TextShimmer duration={3} spread={2}>Pages Discovered</TextShimmer>
                                : 'Pages Discovered'
                            }
                        </h3>
                        <div className="dark-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                            {data.pagesDiscovered.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                                    {isRunning
                                        ? <TextShimmer duration={2} spread={3}>Discovering pages...</TextShimmer>
                                        : <span style={{ color: 'var(--text-tertiary)' }}>No pages found.</span>
                                    }
                                </div>
                            )}
                            {data.pagesDiscovered.map((page, i) => (
                                <motion.div
                                    key={page.url}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div
                                        onClick={() => setExpandedPageUrl(expandedPageUrl === page.url ? null : page.url)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: expandedPageUrl === page.url ? '8px 8px 0 0' : 'var(--radius-md)',
                                            background: expandedPageUrl === page.url ? 'rgba(212, 168, 83, 0.06)' : page.status === 'testing' ? 'rgba(212, 168, 83, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                            border: expandedPageUrl === page.url ? '1px solid rgba(212, 168, 83, 0.18)' : page.status === 'testing' ? '1px solid rgba(212, 168, 83, 0.15)' : '1px solid transparent',
                                            borderBottom: expandedPageUrl === page.url ? '1px solid rgba(255,255,255,0.04)' : undefined,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <motion.div animate={{ rotate: expandedPageUrl === page.url ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            </motion.div>
                                            <div>
                                                <div style={{ fontSize: 13, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
                                                    {page.url}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{page.type}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {page.score != null && (
                                                <span style={{
                                                    fontSize: 13, fontWeight: 700,
                                                    color: page.score >= 85 ? '#10B981' : page.score >= 70 ? '#F59E0B' : '#EF4444'
                                                }}>
                                                    {page.score}
                                                </span>
                                            )}
                                            <StatusBadge status={page.status} size="sm" />
                                        </div>
                                    </div>
                                    {/* Expandable Detail Panel */}
                                    <AnimatePresence initial={false}>
                                        {expandedPageUrl === page.url && (
                                            <motion.div
                                                key="page-details"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                style={{ overflow: 'hidden', borderRadius: '0 0 8px 8px', border: '1px solid rgba(255,255,255,0.04)', borderTop: 'none', background: 'rgba(255,255,255,0.015)' }}
                                            >
                                                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <div>
                                                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Full URL</div>
                                                        <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6, wordBreak: 'break-all' }}>{page.fullUrl || page.url}</div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Hygiene Score</div>
                                                            <div style={{ fontSize: 20, fontWeight: 800, color: page.score != null ? (page.score >= 85 ? '#10B981' : page.score >= 70 ? '#F59E0B' : '#EF4444') : 'var(--text-tertiary)' }}>
                                                                {page.score != null ? page.score : 'N/A'}
                                                                {page.rawScore != null && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 4 }}>({Math.round(page.rawScore * 10) / 10})</span>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Status</div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: page.status === 'tested' ? '#10B981' : 'var(--text-secondary)', textTransform: 'capitalize' }}>{page.status}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Defects Found</div>
                                                            <div style={{ fontSize: 16, color: page.defectCount > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>{page.defectCount}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Page Type</div>
                                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{page.type}</div>
                                                        </div>
                                                        {page.createdAt && (
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Tested At</div>
                                                                <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>{new Date(page.createdAt).toLocaleString()}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Performance Metrics — real data from backend */}
                                                    {page.performanceMetrics && Object.keys(page.performanceMetrics).length > 0 && (
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Performance Metrics</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                                                                {Object.entries(page.performanceMetrics).map(([name, metric]) => (
                                                                    <div key={name} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>{name}</div>
                                                                        <div style={{ fontSize: 14, fontWeight: 700, color: metric.rating === 'good' ? '#10B981' : metric.rating === 'needs-improvement' ? '#F59E0B' : metric.rating === 'poor' ? '#EF4444' : 'var(--text-secondary)' }}>
                                                                            {name === 'CLS' ? (Math.round(metric.value * 1000) / 1000) : `${Math.round(metric.value)}ms`}
                                                                        </div>
                                                                        {metric.rating && <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'capitalize', marginTop: 2 }}>{metric.rating}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Live Defects Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            padding: '20px',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'transparent',
                        }}
                    >
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bug size={16} style={{ color: '#EF4444' }} />
                            {isRunning
                                ? <TextShimmer duration={2.8} spread={2}>Live Defects Feed</TextShimmer>
                                : 'Live Defects Feed'
                            }
                        </h3>
                        <div className="dark-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                            <AnimatePresence>
                                {data.liveDefects.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                                        {isRunning
                                            ? <TextShimmer duration={2.2} spread={2.5}>Scanning for defects...</TextShimmer>
                                            : <span style={{ color: 'var(--text-tertiary)' }}>No defects found.</span>
                                        }
                                    </div>
                                )}
                                {data.liveDefects.map((defect, i) => (
                                    <motion.div
                                        key={defect.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                                    >
                                        <div
                                            onClick={() => setExpandedDefectId(expandedDefectId === defect.id ? null : defect.id)}
                                            style={{
                                                padding: '14px',
                                                borderRadius: expandedDefectId === defect.id ? '10px 10px 0 0' : 10,
                                                background: expandedDefectId === defect.id ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.02)',
                                                borderLeft: `3px solid ${getSeverityColor(defect.severity)}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <motion.div animate={{ rotate: expandedDefectId === defect.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                        <ChevronDown size={13} style={{ color: 'var(--text-tertiary)' }} />
                                                    </motion.div>
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
                                        </div>
                                        {/* Expandable Defect Detail Panel */}
                                        <AnimatePresence initial={false}>
                                            {expandedDefectId === defect.id && (
                                                <motion.div
                                                    key="defect-details"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: 'hidden', borderRadius: '0 0 10px 10px', borderLeft: `3px solid ${getSeverityColor(defect.severity)}`, background: 'rgba(255,255,255,0.015)' }}
                                                >
                                                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Message</div>
                                                            <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6, wordBreak: 'break-all', lineHeight: 1.6 }}>{defect.message}</div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Severity</div>
                                                                <div style={{ fontSize: 13, fontWeight: 700, color: getSeverityColor(defect.severity), textTransform: 'capitalize' }}>{defect.severity}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Type</div>
                                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{defect.type}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Time Detected</div>
                                                                <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>{defect.time}</div>
                                                            </div>
                                                        </div>
                                                        {defect.confidence != null && (
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>AI Confidence</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                                        <div style={{ width: `${defect.confidence}%`, height: '100%', borderRadius: 3, background: defect.confidence >= 80 ? '#10B981' : defect.confidence >= 50 ? '#F59E0B' : '#EF4444', transition: 'width 0.3s ease' }} />
                                                                    </div>
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: defect.confidence >= 80 ? '#10B981' : defect.confidence >= 50 ? '#F59E0B' : '#EF4444', minWidth: 36 }}>{defect.confidence}%</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Page URL</div>
                                                            <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6, wordBreak: 'break-all' }}>{defect.fullPageUrl || defect.page}</div>
                                                        </div>
                                                        {defect.fix && (
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Suggested Fix</div>
                                                                <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: '#10B981', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', padding: '8px 10px', borderRadius: 6, wordBreak: 'break-all', lineHeight: 1.6 }}>{defect.fix}</div>
                                                            </div>
                                                        )}
                                                        {defect.timestamp && (
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Timestamp (ISO)</div>
                                                                <div style={{ fontSize: 12, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>{defect.timestamp}</div>
                                                            </div>
                                                        )}
                                                        {defect.screenshot && (
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Screenshot</div>
                                                                <img src={defect.screenshot} alt="Defect screenshot" style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </GridBackground>
        </motion.div>
    );
}
