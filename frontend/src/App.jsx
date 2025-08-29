// frontend/src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import MajorIndicesStrip from './components/MajorIndicesStrip';
import MarketIndices from './components/MarketIndices';
import MarketAnalysis from './components/MarketAnalysis';
import FnOAnalysis from './components/FnOAnalysis';
import BTSTScanner from './components/BTSTScanner';
import ScalpingOpportunities from './components/ScalpingOpportunities';
import Sidebar from './components/Sidebar';
import { SettingsProvider } from './contexts/SettingsContext';
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
    <SettingsProvider>
      <div className="dashboard-container">
      {/* Clean Header with Title, Date/Time, and Toggle */}
      <Header dataSource={dataSource} onDataSourceChange={handleDataSourceChange} />
      
      {/* Major Indices Strip - Real-time Data */}
      <MajorIndicesStrip dataSource={dataSource} />

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
    </SettingsProvider>
  );
}

export default App;
