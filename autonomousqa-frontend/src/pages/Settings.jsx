import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Key, Bell, CreditCard, Pencil, Trash2, Plus, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { settings as settingsApi } from '../lib/api';

const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'apikeys', icon: Key, label: 'API Keys' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [teamMembers, setTeamMembers] = useState([]);
    const [apiKeys, setApiKeys] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', organization: '', role: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [notifications, setNotifications] = useState({
        'Test Completed': true,
        'Critical Defects': true,
        'Weekly Report': true,
        'Performance Alerts': false,
        'Team Activity': false,
    });

    useEffect(() => {
        if (activeTab === 'team' && teamMembers.length === 0) {
            setLoadingTeam(true);
            settingsApi.team()
                .then(data => setTeamMembers(data.members || []))
                .catch(() => { })
                .finally(() => setLoadingTeam(false));
        }
        if (activeTab === 'apikeys' && apiKeys.length === 0) {
            setLoadingKeys(true);
            settingsApi.apiKeys()
                .then(data => setApiKeys(data.apiKeys || []))
                .catch(() => { })
                .finally(() => setLoadingKeys(false));
        }
    }, [activeTab]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Tab Nav */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 28,
                padding: '4px', background: 'rgba(148,163,184,0.04)',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)',
                width: 'fit-content',
            }}>
                {tabs.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                            padding: '10px 18px', fontSize: 13, fontWeight: activeTab === id ? 600 : 400,
                            background: activeTab === id ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            color: activeTab === id ? 'var(--text-accent)' : 'var(--text-tertiary)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '28px', maxWidth: 600 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24 }}>Profile Settings</h3>
                    {[
                        { label: 'Full Name', field: 'name', value: 'Rohith Kumar', type: 'text' },
                        { label: 'Email', field: 'email', value: 'rohith@autonomousqa.io', type: 'email', disabled: true },
                        { label: 'Organization', field: 'organization', value: 'AutonomousQA Inc.', type: 'text', disabled: true },
                        { label: 'Role', field: 'role', value: 'Owner', type: 'text', disabled: true },
                    ].map(({ label, field, value, type, disabled }) => (
                        <div key={label} style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                            <input type={type} defaultValue={value} disabled={disabled}
                                onChange={(e) => setProfileForm(f => ({ ...f, [field]: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 14,
                                    background: 'rgba(148,163,184,0.06)', border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
                                    opacity: disabled ? 0.6 : 1,
                                }} />
                        </div>
                    ))}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={profileSaving}
                        onClick={async () => {
                            if (!profileForm.name) return;
                            setProfileSaving(true);
                            try { await settingsApi.updateProfile({ name: profileForm.name }); } catch (err) { console.error('Save profile failed:', err); } finally { setProfileSaving(false); }
                        }}
                        style={{
                            padding: '10px 24px', fontSize: 14, fontWeight: 600,
                            background: 'var(--gradient-primary)', color: '#fff',
                            border: 'none', borderRadius: 'var(--radius-md)', cursor: profileSaving ? 'wait' : 'pointer',
                        }}>{profileSaving ? 'Saving...' : 'Save Changes'}</motion.button>
                </motion.div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700 }}>Team Members</h3>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{
                            padding: '8px 16px', fontSize: 12, fontWeight: 600,
                            background: 'var(--gradient-primary)', color: '#fff',
                            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <Plus size={14} /> Invite
                        </motion.button>
                    </div>
                    {loadingTeam ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 }}>
                            <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-blue)' }} />
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading team...</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {teamMembers.map((m) => (
                                <div key={m.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(148,163,184,0.04)', border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                            background: 'var(--gradient-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, fontWeight: 700, color: '#fff',
                                        }}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.lastActive}</span>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '3px 10px',
                                            borderRadius: 'var(--radius-full)',
                                            background: m.role === 'Owner' ? 'rgba(139,92,246,0.1)' : m.role === 'Admin' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)',
                                            color: m.role === 'Owner' ? '#8B5CF6' : m.role === 'Admin' ? '#3B82F6' : 'var(--text-secondary)',
                                        }}>{m.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'apikeys' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700 }}>API Keys</h3>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{
                            padding: '8px 16px', fontSize: 12, fontWeight: 600,
                            background: 'var(--gradient-primary)', color: '#fff',
                            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <Plus size={14} /> Generate Key
                        </motion.button>
                    </div>
                    {loadingKeys ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 }}>
                            <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--color-accent-blue)' }} />
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading API keys...</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {apiKeys.map((key) => (
                                <div key={key.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(148,163,184,0.04)', border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Key size={16} style={{ color: 'var(--text-tertiary)' }} />
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{key.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>{key.key}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Last: {key.lastUsed}</span>
                                        <StatusBadge status={key.status} size="sm" />
                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            aria-label="Copy API key"
                                            style={{
                                                width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(148,163,184,0.06)', border: 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--text-tertiary)', cursor: 'pointer',
                                            }}>
                                            <Copy size={13} />
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '28px', maxWidth: 600 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24 }}>Notification Preferences</h3>
                    {[
                        { label: 'Test Completed', desc: 'When a test run finishes' },
                        { label: 'Critical Defects', desc: 'When critical defects are found' },
                        { label: 'Weekly Report', desc: 'Weekly hygiene score summary' },
                        { label: 'Performance Alerts', desc: 'When regressions are detected' },
                        { label: 'Team Activity', desc: 'When team members run tests' },
                    ].map(({ label, desc }) => {
                        const enabled = notifications[label];
                        return (
                            <div key={label} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 0', borderBottom: '1px solid var(--border-subtle)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>
                                </div>
                                <div
                                    onClick={() => setNotifications(prev => ({ ...prev, [label]: !prev[label] }))}
                                    role="switch"
                                    aria-checked={enabled}
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNotifications(prev => ({ ...prev, [label]: !prev[label] })); } }}
                                    style={{
                                        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                                        background: enabled ? 'var(--color-accent-blue)' : 'rgba(148,163,184,0.2)',
                                        position: 'relative', transition: 'background var(--transition-fast)',
                                    }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                        position: 'absolute', top: 3,
                                        left: enabled ? 23 : 3,
                                        transition: 'left var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '28px', marginBottom: 20, maxWidth: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Current Plan</div>
                                <div style={{ fontSize: 22, fontWeight: 800 }} className="text-gradient">Growth</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 28, fontWeight: 800 }}>₹9,999<span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 400 }}>/mo</span></div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(148,163,184,0.04)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>RUNS USED</div>
                                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>147 <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ 200</span></div>
                            </div>
                            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(148,163,184,0.04)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>RENEWAL</div>
                                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>Mar 15</div>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{
                            width: '100%', padding: '12px', fontSize: 14, fontWeight: 600,
                            background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)',
                            borderRadius: 'var(--radius-md)', color: '#8B5CF6', cursor: 'pointer',
                        }}>
                            Upgrade to Enterprise
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
