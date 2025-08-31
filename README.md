# Perplexity Trading Dashboard

Project: High-performance local trading dashboard that aggregates live market data, provides market movers, F&O analysis, scanners and trading recommendations for active traders.

## Project Objective
- Provide a local, reliable, and extensible trading dashboard for professional traders.
- Aggregate free live market data (NSE) with authenticated fallbacks (Flattrade) and a mock fallback to ensure UI availability.
- Preserve and centralize trading signal calculations in the backend while keeping the frontend modular and responsive.

## Architecture (High level)
- Frontend: React (Vite) app under `frontend/src` with modular components (Header, MajorIndicesStrip, Market movers, F&O, Scanners, Settings). Styling consolidated into `main-styles.css`.
- Backend: Node/Express app under `dashboard-backend` with routes and services for authentication, market data aggregation, multi-source failover and caching. Startup driven by `startup-enhanced.js` and automated by `start-project.bat`.
- Data sources: Primary = NSE Direct, Secondary = Flattrade (authenticated), Tertiary = Mock data.

## Current Status
- App runs locally via `start-project.bat` (frontend: http://localhost:3000, backend: http://localhost:5000).
- Implemented NSE Direct API integration, market-movers side-by-side view, multi-source failover, intelligent caching, and enhanced backend controllers.
- Consolidated styles and archived legacy/backup files under `/archive` to reduce clutter while preserving recovery options.

## Maturity
- Functional maturity: High — core features (data ingestion, failover, UI, signal calculations) are implemented and verified.
- Operational maturity: Medium — further hardening (tests, CI, DB persistence, Redis caching) recommended for production readiness.

## Recommendations & Improvements

Frontend
- Keep components small and focused; group by feature: `components/{indices,movers,scanners,settings}`.
- Adopt TypeScript for type safety and clearer contracts for props and service responses.
- Add unit tests (Jest + React Testing Library) for critical components (Market Movers, Header, Settings).
- Consider lazy-loading heavy components and memoization for performance.

Backend
- Introduce Redis for distributed caching and rate-limit counters.
- Add a simple persistence (SQLite/Postgres) for historical analysis and backtesting of signals.
- Add WebSocket support to push live updates to frontend to reduce polling.
- Harden security: input validation, helmet, stricter CORS, and secret rotation procedures.

Operational
- Add CI checks (lint, typecheck, unit tests) and a lightweight local integration test.
- Document run & debug commands in `README.md` (see run instructions below).

## Future Action Plan
Short-term (next 2 weeks)
- Add unit tests for backend services and two critical frontend components.
- Integrate Redis caching for market data and adjust cache TTLs.
- Add WebSocket endpoint and simple client to reduce polling.

Mid-term (1–3 months)
- Migrate to TypeScript (incremental conversion), add ESLint/Prettier enforcement.
- Add persistence for historical market data and signals (Postgres + migrations).
- Implement CI pipeline with GitHub Actions (lint, tests, build).

Long-term (3–6 months)
- Add plugin architecture for other markets (crypto, global equities) and exchange adapters.
- Add role-based access, telemetry, analytics dashboards and alerting.

## How to run (local)
1. From project root in PowerShell run: `.
un start-project.bat` or `.
un start-project.bat` (use `.
un` prefix) — the provided `start-project.bat` script starts backend and frontend in separate windows.
2. Backend: http://localhost:5000
3. Frontend: http://localhost:3000

## Recovery & Archive
- Legacy/backup files moved to `/archive` with `ARCHIVE-README.md` explaining contents and recovery steps. Restore by copying needed files back to original locations and updating imports.

## Contact
- Repository: https://github.com/hrninfomeet-wq/Perplexity_dashboard

---
*Last updated: September 1, 2025*
