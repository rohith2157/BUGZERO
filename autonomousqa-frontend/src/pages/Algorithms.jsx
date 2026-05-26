import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Brain, Network, GitBranch, BarChart3, Fingerprint, Eye, Cpu, Shield, Zap, Server, Globe, Database, Code2, Layers } from 'lucide-react';
import { AnimatedThemeToggle } from '../components/ui/animated-theme-toggle';
import { StarButton } from '../components/ui/star-button';
import { CinematicFooter } from '../components/ui/motion-footer';
import useThemeStore from '../store/themeStore';
import { useState, useEffect } from 'react';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

const implAlgos = [
  { icon: Network, title: 'Breadth-First Search (BFS)', accent: '#4285F4',
    desc: 'Our crawler uses a classic BFS with a FIFO queue and visited set. It explores every link at depth 0 before depth 1, mapping the shallow surface first.',
    details: ['FIFO Queue: queue = [(url, 0)]', 'Visited Set: O(1) duplicate detection', 'Depth-limited traversal (shallow=1, standard=3, deep=∞)', 'Same-domain filtering via urlparse'] },
  { icon: BarChart3, title: 'PageRank Algorithm', accent: '#34A853',
    desc: 'After crawling, the scheduler builds a Directed Graph (nx.DiGraph) and runs nx.pagerank(G, alpha=0.85) — the exact math Google uses.',
    details: ['Damping factor α = 0.85 (Google standard)', 'NetworkX DiGraph with no self-loops', 'Iterative power method convergence', 'Returns importance scores 0.0 → 1.0'] },
  { icon: GitBranch, title: 'Degree Centrality (Fallback)', accent: '#FBBC04',
    desc: 'If PageRank fails to converge (PowerIterationFailedConvergence), Degree Centrality counts raw connections to rank pages.',
    details: ['Graceful degradation pattern', 'Counts inbound + outbound edges', 'No iterative computation needed', 'Always converges — zero failure risk'] },
  { icon: Layers, title: 'Greedy Sort + Semantic Heuristics', accent: '#EA4335',
    desc: 'Raw PageRank is boosted with semantic heuristics. Auth pages get +0.15, Forms +0.12, Settings +0.10, ensuring critical paths test first.',
    details: ['Auth pages: +0.15 boost (security critical)', 'Form pages: +0.12 boost (input validation)', 'Settings: +0.10, Dashboard: +0.08', 'Greedy descending sort by boosted score'] },
];

const coreAlgos = [
  { icon: Fingerprint, title: 'Semantic Fingerprinting', accent: 'var(--color-accent-gold)',
    desc: 'Creates a multi-dimensional fingerprint of every DOM element — visual position, surrounding text, ARIA roles, DOM depth. When UI changes, fuzzy-matching finds moved elements and self-heals tests with confidence thresholds.' },
  { icon: Shield, title: 'Risk Model Algorithm', accent: 'var(--color-accent-purple)',
    desc: 'Weighted scoring: Change Frequency + Defect History + User Traffic + Business Criticality. Generates a dynamic priority queue so the most dangerous areas are tested first.' },
  { icon: Eye, title: 'Visual Semantic Diffing', accent: 'var(--color-accent-cyan)',
    desc: 'Computer Vision model compares the meaning of visual changes instead of pixel-by-pixel. Classifies cosmetic noise vs. real layout-breaking defects automatically.' },
  { icon: Globe, title: 'DOM Traversal & Exploration', accent: 'var(--color-accent-emerald)',
    desc: 'LangChain-based autonomous agent recursively explores websites. Reads the DOM, identifies interactive elements, decides what actions to take (click, type, scroll) to map all state transitions.' },
  { icon: Cpu, title: 'Defect Classification', accent: 'var(--color-accent-gold-bright)',
    desc: 'LLM (GPT-4o) processes console logs, network traces, and visual snapshots to classify bugs by type and assign severity scores automatically.' },
];

const archLayers = [
  { title: 'Frontend', tech: 'React + Tailwind + Vite', icon: Code2, accent: '#4285F4',
    rules: ['Fully decoupled SPA — handles only state (Zustand) and UI rendering', 'Communicates exclusively via REST APIs and WebSocket connections'] },
  { title: 'API Gateway', tech: 'Express.js + Node.js', icon: Server, accent: '#34A853',
    rules: ['Central orchestrator — auth, PostgreSQL connections, request routing', 'WebSocket streams real-time test execution data to frontend'] },
  { title: 'AI Core Engine', tech: 'Python FastAPI + Playwright + LangChain', icon: Brain, accent: '#EA4335',
    rules: ['Heavy lifting — best Python AI ecosystem with Playwright automation', 'Total isolation — never touches DB directly, reports via internal HTTP'] },
];

const pipeline = [
  { step: 1, label: 'BFS Crawl', color: '#4285F4' },
  { step: 2, label: 'PageRank Score', color: '#34A853' },
  { step: 3, label: 'Greedy Sort', color: '#FBBC04' },
  { step: 4, label: 'Test Loop', color: '#EA4335' },
  { step: 5, label: 'AI Report', color: '#681FF8' },
];

