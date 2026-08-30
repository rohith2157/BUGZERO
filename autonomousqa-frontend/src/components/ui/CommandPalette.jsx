import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, LayoutDashboard, Plus, History, BookKey, Settings,
    Activity, Bug, Shield, Zap, Moon, Sun, ArrowRight, ExternalLink,
    Code, Compass, Sparkles, X, Check
} from 'lucide-react';
import { tests as testsApi } from '../../lib/api';
import useThemeStore from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

export default function CommandPalette({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentRuns, setRecentRuns] = useState([]);
    const inputRef = useRef(null);
    const { theme, toggleTheme } = useThemeStore();
    const logout = useAuthStore(s => s.logout);

    // Fetch recent runs for quick jump
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            testsApi.list({ limit: 6 }).then(data => {
                if (data?.testRuns) {
                    setRecentRuns(data.testRuns);
                }
            }).catch(() => {});
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Navigation items
    const staticItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Navigation', action: () => navigate('/dashboard') },
        { id: 'new-test', label: 'Start New Test', icon: Plus, category: 'Navigation', action: () => navigate('/tests/new') },
        { id: 'history', label: 'Test History', icon: History, category: 'Navigation', action: () => navigate('/history') },
        { id: 'playbooks', label: 'Auth Playbooks', icon: BookKey, category: 'Navigation', action: () => navigate('/playbooks') },
        { id: 'settings', label: 'Settings & API Keys', icon: Settings, category: 'Navigation', action: () => navigate('/settings') },
        { id: 'algorithms', label: 'Algorithms & Architecture', icon: Code, category: 'Explore', action: () => navigate('/algorithms') },
        { id: 'use-cases', label: 'Enterprise Use Cases', icon: Compass, category: 'Explore', action: () => navigate('/use-cases') },
        { id: 'inspiration', label: 'Research & Inspiration', icon: Sparkles, category: 'Explore', action: () => navigate('/inspiration') },
        { id: 'theme-toggle', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? Sun : Moon, category: 'Preferences', action: () => toggleTheme() },
        { id: 'logout', label: 'Sign Out', icon: X, category: 'Account', action: () => { logout(); navigate('/login'); } },
    ];

    // Filter items based on query
    const lowerQuery = query.toLowerCase().trim();

    const isUrl = lowerQuery.startsWith('http://') || lowerQuery.startsWith('https://') || (lowerQuery.includes('.') && !lowerQuery.includes(' '));

    const dynamicTestItem = isUrl ? [{
        id: 'run-custom-url',
        label: `Run Autonomous Test on "${query}"`,
        icon: ArrowRight,
        category: 'Quick Action',
        action: () => navigate('/tests/new', { state: { url: query.startsWith('http') ? query : `https://${query}` } })
    }] : [];

    const runItems = recentRuns.map(r => ({
        id: `run-${r.id}`,
        label: `${r.url} (${r.status} • Score: ${r.overallScore != null ? r.overallScore : '—'})`,
        icon: r.status === 'running' ? Activity : Bug,
        category: 'Recent Test Runs',
        action: () => navigate(`/tests/${r.id}/report`)
    }));

    const allFiltered = [
        ...dynamicTestItem,
        ...staticItems.filter(item => item.label.toLowerCase().includes(lowerQuery) || item.category.toLowerCase().includes(lowerQuery)),
        ...runItems.filter(item => item.label.toLowerCase().includes(lowerQuery))
    ];

    const handleSelect = (item) => {
        onClose();
        item.action();
    };

    const handleKeyListNav = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (allFiltered.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + allFiltered.length) % (allFiltered.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (allFiltered[selectedIndex]) {
                handleSelect(allFiltered[selectedIndex]);
            } else if (isUrl) {
                navigate('/tests/new', { state: { url: query.startsWith('http') ? query : `https://${query}` } });
                onClose();
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '12vh',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '92%',
                            maxWidth: 580,
                            background: 'var(--color-bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 16,
                            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 168, 83, 0.1)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Search Input Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-subtle)',
                        }}>
                            <Search size={18} style={{ color: 'var(--color-accent-gold)', flexShrink: 0 }} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                                onKeyDown={handleKeyListNav}
                                placeholder="Type a command, page name, or paste a URL to test..."
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: 15,
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <span style={{
                                fontSize: 11,
                                padding: '3px 7px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 6,
                                color: 'var(--text-tertiary)',
                                fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                            }}>
                                ESC
                            </span>
                        </div>

                        {/* Results List */}
                        <div style={{
                            maxHeight: 360,
                            overflowY: 'auto',
                            padding: '8px',
                        }}>
                            {allFiltered.length === 0 ? (
                                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
                                    No commands found for "{query}".
                                </div>
                            ) : (
                                allFiltered.map((item, idx) => {
                                    const Icon = item.icon;
                                    const isSelected = idx === selectedIndex;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(212, 168, 83, 0.12)' : 'transparent',
                                                border: `1px solid ${isSelected ? 'rgba(212, 168, 83, 0.25)' : 'transparent'}`,
                                                transition: 'all 0.1s ease',
                                            }}
                                        >
                                            <div style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 8,
                                                background: isSelected ? 'rgba(212, 168, 83, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: isSelected ? 'var(--color-accent-gold)' : 'var(--text-secondary)',
                                                flexShrink: 0,
                                            }}>
                                                <Icon size={15} />
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {item.label}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: 11,
                                                color: 'var(--text-tertiary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                fontWeight: 600,
                                            }}>
                                                {item.category}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Hints */}
                        <div style={{
                            padding: '10px 18px',
                            background: 'rgba(0, 0, 0, 0.18)',
                            borderTop: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            color: 'var(--text-tertiary)',
                        }}>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <span><kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>↑↓</kbd> Navigate</span>
                                <span><kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>↵</kbd> Select</span>
                            </div>
                            <span>BugZero Autonomous Engine</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
