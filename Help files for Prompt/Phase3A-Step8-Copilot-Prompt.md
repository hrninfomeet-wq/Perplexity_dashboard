@workspace You are now in Agent Mode for the Perplexity_dashboard project, reviewing Phase 3A Step 7 and advancing to Step 8. Follow this structured protocol in synergy with Perplexity AI. My project root is C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard. All helper files are in C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\Help files for Prompt.

Protocol Rules:
1. First, review the updated roadmap from: Overall-Roadmap-Updated.md (in Help files for Prompt folder).
2. Analyze Phase 3A Step 7 implementation: Verify files like tradingStrategiesEngine.js for efficiency (e.g., 60s scanning, ML/risk integration, crypto support). Apply fixes from roadmap (e.g., add live data handling, optimize paper trading stubs). Confirm backend stability; note frontend deferral and market closure handling.
3. Then, execute instructions for Phase 3A Step 8 from: Phase3A-Step8-Instructions.md (in Help files).
4. For each step, confirm understanding, perform actions (e.g., install deps, create/edit files, test with live/simulated data).
5. If commands needed, provide exact Terminal/PowerShell formats (e.g., npm install ws --save) and wait for my manual confirmation/execution.
6. If error occurs (e.g., WebSocket connection issues, data feed problems, execution conflicts):
   - Attempt one efficient fix (e.g., fallback to simulated data, add async error handling).
   - If unresolved, generate report: phase3a-step8-error-report.txt in Help files for Prompt. Include: error details, file/line, attempted fix, code snippets, project state.
   - Instruct me: "Error encountered. Report saved to phase3a-step8-error-report.txt. Attach to Perplexity AI for analysis, then paste revised Perplexity AI prompt here to continue."
7. Do not advance past errors.
8. Upon completion, output: "Phase 3A Step 8 Live Trading Integration - COMPLETE! ✅" and provide verification commands (e.g., test paper trading, portfolio tracking).
9. Be efficient: Use best practices (modular code, error-handling for market closures/feeds, optimization); stick to roadmap; exact paths/names (e.g., src/services/live/liveTradingEngine.js); build on Node.js/Express/MongoDB/Multi-API/ML/Risk/Strategies setup.

Enhanced Objectives for Phase 3A Step 8:
- Paper Trading Platform: Risk-free strategy validation with $100,000 simulated capital
- Live Data Integration: Real-time crypto feeds + NSE market hours detection and switching
- Execution Simulation Engine: Automated trade placement with realistic slippage/commission modeling
- Portfolio Management: Real-time position tracking with comprehensive P&L calculation
- Forward Testing Framework: Live strategy performance validation and optimization capabilities

Success Criteria:
- <2 seconds for complete trade execution simulation from signal to position update
- <100ms for real-time price updates and data feed processing
- <200ms for portfolio position and P&L recalculation
- Automatic NSE/crypto market switching based on trading hours (9:15 AM - 3:30 PM IST)
- Real-time enforcement of stop-loss, take-profit, and position sizing controls
- Complete integration with existing 5 strategies, ML enhancement, and risk management

Key Implementation Files Available in Help files for Prompt:
- Overall-Roadmap-Updated.md (Enhanced roadmap with live trading focus and timeline)
- Phase3A-Step8-Instructions.md (Complete 28-day implementation guide)
- live.config.js (Live trading configuration with paper trading and risk settings)
- tradeExecutionModel.js (Complete database schemas for live trading and performance tracking)
- liveTradingEngine.js (Core live trading orchestrator with crypto/NSE support)
- dataFeedManager.js (Real-time market data with WebSocket and API integration)

Core Components to Implement:
- Live Trading Engine: Central orchestrator managing paper trading, execution simulation, and performance tracking
- Data Feed Manager: Real-time crypto WebSocket feeds + NSE simulation with market hours detection
- Execution Simulator: Realistic trade execution with slippage, commission, and market impact modeling
- Portfolio Manager: Real-time position tracking with unrealized/realized P&L calculation
- Performance Analyzer: Live win rates, Sharpe ratios, drawdown monitoring, and strategy optimization

Testing Requirements:
- Test with crypto symbols (BTC, ETH, SOL, DOGE) for 24/7 operation during Indian market closure
- Validate paper trading session startup with $100,000 simulated capital
- Confirm real-time portfolio tracking and P&L calculation accuracy
- Test market hours switching between NSE and crypto automatically
- Validate all 5 strategies (scalping, swing, BTST, options, F&O) integration with live trading
- Ensure ML predictions and risk management work seamlessly with live execution simulation

Confirm workspace and Help files access. Start with roadmap review and Step 7 analysis, then proceed to Step 8 Step 1.