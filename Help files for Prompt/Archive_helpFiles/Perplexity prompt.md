**Context and Background:**
- Project location on local PC: `C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard`
- GitHub repo: https://github.com/hrninfomeet-wq/Perplexity_dashboard
- Phase 1 (Authentication Consolidation) is now complete after troubleshooting with VS Code GitHub Copilot. The Copilot response confirming completion is attached (assume file name: `copilot-phase1-response.txt` for reference).
- Previous issues in Phase 1 implementation:
  - File name mismatches (e.g., your generated `auth-config.js` vs. project `auth.config.js`; `updated-authRoutes.js` vs. `authRoutes.js`).
  - Commands not optimized for VS Code Terminal/PowerShell, leading to errors.
- All generated files from you will be saved locally in: `C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\Help files for Prompt`
- Goal: Re-analyze the project post-Phase 1 corrections, plan and provide assets for Phase 2 (Database Integration, based on roadmap inferences: integrate MongoDB for storing user sessions, trade data, and analytics to enable persistent storage and real-time querying).

**Instructions for You (Perplexity):**
1. Re-analyze the project structure using the GitHub link and attached Copilot response. Confirm authentication files (e.g., `auth.config.js`, `authRoutes.js`) are aligned post-corrections.
2. Define Phase 2: Database Integration.
   - Use MongoDB (via Mongoose for Node.js) as it's suitable for the Express backend.
   - Key objectives: Set up DB connection, create schemas for users and trades, integrate with auth routes for session storage, add basic CRUD routes.
   - Ensure compatibility with existing tech (Node.js, Express, React).
3. Generate the following assets as text outputs (I'll save them locally):
   - `Phase2-Instructions.md`: Detailed step-by-step guide, including exact file paths, commands (optimized for VS Code Terminal/PowerShell, e.g., use `npm install` with no sudo), and verification steps.
   - Required code files (provide full content):
     - `db.config.js`: DB connection config.
     - `userModel.js`: Mongoose schema for users.
     - `tradeModel.js`: Mongoose schema for trades.
     - `updated-authRoutes.js`: Modified auth routes to integrate DB.
     - `dataRoutes.js`: New routes for CRUD on trades.
4. Avoid past mistakes: Use exact project file naming conventions (e.g., lowercase with dots like `auth.config.js`). Test commands mentally for Terminal/PowerShell compatibility.

**Communication Protocol for Iterative Collaboration with VS Code GitHub Copilot:**
Provide a self-contained prompt (below) that I can copy-paste directly into VS Code GitHub Copilot Chat. This prompt establishes a protocol where Copilot:
- Executes the Phase 2 plan step-by-step.
- Reports progress or errors via a generated report file saved to `C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\Help files for Prompt\phase2-error-report.txt`.
- If errors occur, Copilot pauses, writes the report (including error logs, attempted fixes), and instructs me to attach it to you (Perplexity) for analysis and revised instructions.
- Upon success, Copilot confirms "Phase 2 Database Integration - COMPLETE! ✅" and suggests testing commands.
- This creates an iterative loop: Copilot → Report → User attaches to Perplexity → Perplexity analyzes and provides fixes → New prompt for Copilot.

**Prompt for VS Code GitHub Copilot Chat:**

```
@workspace You are now in Agent Mode for Phase 2 of the Perplexity_dashboard project. Follow this structured protocol to implement Database Integration collaboratively with Perplexity. My project root is C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard. All helper files are in C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\Help files for Prompt.

Protocol Rules:
1. Read and execute instructions from the attached file: Phase2-Instructions.md (located in Help files for Prompt folder).
2. For each step, confirm understanding, then perform actions (e.g., create/edit files, run commands).
3. If a step requires running a command, provide the exact command for Terminal/PowerShell (e.g., npm install mongoose --save) and wait for my confirmation before proceeding (I’ll run it manually).
4. If any error occurs (e.g., dependency conflict, code syntax issue):
   - Attempt a basic fix once.
   - If unresolved, generate a report file: phase2-error-report.txt in the Help files for Prompt folder. Include: error message, file/line affected, your attempted fix, project state snapshot (e.g., relevant code snippets).
   - Instruct me: "Error encountered. Report saved to phase2-error-report.txt. Attach this to Perplexity for analysis and get revised instructions. Paste the new Perplexity prompt back here to continue."
5. Do not proceed past an error without resolution.
6. Upon completing all steps without errors, output: "Phase 2 Database Integration - COMPLETE! ✅" and provide verification commands (e.g., to test DB connection).
7. Be precise, use exact file names/paths from the project (e.g., src/config/auth.config.js), and assume Node.js/Express environment.

Start by confirming you have access to the workspace and the Help files folder via VS Code. Then, begin Step 1 from Phase2-Instructions.md.
``` 

**Next Steps for You (Perplexity):**
After providing the above, wait for my feedback. If I attach a report, analyze it and generate revised assets/prompt. This protocol ensures smooth, error-free iteration like a generative-agentic AI collaboration.