import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitPullRequest, CheckCircle2, AlertTriangle, ExternalLink, X, Code, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { tests as testsApi } from '../../lib/api';

export default function AutoFixModal({ isOpen, onClose, defect, runId }) {
    if (!isOpen || !defect) return null;

    const [loading, setLoading] = useState(false);
    const [prResult, setPrResult] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const targetFile = defect.targetFile || 'src/App.jsx';
    const patchDiff = defect.patchDiff || `--- a/${targetFile}\n+++ b/${targetFile}\n@@ -12,3 +12,4 @@\n <main>\n+  <h1>AutonomousQA Fix</h1>\n   <p>${defect.message || 'Remediated element'}</p>\n </main>`;

    const handleCreatePR = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await testsApi.autofix(runId, {
                defectId: defect.id,
                targetFile,
                patchDiff,
                title: `fix(qa): automated resolution for ${defect.type || 'accessibility'} defect`,
                body: `## 🤖 BugZero Autonomous Remediation PR\n\n- **Defect:** ${defect.message}\n- **Target File:** \`${targetFile}\`\n\n\`\`\`diff\n${patchDiff}\n\`\`\`\n\n*Verified by BugZero Autonomous QA.*`
            });
            setPrResult(res.pullRequest);
        } catch (err) {
            setError(err.message || 'Failed to create Pull Request');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyDiff = () => {
        navigator.clipboard.writeText(patchDiff);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: 20,
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{
                    width: '100%',
                    maxWidth: 640,
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 168, 83, 0.1)',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: 'rgba(212, 168, 83, 0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-accent-gold)'
                        }}>
                            <GitPullRequest size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                Autonomous GitHub PR Bot
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                Zero-Touch Code Patch & Remediation
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: 6,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Defect Summary Card */}
                    <div style={{
                        padding: '12px 16px',
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 10,
                        border: '1px solid var(--border-subtle)',
                        fontSize: 13,
                    }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                            Detected Defect
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {defect.message || 'Accessibility / DOM layout violation'}
                        </div>
                    </div>

                    {/* Diff Preview */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Generated AST Patch Diff (<code style={{ color: 'var(--color-accent-gold)' }}>{targetFile}</code>)
                            </span>
                            <button
                                onClick={handleCopyDiff}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: copied ? '#10B981' : 'var(--color-accent-gold)',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Copied!' : 'Copy Diff'}
                            </button>
                        </div>
                        <pre style={{
                            margin: 0,
                            padding: '14px',
                            background: '#0B0F19',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 10,
                            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: '#10B981',
                            overflowX: 'auto',
                            maxHeight: 180,
                        }}>
                            {patchDiff}
                        </pre>
                    </div>

                    {error && (
                        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#EF4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    {prResult && (
                        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle2 size={15} /> Pull Request Created Successfully!
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                    Branch: <code style={{ color: 'var(--text-primary)' }}>{prResult.branchName}</code>
                                </div>
                            </div>
                            <a
                                href={prResult.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    padding: '6px 14px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background: 'var(--gradient-primary)',
                                    color: '#fff',
                                    borderRadius: 8,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                View PR <ExternalLink size={13} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: 'rgba(255, 255, 255, 0.01)',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 18px',
                            fontSize: 13,
                            fontWeight: 600,
                            background: 'var(--glass-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 8,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                    {!prResult && (
                        <button
                            onClick={handleCreatePR}
                            disabled={loading}
                            style={{
                                padding: '9px 20px',
                                fontSize: 13,
                                fontWeight: 700,
                                background: 'var(--gradient-primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                cursor: loading ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: 'var(--shadow-glow-gold)',
                            }}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <GitPullRequest size={14} />}
                            {loading ? 'Creating Branch & PR...' : 'Open GitHub Auto-Fix PR'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
