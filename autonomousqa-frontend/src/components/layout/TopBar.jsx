import { Bell, Search, User, Moon, Sun } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';

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
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

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

                {/* User Avatar */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-glow-gold)',
                        marginLeft: 2,
                    }}
                >
                    <User size={16} color="var(--on-accent)" />
                </motion.div>
            </div>
        </motion.header>
    );
}
