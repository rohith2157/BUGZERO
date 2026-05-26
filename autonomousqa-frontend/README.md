<div align="center">
  <h1>🖥️ Frontend — React Dashboard</h1>
  <p><strong>React 19 · Vite 7 · Framer Motion · Real-Time WebSocket</strong></p>
</div>

---

## What This Does

The frontend is a premium, production-grade React SPA with real-time test monitoring, interactive reports, and a cinematic landing page — all powered by live WebSocket events from the gateway.

## Pages

| Page | Route | Description |
|:---|:---|:---|
| **Landing** | `/` | Marketing page with 6 feature cards, stats, and CTA |
| **Use Cases** | `/use-cases` | Deep-dive into each AI agent with problem/solution/impact |
| **Login** | `/login` | JWT authentication with registration |
| **Dashboard** | `/dashboard` | Test history, analytics, and team stats |
| **New Test** | `/dashboard/new` | Configure & launch a test run |
| **Live Test** | `/dashboard/test/:id` | Real-time monitoring with self-healing log |
| **Report** | `/dashboard/report/:id` | Full report with visual regression section |
| **Compliance** | `/dashboard/compliance/:id` | WCAG compliance details |
| **Performance** | `/dashboard/performance/:id` | Core Web Vitals dashboard |
| **Playbooks** | `/dashboard/playbooks` | Saved test configurations |
| **Settings** | `/dashboard/settings` | Profile, team, API keys |

## Key Components

| Component | Purpose |
|:---|:---|
| `HygieneScoreGauge` | Animated circular score gauge |
| `StatusBadge` | Severity badges (critical/major/minor) |
| `GridBackground` | Animated grid backdrop |
| `WarpBackground` | WebGL warp shader background |
| `TiltCard` | 3D tilt-on-hover card effect |
| `CinematicFooter` | Animated footer with particle effects |
| `StarButton` | Premium CTA button with shimmer |

## Setup

```bash
npm install
npm run dev        # Starts on :5173
```

## Environment

The frontend connects to:
- **API Gateway:** `http://localhost:3000` (REST API)
- **WebSocket:** `http://localhost:3000` (Socket.io)
