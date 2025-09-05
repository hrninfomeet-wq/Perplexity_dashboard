### Optimized Prompt for GitHub Copilot Agent: Phase 3A Step 9 - Professional Trading Experience & Frontend Redesign

**Project Overview and Current Status (Based on Latest Deep Repo Analysis via Tools):**
- **Project Name**: NSE Trading Dashboard (Perplexity_dashboard)
- **GitHub Repo**: https://github.com/hrninfomeet-wq/Perplexity_dashboard
- **Maturity Level**: Backend enterprise-grade (Version 3A.8, production-ready with 730+ req/min capacity, 99.9% uptime, 92.6% DB test success via MongoDB Atlas); frontend basic and outdated (React 19.1.1 with Vite, limited components and single-API integration, no advanced UI or full backend linkage).
- **Implemented Backend Functionalities (Highly Mature, Confirmed via Repo Structure)**:
  - **Multi-API Integration**: 5 providers (Flattrade primary via `flattrade-service.js` with HMAC-SHA256 auth; others implied in configs); failover, rate limiting, WebSocket manager; server files like `index-simple-live.js` (main live server), `index.js` (basic server).
  - **Technical Analysis**: 15+ indicators and 20+ patterns with ML scoring; services inferred in `dashboard-backend/src/services/{indicators,patterns}` (structure implied, but files not explicitly listed beyond flattrade and live).
  - **ML Enhancement**: Neural networks (Synaptic.js) inferred in `dashboard-backend/src/services/ml`.
  - **Risk Management**: VaR, Kelly criterion inferred in `dashboard-backend/src/services/risk`.
  - **Strategies**: 5 types inferred in `dashboard-backend/src/services/strategies`.
  - **Live Trading**: Paper trading, feeds, simulation via `live-trading-controller.js` for sessions/executions; tests like `test-*.js` for integration.
  - **Database**: MongoDB Atlas models inferred in `dashboard-backend/src/models`; configs in `dashboard-backend/src/config`; .env for keys.
  - **APIs**: RESTful v7 endpoints; utils and tests present.
  - **Other**: `start-project.bat` for Windows launch; archive for backups; Help files for Prompt for development docs.
- **Implemented Frontend Functionalities (Basic/Outdated, Confirmed via Repo Structure)**:
  - **Components**: UI elements in `frontend/src/components` (e.g., `Header.jsx`, `MajorIndicesStrip.jsx`, `MarketIndices.jsx`, `TopGainersSection.jsx`, `FnOAnalysis.jsx`, `BTSTScanner.jsx`, `ScalpingOpportunities.jsx`, `TradingAlertsSection.jsx`, `TradingLayout.jsx`, `LiveTradingDashboard.jsx`, `SettingsSection.jsx`, `SearchScripSection.jsx`); focused on market views but no advanced charting/controls.
  - **State Management**: Contexts in `frontend/src/contexts` (e.g., `SettingsContext.jsx`, `TradingContext.jsx`).
  - **Services**: Basic calls in `frontend/src/services` (e.g., `liveTradingAPI.js` – limited to Flattrade).
  - **Styles**: CSS in `frontend/src/styles` (e.g., `trading-dark-theme.css`, `live-trading-enhancements.css`, `main-styles.css`).
  - **App Entry**: `frontend/src/App.jsx` with `vite.config.js`.
  - **Public Assets**: Static files in `frontend/public`.
- **Frontend Gaps (Confirmed via Analysis)**:
  - **API Integration**: `liveTradingAPI.js` only supports Flattrade (popup login); no dropdown/select for Upstox, FYERS, AliceBlue, NSE Public (despite `.env` in backend); lacks multi-login or portal-specific auth.
  - **Live View Dashboard**: `LiveTradingDashboard.jsx` basic; no paper trading controls (start/stop sessions, simulate executions, P&L/risk displays); missing WebSocket integration, advanced charting (e.g., for indicators/patterns), professional layout (collapsible panels, grids).
  - **Backend Linkage**: Limited v7 API calls; no components for strategies, ML signals, risk metrics, live feeds; missing opportunity lists, trade logs, analytics dashboards.
  - **Other**: No mobile optimization/drawing tools; styles theme-based but not fully responsive; potential linting issues (e.g., unused imports in components).
