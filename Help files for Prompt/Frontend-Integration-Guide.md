# 🎛️ FRONTEND MULTI-API INTEGRATION GUIDE
## Professional Dashboard for 4-Provider System (590 req/min)

**Target**: Build enterprise-grade frontend for current 4-provider backend  
**Current Capacity**: 590 req/min (Flattrade + Upstox + FYERS + NSE Public)  
**Timeline**: 1-2 weeks for complete integration  

---

## 🚀 FRONTEND ARCHITECTURE OVERVIEW

### **Dashboard Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│ 🎛️ NSE Trading Dashboard - Multi-API System        │
├─────────────────────────────────────────────────────┤
│ 📊 Capacity Meter: 590/710 req/min (4/5 providers) │
├─────────┬─────────┬─────────┬─────────┬─────────────┤
│ Flatt   │ Upstox  │ FYERS   │ NSE     │ AliceBlue   │
│ 80/min  │ 250/min │ 200/min │ 60/min  │ Pending     │
│ ✅ OK   │ ✅ OK   │ ✅ OK   │ ✅ OK   │ ⏳ APP_CODE │
├─────────┴─────────┴─────────┴─────────┴─────────────┤
│ 📈 Real-time Performance Metrics                   │
│ 🔐 Authentication Status & OAuth Management        │
│ ⚙️ Provider Configuration & Settings               │
│ 🚨 Alert Center & System Health                    │
└─────────────────────────────────────────────────────┘
```

---

## 📋 CORE COMPONENT SPECIFICATIONS

### **1. Multi-Provider Status Grid**

```javascript
// src/components/MultiProviderGrid.jsx
import React, { useState, useEffect } from 'react';

