import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, FlaskConical, Eye, EyeOff } from 'lucide-react';
import { auth as authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import TextBlockAnimation from '../components/ui/text-block-animation';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { document.title = mode === 'login' ? 'Sign In — AutonomousQA' : 'Create Account — AutonomousQA'; }, [mode]);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    orgName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await authApi.login({ email: form.email, password: form.password });
      } else {
        result = await authApi.register({
          email: form.email,
          password: form.password,
          name: form.name,
          orgName: form.orgName || undefined,
        });
      }

      setAuth(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Quick demo login
  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login({
        email: 'rohith@autonomousqa.io',
        password: 'password123',
      });
      setAuth(result.user, result.token);
      navigate('/dashboard');
    } catch {
      // Fallback: skip auth and go directly (for when backend isn't running)
      setAuth(
        { id: 'demo', email: 'rohith@autonomousqa.io', name: 'Rohith Kumar', role: 'owner' },
        'demo-token'
      );
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 44px',
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border var(--transition-fast)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient orbs — gold */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,83,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 400,
          padding: 36,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20,
          backdropFilter: 'blur(24px)',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-gold)',
          }}>
            <FlaskConical size={17} color="var(--on-accent)" />
          </div>
          <TextBlockAnimation animateOnScroll={false} delay={0.3} blockColor="var(--color-accent-gold)" duration={0.5}>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
              Autonomous<span style={{ color: 'var(--color-accent-gold)' }}>QA</span>
            </span>
          </TextBlockAnimation>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          padding: 3,
        }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', transition: 'all var(--transition-fast)',
                background: mode === m ? 'var(--color-bg-elevated)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="name"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Organization (optional)"
                    value={form.orgName}
                    onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-tertiary)' }} />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-tertiary)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 12, top: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: 2,
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              marginBottom: 16,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-sm)',
              color: '#EF4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <TextBlockAnimation animateOnScroll={false} delay={0.6} blockColor="var(--color-accent-gold)" duration={0.5}>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '13px 0', fontSize: 14, fontWeight: 700,
                background: 'var(--color-accent-gold)', color: 'var(--on-accent)',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 0 20px rgba(212,168,83,0.2)',
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </TextBlockAnimation>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '20px 0', color: 'var(--text-tertiary)', fontSize: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Demo login */}
        <TextBlockAnimation animateOnScroll={false} delay={0.8} blockColor="var(--color-accent-purple)" duration={0.5}>
          <motion.button
            onClick={handleDemoLogin}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '12px 0', fontSize: 13, fontWeight: 600,
              background: 'rgba(212, 168, 83, 0.06)',
              border: '1px solid rgba(212, 168, 83, 0.15)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-accent-gold)',
              cursor: 'pointer',
            }}
          >
            🚀 Quick Demo Login
          </motion.button>
        </TextBlockAnimation>
      </motion.div>
    </div>
  );
}