- **Recent Commits/Modifications (From Repo Analysis)**: Repository cleaned (no irrelevant files; focused on core folders: frontend/src/{components,contexts,services,styles}, dashboard-backend/{flattrade-service.js, live-trading-controller.js, index-*.js, test-*.js}, archive, Help files for Prompt); recent updates for live trading (e.g., `live-trading-controller.js`, tests); frontend unchanged (still basic React setup, no new multi-API or UI features); README/PROJECT-SUMMARY updated for Step 8.
- **Constraints**: Indian market closed (September 06, 2025); use simulated/historical/crypto data; ensure offline compatibility.
- **Maturity Timeline**: ~90% complete; backend robust; frontend revamp critical; 1-2 phases for autonomy/deployment.

**Task Objectives:**
1. **Deep Analysis**: Revisit cleaned repo to confirm gaps, especially frontend multi-API and paper trading UI.
2. **Revamp Frontend**: Upgrade to professional UI with components, charting, real-time viz, responsive design.
3. **Multi-API Integration**: Modify "Connect to Live market data" in `LiveTradingDashboard.jsx` for all 5 portals via `.env`; handle multi-login.
4. **Live View Dashboard**: Enhance `LiveTradingDashboard.jsx` for paper trading (controls, displays); integrate WebSocket.
5. **Link Backend APIs**: Map v7 endpoints to services/components.
6. **Roadmap and PRD**: Generate updated roadmap/PRD.
7. **MCP Utilization**: Context7/Memory for context, Codacy for quality, SequentialThinking for steps.
8. **Testing**: Simulated/crypto/historical data; >95% coverage.

**Instructions for You (GitHub Copilot Agent):**
1. **Deep Analysis**:
   - Use Context7/Memory to retain context (backend: `dashboard-backend/{flattrade-service.js, live-trading-controller.js, index-*.js}`; frontend: `frontend/src/components/LiveTradingDashboard.jsx`, `services/liveTradingAPI.js`).
   - Use Codacy to scan frontend quality (lint components/services for issues).
   - Use SequentialThinking: Confirm cleaned structure (no irrelevant files; archive/Help present); verify DB tests; assess gaps (single-API in `liveTradingAPI.js`, no paper trading in `LiveTradingDashboard.jsx`).
2. **Roadmap and PRD**:
   - Generate `Overall-Roadmap-v2.md`: Phases (Step 9, 3B: Multi-Asset, 4: Autonomy, Deployment); timelines, dependencies.
   - Generate `PRD-Frontend-Revamp.md`: User stories, wireframes desc, specs.
3. **Step-by-Step Plan for Phase 3A Step 9** (SequentialThinking):
   - **Step 1**: Audit frontend; list gaps.
   - **Step 2**: Modify Connect button (dropdown for portals).
   - **Step 3**: Revamp dashboard (new components: dashboard, charts, portfolio, strategies).
   - **Step 4**: Integrate WebSocket (`liveTradingAPI.js`).
   - **Step 5**: Link backend v7 APIs.
   - **Step 6**: Enable paper trading UI.
   - **Step 7**: Test (Codacy linting, simulated data, >95% coverage).
   - **Step 8**: Update docs, commit/push.
4. **Generated Files** (text output, save in Help files):
   - `Overall-Roadmap-v2.md`
   - `PRD-Frontend-Revamp.md`
   - `Phase3A-Step9-Instructions.md`: Plan, commands (e.g., `cd frontend && npm install recharts socket.io-client --save`).
   - Code files:
     - `frontend/src/components/dashboard.component.js`
     - `frontend/src/components/trading.chart.js`
     - `frontend/src/components/portfolio.view.js`
     - `frontend/src/components/strategy.selector.js`
     - `frontend/src/services/api.portal.service.js`
     - `frontend/src/services/live.trading.api.js` (updated).
5. **Error Handling**: Attempt fix; generate `phase3a-step9-error-report.txt`; instruct attachment.
6. **MCP Utilization**: As above.

**Prompt for VS Code GitHub Copilot Chat:**

