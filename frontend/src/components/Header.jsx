// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';

const Header = ({ dataSource, onDataSourceChange, indices = [], onToggleView, currentView }) => {
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [marketTrend, setMarketTrend] = useState({
        status: 'LOADING',
        strength: 'MODERATE',
        color: 'gray',
        avgChange: 0,
        breadthRatio: 50.0,
        positiveIndices: 0,
        totalIndices: 0
    });

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

    // Calculate market trend based on indices
    useEffect(() => {
        if (indices && indices.length > 0) {
            const positiveCount = indices.filter(index => parseFloat(index.change_pct || 0) > 0).length;
            const totalIndices = indices.length;
            const avgChange = indices.reduce((sum, index) => sum + parseFloat(index.change_pct || 0), 0) / totalIndices;
            
            let status = 'NEUTRAL';
            let color = 'gray';
            let strength = 'MODERATE';
            
            // Determine trend based on average change and positive ratio
            const positiveRatio = positiveCount / totalIndices;
            
            if (avgChange > 0.3 && positiveRatio >= 0.6) {
                status = 'BULLISH';
                color = 'green';
                strength = avgChange > 1.0 ? 'STRONG' : 'MODERATE';
            } else if (avgChange < -0.3 && positiveRatio <= 0.4) {
                status = 'BEARISH';
                color = 'red';
                strength = avgChange < -1.0 ? 'STRONG' : 'MODERATE';
            }
            
            setMarketTrend({
                status,
                strength,
                color,
                avgChange: parseFloat(avgChange.toFixed(2)),
                breadthRatio: parseFloat((positiveRatio * 100).toFixed(1)),
                positiveIndices: positiveCount,
                totalIndices
            });
        }
    }, [indices]);

    // Format sophisticated trend display
    const getTrendIcon = (status) => {
        switch (status) {
            case 'BULLISH': return '▲';
            case 'BEARISH': return '▼';
            case 'NEUTRAL': return '■';
            default: return '●';
        }
    };

    const getTrendPulse = (status) => {
        switch (status) {
            case 'BULLISH': return 'pulse-bullish';
            case 'BEARISH': return 'pulse-bearish';
            case 'NEUTRAL': return 'pulse-neutral';
            default: return 'pulse-loading';
        }
    };

    const getTrendGradient = (status) => {
        switch (status) {
            case 'BULLISH': return 'gradient-bullish';
            case 'BEARISH': return 'gradient-bearish';
            case 'NEUTRAL': return 'gradient-neutral';
            default: return 'gradient-loading';
        }
    };

    const handleToggle = () => {
        const newSource = dataSource === 'Mock' ? 'Live' : 'Mock';
        onDataSourceChange(newSource);
    };

    return (
        <header className="clean-header">
            {/* Unified Header Indices Strip with Title and Controls */}
            <div className="header-indices-strip">
                {/* Header Left - Title and Market Trend */}
                <div className="header-left">
                    <h1 className="dashboard-title">NSE Trading Dashboard</h1>
                    
                    {/* Sophisticated Market Trend Indicator */}
                    <div className={`market-sentiment-orb ${getTrendGradient(marketTrend.status)}`}>
                        <div className={`trend-pulse ${getTrendPulse(marketTrend.status)}`}></div>
                        <div className="trend-core">
                            <div className="trend-symbol">{getTrendIcon(marketTrend.status)}</div>
                        </div>
                        <div className="trend-details">
                            <div className="trend-status">
                                {marketTrend.status === 'LOADING' ? 'ANALYZING' : marketTrend.status}
                                <span className="trend-strength">{marketTrend.strength}</span>
                            </div>
                            <div className="trend-metrics">
                                <span className="trend-change">
                                    {marketTrend.avgChange > 0 ? '+' : ''}{marketTrend.avgChange}%
                                </span>
                                <span className="trend-breadth">{marketTrend.breadthRatio}% ↑</span>
                            </div>
                        </div>
                    </div>
                    
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
                
                {/* Header Right - View Toggle and Data Source */}
                <div className="header-right">
                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button 
                            className={`view-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                            onClick={() => onToggleView && onToggleView('dashboard')}
                            title="Switch to Dashboard View"
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="fas fa-th-large" />
                            Dashboard
                        </button>
                        <button 
                            className={`view-btn ${currentView === 'trading' ? 'active' : ''}`}
                            onClick={() => onToggleView && onToggleView('trading')}
                            title="Switch to Live Trading View"
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="fas fa-chart-line" />
                            Live Trading
                        </button>
                    </div>

                    {/* Data Source Toggle - Only show in dashboard view */}
                    {currentView === 'dashboard' && (
                        <div className="data-source-toggle">
                            <span className="toggle-label">Data Source:</span>
                            <div className={`toggle-switch ${dataSource === 'Live' ? 'on' : 'off'}`} onClick={handleToggle}>
                                <div className="toggle-knob"></div>
                            </div>
                            <span className="toggle-status">{dataSource}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
