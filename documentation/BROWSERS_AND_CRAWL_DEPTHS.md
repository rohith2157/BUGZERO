# 🌐 Browsers & Crawl Depths — Full Guide

> **AutonomousQA** lets you choose which browser engine to test with and how deep to crawl a website.  
> This guide explains every option with visuals.

---

## 🖥️ Browser Engines

AutonomousQA supports three real browser engines via **Playwright**. Each renders pages differently — just like real users on different devices.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BROWSER ENGINE COMPARISON                       │
├──────────────┬──────────────────────┬──────────────────────────────┤
│   ENGINE     │   POWERS             │   BEST FOR                   │
├──────────────┼──────────────────────┼──────────────────────────────┤
│  Chromium    │  Chrome, Edge,       │  Most websites · Default     │
│              │  Brave, Opera        │  choice · 65% of web users   │
├──────────────┼──────────────────────┼──────────────────────────────┤
│  Firefox     │  Mozilla Firefox     │  Privacy-focused apps ·      │
│              │  Firefox ESR         │  CSS Grid edge cases ·       │
│              │                      │  Web standards compliance    │
├──────────────┼──────────────────────┼──────────────────────────────┤
│  WebKit      │  Safari (iOS/macOS)  │  Apple platform testing ·    │
│              │  Mobile Safari       │  iOS web apps · App Store    │
│              │                      │  web views                   │
└──────────────┴──────────────────────┴──────────────────────────────┘
```

---

### 🔵 Chromium

```
  ┌─────────────────────────────────────────────────────┐
  │  CHROMIUM ENGINE                                    │
  │                                                     │
  │  V8 JavaScript Engine  ──▶  Fastest JS execution   │
  │  Blink Renderer        ──▶  Most modern CSS/HTML   │
  │  DevTools Protocol     ──▶  Deep automation hooks  │
  │                                                     │
  │  Market Share: ██████████████████████ 65%          │
  │  Speed:        ████████████████████░░ Fast         │
  │  Compatibility:████████████████████░░ Excellent    │
  └─────────────────────────────────────────────────────┘

  USE WHEN: Building for general public users
  DETECTS:  Chrome-specific rendering bugs, V8 JS errors
  SKIPS:    Safari-only issues, Firefox quirks
```

**Real-world example:**  
Your React app uses `backdrop-filter: blur()` — Chromium renders it fine, but it may look broken on Firefox. Testing only on Chromium would **miss** that bug.

---

### 🟠 Firefox

```
  ┌─────────────────────────────────────────────────────┐
  │  FIREFOX ENGINE (Gecko + SpiderMonkey)              │
  │                                                     │
  │  SpiderMonkey JS       ──▶  Different JS behavior  │
  │  Gecko Renderer        ──▶  Strict CSS standards   │
  │  Privacy Protections   ──▶  Blocks more trackers   │
  │                                                     │
  │  Market Share: ████░░░░░░░░░░░░░░░░░░ ~4%          │
  │  Speed:        ████████████████░░░░░░ Moderate     │
  │  Compatibility:██████████████████░░░░ Good         │
  └─────────────────────────────────────────────────────┘

  USE WHEN: Testing enterprise/developer tools (devs use Firefox more)
  DETECTS:  CSS flexbox/grid differences, JS engine quirks,
            stricter CORS/security policy rejections
  SKIPS:    Chrome-specific WebAPIs (e.g. Web Bluetooth)
```

**Real-world example:**  
Firefox enforces stricter `same-site` cookie policies. A login session that works in Chrome may **silently fail** in Firefox.

---

### ⬜ WebKit

```
  ┌─────────────────────────────────────────────────────┐
  │  WEBKIT ENGINE (Safari)                             │
  │                                                     │
  │  JavaScriptCore        ──▶  Older ES support       │
  │  WebKit Renderer       ──▶  iOS/macOS look         │
  │  Apple Pay / Touch ID  ──▶  Native integrations   │
  │                                                     │
  │  Market Share: ████████████████░░░░░░ ~19%         │
  │  Speed:        ██████████████░░░░░░░░ Moderate     │
  │  Compatibility:████████████████░░░░░░ Good         │
  └─────────────────────────────────────────────────────┘

  USE WHEN: Your users are on iPhone/iPad/Mac (Safari)
  DETECTS:  Missing -webkit- prefixes, iOS scroll bugs,
            date/time input differences, audioContext issues
  SKIPS:    Chrome/Firefox-specific features
