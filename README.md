# VayuGuard — Urban Air Quality & Winter Smog Assistant

VayuGuard is a GenAI-powered full-stack web application that helps families and communities navigate severe winter smog and urban air pollution. It combines **live hyperlocal air quality telemetry** (Open-Meteo) with **Google Gemini structured outputs** (`@google/genai`) to deliver tailored low-emission daily routines, budget-conscious indoor air hacks, sustainable alternatives, and transparent personal health vs. community emission impact breakdowns.

---

## Problem Statement Alignment (Challenge 6)

| Prompt Requirement | Implementation | Source File(s) |
| :--- | :--- | :--- |
| **Navigate severe winter smog & urban air pollution** | Live US AQI, PM2.5, PM10, NO₂, O₃ telemetry, EPA risk classification, and 24-hour PM2.5 trend strip with computed safest 3-hour window. | `src/lib/aqi.ts`, `src/app/api/aqi/route.ts`, `src/components/AqiBanner.tsx` |
| **Tailored to location and lifestyle** | Accessible household profiler capturing city, vulnerable groups (children, elderly, asthma), commute mode, cooking fuel, ventilation, and purifier ownership. | `src/components/LifestyleForm.tsx`, `src/lib/schemas.ts` |
| **Low-emission daily routines, indoor air hacks & sustainable alternatives** | Server-side Gemini structured JSON generation producing 3 dedicated, schema-validated action categories. | `src/lib/genai.ts`, `src/app/api/plan/route.ts`, `src/components/ActionPlanTabs.tsx` |
| **Clearly explain the direct impact of choices** | Every recommendation includes quantified Personal Health Impact (`-% PM2.5 exposure`) and Community Emission Impact (`-kg CO₂e/week`) with plain-English cause-and-effect explanations. | `src/components/ImpactExplainer.tsx`, `src/components/ActionPlanTabs.tsx` |
| **Help families & communities** | One-click copyable **Community Smog Brief** formatted for family WhatsApp groups and local RWAs to coordinate low-emission actions. | `src/components/ActionPlanTabs.tsx` |

---

## Engineering Highlights Across the 6 Evaluation Criteria

1. **Code Quality**
   - Strict TypeScript (`"strict": true`) across frontend, API routes, and test suites with zero `any` types.
   - Clean separation of concerns across `src/lib/` (telemetry, AI client, schemas, rate limiting), `src/app/api/` (route handlers), and `src/components/` (UI).
2. **Security**
   - `GEMINI_API_KEY` is strictly server-side; `.env.example` documents required environment variables without committing secrets.
   - Strict Zod validation on both incoming API payloads and outgoing LLM JSON responses, plus prompt input sanitization against injection.
   - HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) configured in `next.config.ts`.
   - Memory-bounded per-IP rate limiting (`429 Too Many Requests` + `Retry-After`) and `Content-Type` enforcement (`415`).
3. **Efficiency**
   - Open-Meteo geocoding cached for 1 hour (`revalidate: 3600`) and AQI telemetry cached for 15 minutes (`revalidate: 900`) with HTTP `stale-while-revalidate`.
   - `AbortController` cancels in-flight city searches on rapid input changes to prevent race conditions.
   - Lightweight CSS-rendered 24-hour PM2.5 bar chart avoids heavy client charting bundles.
4. **Testing**
   - Comprehensive Vitest + React Testing Library suite in `tests/` covering AQI breakpoints, safest-window sliding math, Zod boundary/injection validation, `/api/plan` route error/rate-limit handling, and accessible form interactions.
5. **Accessibility (WCAG AA)**
   - Skip-to-main-content link, semantic landmarks (`<header>`, `<main>`, `<footer>`, `<section>`, `<article>`), and `aria-live="polite"` status updates.
   - Non-color-dependent AQI severity badges (paired icons + explicit risk labels).
   - Full WAI-ARIA Tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`) with `ArrowLeft`, `ArrowRight`, `Home`, and `End` keyboard navigation.
6. **Problem Statement Alignment**
   - End-to-end workflow directly answers every aspect of Challenge 6 without filler features.

---

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **GenAI:** `@google/genai` SDK (default model: `gemini-3.5-flash-lite`, configurable via `GEMINI_MODEL`)
- **Air Quality Data:** Open-Meteo Geocoding & Air Quality APIs (no API key required)
- **Validation & Testing:** Zod, Vitest, React Testing Library, jsdom

---

## Local Setup & Running

### 1. Install dependencies
```bash
npm install