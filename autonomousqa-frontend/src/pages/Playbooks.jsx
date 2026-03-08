import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookKey, Pencil, Trash2, X, Chrome, Github, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { playbooks as playbooksApi } from '../lib/api';

const typeIcons = {
    'Google SSO': Chrome,
    'GitHub OAuth': Github,
    'Form + TOTP': KeyRound,
    'Form': KeyRound,
    'Microsoft SSO': ShieldCheck,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Playbooks() {
    const [showModal, setShowModal] = useState(false);
    const [playbooks, setPlaybooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPlaybook, setNewPlaybook] = useState({ name: '', domain: '', authType: 'Form-based Login' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { document.title = 'Auth Playbooks — AutonomousQA'; }, []);

    // Escape key closes modal
    useEffect(() => {
        if (!showModal) return;
        const handler = (e) => { if (e.key === 'Escape') setShowModal(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [showModal]);

    const fetchPlaybooks = () => {
        playbooksApi.list().then(data => {
            setPlaybooks((data.playbooks || []).map(pb => ({
                id: pb.id,
                name: pb.name,
                domain: pb.domain,
                type: pb.authType,
                status: pb.status,
                successRate: pb.successRate ? `${Math.round(pb.successRate)}%` : '—',
                lastUsed: pb.lastUsed ? new Date(pb.lastUsed).toLocaleDateString() : 'Never',
            })));
        }).catch(() => { }).finally(() => setLoading(false));
    };

    const handleCreate = async () => {
        if (!newPlaybook.name || !newPlaybook.domain) return;
        setSaving(true);
        try {
            await playbooksApi.create({ name: newPlaybook.name, domain: newPlaybook.domain, authType: newPlaybook.authType });
            setShowModal(false);
            setNewPlaybook({ name: '', domain: '', authType: 'Form-based Login' });
            fetchPlaybooks();
        } catch (err) {
            console.error('Create playbook failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this playbook?')) return;
        try {
            await playbooksApi.remove(id);
            setPlaybooks(prev => prev.filter(pb => pb.id !== id));
        } catch (err) {
            console.error('Delete playbook failed:', err);
        }
    };

    useEffect(() => { fetchPlaybooks(); }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: '#D4A853' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Loading playbooks...</span>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Auth Playbooks</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Manage saved authentication strategies for your applications.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '10px 20px', fontSize: 13, fontWeight: 600,
                        background: 'var(--gradient-primary)', color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: 'var(--shadow-glow-gold)',
                    }}
                >
                    <Plus size={16} /> New Playbook
                </motion.button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
            }}>
                {playbooks.map((pb) => {
                    const Icon = typeIcons[pb.type] || KeyRound;
                    return (
                        <motion.div
                            key={pb.id}
                            variants={item}
                            whileHover={{ y: -3 }}
                            className="glass-card"
                            style={{ padding: '22px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                background: pb.status === 'active' ? 'var(--gradient-success)' : 'rgba(255,255,255,0.06)',
                            }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                        background: 'rgba(212, 168, 83, 0.08)',
                                        border: '1px solid rgba(212, 168, 83, 0.12)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={18} style={{ color: '#D4A853' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>{pb.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'Geist Mono', 'JetBrains Mono', monospace" }}>{pb.domain}</div>
                                    </div>
                                </div>
                                <StatusBadge status={pb.status} size="sm" />
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 14,
                            }}>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Type</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{pb.type}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Success Rate</div>
                                    <div style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 700 }}>{pb.successRate}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Last used: {pb.lastUsed}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        aria-label="Edit playbook"
                                        style={{
                                            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--text-tertiary)', cursor: 'pointer',
                                        }}
                                    >
                                        <Pencil size={13} />
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        aria-label="Delete playbook"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(pb.id); }}
                                        style={{
                                            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                                            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#EF4444', cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={13} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {playbooks.length === 0 && (
                <motion.div
                    variants={item}
                    style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}
                >
                    No playbooks yet. Create one to save your auth strategies.
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 480, padding: '28px',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-xl)',
                                boxShadow: 'var(--shadow-xl)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>New Auth Playbook</h3>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowModal(false)}
                                    aria-label="Close modal"
                                    style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </motion.button>
                            </div>

                            {[
                                { label: 'Playbook Name', placeholder: 'e.g. Google SSO Login', field: 'name' },
                                { label: 'Domain', placeholder: 'e.g. app.example.com', field: 'domain' },
                            ].map(({ label, placeholder, field }) => (
                                <div key={label} style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                                    <input placeholder={placeholder} value={newPlaybook[field]} onChange={(e) => setNewPlaybook(p => ({ ...p, [field]: e.target.value }))} style={{
                                        width: '100%', padding: '10px 14px', fontSize: 14,
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
                                    }} />
                                </div>
                            ))}

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auth Type</label>
                                <select value={newPlaybook.authType} onChange={(e) => setNewPlaybook(p => ({ ...p, authType: e.target.value }))} style={{
                                    width: '100%', padding: '10px 14px', fontSize: 14,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer',
                                }}>
                                    <option>Form-based Login</option>
                                    <option>Google SSO</option>
                                    <option>GitHub OAuth</option>
                                    <option>Microsoft SSO</option>
                                    <option>Form + TOTP/MFA</option>
                                </select>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%', padding: '12px', fontSize: 14, fontWeight: 600,
                                    background: 'var(--gradient-primary)', color: '#fff',
                                    border: 'none', borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer', boxShadow: 'var(--shadow-glow-gold)',
                                }}
                                onClick={handleCreate}
                                disabled={saving || !newPlaybook.name || !newPlaybook.domain}
                            >
                                {saving ? 'Creating...' : 'Create Playbook'}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
