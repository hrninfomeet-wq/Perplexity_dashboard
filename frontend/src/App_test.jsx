// frontend/src/App.jsx - Simple Test Version
import React, { useState } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import './style.css';

function App() {
  return (
    <SettingsProvider>
      <div className="app" style={{ padding: '20px', background: '#0a0e1a', color: 'white', minHeight: '100vh' }}>
        <h1>NSE Trading Dashboard</h1>
        <p>Testing basic functionality...</p>
        <div style={{ background: '#232940', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
          <h2>Test Panel</h2>
          <p>If you can see this, the basic React app is working.</p>
        </div>
      </div>
    </SettingsProvider>
  );
}

export default App;
