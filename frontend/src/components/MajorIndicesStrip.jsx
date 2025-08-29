// frontend/src/components/MajorIndicesStrip.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const MajorIndicesStrip = ({ dataSource }) => {
    const { refreshRate } = useSettings();
    const [indices, setIndices] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                // Only show full loading on first load, subtle refresh indicator after that
                if (indices.length === 0) {
                    setIsInitialLoading(true);
                } else {
                    setIsRefreshing(true);
                }
                
                const response = await fetch('/api/indices');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setIndices(data.data || []);
                setTimestamp(new Date().toLocaleTimeString());
                setIsInitialLoading(false);
                setIsRefreshing(false);
            } catch (error) {
                console.error("Failed to fetch indices:", error);
                // Fallback to mock data when API fails
                const mockIndices = [
                    { 
                        symbol: 'NIFTY', 
                        name: 'NIFTY 50', 
                        price: 24500.00, 
                        change: 125.50, 
                        change_pct: 0.51,
                        support: 24350,
                        resistance: 24650
                    },
                    { 
                        symbol: 'BANKNIFTY', 
                        name: 'BANK NIFTY', 
                        price: 51200.00, 
                        change: -200.25, 
                        change_pct: -0.39,
                        support: 50800,
                        resistance: 51500
                    },
                    { 
                        symbol: 'SENSEX', 
                        name: 'SENSEX', 
                        price: 80450.00, 
                        change: 180.75, 
                        change_pct: 0.22,
                        support: 80200,
                        resistance: 80800
                    },
                    { 
                        symbol: 'VIX', 
                        name: 'INDIA VIX', 
                        price: 13.25, 
                        change: -0.15, 
                        change_pct: -1.12,
                        support: null,
                        resistance: null
                    }
                ];
                setIndices(mockIndices);
                setTimestamp('Mock Data');
                setIsInitialLoading(false);
                setIsRefreshing(false);
            }
        };

        fetchIndices();
        
        // Only auto-refresh if we have live data
        if (dataSource === 'Live') {
            const interval = setInterval(fetchIndices, refreshRate); // Use configurable refresh rate
            return () => clearInterval(interval);
        }
    }, [dataSource, refreshRate]);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        if (change > 0) return 'positive';
        if (change < 0) return 'negative';
        return 'neutral';
    };

    const formatPrice = (price) => {
        if (typeof price !== 'number') return price || '????';
        return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatChange = (change, changePct) => {
        if (typeof change !== 'number' || typeof changePct !== 'number') {
            return '????';
        }
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
    };

    const formatLevels = (index) => {
        if (index.symbol === 'VIX') {
            return 'Volatility Index';
        }
        
        const support = index.support || (index.price * 0.98);
        const resistance = index.resistance || (index.price * 1.02);
        
        return `S: ${Math.round(support).toLocaleString()} | R: ${Math.round(resistance).toLocaleString()}`;
    };

    return (
        <section className="major-indices-strip">
            <div className="indices-container">
                {isInitialLoading ? (
                    <div className="major-index loading">
                        <div className="index-name">Loading...</div>
                        <div className="index-price">Fetching market data...</div>
                    </div>
                ) : (
                    indices.map(index => (
                        <div key={index.symbol} className={`major-index ${isRefreshing ? 'refreshing' : ''}`}>
                            <div className="index-name">{index.name}</div>
                            <div className="index-price">{formatPrice(index.price)}</div>
                            <div className={`index-change ${getChangeClass(index.change)}`}>
                                {formatChange(index.change, index.change_pct)}
                            </div>
                            <div className="index-levels">{formatLevels(index)}</div>
                            {isRefreshing && (
                                <div className="refresh-indicator">
                                    <span className="refresh-dot"></span>
                                </div>
                            )}
                        </div>
                    ))
                )}
                
                {/* Data source indicator */}
                <div className="indices-meta">
                    <div className="data-source-info">
                        <span className={`source-badge ${dataSource.toLowerCase()}`}>
                            {dataSource} Data
                        </span>
                        <span className="update-time">
                            Updated: {timestamp} {isRefreshing && '🔄'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MajorIndicesStrip;