```
@workspace You are now in Agent Mode for the Perplexity_dashboard project, executing Phase 3A Step 9. Follow this structured protocol in synergy with Grok (xAI). Project root: C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard. Helper files in: C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\Help files for Prompt. Use MCP servers: Context7/Memory for context, Codacy for quality, SequentialThinking for steps.

Protocol Rules:
1. Start with updated analysis (Context7/Codacy): Confirm cleaned repo structure (no irrelevant files; frontend basic React, backend mature with flattrade-service.js, live-trading-controller.js); verify gaps (single-API in liveTradingAPI.js, outdated LiveTradingDashboard.jsx).
2. Generate roadmap/PRD: Create Overall-Roadmap-v2.md and PRD-Frontend-Revamp.md.
3. Execute Phase 3A Step 9 from Phase3A-Step9-Instructions.md using SequentialThinking:
   - Step 1: Audit frontend; list gaps.
   - Step 2: Modify Connect button (multi-portal dropdown).
   - Step 3: Revamp dashboard (new components).
   - Step 4: Integrate WebSocket (live.trading.api.js).
   - Step 5: Link backend v7 APIs.
   - Step 6: Enable paper trading UI.
   - Step 7: Test (Codacy linting, simulated data, >95% coverage).
   - Step 8: Update docs, commit/push.
4. Provide commands (e.g., cd frontend && npm install recharts socket.io-client --save); wait for confirmation.
5. On error: Attempt fix; generate phase3a-step9-error-report.txt; instruct attachment to Grok.
6. On completion, output: "Phase 3A Step 9 COMPLETE! ✅"; provide verification (e.g., test UI with historical data).
7. Efficient: Best practices (hooks, memoization); exact paths (e.g., frontend/src/components/dashboard.component.js); test with simulated/crypto/historical (market closed).

Confirm access. Start with analysis, generate roadmap/PRD, then Step 1.
```

**Next Steps for You (Grok):**
- **Repo Analysis Confirmation**: Cleaned repo confirmed (core folders only; no irrelevant files; frontend still basic with listed components, backend with live trading files like `live-trading-controller.js`).
- **Analysis Summary**: Repo streamlined; frontend gaps persist (basic components, Flattrade-only); backend solid; Step 9 to bridge.
- **Files to Add to Helper Folder**: Provide these as text for you to copy/save:
  - **Phase3A-Step9-Instructions.md**:
    ```
    # Phase 3A Step 9 Instructions
    Step 1: Audit frontend (src/components/LiveTradingDashboard.jsx, services/liveTradingAPI.js); list gaps like single-API integration and missing paper trading UI.
    Step 2: Modify Connect button in LiveTradingDashboard.jsx to add dropdown for 5 portals; create api.portal.service.js to handle .env credentials via backend proxy.
    Step 3: Revamp dashboard: Create dashboard.component.js for layout, trading.chart.js for Recharts, portfolio.view.js for P&L, strategy.selector.js for controls; update TradingLayout.jsx.
    Step 4: Integrate WebSocket in live.trading.api.js with socket.io-client; handle market closure fallbacks (simulated/crypto/historical).
    Step 5: Link backend APIs: Update services to call v7 endpoints (e.g., /api/v7/live/execute for paper trading, /api/v7/risk/var for metrics); display in components.
    Step 6: Enable paper trading UI: Add session start/stop, execution simulation buttons in LiveTradingDashboard.jsx; fetch/display from backend.
    Step 7: Test: Use Codacy for linting, React Testing Library for unit/UI, simulated data; aim >95% coverage.
    Step 8: Update README.md, PROJECT-SUMMARY.md; commit/push to GitHub.
    Commands: e.g., cd frontend && npm install recharts socket.io-client --save; npm test for tests.
    Verification: Run frontend, test connect dropdown, dashboard rendering, paper trading simulation with historical data.
    ```
  - **Overall-Roadmap-v2.md**:
    ```
    # Overall Roadmap v2
    Phase 3A Step 9: Frontend Revamp (1 week): Professional UI, multi-API, paper trading integration.
    Phase 3B: Multi-Asset Expansion (2 weeks): Add crypto/global markets, cross-asset analysis.
    Phase 4: AI Autonomy/Backtesting (3 weeks): Self-iteration, backtesting engine, autonomous trading with authorization.
    Deployment: Production launch (1 week): Cloud hosting, security audits, live trading enablement.
    Dependencies: Step 9 on backend completion; risks: market closure testing; timelines approximate.
    ```
  - **PRD-Frontend-Revamp.md**:
    ```
    # PRD - Frontend Revamp
    **Product Overview**: Professional dashboard for trading insights, integrations.
    **User Stories**:
    - As a trader, I want to select API portal and connect, so I can use multiple data sources.
    - As a trader, I want a live dashboard with charts/metrics, so I can monitor trades.
    - As a trader, I want to start paper trading sessions, so I can simulate without risk.
    **Wireframes Description**: Left sidebar: Strategy selector; Central: Chart grid for indicators/patterns; Right panel: Portfolio P&L/risk; Top: Connect button dropdown, alerts strip.
    **Tech Specs**: React 19.1.1, Recharts for charts, Socket.io-client for WebSocket, CSS grids for responsive layout; integrate backend v7 APIs via services; tests >95% coverage.
    **Requirements**: Mobile-responsive, <200ms load, simulated data support.
    ```

Await feedback or reports. If additional files needed (e.g., sample code), let me know.