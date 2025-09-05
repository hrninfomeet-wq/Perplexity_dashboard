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