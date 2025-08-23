// NSE Trading Dashboard JavaScript

// Market data from application_data_json
let marketData = {
    indices: [
        {"name": "NIFTY 50", "symbol": "NIFTY", "price": 24350.45, "change": 125.30, "change_pct": 0.52, "high": 24420.80, "low": 24280.15, "volume": 15234567},
        {"name": "BANK NIFTY", "symbol": "BANKNIFTY", "price": 51245.60, "change": -89.45, "change_pct": -0.17, "high": 51398.75, "low": 51100.20, "volume": 8901234},
        {"name": "NIFTY IT", "symbol": "NIFTYIT", "price": 34567.89, "change": 234.56, "change_pct": 0.68, "high": 34650.45, "low": 34320.12, "volume": 3456789},
        {"name": "NIFTY PHARMA", "symbol": "NIFTYPHARMA", "price": 15432.10, "change": -45.67, "change_pct": -0.29, "high": 15500.78, "low": 15380.45, "volume": 2345678},
        {"name": "NIFTY FMCG", "symbol": "NIFTYFMCG", "price": 56789.34, "change": 67.89, "change_pct": 0.12, "high": 56850.23, "low": 56650.78, "volume": 1876543},
        {"name": "NIFTY MIDCAP", "symbol": "NIFTYMIDCAP", "price": 12345.67, "change": 89.12, "change_pct": 0.73, "high": 12389.45, "low": 12234.56, "volume": 4567890},
        {"name": "NIFTY SMALLCAP", "symbol": "NIFTYSMALLCAP", "price": 17890.23, "change": -23.45, "change_pct": -0.13, "high": 17945.67, "low": 17834.12, "volume": 3789012}
    ],
    btstStocks: [
        {"name": "RELIANCE", "ltp": 2456.75, "change_pct": 2.34, "volume_ratio": 1.45, "signal": "Bullish Breakout", "rsi": 68.4, "price_action": "Above Resistance", "btst_score": 8.2},
        {"name": "TCS", "ltp": 3789.40, "change_pct": 1.89, "volume_ratio": 1.23, "signal": "Momentum Build", "rsi": 72.1, "price_action": "Trend Continuation", "btst_score": 7.8},
        {"name": "INFY", "ltp": 1654.30, "change_pct": 3.12, "volume_ratio": 1.67, "signal": "Volume Surge", "rsi": 75.6, "price_action": "Gap Up", "btst_score": 8.5},
        {"name": "HDFCBANK", "ltp": 1789.65, "change_pct": -1.23, "volume_ratio": 1.34, "signal": "Oversold Bounce", "rsi": 32.8, "price_action": "Support Hold", "btst_score": 6.9},
        {"name": "ITC", "ltp": 456.80, "change_pct": 2.67, "volume_ratio": 1.89, "signal": "Bullish Flag", "rsi": 69.3, "price_action": "Breakout", "btst_score": 7.6}
    ],
    tradingAlerts: [
        {"timestamp": "15:24:32", "stock": "RELIANCE", "signal": "BUY", "entry": 2456.75, "target": 2510.00, "stoploss": 2420.00, "type": "BTST"},
        {"timestamp": "15:18:45", "stock": "INFY", "signal": "BUY", "entry": 1654.30, "target": 1685.00, "stoploss": 1635.00, "type": "Intraday"},
        {"timestamp": "15:12:18", "stock": "BANKNIFTY", "signal": "SELL", "entry": 51245.60, "target": 51100.00, "stoploss": 51350.00, "type": "F&O"},
        {"timestamp": "15:08:22", "stock": "TCS", "signal": "BUY", "entry": 3789.40, "target": 3825.00, "stoploss": 3765.00, "type": "BTST"},
        {"timestamp": "15:03:56", "stock": "HDFCBANK", "signal": "BUY", "entry": 1789.65, "target": 1820.00, "stoploss": 1770.00, "type": "Swing"}
    ],
    topGainers: [
        {"name": "ADANIPORTS", "ltp": 789.45, "change_pct": 4.56},
        {"name": "TATASTEEL", "ltp": 145.67, "change_pct": 3.89},
        {"name": "JSWSTEEL", "ltp": 567.89, "change_pct": 3.45},
        {"name": "HINDALCO", "ltp": 234.56, "change_pct": 3.12},
        {"name": "COALINDIA", "ltp": 345.67, "change_pct": 2.89}
    ],
    topLosers: [
        {"name": "BAJFINANCE", "ltp": 6789.12, "change_pct": -2.34},
        {"name": "HCLTECH", "ltp": 1234.56, "change_pct": -1.89},
        {"name": "WIPRO", "ltp": 456.78, "change_pct": -1.67},
        {"name": "TECHM", "ltp": 987.65, "change_pct": -1.45},
        {"name": "LTIM", "ltp": 3456.78, "change_pct": -1.23}
    ]
};

