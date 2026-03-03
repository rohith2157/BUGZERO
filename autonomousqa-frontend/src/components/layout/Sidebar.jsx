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
            animate={{ width: collapsed ? 68 : 240 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                transition: 'background 0.3s ease',
            }}
        >
            {/* Logo */}
            <div style={{
                padding: collapsed ? '18px 14px' : '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 56,
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-glow-gold)',
                }}>
                    <FlaskConical size={17} color="var(--on-accent)" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Autonomous<span style={{ color: 'var(--color-accent-gold)' }}>QA</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 12px' }} />

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive = location.pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            style={{ textDecoration: 'none' }}
                        >
                            <motion.div
                                whileHover={{ background: 'var(--glass-subtle-hover)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: collapsed ? '10px 14px' : '9px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    background: isActive ? 'rgba(212, 168, 83, 0.08)' : 'transparent',
                                    transition: 'all 0.15s ease',
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
                                            width: 2,
                                            height: 16,
                                            borderRadius: 2,
                                            background: 'var(--color-accent-gold)',
                                            boxShadow: '0 0 8px rgba(212,168,83,0.4)',
                                        }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <Icon size={18} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55, color: isActive ? 'var(--color-accent-gold)' : undefined }} />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                fontSize: 13,
                                                fontWeight: isActive ? 600 : 400,
                                                whiteSpace: 'nowrap',
                                                letterSpacing: '-0.01em',
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
            <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border-subtle)' }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{
                        width: '100%',
                        padding: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: 'var(--glass-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        fontSize: 11,
                        transition: 'all 0.15s ease',
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
