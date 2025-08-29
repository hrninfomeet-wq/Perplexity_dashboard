// frontend/src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Refresh rate in milliseconds
    const [refreshRate, setRefreshRate] = useState(2000); // Default 2 seconds

    // Available refresh rate options
    const refreshRateOptions = [
        { label: '1 second', value: 1000 },
        { label: '2 seconds', value: 2000 },
        { label: '5 seconds', value: 5000 },
        { label: '10 seconds', value: 10000 },
        { label: '30 seconds', value: 30000 },
        { label: '60 seconds', value: 60000 }
    ];

    const updateRefreshRate = (newRate) => {
        setRefreshRate(newRate);
        // Optionally save to localStorage for persistence
        localStorage.setItem('dashboardRefreshRate', newRate.toString());
    };

    // Load from localStorage on initialization
    React.useEffect(() => {
        const savedRate = localStorage.getItem('dashboardRefreshRate');
        if (savedRate) {
            setRefreshRate(parseInt(savedRate, 10));
        }
    }, []);

    const value = {
        refreshRate,
        updateRefreshRate,
        refreshRateOptions
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
