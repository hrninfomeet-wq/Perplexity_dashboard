// frontend/src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import MarketIndices from './components/MarketIndices';
import MarketAnalysis from './components/MarketAnalysis';
import FnOAnalysis from './components/FnOAnalysis';
import BTSTScanner from './components/BTSTScanner';
import ScalpingOpportunities from './components/ScalpingOpportunities';
import Sidebar from './components/Sidebar';
import './style.css';

function App() {
  const [dataSource, setDataSource] = useState('Mock');

  const handleDataSourceChange = (newSource) => {
    setDataSource(newSource);
    if (newSource === 'Live') {
      console.log('Connecting to live market data...');
      // Add logic to call backend API or WebSocket
    }
  };

  return (
    <div className="dashboard-container">
      {/* Clean Header with Title, Date/Time, and Toggle */}
      <Header dataSource={dataSource} onDataSourceChange={handleDataSourceChange} />
      
      {/* Major Indices Strip - Prominent Display */}
      <section className="major-indices-strip">
        <div className="indices-container">
          <div className="major-index">
            <div className="index-name">NIFTY 50</div>
            <div className="index-price">24,500.00</div>
            <div className="index-change positive">+125.50 (+0.51%)</div>
            <div className="index-levels">S: 24,350 | R: 24,650</div>
          </div>
          <div className="major-index">
            <div className="index-name">BANK NIFTY</div>
            <div className="index-price">51,200.00</div>
            <div className="index-change negative">-200.25 (-0.39%)</div>
            <div className="index-levels">S: 50,800 | R: 51,500</div>
          </div>
          <div className="major-index">
            <div className="index-name">SENSEX</div>
            <div className="index-price">80,450.00</div>
            <div className="index-change positive">+180.75 (+0.22%)</div>
            <div className="index-levels">S: 80,200 | R: 80,800</div>
          </div>
          <div className="major-index">
            <div className="index-name">INDIA VIX</div>
            <div className="index-price">13.25</div>
            <div className="index-change neutral">-0.15 (-1.12%)</div>
            <div className="index-levels">Volatility Index</div>
          </div>
        </div>
      </section>

      {/* Market Status Bar */}
      <section className="market-status-bar">
        <div className="status-container">
          <div className="market-trend">
            <span className="trend-label">Market Trend:</span>
            <span className="trend-value bullish">BULLISH</span>
          </div>
          <div className="market-time">
            <span className="time-label">Market Status:</span>
            <span className="time-value">Open</span>
          </div>
          <div className="data-source-indicator">
            <span className="source-label">Data:</span>
            <span className={`source-value ${dataSource.toLowerCase()}`}>{dataSource}</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-left">
          <div className="analysis-grid">
            <MarketAnalysis />
            <FnOAnalysis />
          </div>
          <div className="tables-section">
            <BTSTScanner />
            <ScalpingOpportunities />
          </div>
        </div>
        
        <div className="content-right">
          <Sidebar />
        </div>
      </main>
    </div>
  );
}

export default App;
