import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmptyTestState({ title = 'No Active Test' }) {
    const navigate = useNavigate();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '70vh', textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ 
                    width: 72, height: 72, borderRadius: 20, 
                    background: 'rgba(212, 168, 83, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 24px auto',
                    border: '1px solid rgba(212, 168, 83, 0.2)'
                }}>
                    <FlaskConical size={36} style={{ color: 'var(--color-accent-gold)' }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>{title}</h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400, lineHeight: 1.6, margin: '0 auto 32px auto' }}>
                    Go to new test, you will get results in a unique way
                </p>
                <button
                    onClick={() => navigate('/tests/new')}
                    style={{
                        padding: '12px 28px',
                        background: 'var(--color-accent-gold)',
                        color: '#000',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(212, 168, 83, 0.25)',
                        transition: 'transform 0.2s ease, opacity 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    Run New Test
                </button>
            </motion.div>
        </div>
    );
}
