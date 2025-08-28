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
import './dashboard-styles.css';

function App() {
  const [dataSource, setDataSource] = useState('Mock');

  const handleDataSourceChange = async (newSource) => {
    setDataSource(newSource);
    
    if (newSource === 'Live') {
      try {
        console.log('🔄 Connecting to live market data...');
        
        const response = await fetch('/api/connect/live', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Connected to live data successfully');
        } else if (data.needsLogin && data.loginUrl) {
          console.log('🔐 Authentication required, opening login window...');
          
          const authWindow = window.open(data.loginUrl, 'flattradeLogin', 'width=600,height=700');
          
          // Listen for message from popup
          const messageListener = (event) => {
            if (event.source === authWindow) {
              if (event.data?.type === 'auth-success') {
                console.log('✅ Authentication successful!');
                window.removeEventListener('message', messageListener);
                authWindow.close();
              } else if (event.data?.type === 'auth-error') {
                console.error('❌ Authentication failed:', event.data.error);
                window.removeEventListener('message', messageListener);
                authWindow.close();
                setDataSource('Mock');
              }
            }
          };
          window.addEventListener('message', messageListener);
          
        } else {
          throw new Error(data.error || 'Failed to connect to live data');
        }
        
      } catch (error) {
        console.error('❌ Failed to connect to live data:', error);
        setDataSource('Mock');
      }
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