```

**Real-world example:**  
`position: sticky` behaves differently on iOS Safari. A sticky navbar that works on Chrome may **jump or disappear** on iPhone.

---

### 📊 Side-by-Side Browser Matrix

```
                    CHROMIUM    FIREFOX    WEBKIT
                    ─────────────────────────────
JS Engine           V8          SpiderM.   JSCore
CSS Engine          Blink       Gecko      WebKit
Emoji rendering     ✅ Full     ✅ Full    ✅ Full
CSS Grid            ✅          ✅         ⚠️ Partial
WebP images         ✅          ✅         ✅
CSS :has()          ✅          ✅         ✅
scrollbar-gutter    ✅          ✅         ❌ No
Web Bluetooth       ✅          ❌ No      ❌ No
Hardwre accel.      ✅          ✅         ✅
AVIF images         ✅          ✅         ✅

✅ = Supported  ⚠️ = Partial  ❌ = Not supported
```

---

## 🕷️ Crawl Depth

Crawl depth controls **how many pages of the website** the AI engine visits and tests.

```
  YOUR WEBSITE STRUCTURE (example)
  
  https://myapp.com/                 ← Level 0 (root)
  ├── /about                         ← Level 1
  ├── /pricing                       ← Level 1
  ├── /dashboard                     ← Level 1
  │   ├── /dashboard/analytics       ← Level 2
  │   ├── /dashboard/settings        ← Level 2
  │   │   ├── /dashboard/settings/profile    ← Level 3
  │   │   ├── /dashboard/settings/billing    ← Level 3
  │   │   │   └── /settings/billing/history  ← Level 4
  │   │   └── /dashboard/settings/api-keys   ← Level 3
  │   └── /dashboard/reports         ← Level 2
  ├── /blog                          ← Level 1
  │   ├── /blog/post-1               ← Level 2
  │   ├── /blog/post-2               ← Level 2
  │   └── /blog/post-3               ← Level 2
  └── /docs                          ← Level 1
      ├── /docs/getting-started      ← Level 2
      └── /docs/api-reference        ← Level 2
```

---

### 🟢 Shallow — Top-level only

```
  ┌─────────────────────────────────────────────────────────────┐
  │  SHALLOW CRAWL                                              │
  │                                                             │
  │  Pages crawled: Up to 5                                     │
  │  Depth: Level 0 + Level 1 only                             │
  │  Time:   ~15–30 seconds                                     │
  │                                                             │
  │  https://myapp.com/          ◀── ✅ VISITED               │
  │  ├── /about                  ◀── ✅ VISITED               │
  │  ├── /pricing                ◀── ✅ VISITED               │
  │  ├── /dashboard              ◀── ✅ VISITED               │
  │  │   ├── /dashboard/analytics    ── ❌ SKIPPED            │
  │  │   └── /dashboard/settings     ── ❌ SKIPPED            │
  │  ├── /blog                   ◀── ✅ VISITED               │
  │  │   ├── /blog/post-1            ── ❌ SKIPPED            │
  │  └── /docs                       ── ❌ SKIPPED            │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  ✅ USE FOR: Quick sanity check · CI/CD pipelines · Landing pages
  ⚠️ MISSES:  Inner pages · Settings · User flows · Admin panels
```

**Best for:** Running on every code push to catch obvious regressions fast.

---

### 🟡 Standard — 3 levels deep

```
  ┌─────────────────────────────────────────────────────────────┐
  │  STANDARD CRAWL                                             │
  │                                                             │
  │  Pages crawled: Up to 20                                    │
  │  Depth: Levels 0 → 1 → 2 → 3                              │
  │  Time:   ~1–3 minutes                                       │
  │                                                             │
  │  https://myapp.com/              ◀── ✅ VISITED           │
  │  ├── /about                      ◀── ✅ VISITED           │
  │  ├── /pricing                    ◀── ✅ VISITED           │
  │  ├── /dashboard                  ◀── ✅ VISITED           │
  │  │   ├── /dashboard/analytics    ◀── ✅ VISITED           │
  │  │   ├── /dashboard/settings     ◀── ✅ VISITED           │
  │  │   │   ├── .../profile         ◀── ✅ VISITED           │
  │  │   │   ├── .../billing         ◀── ✅ VISITED           │
  │  │   │   │   └── .../history     ── ❌ SKIPPED (L4)       │
  │  │   │   └── .../api-keys        ◀── ✅ VISITED           │
  │  ├── /blog                       ◀── ✅ VISITED           │
  │  │   ├── /blog/post-1            ◀── ✅ VISITED           │
  │  │   └── /blog/post-2            ◀── ✅ VISITED           │
  │  └── /docs/getting-started       ◀── ✅ VISITED           │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  ✅ USE FOR: Pre-release testing · Sprint reviews · Weekly audits
  ⚠️ MISSES:  Very deeply nested pages (L4+) · Paginated content
