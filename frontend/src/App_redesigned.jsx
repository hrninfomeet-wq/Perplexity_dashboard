// frontend/src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import MajorIndicesStrip from './components/MajorIndicesStrip';
import MarketAnalysis from './components/MarketAnalysis';
import FnOAnalysis from './components/FnOAnalysis';
import BTSTScanner from './components/BTSTScanner';
import ScalpingOpportunities from './components/ScalpingOpportunities';
import TradingAlerts from './components/TradingAlerts';
import Settings from './components/Settings';
import DraggableGrid from './components/DraggableGrid';
import { SettingsProvider } from './contexts/SettingsContext';
import './style.css';
import './dashboard-styles.css';
import './trading-desk-styles.css';

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
      <div className="app">
        {/* Professional Trading Header */}
        <Header />
        
        {/* Major Indices Strip */}
        <section className="indices-section">
          <MajorIndicesStrip dataSource={dataSource} />
        </section>

        {/* Main Trading Dashboard with Draggable Grid */}
        <main className="main-content">
          <DraggableGrid>
            <TradingAlerts title="Trading Alerts" />
            <FnOAnalysis title="F&O Analysis" />
            <MarketAnalysis title="Market Analysis" />
            <BTSTScanner title="BTST Scanner" />
            <ScalpingOpportunities title="Scalping Opportunities" />
            <Settings title="Settings" />
          </DraggableGrid>
        </main>
      </div>
    </SettingsProvider>
  );
}

export default App;
