// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';

const Header = ({ dataSource, onDataSourceChange, indices = [] }) => {
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-IN'));
            setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }));
        };

        updateDateTime();
        const timer = setInterval(updateDateTime, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleToggle = () => {
        const newSource = dataSource === 'Mock' ? 'Live' : 'Mock';
        onDataSourceChange(newSource);
    };

    return (
        <header className="clean-header">
            {/* Unified Header Indices Strip with Title and Controls */}
            <div className="header-indices-strip">
                {/* Header Left - Title and DateTime */}
                <div className="header-left">
                    <h1 className="dashboard-title">NSE Trading Dashboard</h1>
                    <div className="datetime-display">
                        <span className="current-date">{currentDate}</span>
                        <span className="current-time">{currentTime}</span>
                    </div>
                </div>
                
                {/* Indices Cards */}
                <div className="indices-container">
                    {indices.map((index, i) => (
                        <div key={index.symbol} className={`header-index-item ${index.change_pct >= 0 ? 'positive' : 'negative'}`}>
                            <div className="index-name">{index.name}</div>
                            <div className="index-price">₹{index.price?.toFixed(2) || '0.00'}</div>
                            <div className="index-change">
                                {index.change >= 0 ? '+' : ''}{index.change?.toFixed(2) || '0.00'} 
                                ({index.change_pct >= 0 ? '+' : ''}{index.change_pct?.toFixed(2) || '0.00'}%)
                            </div>
                            {(index.support || index.resistance) && (
                                <div className="index-levels">
                                    {index.support && <span className="support">S: ₹{index.support}</span>}
                                    {index.resistance && <span className="resistance">R: ₹{index.resistance}</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Header Right - Data Source Toggle */}
                <div className="header-right">
                    <div className="data-source-toggle">
                        <span className="toggle-label">Data Source:</span>
                        <div className={`toggle-switch ${dataSource === 'Live' ? 'on' : 'off'}`} onClick={handleToggle}>
                            <div className="toggle-knob"></div>
                        </div>
                        <span className="toggle-status">{dataSource}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
