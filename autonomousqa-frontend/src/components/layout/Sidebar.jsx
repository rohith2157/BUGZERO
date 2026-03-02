import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Plus, History, Shield, BookKey,
    Settings, Zap, ChevronLeft, ChevronRight, Bug,
    Activity, FlaskConical
} from 'lucide-react';
import { tests as testsApi } from '../../lib/api';

const staticNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tests/new', icon: Plus, label: 'New Test' },
    { to: '/playbooks', icon: BookKey, label: 'Playbooks' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
    const [latestTestId, setLatestTestId] = useState(null);
    const location = useLocation();

    useEffect(() => {
        testsApi.list({ limit: 1 }).then(data => {
            if (data.testRuns?.[0]) setLatestTestId(data.testRuns[0].id);
        }).catch(() => { });
    }, []);

    // Build nav items with dynamic test ID
    const navItems = [
        ...staticNavItems.slice(0, 2),
        ...(latestTestId ? [
            { to: `/tests/${latestTestId}`, icon: Activity, label: 'Live Test' },
            { to: `/tests/${latestTestId}/report`, icon: Bug, label: 'Report' },
            { to: `/tests/${latestTestId}/compliance`, icon: Shield, label: 'Compliance' },
            { to: `/tests/${latestTestId}/performance`, icon: Zap, label: 'Performance' },
        ] : []),
        ...staticNavItems.slice(2),
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg, rgba(11, 17, 32, 0.95) 0%, rgba(6, 9, 15, 0.98) 100%)',
                borderRight: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
            }}
        >
            {/* Logo */}
            <div style={{
                padding: collapsed ? '20px 16px' : '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 64,
            }}>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-glow-blue)',
                }}>
                    <FlaskConical size={20} color="#fff" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Autonomous<span style={{ color: 'var(--color-accent-blue)' }}>QA</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Zero-Touch Testing
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Glow divider */}
            <div className="glow-line" style={{ margin: '0 16px' }} />

            {/* Nav */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive = location.pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            style={{ textDecoration: 'none' }}
                        >
                            <motion.div
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: collapsed ? '12px 16px' : '10px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    transition: 'all var(--transition-fast)',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 3,
                                            height: 20,
                                            borderRadius: 3,
                                            background: 'var(--gradient-primary)',
                                            boxShadow: 'var(--shadow-glow-blue)',
                                        }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <Icon size={20} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                fontSize: 14,
                                                fontWeight: isActive ? 600 : 400,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Collapse button */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{
                        width: '100%',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: 'rgba(148, 163, 184, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all var(--transition-fast)',
                    }}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                Collapse
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </motion.aside>
    );
}
