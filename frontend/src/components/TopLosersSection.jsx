// frontend/src/components/TopLosersSection.jsx
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const TopLosersSection = ({ dataSource }) => {
    const { refreshRate } = useSettings();
    const [losers, setLosers] = useState([]);
    const [timestamp, setTimestamp] = useState('Never');

    useEffect(() => {
        const fetchLosers = async () => {
            try {
                console.log('🔍 TopLosersSection fetching with dataSource:', dataSource);
                
                if (dataSource === 'Live') {
                    const response = await fetch('http://localhost:5000/api/losers');
                    if (!response.ok) {
                        throw new Error('Failed to fetch losers data');
                    }
                    const data = await response.json();
                    console.log('📊 TopLosersSection API Response:', data);
                    
                    // API returns data.data directly, not data.data.losers
                    const losersData = data.data || [];
                    
                    // Map the data structure to match component expectations
                    const mappedLosers = losersData.map(stock => ({
                        name: stock.symbol || stock.name,
                        ltp: stock.price || stock.ltp,
                        change_pct: stock.changePercent || stock.change_pct
                    }));
                    
                    setLosers(mappedLosers);
                    setTimestamp(new Date().toLocaleTimeString());
                } else {
                    // Mock data
                    const mockLosers = [
                        { name: 'ZOMATO', ltp: 268.75, change_pct: -3.85 },
                        { name: 'PAYTM', ltp: 945.20, change_pct: -3.45 },
                        { name: 'NYKAA', ltp: 180.40, change_pct: -2.95 },
                        { name: 'POLICYBZR', ltp: 1456.80, change_pct: -2.67 },
                        { name: 'IRCTC', ltp: 825.35, change_pct: -2.25 },
                        { name: 'DMART', ltp: 4125.90, change_pct: -1.89 }
                    ];
                    setLosers(mockLosers);
                    setTimestamp('Mock data');
                }
            } catch (error) {
                console.error("Failed to fetch top losers:", error);
                // Fallback to mock data on error
                const fallbackLosers = [
                    { name: 'ZOMATO', ltp: 268.75, change_pct: -3.85 },
                    { name: 'PAYTM', ltp: 945.20, change_pct: -3.45 },
                    { name: 'NYKAA', ltp: 180.40, change_pct: -2.95 },
                    { name: 'POLICYBZR', ltp: 1456.80, change_pct: -2.67 },
                    { name: 'IRCTC', ltp: 825.35, change_pct: -2.25 },
                    { name: 'DMART', ltp: 4125.90, change_pct: -1.89 }
                ];
                setLosers(fallbackLosers);
                setTimestamp('Failed to load');
            }
        };

        fetchLosers();
        const interval = setInterval(fetchLosers, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate, dataSource]);

    const getChangeClass = (change) => {
        if (typeof change !== 'number') return '';
        return change >= 0 ? 'price-positive' : 'price-negative';
    };

    return (
        <div className="top-losers-content">
            <div className="table-container">
                <table className="movers-table">
                    <thead>
                        <tr>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Change %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {losers.length > 0 ? losers.map(stock => (
                            <tr key={stock.name}>
                                <td><strong>{stock.name}</strong></td>
                                <td className={getChangeClass(stock.change_pct)}>{typeof stock.ltp === 'number' ? `₹${stock.ltp.toFixed(2)}` : stock.ltp}</td>
                                <td className={getChangeClass(stock.change_pct)}>{typeof stock.change_pct === 'number' ? `${stock.change_pct.toFixed(2)}%` : stock.change_pct}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="text-center">Loading data...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopLosersSection;
