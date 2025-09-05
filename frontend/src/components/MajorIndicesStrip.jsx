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
                
                const response = await fetch('http://localhost:5000/api/indices');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const allIndices = data.data || [];
                
                // Filter out NIFTY, BANKNIFTY, SENSEX, and VIX as they're now in header
                const filteredIndices = allIndices.filter(index => 
                    !['NIFTY', 'BANKNIFTY', 'SENSEX', 'VIX'].includes(index.symbol)
                );
                
                setIndices(filteredIndices);
                setTimestamp(new Date().toLocaleTimeString());
                setIsInitialLoading(false);
                setIsRefreshing(false);
            } catch (error) {
                console.error("Failed to fetch indices:", error);
                // Fallback to mock data when API fails (only sectoral indices)
                const mockIndices = [
                    { 
                        symbol: 'NIFTYMIDCAP', 
                        name: 'NIFTY MIDCAP SELECT', 
                        price: 12450.00, 
                        change: 85.25, 
                        change_pct: 0.69,
                        support: 12300,
                        resistance: 12600
                    },
                    { 
                        symbol: 'FINNIFTY', 
                        name: 'FINNIFTY', 
                        price: 23850.00, 
                        change: -125.75, 
                        change_pct: -0.52,
                        support: 23700,
                        resistance: 24000
                    },
                    { 
                        symbol: 'NIFTYAUTO', 
                        name: 'NIFTY AUTO', 
                        price: 18920.00, 
                        change: 220.50, 
                        change_pct: 1.18,
                        support: 18700,
                        resistance: 19100
                    },
                    { 
                        symbol: 'NIFTYIT', 
                        name: 'NIFTY IT', 
                        price: 34250.00, 
                        change: 180.25, 
                        change_pct: 0.53,
                        support: 34000,
                        resistance: 34500
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
        <div className="major-indices-content">
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
            </div>
        </div>
    );
};

export default MajorIndicesStrip;
