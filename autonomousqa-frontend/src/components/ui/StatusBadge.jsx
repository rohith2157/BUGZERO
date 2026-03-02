import { severityConfig } from '../../data/mockData';

export default function StatusBadge({ status, size = 'md' }) {
    const configs = {
        completed: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', label: 'Completed' },
        running: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', label: 'Running' },
        failed: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', label: 'Failed' },
        queued: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)', label: 'Queued' },
        testing: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', label: 'Testing' },
        tested: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', label: 'Tested' },
        active: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', label: 'Active' },
        inactive: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)', label: 'Inactive' },
        revoked: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', label: 'Revoked' },
        good: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', label: 'Good' },
        'needs-improvement': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', label: 'Needs Improvement' },
        poor: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', label: 'Poor' },
        ...severityConfig,
    };

    const config = configs[status] || configs['queued'];
    const padding = size === 'sm' ? '2px 8px' : '4px 10px';
    const fontSize = size === 'sm' ? 11 : 12;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding,
            fontSize,
            fontWeight: 600,
            color: config.color,
            background: config.bg,
            border: `1px solid ${config.border}`,
            borderRadius: 'var(--radius-full)',
            whiteSpace: 'nowrap',
        }}>
            {(status === 'running' || status === 'testing') && (
                <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: config.color,
                    animation: 'pulse-glow 1.5s ease-in-out infinite',
                    flexShrink: 0,
                }} />
            )}
            {config.label}
        </span>
    );
}
