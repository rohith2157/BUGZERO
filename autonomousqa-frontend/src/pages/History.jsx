import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowUpDown, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import { tests as testsApi } from '../lib/api';

export default function History() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [allRuns, setAllRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        testsApi.list({ limit: 50 }).then(data => {
            if (data.testRuns) {
                setAllRuns(data.testRuns.map(r => ({
                    id: r.id,
                    url: r.url || '',
                    status: r.status,
                    score: r.overallScore,
                    defects: r.defectCount || r._count?.defects || 0,
                    pages: r.totalPages || r._count?.pages || 0,
                    duration: r.duration || '—',
                    date: r.createdAt?.split('T')[0] || '',
                })));
            }
        }).catch(() => { }).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let runs = [...allRuns];

    if (search) {
        const lowerSearch = search.toLowerCase();
        runs = runs.filter(r => r.url.toLowerCase().includes(lowerSearch));
    }
    if (statusFilter !== 'all') {
        runs = runs.filter(r => r.status === statusFilter);
    }
    if (sortBy === 'score') {
        runs.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'defects') {
        runs.sort((a, b) => b.defects - a.defects);
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading history...</span>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', flex: 1, minWidth: 200, maxWidth: 400,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                }}>
                    <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by URL..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'completed', 'running', 'failed'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            style={{
                                padding: '7px 14px', fontSize: 12, fontWeight: 600,
                                background: statusFilter === s ? 'rgba(212, 168, 83, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${statusFilter === s ? 'rgba(212, 168, 83, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: 'var(--radius-full)',
                                color: statusFilter === s ? 'var(--color-accent-gold)' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all var(--transition-fast)',
                                textTransform: 'capitalize',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                    {[
                        { key: 'date', label: 'Date' },
                        { key: 'score', label: 'Score' },
                        { key: 'defects', label: 'Defects' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            style={{
                                padding: '7px 12px', fontSize: 12, fontWeight: 500,
                                background: sortBy === key ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${sortBy === key ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: 'var(--radius-full)',
                                color: sortBy === key ? 'var(--color-accent-purple)' : 'var(--text-tertiary)',
                                cursor: 'pointer', transition: 'all var(--transition-fast)',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            <ArrowUpDown size={11} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '20px' }}
            >
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['URL', 'Status', 'Hygiene Score', 'Defects', 'Pages', 'Duration', 'Date', ''].map(h => (
                                    <th key={h} style={{
                                        textAlign: 'left', padding: '12px 14px',
                                        fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        borderBottom: '1px solid var(--border-subtle)',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map((run, i) => (
                                <motion.tr
                                    key={run.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => navigate(`/tests/${run.id}/report`)}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        transition: 'background var(--transition-fast)',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 168, 83, 0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px', fontSize: 13, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", color: 'var(--color-accent-gold)' }}>
                                        {run.url.replace('https://', '')}
                                    </td>
                                    <td style={{ padding: '14px' }}><StatusBadge status={run.status} size="sm" /></td>
                                    <td style={{ padding: '14px' }}>
                                        {run.score ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 60, height: 6, borderRadius: 3,
                                                    background: 'rgba(148,163,184,0.1)',
                                                    overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        width: `${run.score}%`, height: '100%', borderRadius: 3,
                                                        background: run.score >= 85 ? '#10B981' : run.score >= 70 ? '#F59E0B' : '#EF4444',
                                                    }} />
                                                </div>
                                                <span style={{
                                                    fontSize: 14, fontWeight: 700,
                                                    color: run.score >= 85 ? '#10B981' : run.score >= 70 ? '#F59E0B' : '#EF4444',
                                                }}>
                                                    {run.score}
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>{run.defects}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)' }}>{run.pages}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>{run.duration}</td>
                                    <td style={{ padding: '14px', fontSize: 13, color: 'var(--text-tertiary)' }}>{run.date}</td>
                                    <td style={{ padding: '14px' }}>
                                        <ExternalLink size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {runs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
                        No test runs match your filters.
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