```

**Best for:** Regular testing during development — catches ~90% of real user issues.

---

### 🔴 Deep — Entire site

```
  ┌─────────────────────────────────────────────────────────────┐
  │  DEEP CRAWL                                                 │
  │                                                             │
  │  Pages crawled: Up to 100                                   │
  │  Depth: All levels until max pages hit                      │
  │  Time:   ~5–20 minutes                                      │
  │                                                             │
  │  https://myapp.com/              ◀── ✅ ALL PAGES          │
  │  ├── ALL Level 1 pages           ◀── ✅ VISITED           │
  │  ├── ALL Level 2 pages           ◀── ✅ VISITED           │
  │  ├── ALL Level 3 pages           ◀── ✅ VISITED           │
  │  ├── ALL Level 4 pages           ◀── ✅ VISITED           │
  │  └── ... up to 100 pages total   ◀── ✅ VISITED           │
  │                                                             │
  │  Finds: Orphaned pages · Broken internal links ·           │
  │         Hidden admin routes · Deeply buried forms ·        │
  │         SEO dead ends · Legacy pages never cleaned up      │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  ✅ USE FOR: Pre-launch audits · Quarterly compliance scans ·
             Security sweeps · Full accessibility audits
  ⚠️ AVOID:  Very large sites (10k+ pages) — use domain filters
```

**Best for:** Full site audit before a major release or compliance deadline.

---

## ⚡ Speed & Coverage Comparison

```
               SHALLOW        STANDARD        DEEP
               ──────────────────────────────────────
Pages          Up to 5        Up to 20        Up to 100
Time           ~15-30s        ~1-3 min        ~5-20 min
Coverage       ██░░░░░░░░     █████░░░░░      ██████████
               10%            50%             100%

Defects found  Basic bugs     Most bugs       All bugs
CI/CD use      ✅ YES         ⚠️ Maybe        ❌ NO
Pre-release    ❌ Too small   ✅ YES          ✅ YES
Full audit     ❌ Too small   ❌ Too small    ✅ YES
```

---

## 🎯 Recommended Combinations

```
  ┌──────────────────────────────────────────────────────────────┐
  │  SCENARIO                   │  BROWSER    │  DEPTH          │
  ├──────────────────────────────┼─────────────┼─────────────────┤
  │  Every code push (CI)       │  Chromium   │  Shallow        │
  │  Daily dev check            │  Chromium   │  Standard       │
  │  Pre-release QA             │  Chromium   │  Standard       │
  │  Cross-browser check        │  Firefox    │  Standard       │
  │  iOS/Safari bug hunt        │  WebKit     │  Shallow        │
  │  Full launch audit          │  Chromium   │  Deep           │
  │  WCAG accessibility audit   │  Firefox    │  Deep           │
  │  GDPR compliance scan       │  Chromium   │  Deep           │
  │  E-commerce checkout test   │  WebKit     │  Standard       │
  │  SaaS app regression        │  Chromium   │  Standard       │
  └──────────────────────────────┴─────────────┴─────────────────┘
```

---

## 🧠 Quick Decision Tree

```
  START HERE
      │
      ▼
  Do you need results in < 1 min?
  ├── YES ──▶ Use SHALLOW depth
  └── NO
       │
       ▼
  Do you need full site coverage?
  ├── YES ──▶ Use DEEP depth
  └── NO  ──▶ Use STANDARD depth (default)
  
  
  Which browser?
      │
      ▼
  Are your users mainly on iPhone/iPad?
  ├── YES ──▶ Use WEBKIT
  └── NO
       │
       ▼
  Are you building a developer tool / enterprise app?
  ├── YES ──▶ Use FIREFOX
  └── NO  ──▶ Use CHROMIUM (default)
```

---

*Generated by AutonomousQA — AI-powered autonomous testing engine*
