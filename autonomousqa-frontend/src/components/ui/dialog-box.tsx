import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Camera, Mail, Shield, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const DialogBox = () => {
    const { user, updateUser } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const nameInputRef = useRef(null);

    // Sync local state when user changes or dialog opens
    useEffect(() => {
        if (open) {
            setName(user?.name || '');
            setSaved(false);
            // Auto-focus name input
            setTimeout(() => nameInputRef.current?.focus(), 150);
        }
    }, [open, user]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate a brief save delay for feedback
        await new Promise((r) => setTimeout(r, 400));
        updateUser({ name: name.trim() || user?.name });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setOpen(false), 600);
    };

    const initials = (user?.name || user?.email || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const modal = (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="edit-profile-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Edit Profile"
                >
                    <motion.div
                        key="edit-profile-card"
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 440,
                            margin: '0 16px',
                            background: 'var(--color-bg-elevated, #0a0a0a)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 20,
                            overflow: 'hidden',
                            boxShadow: '0 32px 80px -12px rgba(0, 0, 0, 0.8), 0 0 60px rgba(212, 168, 83, 0.06)',
                            position: 'relative',
                        }}
                    >
                        {/* Decorative gradient header */}
                        <div style={{
                            position: 'relative',
                            height: 100,
                            background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(167, 139, 250, 0.08) 50%, rgba(108, 142, 239, 0.1) 100%)',
                            borderBottom: '1px solid var(--border-subtle)',
                            overflow: 'hidden',
                        }}>
                            {/* Subtle grid pattern */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                                backgroundSize: '24px 24px',
                            }} />
                            {/* Glow orb */}
                            <div style={{
                                position: 'absolute',
                                top: -30,
                                right: -20,
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(212, 168, 83, 0.2) 0%, transparent 70%)',
                                filter: 'blur(20px)',
                            }} />
                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(8px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    transition: 'color 0.15s',
                                }}
                                aria-label="Close"
                            >
                                <X size={15} />
                            </motion.button>
                        </div>

                        {/* Avatar overlapping header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: -44,
                            position: 'relative',
                            zIndex: 2,
                        }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: 88,
                                    height: 88,
                                    borderRadius: 20,
                                    background: user?.photo ? `url(${user.photo}) center/cover` : 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '4px solid var(--color-bg-elevated, #0a0a0a)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), var(--shadow-glow-gold)',
                                    fontSize: 28,
                                    fontWeight: 800,
                                    color: 'var(--on-accent)',
                                    letterSpacing: '-0.02em',
                                    overflow: 'hidden',
                                }}>
                                    {user?.photo ? null : initials}
                                </div>
                                {/* Camera badge */}
                                <motion.div
                                    whileHover={{ scale: 1.15 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -4,
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        background: 'var(--color-accent-gold)',
                                        border: '3px solid var(--color-bg-elevated, #0a0a0a)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(212, 168, 83, 0.3)',
                                    }}
                                >
                                    <Camera size={12} color="var(--on-accent)" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '20px 28px 28px' }}>
                            {/* Title */}
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <h2 style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.2,
                                    marginBottom: 4,
                                }}>
                                    Edit Profile
                                </h2>
                                <p style={{
                                    fontSize: 13,
                                    color: 'var(--text-tertiary)',
                                    fontWeight: 400,
                                }}>
                                    Customize how you appear across BugZero
                                </p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} autoComplete="off">
                                {/* Name Field */}
                                <div style={{ marginBottom: 16 }}>
                                    <label
                                        htmlFor="edit-profile-name"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 8,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        <User size={12} />
                                        Display Name
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        id="edit-profile-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            border: '1px solid var(--border-default)',
                                            background: 'var(--glass-subtle)',
                                            color: 'var(--text-primary)',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--color-accent-gold)';
                                            e.target.style.boxShadow = '0 0 0 3px var(--color-accent-gold-glow)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-default)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Email Field (Read-Only) */}
                                <div style={{ marginBottom: 16 }}>
                                    <label
                                        htmlFor="edit-profile-email"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 8,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        <Mail size={12} />
                                        Email
                                    </label>
                                    <div style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: 12,
                                        border: '1px solid var(--border-subtle)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: 'var(--text-tertiary)',
                                        fontSize: 14,
                                        fontWeight: 400,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        boxSizing: 'border-box',
                                    }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user?.email || 'Not set'}
                                        </span>
                                        <span style={{
                                            fontSize: 10,
                                            padding: '2px 8px',
                                            borderRadius: 6,
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--text-muted)',
                                            fontWeight: 600,
                                            letterSpacing: '0.04em',
                                            flexShrink: 0,
                                            marginLeft: 8,
                                        }}>
                                            READ ONLY
                                        </span>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div style={{ marginBottom: 28 }}>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 8,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        <Shield size={12} />
                                        Role
                                    </label>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '8px 14px',
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.1) 0%, rgba(212, 168, 83, 0.05) 100%)',
                                        border: '1px solid rgba(212, 168, 83, 0.2)',
                                    }}>
                                        <Sparkles size={13} color="var(--color-accent-gold)" />
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: 'var(--color-accent-gold)',
                                            letterSpacing: '0.02em',
                                        }}>
                                            {user?.role || 'Owner'}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{
                                    height: 1,
                                    background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)',
                                    marginBottom: 20,
                                }} />

                                {/* Actions */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.06)' }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={handleClose}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: 10,
                                            border: '1px solid var(--border-default)',
                                            background: 'transparent',
                                            color: 'var(--text-secondary)',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        Cancel
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(212, 168, 83, 0.3)' }}
                                        whileTap={{ scale: 0.97 }}
                                        type="submit"
                                        disabled={saving || saved}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: saved
                                                ? 'var(--color-success)'
                                                : 'var(--gradient-primary)',
                                            color: saved ? '#fff' : 'var(--on-accent)',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: saving || saved ? 'default' : 'pointer',
                                            fontFamily: 'inherit',
                                            boxShadow: 'var(--shadow-glow-gold)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            opacity: saving ? 0.7 : 1,
                                            minWidth: 120,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {saving ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                    style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--on-accent)', borderRadius: '50%' }}
                                                />
                                                Saving...
                                            </>
                                        ) : saved ? (
                                            <>
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', damping: 12 }}
                                                >
                                                    ✓
                                                </motion.span>
                                                Saved!
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <User size={14} />
                Edit Profile
            </button>
            {createPortal(modal, document.body)}
        </>
    );
};