// Global variables
let refreshInterval;
let currentRefreshRate = 5000; // 5 seconds default
let niftyChart;
let currentSortColumn = null;
let currentSortDirection = 'asc';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    updateDateTime();
    updateMarketStatus();
    renderIndicesTable();
    renderBTSTTable();
    renderTradingAlerts();
    renderGainersLosers();
    initializeChart();
    setupEventListeners();
    startAutoRefresh();
    
    // Hide loading overlay
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.remove('show');
    }, 1500);
}

// Date and time updates
function updateDateTime() {
    const now = new Date();
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    const dateOptions = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-IN', timeOptions);
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-IN', dateOptions);
}

// Market status updates
function updateMarketStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    const statusElement = document.getElementById('market-status');
    if (currentTime >= marketOpen && currentTime <= marketClose) {
        statusElement.textContent = 'OPEN';
        statusElement.style.background = 'var(--color-success)';
    } else {
        statusElement.textContent = 'CLOSED';
        statusElement.style.background = 'var(--color-error)';
    }
}

// Render indices table
function renderIndicesTable() {
    const tbody = document.getElementById('indices-tbody');
    tbody.innerHTML = '';
    
    marketData.indices.forEach(index => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${index.name}</strong></td>
            <td>₹${formatNumber(index.price)}</td>
            <td class="${index.change >= 0 ? 'price-positive' : 'price-negative'}">
                ${index.change >= 0 ? '+' : ''}₹${formatNumber(index.change)}
            </td>
            <td class="${index.change_pct >= 0 ? 'price-positive' : 'price-negative'}">
                ${index.change_pct >= 0 ? '+' : ''}${index.change_pct.toFixed(2)}%
            </td>
            <td>₹${formatNumber(index.high)}</td>
            <td>₹${formatNumber(index.low)}</td>
            <td>${formatVolume(index.volume)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Update header summary
    const nifty = marketData.indices.find(idx => idx.symbol === 'NIFTY');
    const bankNifty = marketData.indices.find(idx => idx.symbol === 'BANKNIFTY');
    
    if (nifty) {
        document.getElementById('nifty-value').textContent = `₹${formatNumber(nifty.price)}`;
        const niftyChange = document.getElementById('nifty-change');
        niftyChange.textContent = `${nifty.change >= 0 ? '+' : ''}₹${formatNumber(nifty.change)} (${nifty.change_pct >= 0 ? '+' : ''}${nifty.change_pct.toFixed(2)}%)`;
        niftyChange.className = `change ${nifty.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (bankNifty) {
        document.getElementById('banknifty-value').textContent = `₹${formatNumber(bankNifty.price)}`;
        const bankNiftyChange = document.getElementById('banknifty-change');
        bankNiftyChange.textContent = `${bankNifty.change >= 0 ? '+' : ''}₹${formatNumber(bankNifty.change)} (${bankNifty.change_pct >= 0 ? '+' : ''}${bankNifty.change_pct.toFixed(2)}%)`;
        bankNiftyChange.className = `change ${bankNifty.change >= 0 ? 'positive' : 'negative'}`;
    }
}

// Render BTST table
function renderBTSTTable() {
    const tbody = document.getElementById('btst-tbody');
    tbody.innerHTML = '';
    
    marketData.btstStocks.forEach(stock => {
        const row = document.createElement('tr');
        const scoreClass = stock.btst_score >= 8 ? 'high' : stock.btst_score >= 7 ? 'medium' : 'low';
        
        row.innerHTML = `
            <td><strong>${stock.name}</strong></td>
            <td>₹${formatNumber(stock.ltp)}</td>
            <td class="${stock.change_pct >= 0 ? 'price-positive' : 'price-negative'}">
                ${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct.toFixed(2)}%
            </td>
            <td>${stock.volume_ratio.toFixed(2)}x</td>
            <td><span class="status status--info">${stock.signal}</span></td>
            <td>${stock.rsi.toFixed(1)}</td>
            <td>${stock.price_action}</td>
            <td><span class="btst-score ${scoreClass}">${stock.btst_score.toFixed(1)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Render trading alerts
function renderTradingAlerts() {
    const alertsList = document.getElementById('alerts-list');
    alertsList.innerHTML = '';
    
    marketData.tradingAlerts.slice(-10).reverse().forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.signal.toLowerCase()}`;
        
        alertElement.innerHTML = `
            <div class="alert-header">
                <span class="alert-stock">${alert.stock}</span>
                <span class="alert-signal ${alert.signal.toLowerCase()}">${alert.signal}</span>
            </div>
            <div class="alert-details">
                <span>Entry: ₹${formatNumber(alert.entry)}</span>
                <span>Target: ₹${formatNumber(alert.target)}</span>
                <span>SL: ₹${formatNumber(alert.stoploss)}</span>
            </div>
            <div class="alert-timestamp">${alert.timestamp} • ${alert.type}</div>
        `;
        
        alertsList.appendChild(alertElement);
    });
}

// Render gainers and losers
function renderGainersLosers() {
    const gainersList = document.getElementById('gainers-list');
    const losersList = document.getElementById('losers-list');
    
    gainersList.innerHTML = '';
    losersList.innerHTML = '';
    
    marketData.topGainers.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'gainer-item';
        item.innerHTML = `
            <span class="stock-name">${stock.name}</span>
            <div>
                <span class="stock-change">+${stock.change_pct.toFixed(2)}%</span>
                <div style="font-size: 11px; color: var(--color-text-secondary);">₹${formatNumber(stock.ltp)}</div>
            </div>
        `;
        gainersList.appendChild(item);
    });
    
    marketData.topLosers.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'loser-item';
        item.innerHTML = `
            <span class="stock-name">${stock.name}</span>
            <div>
                <span class="stock-change">${stock.change_pct.toFixed(2)}%</span>
                <div style="font-size: 11px; color: var(--color-text-secondary);">₹${formatNumber(stock.ltp)}</div>
            </div>
        `;
        losersList.appendChild(item);
    });
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('nifty-candlestick-chart').getContext('2d');
    
    // Generate sample candlestick data
    const chartData = generateCandlestickData();
    
    niftyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'NIFTY 50',
                data: chartData.prices,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Generate sample candlestick data
function generateCandlestickData() {
    const labels = [];
    const prices = [];
    const basePrice = 24350;
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * 5);
        labels.push(date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        
        // Generate realistic price movement
        const randomChange = (Math.random() - 0.5) * 100;
        const price = basePrice + randomChange + (Math.sin(i / 5) * 50);
        prices.push(price.toFixed(2));
    }
    
    return { labels, prices };
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Timeframe switching
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateChartTimeframe(e.target.getAttribute('data-timeframe'));
        });
    });
    
    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', (e) => {
            const column = e.target.getAttribute('data-sort');
            sortTable(column);
        });
    });
    
    // Refresh buttons
    document.getElementById('refresh-indices').addEventListener('click', () => {
        simulateDataUpdate();
        renderIndicesTable();
    });
    
    // Clear alerts
    document.getElementById('clear-alerts').addEventListener('click', () => {
        marketData.tradingAlerts = [];
        renderTradingAlerts();
    });
    
    // Settings
    document.getElementById('refresh-rate').addEventListener('change', (e) => {
        currentRefreshRate = parseInt(e.target.value) * 1000;
        startAutoRefresh();
    });
    
    // Export data
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // Sound alerts checkbox
    document.getElementById('sound-alerts').addEventListener('change', (e) => {
        if (e.target.checked) {
            // Play a test sound (in real app, you'd implement sound notifications)
            console.log('Sound alerts enabled');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            simulateDataUpdate();
            renderIndicesTable();
        }
        if (e.code === 'Escape') {
            // Close any open modals (for future use)
            console.log('Escape pressed');
        }
    });
}

// Switch tabs
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Update chart timeframe
function updateChartTimeframe(timeframe) {
    const chartData = generateCandlestickData();
    niftyChart.data.labels = chartData.labels;
    niftyChart.data.datasets[0].data = chartData.prices;
    niftyChart.update();
}

// Sort table
function sortTable(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    marketData.indices.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (currentSortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    renderIndicesTable();
}

// Simulate real-time data updates
function simulateDataUpdate() {
    marketData.indices.forEach(index => {
        // Simulate price changes
        const changePercent = (Math.random() - 0.5) * 0.5; // ±0.25%
        const priceChange = index.price * (changePercent / 100);
        
        index.price += priceChange;
        index.change += priceChange;
        index.change_pct = (index.change / (index.price - index.change)) * 100;
        
        // Update high/low
        if (index.price > index.high) index.high = index.price;
        if (index.price < index.low) index.low = index.price;
        
        // Simulate volume changes
        index.volume += Math.floor(Math.random() * 100000);
    });
    
    // Simulate BTST stock updates
    marketData.btstStocks.forEach(stock => {
        const changePercent = (Math.random() - 0.5) * 1; // ±0.5%
        stock.ltp += stock.ltp * (changePercent / 100);
        stock.change_pct += changePercent;
        stock.rsi += (Math.random() - 0.5) * 2;
        stock.rsi = Math.max(0, Math.min(100, stock.rsi));
    });
    
    // Occasionally add new alerts
    if (Math.random() > 0.7) {
        addRandomAlert();
    }
}

// Add random trading alert
function addRandomAlert() {
    const stocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'WIPRO', 'BAJFINANCE'];
    const signals = ['BUY', 'SELL'];
    const types = ['BTST', 'Intraday', 'F&O', 'Swing'];
    
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newAlert = {
        timestamp: timestamp,
        stock: stocks[Math.floor(Math.random() * stocks.length)],
        signal: signals[Math.floor(Math.random() * signals.length)],
        entry: Math.random() * 3000 + 100,
        target: 0,
        stoploss: 0,
        type: types[Math.floor(Math.random() * types.length)]
    };
    
    newAlert.target = newAlert.entry * (1 + (Math.random() * 0.05 + 0.01));
    newAlert.stoploss = newAlert.entry * (1 - (Math.random() * 0.03 + 0.01));
    
    marketData.tradingAlerts.push(newAlert);
    renderTradingAlerts();
}

// Start auto-refresh
function startAutoRefresh() {
    clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        simulateDataUpdate();
        renderIndicesTable();
        renderBTSTTable();
        updateDateTime();
        updateMarketStatus();
        
        // Update chart occasionally
        if (Math.random() > 0.7) {
            updateChartTimeframe('1m');
        }
    }, currentRefreshRate);
    
    // Update datetime every second
    setInterval(updateDateTime, 1000);
}

// Export data functionality
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        indices: marketData.indices,
        btstStocks: marketData.btstStocks,
        tradingAlerts: marketData.tradingAlerts
    };
    
    const csvContent = convertToCSV(marketData.indices);
    downloadCSV(csvContent, 'nse_market_data.csv');
}

// Convert data to CSV
function convertToCSV(data) {
    const headers = ['Name', 'Price', 'Change', 'Change %', 'High', 'Low', 'Volume'];
    const rows = data.map(item => [
        item.name,
        item.price.toFixed(2),
        item.change.toFixed(2),
        item.change_pct.toFixed(2),
        item.high.toFixed(2),
        item.low.toFixed(2),
        item.volume
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    return csvContent;
}

// Download CSV file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function formatVolume(volume) {
    if (volume >= 10000000) {
        return (volume / 10000000).toFixed(1) + 'Cr';
    } else if (volume >= 100000) {
        return (volume / 100000).toFixed(1) + 'L';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
}

// Show loading overlay
function showLoading() {
    document.getElementById('loading-overlay').classList.add('show');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('show');
}

// Initialize loading state
showLoading();