export default function Algorithms() {
  const navigate = useNavigate();
  const isDark = useThemeStore(s => s.theme) === 'dark';
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const S = (p) => ({ ...p, style: { ...p.style } }); // helper

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', position: 'relative', overflowX: 'hidden' }}>
      <div className="grid-pattern" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(66,133,244,0.06) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(66,133,244,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(234,67,53,0.05) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(234,67,53,0.03) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 20px', pointerEvents: 'none' }}>
        <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
          style={{ margin: '0 auto', pointerEvents: 'auto', width: '100%', maxWidth: isScrolled ? 896 : 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isScrolled ? '12px 24px' : '16px 12px',
            background: isScrolled ? 'var(--glass-navbar)' : 'transparent',
            backdropFilter: isScrolled ? 'blur(32px) saturate(1.5)' : 'none',
            border: isScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
            borderRadius: isScrolled ? 24 : 12, transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-gold)' }}>
              <FlaskConical size={15} color="var(--on-accent)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Bug<span style={{ color: 'var(--color-accent-gold)' }}>Zero</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AnimatedThemeToggle />
            <StarButton title="Launch App" onClick={() => setTimeout(() => navigate('/login'), 400)} />
          </div>
        </motion.nav>
      </div>

      {/* Hero */}
      <section style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '160px 24px 60px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'var(--glass-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 32, backdropFilter: 'blur(10px)' }}>
            <ArrowLeft size={15} /> Back to Home
          </motion.button>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)', fontSize: 12, fontWeight: 600, color: '#4285F4', marginBottom: 28 }}>
            <Brain size={14} /> The Engine Under the Hood
          </motion.div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.045em', maxWidth: 800, margin: '0 auto 20px' }}>
            <span style={{ color: 'var(--text-primary)' }}>Algorithms that </span>
            <span style={{ background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>think.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            9 algorithms. 3 architectural layers. 1 autonomous pipeline.<br/>Every line of code is built to replace manual testing forever.
          </p>
        </motion.div>
      </section>

      {/* Pipeline Visualization */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
          {pipeline.map(({ step, label, color }, i) => (
            <motion.div key={step} variants={fadeUp} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}12`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color }}>{step}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.05em' }}>{label}</span>
              </div>
              {i < pipeline.length - 1 && <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${color}, ${pipeline[i+1].color})`, margin: '0 8px', marginBottom: 20, opacity: 0.5 }} />}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== IMPLEMENTED ALGORITHMS (The 4 real ones) ===== */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(52,168,83,0.08)', border: '1px solid rgba(52,168,83,0.2)', fontSize: 12, fontWeight: 600, color: '#34A853', marginBottom: 20 }}>
            <Code2 size={14} /> Live in Production
          </motion.div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 10, color: 'var(--text-primary)' }}>
            Implemented <span style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Algorithms</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>These 4 algorithms are running in the ai-core backend right now, powering every test run.</p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {implAlgos.map(({ icon: Icon, title, accent, desc, details }) => (
            <motion.div key={title} variants={fadeUp} whileHover={{ y: -6, borderColor: `${accent}50` }}
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}15`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>{desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {details.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                    <div style={{ width: 4, height: 4, borderRadius: 2, background: accent, flexShrink: 0 }} />
                    {d}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CORE ALGORITHMIC MODELS ===== */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.18)', fontSize: 12, fontWeight: 600, color: 'var(--color-accent-gold)', marginBottom: 20 }}>
            <Brain size={14} /> AI-Powered Intelligence
          </motion.div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 10, color: 'var(--text-primary)' }}>
            Core Algorithmic <span style={{ background: 'linear-gradient(135deg, var(--color-accent-gold), var(--color-accent-gold-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Models</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>5 AI-driven algorithmic models powering the 6 core features of BugZero.</p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {coreAlgos.map(({ icon: Icon, title, accent, desc }) => (
            <motion.div key={title} variants={fadeUp} whileHover={{ y: -4, borderColor: `${accent}50` }}
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 20px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}12`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={18} style={{ color: accent }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== ARCHITECTURE ===== */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', fontSize: 12, fontWeight: 600, color: 'var(--color-accent-purple)', marginBottom: 20 }}>
            <Server size={14} /> System Design
          </motion.div>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 10, color: 'var(--text-primary)' }}>
            3-Layer Microservices <span style={{ background: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Architecture</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>Total separation of concerns — AI processing never blocks the API, and the UI stays blazing fast.</p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {archLayers.map(({ title, tech, icon: Icon, accent, rules }, i) => (
            <motion.div key={title} variants={fadeUp} whileHover={{ y: -6, borderColor: `${accent}50` }}
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px 22px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '0.15em' }}>LAYER {i + 1}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 4px' }}>{title}</h3>
              <p style={{ fontSize: 11, color: accent, fontFamily: 'monospace', fontWeight: 600, marginBottom: 14 }}>{tech}</p>
              {rules.map((r, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: accent, marginTop: 5, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{r}</p>
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Summary Stats */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { v: '4', l: 'Implemented Algorithms', c: '#4285F4' },
            { v: '5', l: 'AI Algorithmic Models', c: '#34A853' },
            { v: '3', l: 'Architecture Layers', c: '#FBBC04' },
            { v: '5', l: 'Pipeline Stages', c: '#EA4335' },
          ].map(({ v, l, c }) => (
            <motion.div key={l} variants={fadeUp} style={{ textAlign: 'center', padding: '28px 16px', background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: c, letterSpacing: '-0.04em', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, fontWeight: 600 }}>{l}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <CinematicFooter onNavigate={(path) => navigate(path)} />
    </div>
  );
}
