import { Bell, Search, User, Moon, Sun, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import useThemeStore from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

const routeTitles = {
    '/dashboard': 'Dashboard',
    '/tests/new': 'Start New Test',
    '/playbooks': 'Auth Playbooks',
    '/history': 'Test History',
    '/settings': 'Settings',
};

function getTitle(pathname) {
    if (routeTitles[pathname]) return routeTitles[pathname];
    // Dynamic test routes
    if (/^\/tests\/[^/]+\/report$/.test(pathname)) return 'Test Report';
    if (/^\/tests\/[^/]+\/compliance$/.test(pathname)) return 'Compliance Report';
    if (/^\/tests\/[^/]+\/performance$/.test(pathname)) return 'Performance Report';
    if (/^\/tests\/[^/]+$/.test(pathname)) return 'Live Test View';
    return 'AutonomousQA';
}

export default function TopBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const title = getTitle(location.pathname);
    const { theme, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const isDark = theme === 'dark';
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <motion.header
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 28px',
                background: 'var(--glass-navbar)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'sticky',
                top: 0,
                zIndex: 30,
                transition: 'background 0.3s ease',
            }}
        >
            {/* Page Title */}
            <div>
                <h1 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                }}>
                    {title}
                </h1>
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Search */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 14px',
                    background: 'var(--glass-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-tertiary)',
                    fontSize: 13,
                    minWidth: 180,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}>
                    <Search size={14} />
                    <span>Search...</span>
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        padding: '2px 6px',
                        background: 'var(--glass-subtle-hover)',
                        borderRadius: 4,
                        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                        color: 'var(--text-tertiary)',
                    }}>⌘K</span>
                </div>

                {/* Dark mode toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Toggle theme"
                    onClick={toggleTheme}
                    style={{
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--glass-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                    }}
                >
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </motion.button>

                {/* Notifications */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label="Notifications"
                    style={{
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--glass-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        position: 'relative',
                    }}
                >
                    <Bell size={15} />
                    <span style={{
                        position: 'absolute',
                        top: 7,
                        right: 7,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--color-accent-gold)',
                        border: '2px solid var(--notification-border)',
                    }} />
                </motion.button>

                {/* User Profile Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative', marginLeft: 2 }}>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setProfileOpen((o) => !o)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 10px 4px 4px',
                            background: profileOpen ? 'var(--glass-subtle-hover)' : 'var(--glass-subtle)',
                            border: `1px solid ${profileOpen ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                            borderRadius: 10,
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{
                            width: 28, height: 28, borderRadius: 7,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-glow-gold)',
                            flexShrink: 0,
                        }}>
                            <User size={14} color="var(--on-accent)" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || user?.email?.split('@')[0] || 'Account'}
                        </span>
                        <ChevronDown size={13} style={{ color: 'var(--text-tertiary)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </motion.button>

                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    minWidth: 220,
                                    background: 'var(--color-bg-elevated, #18181b)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 12,
                                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* User info header */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 9,
                                            background: 'var(--gradient-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'var(--shadow-glow-gold)',
                                            flexShrink: 0,
                                        }}>
                                            <User size={17} color="var(--on-accent)" />
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user?.name || 'User'}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user?.email || ''}
                                            </div>
                                            {user?.role && (
                                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                                                    {user.role}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div style={{ padding: '6px' }}>
                                    <button
                                        onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '9px 12px', borderRadius: 8, border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                                            transition: 'all 0.1s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    >
                                        <Settings size={14} />
                                        Settings
                                    </button>

                                    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '9px 12px', borderRadius: 8, border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            color: '#EF4444', fontSize: 13, fontWeight: 600,
                                            transition: 'all 0.1s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.header>
    );
}
