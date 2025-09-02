# NSE Trading Dashboard

> Professional-grade real-time market analysis platform with unified authentication and database integration

[![Phase 1 Complete](https://img.shields.io/badge/Phase%201-Complete-brightgreen.svg)](https://github.com/hrninfomeet-wq/Perplexity_dashboard)
[![Authentication](https://img.shields.io/badge/Auth%20System-Unified-blue.svg)](https://github.com/hrninfomeet-wq/Perplexity_dashboard)
[![Database](https://img.shields.io/badge/MongoDB-Integrated-green.svg)](https://mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v24.6.0-green.svg)](https://nodejs.org/)
[![NSE API](https://img.shields.io/badge/Flattrade%20API-Authenticated-orange.svg)](https://flattrade.in/)

## Quick Start

1. **Clone & Setup**
   ```bash
   git clone https://github.com/hrninfomeet-wq/Perplexity_dashboard.git
   cd Perplexity_dashboard
   ```

2. **One-Click Launch**
   ```bash
   .\start-project.bat
   ```

3. **Access Dashboard**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## ✅ Current Status (September 2, 2025)

**Phase 1: COMPLETED** - Unified Authentication System
- ✅ Complete Express.js authentication flow operational
- ✅ MongoDB database integration ready
- ✅ Centralized token management with encryption
- ✅ Auto-refresh and session management
- ✅ All 7 authentication endpoints functional
- ✅ Enhanced middleware and security features
- ✅ Backup components preserved for rollback safety

**Phase 2: READY** - Advanced Market Calculations & UI Enhancement
- 📋 Database-driven trading analysis features
- 📋 Enhanced frontend UI improvements  
- 📋 Real-time trading signal algorithms
- 📋 Advanced market sentiment analysis

## Key Features

- 🔐 **Unified Authentication** - Complete Flattrade API integration with auto-refresh
- 🗄️ **Database Integration** - MongoDB with user sessions and trade tracking
- � **Professional Trading Interface** - Bloomberg/Reuters style UI (Phase 2)
- ⚡ **Real-Time Analytics** - Market movers, F&O analysis, BTST scanning (Phase 2)
- 🎯 **Smart Session Management** - Encrypted token storage with automatic refresh
- 🛡️ **Enhanced Security** - Comprehensive middleware and error handling
- � **Auto-Recovery** - Circuit breaker pattern with graceful fallbacks

## Architecture

```
Frontend (React 19.1.1)    Backend (Node.js/Express)       Database & Auth
┌─────────────────────┐    ┌────────────────────────┐      ┌──────────────┐
│ Enhanced UI (Phase2)│    │ Unified Auth Service   │      │ MongoDB      │
│ Market Movers       │◄──►│ Token Management       │  ◄──►│ User Sessions│
│ F&O Analysis        │    │ Auto-Refresh System    │      │ Trade Data   │
│ BTST Scanner        │    │ Circuit Breaker        │      │ Preferences  │
│ Trading Alerts      │    │ Enhanced Security      │      ├──────────────┤
└─────────────────────┘    └────────────────────────┘      │ Flattrade API│
                                                           │ Integration  │
                                                           └──────────────┘
```

## Performance

- **Response Time**: ~200-300ms average
- **Cache Hit Rate**: ~75% efficiency
- **API Optimization**: 80 calls/min (reduced from 750+)
- **Memory Usage**: Backend ~105MB, Frontend ~50MB
- **Error Rate**: <0.5% with circuit breaker protection

## Future Roadmap

### 📈 Phase 1: Core Enhancements
- TypeScript migration
- WebSocket real-time updates
- Database integration
- Advanced charting

### 🌍 Phase 2: Multi-Asset Platform
- Cryptocurrency integration (Binance, CoinGecko)
- Global markets (US equities, Forex)
- Cross-asset correlation analysis

### 🤖 Phase 3: AI-Powered Analytics
- Machine learning predictions
- Pattern recognition
- Sentiment analysis
- Automated signal generation

## Documentation

- **[Project Summary](./Project-summary.md)** - Comprehensive technical analysis
- **[Archive Guide](./archive/ARCHIVE-README.md)** - Backup files documentation
- **[Startup Guide](./ENHANCED-STARTUP-GUIDE.md)** - Detailed setup instructions

## Tech Stack

- **Frontend**: React 19.1.1, Vite 7.1.3, Professional CSS Grid
- **Backend**: Node.js, Express.js, Multi-API Integration
- **Data Sources**: NSE Direct API (Primary), Flattrade API (Secondary)
- **Features**: Auto-authentication, Smart caching, Error recovery

## License

This project is intended for personal and educational use. Please ensure compliance with API terms of service.

---

**Status**: Production Ready | **Version**: 2.1 | **Last Updated**: September 2025