const MultiProviderGrid = () => {
    const [providers, setProviders] = useState({});
    const [totalCapacity, setTotalCapacity] = useState(0);
    const [healthyCount, setHealthyCount] = useState(0);

    useEffect(() => {
        const fetchProviderStatus = async () => {
            try {
                const response = await fetch('/api/multi-api/health');
                const data = await response.json();
                
                setProviders(data.providers);
                setTotalCapacity(data.totalCapacity);
                setHealthyCount(data.healthyProviders);
            } catch (error) {
                console.error('Failed to fetch provider status:', error);
            }
        };

        // Initial fetch
        fetchProviderStatus();
        
        // Real-time updates every 5 seconds
        const interval = setInterval(fetchProviderStatus, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'degraded': return 'bg-yellow-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="grid grid-cols-5 gap-4 p-6">
            <div className="col-span-5 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Multi-API System Status
                </h2>
                <div className="mt-2">
                    <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold">
                            Capacity: {totalCapacity}/710 req/min
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${(totalCapacity / 710) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                            {healthyCount}/5 Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Provider Cards */}
            {Object.entries(providers).map(([name, provider]) => (
                <div key={name} className="bg-white rounded-lg shadow-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 capitalize">
                            {name}
                        </h3>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.health)}`}></div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Capacity:</span>
                            <span className="font-medium">{provider.rateLimitPerMin}/min</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span>Used:</span>
                            <span className="font-medium">{provider.requestCount}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`font-medium capitalize ${
                                provider.health === 'healthy' ? 'text-green-600' : 
                                provider.health === 'degraded' ? 'text-yellow-600' : 
                                'text-red-600'
                            }`}>
                                {provider.health}
                            </span>
                        </div>
                        
                        <div className="mt-3 bg-gray-100 rounded p-2">
                            <div className="text-xs text-gray-600 mb-1">Usage</div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(provider.requestCount / provider.rateLimitPerMin) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* AliceBlue Pending Card */}
            <div className="bg-yellow-50 rounded-lg shadow-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">AliceBlue</h3>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                </div>
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="font-medium">120/min</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-yellow-600">APP_CODE Pending</span>
                    </div>
                    
                    <div className="mt-3 bg-yellow-100 rounded p-2">
                        <div className="text-xs text-yellow-700">
                            Waiting for portal approval
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiProviderGrid;
```

### **2. Real-time Performance Monitor**

```javascript
// src/components/PerformanceMonitor.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceMonitor = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [realTimeMetrics, setRealTimeMetrics] = useState({});

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/monitoring/metrics');
                const data = await response.json();
                
                setRealTimeMetrics(data);
                
                // Update performance chart data
                setPerformanceData(prev => {
                    const newData = [...prev, {
                        time: new Date().toLocaleTimeString(),
                        requests: data.requests.perMinute,
                        responseTime: data.performance.avgResponseTime,
                        errorRate: data.performance.errorRate
                    }];
                    
                    // Keep only last 20 data points
                    return newData.slice(-20);
                });
                
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            }
        };

        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Monitoring</h3>
            
            {/* Real-time Metrics Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium">Requests/Min</div>
                    <div className="text-2xl font-bold text-blue-800">
                        {realTimeMetrics.requests?.perMinute || 0}
                    </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Avg Response</div>
                    <div className="text-2xl font-bold text-green-800">
                        {realTimeMetrics.performance?.avgResponseTime || 0}ms
                    </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium">Success Rate</div>
                    <div className="text-2xl font-bold text-purple-800">
                        {(realTimeMetrics.performance?.successRate || 0).toFixed(1)}%
                    </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600 font-medium">Active Providers</div>
                    <div className="text-2xl font-bold text-orange-800">
                        {realTimeMetrics.health?.healthy || 0}/4
                    </div>
                </div>
            </div>
            
            {/* Performance Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                            type="monotone" 
                            dataKey="requests" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            name="Requests/Min"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="responseTime" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            name="Response Time (ms)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceMonitor;
```

### **3. Authentication Management Center**

```javascript
// src/components/AuthCenter.jsx
import React, { useState, useEffect } from 'react';

const AuthCenter = () => {
    const [authStatus, setAuthStatus] = useState({});
    const [isAuthenticating, setIsAuthenticating] = useState({});

    useEffect(() => {
        fetchAuthStatus();
        const interval = setInterval(fetchAuthStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchAuthStatus = async () => {
        try {
            const response = await fetch('/api/auth/multi/status');
            const data = await response.json();
            setAuthStatus(data);
        } catch (error) {
            console.error('Failed to fetch auth status:', error);
        }
    };

    const initiateAuth = async (provider) => {
        setIsAuthenticating(prev => ({ ...prev, [provider]: true }));
        
        try {
            const response = await fetch(`/api/auth/multi/initiate/${provider}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.authUrl) {
                // Open OAuth window
                const authWindow = window.open(
                    data.authUrl, 
                    'auth', 
                    'width=500,height=600'
                );
                
                // Monitor auth completion
                const checkAuth = setInterval(() => {
                    if (authWindow.closed) {
                        clearInterval(checkAuth);
                        fetchAuthStatus();
                        setIsAuthenticating(prev => ({ ...prev, [provider]: false }));
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Auth initiation failed:', error);
            setIsAuthenticating(prev => ({ ...prev, [provider]: false }));
        }
    };

    const getAuthStatusColor = (isAuthenticated) => {
        return isAuthenticated ? 'text-green-600' : 'text-red-600';
    };

    const getAuthStatusText = (isAuthenticated) => {
        return isAuthenticated ? 'Authenticated' : 'Not Authenticated';
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Authentication Center</h3>
            
            <div className="space-y-4">
                {Object.entries(authStatus.providers || {}).map(([provider, status]) => (
                    <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-sm font-medium capitalize">
                                    {provider.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            
                            <div>
                                <div className="font-medium capitalize">{provider}</div>
                                <div className={`text-sm ${getAuthStatusColor(status.isAuthenticated)}`}>
                                    {getAuthStatusText(status.isAuthenticated)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <div className="text-right text-sm">
                                <div className="font-medium">{status.capacity} req/min</div>
                                <div className="text-gray-500">
                                    {status.isHealthy ? 'Healthy' : 'Unhealthy'}
                                </div>
                            </div>
                            
                            {!status.isAuthenticated && provider !== 'nse_public' && (
                                <button
                                    onClick={() => initiateAuth(provider)}
                                    disabled={isAuthenticating[provider]}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {isAuthenticating[provider] ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                            
                            {status.isAuthenticated && (
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* AliceBlue Pending */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-sm font-medium">A</span>
                        </div>
                        
                        <div>
                            <div className="font-medium">AliceBlue</div>
                            <div className="text-sm text-yellow-600">
                                APP_CODE Approval Pending
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <div className="text-right text-sm">
                            <div className="font-medium">120 req/min</div>
                            <div className="text-yellow-600">Pending Approval</div>
                        </div>
                        
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthCenter;
```

---

## 🎯 IMPLEMENTATION ROADMAP

### **Week 1: Core Components**
- **Days 1-2**: Multi-Provider Status Grid
- **Days 3-4**: Performance Monitoring Dashboard  
- **Days 5-7**: Authentication Management Center

### **Week 2: Advanced Features**
- **Days 1-2**: FYERS Daily Usage Tracker (100K limit)
- **Days 3-4**: Alert System & Notifications
- **Days 5-7**: Provider Configuration & Settings

---

## 📊 SUCCESS METRICS

### **Frontend Complete When:**
- ✅ Real-time display of 4-provider system (590 req/min)
- ✅ OAuth management for Upstox and FYERS
- ✅ Performance monitoring with live charts
- ✅ AliceBlue pending status with progress indicator
- ✅ FYERS 100K daily limit tracking
- ✅ Provider configuration controls

### **User Experience Goals:**
- **Professional Interface**: Enterprise-grade dashboard design
- **Real-time Updates**: Live provider status and metrics
- **Intuitive Management**: Easy OAuth and provider control
- **Performance Insights**: Historical analytics and trends
- **Scalability**: Ready for AliceBlue integration

---

**Your 590 req/min multi-API system deserves a professional frontend to showcase its power!** 🚀

---

*Frontend Integration Guide: Complete*  
*Target: Professional dashboard for 4-provider system*  
*Expected Outcome: Enterprise-grade trading platform interface*