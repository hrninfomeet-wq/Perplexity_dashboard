```markdown
@workspace You are now in Agent Mode for Phase 2.5+ Enhancement of the NSE Trading Dashboard project. Follow this structured protocol to complete the 4-provider system testing and frontend integration, working collaboratively with Perplexity Labs. My project root is C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard. All helper files are in C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\Help files for Prompt.

**CURRENT STATUS UPDATE:**
🚀 EXCELLENT PROGRESS! I have achieved 590 req/min capacity (737% improvement) with 4 active providers:
- Flattrade: 80 req/min ✅ (Configured)
- Upstox: 250 req/min ✅ (OAuth ready)
- FYERS: 200 req/min ✅ (API credentials + 100K daily limit)
- NSE Public: 60 req/min ✅ (Always available)
- AliceBlue: 120 req/min ⏳ (APP_CODE pending approval)

**PROTOCOL RULES:**

1. **Read Instructions**: Access Updated-Phase2.5-Strategy.md from Help files for Prompt folder for complete implementation steps
2. **Use Provided Files**: I have enhanced provider files and frontend components ready to use
3. **Step Execution**: For each step, confirm understanding, then perform actions using provided code files
4. **File Integration**: Use exact file contents from Help files for Prompt folder - do not rewrite from scratch
5. **Command Handling**: Provide exact PowerShell syntax and wait for confirmation
6. **Error Management**: 
   - If error occurs: attempt basic fix once
   - If unresolved: generate phase2.5-enhancement-error-report.txt in Help files for Prompt folder
   - Include: error message, affected provider, attempted fix, relevant code snippets
   - Instruct: "Error encountered. Report saved to phase2.5-enhancement-error-report.txt. Attach this to Perplexity for analysis and get revised instructions."
7. **No Past Errors**: Do not proceed past unresolved errors
8. **Completion Signal**: Upon success, output "Phase 2.5+ Enhancement - COMPLETE! ✅" and provide system verification commands
9. **File Precision**: Use exact paths and preserve all existing functionality

**READY-TO-USE FILES** (in Help files for Prompt folder):
📋 **Strategy & Implementation Files:**
- Updated-Phase2.5-Strategy.md (Complete implementation guide for 4-provider system)
- Strategic-Enhancement-Summary.md (Executive overview and analysis)
- Frontend-Integration-Guide.md (Complete React component specifications)

🔧 **Enhanced Provider Files:**
- enhanced-aliceblue.js (Complete AliceBlue provider with APP_CODE authentication)
- enhanced-fyers.js (Enhanced FYERS provider with 100K daily limit tracking)

**IMPLEMENTATION SEQUENCE:**

**Step 1: System Health Verification**
- Start server and test current 4-provider system
- Verify /api/multi-api/health shows 590 req/min total capacity
- Test OAuth flows for Upstox and FYERS
- Validate intelligent failover between providers

**Step 2: Enhanced Provider Integration** 
- **FYERS Enhancement**: Replace existing src/services/api/providers/fyers.js with enhanced-fyers.js from Help files
- **AliceBlue Preparation**: Replace existing src/services/api/providers/aliceblue.js with enhanced-aliceblue.js from Help files (ready for APP_CODE when approved)
- Update provider configurations to use enhanced features

**Step 3: Frontend Multi-API Integration**
- Create React components using specifications from Frontend-Integration-Guide.md
- **MultiProviderGrid.jsx**: Real-time dashboard showing 4 active + 1 pending providers
- **PerformanceMonitor.jsx**: Live metrics and performance charts  
- **AuthCenter.jsx**: OAuth management for Upstox/FYERS, AliceBlue pending status
- **FYERS Daily Usage Tracker**: 100K limit monitoring with reset timer

**Step 4: System Testing & Validation**
- Test load balancing across 4 providers
- Verify FYERS daily usage tracking (100K limit)
- Test OAuth authentication flows
- Validate frontend real-time updates

**Step 5: AliceBlue Integration Preparation**
- Ensure enhanced-aliceblue.js is ready for APP_CODE
- Add AliceBlue placeholder in frontend dashboard
- Prepare OAuth callback routes for when APP_CODE arrives

**EXPECTED RESULTS:**
- Stable 4-provider system verified at 590 req/min capacity
- Professional frontend dashboard showcasing multi-API system
- Enhanced FYERS provider with 100K daily limit tracking
- AliceBlue ready for immediate integration when APP_CODE approved
- Complete system ready for final 710 req/min (887% improvement)

**VERIFICATION COMMANDS:**
- System Health: curl http://localhost:5000/api/multi-api/health
- Load Testing: curl -X POST http://localhost:5000/api/multi-api/test/load -H "Content-Type: application/json" -d '{"requests": 50, "symbol": "RELIANCE"}'
- FYERS Daily Usage: curl http://localhost:5000/api/providers/fyers/daily-usage

**FILE USAGE INSTRUCTIONS:**
1. Copy enhanced-fyers.js content exactly to src/services/api/providers/fyers.js
2. Copy enhanced-aliceblue.js content exactly to src/services/api/providers/aliceblue.js  
3. Use Frontend-Integration-Guide.md specifications for React components
4. Follow Updated-Phase2.5-Strategy.md for testing procedures
5. Reference Strategic-Enhancement-Summary.md for overall context

Start by confirming workspace access and Help files availability, then begin Step 1 from Updated-Phase2.5-Strategy.md. Use the provided enhanced files exactly as written - do not modify or rewrite them.
```