import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Plus, History, Shield, BookKey,
    Settings, Zap, ChevronLeft, ChevronRight, Bug,
    Activity, FlaskConical, ArrowRight
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

    // Re-fetch on every navigation so Live Test always points to the running test
    useEffect(() => {
        const findActiveTest = async () => {
            try {
                // Prefer running → queued → latest completed
                for (const status of ['running', 'queued']) {
                    const data = await testsApi.list({ limit: 1, status });
                    if (data.testRuns?.[0]) {
                        setLatestTestId(data.testRuns[0].id);
                        return;
                    }
                }
                // No active test — fall back to most recent
                const data = await testsApi.list({ limit: 1 });
                if (data.testRuns?.[0]) setLatestTestId(data.testRuns[0].id);
            } catch { /* ignore */ }
        };
        findActiveTest();
    }, [location.pathname]);

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
                    const isSettings = to === '/settings';
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            style={{ textDecoration: 'none', ...(isSettings ? { marginTop: 'auto' } : {}) }}
                        >
                            <motion.div
                                whileHover={{ background: 'var(--glass-subtle-hover)' }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative overflow-hidden flex items-center`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: collapsed ? '10px 14px' : '9px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
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
                                            top: '20%',
                                            width: 3,
                                            height: '60%',
                                            borderRadius: '0 4px 4px 0',
                                            background: 'var(--color-accent-gold)',
                                            boxShadow: '2px 0 8px rgba(212,168,83,0.4)',
                                            zIndex: 30,
                                        }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}

                                {/* Visible Text & Icon */}
                                <div className={`flex items-center gap-[10px] relative z-10 transition-all duration-300 w-full ${!collapsed ? 'group-hover:translate-x-12 group-hover:opacity-0' : ''}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
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
                                </div>

                                {/* Hover State (Sliding in) */}
                                {!collapsed && (
                                    <>
                                        <div className="absolute left-0 top-0 z-20 flex h-full w-full translate-x-12 items-center text-[var(--color-bg-primary)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" style={{ paddingLeft: '34px', gap: '10px' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{label}</span>
                                            <ArrowRight size={16} strokeWidth={2.5} />
                                        </div>
                                        <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-[var(--color-accent-gold)] transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] opacity-0 group-hover:opacity-100 z-10"></div>
                                    </>
                                )}
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
