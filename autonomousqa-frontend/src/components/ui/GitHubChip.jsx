import { Github, GitBranch } from 'lucide-react';

export default function GitHubChip({ repoName, branch, commitSha, commitShaShort, repoUrl }) {
    if (!repoName) return null;

    const commitUrl = repoUrl && commitSha ? `${repoUrl.replace('.git', '')}/commit/${commitSha}` : '#';

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'inherit',
        }}>
            {/* Repo Name with Icon */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 500 }}>
                <Github size={14} style={{ color: 'var(--text-secondary)' }} />
                {repoName}
            </span>

            {/* Branch Badge */}
            {branch && (
                <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    fontSize: '11px', fontWeight: 600,
                    padding: '2px 6px',
                    background: 'rgba(148,163,184,0.1)',
                    color: 'var(--text-secondary)',
                    borderRadius: '4px'
                }}>
                    <GitBranch size={10} />
                    {branch}
                </span>
            )}

            {/* SHA Pill (Link) */}
            {commitShaShort && (
                <a 
                    href={commitUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                    style={{
                        fontSize: '11px',
                        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                        padding: '2px 6px',
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-accent-gold)',
                        border: '1px solid rgba(212, 168, 83, 0.2)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 168, 83, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-elevated)';
                        e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.2)';
                    }}
                >
                    {commitShaShort}
                </a>
            )}
        </span>
    );
}
