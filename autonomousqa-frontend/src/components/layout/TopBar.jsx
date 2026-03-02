import { Bell, Search, User, Moon } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    const title = getTitle(location.pathname);

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
                background: 'rgba(9, 9, 11, 0.7)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 30,
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
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
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
                        background: 'rgba(255,255,255,0.06)',
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
                    style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(148, 163, 184, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                    }}
                >
                    <Moon size={16} />
                </motion.button>

                {/* Notifications */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Notifications"
                    style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(148, 163, 184, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        position: 'relative',
                    }}
                >
                    <Bell size={16} />
                    <span style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--color-error)',
                        border: '2px solid var(--color-bg-primary)',
                    }} />
                </motion.button>

                {/* User Avatar */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-glow-blue)',
                        marginLeft: 4,
                    }}
                >
                    <User size={18} color="#fff" />
                </motion.div>
            </div>
        </motion.header>
    );
}
