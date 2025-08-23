// NSE Trading Dashboard JavaScript

let marketData = {
    indices: [
        { "name": "NIFTY 50", "symbol": "NIFTY", "price": 24350.45, "change": 125.30, "change_pct": 0.52, "high": 24420.80, "low": 24280.15, "volume": 15234567 },
        { "name": "BANK NIFTY", "symbol": "BANKNIFTY", "price": 51245.60, "change": -89.45, "change_pct": -0.17, "high": 51398.75, "low": 51100.20, "volume": 8901234 },
        { "name": "NIFTY IT", "symbol": "NIFTYIT", "price": 34567.89, "change": 234.56, "change_pct": 0.68, "high": 34650.45, "low": 34320.12, "volume": 3456789 },
        { "name": "NIFTY PHARMA", "symbol": "NIFTYPHARMA", "price": 15432.10, "change": -45.67, "change_pct": -0.29, "high": 15500.78, "low": 15380.45, "volume": 2345678 },
        { "name": "NIFTY FMCG", "symbol": "NIFTYFMCG", "price": 56789.34, "change": 67.89, "change_pct": 0.12, "high": 56850.23, "low": 56650.78, "volume": 1876543 },
        { "name": "NIFTY MIDCAP", "symbol": "NIFTYMIDCAP", "price": 12345.67, "change": 89.12, "change_pct": 0.73, "high": 12389.45, "low": 12234.56, "volume": 4567890 },
        { "name": "NIFTY SMALLCAP", "symbol": "NIFTYSMALLCAP", "price": 17890.23, "change": -23.45, "change_pct": -0.13, "high": 17945.67, "low": 17834.12, "volume": 3789012 }
    ],
    btstStocks: [
        { "name": "RELIANCE", "ltp": 2456.75, "change_pct": 2.34, "volume_ratio": 1.45, "signal": "Bullish Breakout", "rsi": 68.4, "price_action": "Above Resistance", "btst_score": 8.2 },
        { "name": "TCS", "ltp": 3789.40, "change_pct": 1.89, "volume_ratio": 1.23, "signal": "Momentum Build", "rsi": 72.1, "price_action": "Trend Continuation", "btst_score": 7.8 },
        { "name": "INFY", "ltp": 1654.30, "change_pct": 3.12, "volume_ratio": 1.67, "signal": "Volume Surge", "rsi": 75.6, "price_action": "Gap Up", "btst_score": 8.5 },
        { "name": "HDFCBANK", "ltp": 1789.65, "change_pct": -1.23, "volume_ratio": 1.34, "signal": "Oversold Bounce", "rsi": 32.8, "price_action": "Support Hold", "btst_score": 6.9 },
        { "name": "ITC", "ltp": 456.80, "change_pct": 2.67, "volume_ratio": 1.89, "signal": "Bullish Flag", "rsi": 69.3, "price_action": "Breakout", "btst_score": 7.6 }
    ],
    tradingAlerts: [
        { "timestamp": "15:24:32", "stock": "RELIANCE", "signal": "BUY", "entry": 2456.75, "target": 2510.00, "stoploss": 2420.00, "type": "BTST" },
        { "timestamp": "15:18:45", "stock": "INFY", "signal": "BUY", "entry": 1654.30, "target": 1685.00, "stoploss": 1635.00, "type": "Intraday" },
        { "timestamp": "15:12:18", "stock": "BANKNIFTY", "signal": "SELL", "entry": 51245.60, "target": 51100.00, "stoploss": 51350.00, "type": "F&O" },
        { "timestamp": "15:08:22", "stock": "TCS", "signal": "BUY", "entry": 3789.40, "target": 3825.00, "stoploss": 3765.00, "type": "BTST" },
        { "timestamp": "15:03:56", "stock": "HDFCBANK", "signal": "BUY", "entry": 1789.65, "target": 1820.00, "stoploss": 1770.00, "type": "Swing" }
    ],
    topGainers: [
        { "name": "ADANIPORTS", "ltp": 789.45, "change_pct": 4.56 },
        { "name": "TATASTEEL", "ltp": 145.67, "change_pct": 3.89 },
        { "name": "JSWSTEEL", "ltp": 567.89, "change_pct": 3.45 },
        { "name": "HINDALCO", "ltp": 234.56, "change_pct": 3.12 },
        { "name": "COALINDIA", "ltp": 345.67, "change_pct": 2.89 }
    ],
    topLosers: [
        { "name": "BAJFINANCE", "ltp": 6789.12, "change_pct": -2.34 },
        { "name": "HCLTECH", "ltp": 1234.56, "change_pct": -1.89 },
        { "name": "WIPRO", "ltp": 456.78, "change_pct": -1.67 },
        { "name": "TECHM", "ltp": 987.65, "change_pct": -1.45 },
        { "name": "LTIM", "ltp": 3456.78, "change_pct": -1.23 }
    ]
};
let sectorData = [
    { name: "IT", change_pct: +0.68 },
    { name: "MIDCAP", change_pct: +0.73 },
    { name: "FMCG", change_pct: +0.12 },
    { name: "BANKING", change_pct: -0.17 },
    { name: "PHARMA", change_pct: -0.29 },
    { name: "SMALLCAP", change_pct: -0.13 }
];
let scalpingOpportunities = [
    { instrument: "NIFTY 50", type: "Option CE", spot: 24350, strike: 24400, direction: "Buy", target: 24455, stoploss: 24315, probability: 87 },
    { instrument: "BANKNIFTY", type: "Option PE", spot: 51100, strike: 51000, direction: "Sell", target: 50920, stoploss: 51150, probability: 83 },
    { instrument: "NIFTY MIDCAP", type: "Future", spot: 12345, strike: "-", direction: "Buy", target: 12415, stoploss: 12290, probability: 81 }
];
// --- SCALPING TRADES MANAGER ---

// List of all index instruments for scalability and rolling log
const scalpingInstruments = [
    {
        code: "NIFTY 50",
        expiry: "WEEKLY"
    },
    {
        code: "BANKNIFTY",
        expiry: "MONTHLY"
    },
    {
        code: "FINNIFTY",
        expiry: "MONTHLY"
    },
    {
        code: "SENSEX",
        expiry: "WEEKLY"
    }
];

// Session rolling log storage
let scalpingLog = []; // Array of trade objects, each keeps status

// Active trade managers per instrument
let activeScalp = {
    "NIFTY 50": null,
    "BANKNIFTY": null,
    "FINNIFTY": null,
    "SENSEX": null
};

// Demo helper: randomly pseudo-generates VWAP, ADX, MA, probability, etc. (plug API here later!)
function getDemoMarketContext(instrument) {
    // Simulate ADX, MA Slope, Bollinger width for the market state
    const adx = Math.floor(10 + Math.random() * 40);
    const maSlope = parseFloat((Math.random() * 2 - 1).toFixed(3));
    const bandFactor = parseFloat((Math.random() * 2.8).toFixed(3));
    // Market type score
    const score = (adx / 25) + (Math.abs(maSlope) / 0.8) + bandFactor;
    let marketType;
    if (score < 1.5) marketType = "Range-bound";
    else if (score < 2.5) marketType = "Weak Trend";
    else marketType = "Trending";
    // Simulate option price (ATM, OTM1), OI/volume spikes, PV structure
    const spot = 24000 + Math.floor(Math.random() * 5000);
    const atmStrike = Math.round(spot / 50) * 50;
    const otm1Strike = atmStrike + (Math.random() > 0.5 ? 50 : -50);
    return {
        adx, maSlope, bandFactor, score, marketType,
        spot, atmStrike, otm1Strike,
        premium: Math.round(80 + Math.random() * 40),  // "ATM premium"
        vwap: Math.round(atmStrike + (Math.random() - 0.5) * 30),
        PCR: parseFloat((Math.random() * 2).toFixed(2)),
        volumeSpikeCE: Math.random() > 0.7,
        volumeSpikePE: Math.random() > 0.7,
        oiSpurtCE: Math.random() > 0.6,
        oiSpurtPE: Math.random() > 0.6,
        rsi: Math.round(10 + Math.random() * 90)
    };
}
// --- SIGNAL GENERATION AND STATE MANAGER ---

// Utility: Create timestamp string (HH:MM:SS)
function nowTimeStr() {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', { hour12: false });
}

// Main: Called every refresh (or use internally) to update all instruments
function updateScalpingSignals() {
    scalpingInstruments.forEach(ins => {
        // Only generate if inactive or previous is closed
        if (activeScalp[ins.code] && activeScalp[ins.code].status === 'in progress') {
            return; // Skip if there's an active trade for this instrument
        }

        // Get fake context/market and "logic match"
        const ctx = getDemoMarketContext(ins.code);

        // Determine market type and signal logic to apply
        let useStrategy = (ctx.marketType === 'Trending') ? 'VW' : 'SMC';

        // Build candidate trade with computed probability
        // (Simulates logic filters: strike, OI/Vol/VWAP, entry confirm, etc.)
        let candidate = null;
        let struck = "--";
        let dir = "--";
        let prob = 0;
        if (useStrategy === "SMC") {
            // Rangebound: SMC (option chain smart money)
            if (ctx.oiSpurtCE && ctx.volumeSpikeCE && ctx.premium < 110 && ctx.PCR < 1.3) {
                candidate = {
                    instrument: ins.code,
                    type: `Option CE (${ins.expiry})`,
                    strike: ctx.atmStrike,
                    direction: "Buy",
                    time: nowTimeStr(),
                    strategy: "SMC",
                    probability: 90 + Math.floor(Math.random() * 5),
                    entry: ctx.premium,
                    target: "--",
                    stoploss: "--",
                    status: "in progress",
                    exitTime: "--"
                };
                struck = ctx.atmStrike;
                dir = "Buy";
                prob = candidate.probability;
            }
            else if (ctx.oiSpurtPE && ctx.volumeSpikePE && ctx.premium < 110 && ctx.PCR > 0.5) {
                candidate = {
                    instrument: ins.code,
                    type: `Option PE (${ins.expiry})`,
                    strike: ctx.atmStrike,
                    direction: "Sell",
                    time: nowTimeStr(),
                    strategy: "SMC",
                    probability: 90 + Math.floor(Math.random() * 5),
                    entry: ctx.premium,
                    target: "--",
                    stoploss: "--",
                    status: "in progress",
                    exitTime: "--"
                };
                struck = ctx.atmStrike;
                dir = "Sell";
                prob = candidate.probability;
            }
        } else {
            // Trending: VWAP Bounce
            let bullishVWAPBounce = ctx.spot > ctx.vwap && ctx.rsi < 70 && ctx.premium >= 80 && ctx.premium <= 110;
            if (bullishVWAPBounce) {
                candidate = {
                    instrument: ins.code,
                    type: `Option CE (${ins.expiry})`,
                    strike: ctx.atmStrike,
                    direction: "Buy",
                    time: nowTimeStr(),
                    strategy: "VW",
                    probability: 92 + Math.floor(Math.random() * 4),
                    entry: ctx.premium,
                    target: "--",
                    stoploss: "--",
                    status: "in progress",
                    exitTime: "--"
                };
                struck = ctx.atmStrike;
                dir = "Buy";
                prob = candidate.probability;
            }
            let bearishVWAPBounce = ctx.spot < ctx.vwap && ctx.rsi > 30 && ctx.premium >= 80 && ctx.premium <= 110;
            if (!candidate && bearishVWAPBounce) {
                candidate = {
                    instrument: ins.code,
                    type: `Option PE (${ins.expiry})`,
                    strike: ctx.atmStrike,
                    direction: "Sell",
                    time: nowTimeStr(),
                    strategy: "VW",
                    probability: 92 + Math.floor(Math.random() * 4),
                    entry: ctx.premium,
                    target: "--",
                    stoploss: "--",
                    status: "in progress",
                    exitTime: "--"
                };
                struck = ctx.atmStrike;
                dir = "Sell";
                prob = candidate.probability;
            }
        }

        // Add only ONE: ATM has priority, otherwise OTM1 if ATM not matched.
        if (candidate) {
            activeScalp[ins.code] = candidate;
            scalpingLog.unshift(candidate); // Add to log (newest at top)
        }
    });

    // Demo: Auto-complete signals after N intervals for rolling log effect
    scalpingLog.forEach(signal => {
        if (signal.status === "in progress") {
            if (!signal._lifetime) signal._lifetime = 0;
            signal._lifetime++;
            // After X refreshes (~2-4 demo minutes), mark as complete and record exit time
            if (signal._lifetime > 6 + Math.floor(Math.random() * 6)) {
                signal.status = "completed";
                signal.exitTime = nowTimeStr();
                activeScalp[signal.instrument] = null;
                // Assign "Passed" or "Failed"
                signal.result = (Math.random() > 0.27) ? "Passed" : "Failed";
            }
        }
    });

    // To avoid memory bloat, keep log at most ~30 signals per session:
    if (scalpingLog.length > 30) scalpingLog = scalpingLog.slice(0, 30);
}

// --- Sector Heatmap and Scalping Table Rendering ---

function renderSectorHeatmap() {
    const grid = document.querySelector(".sector-grid");
    if (!grid) return;
    grid.innerHTML = ""; // Clear old
    // Find trending sector (absolute biggest % move)
    let trending = sectorData.reduce((max, s) => Math.abs(s.change_pct) > Math.abs(max.change_pct) ? s : max, sectorData[0]);
    sectorData.forEach(sector => {
        const item = document.createElement("div");
        item.className = "sector-item " + (sector.change_pct >= 0 ? "positive" : "negative");
        if (sector === trending) item.style.boxShadow = "0 0 12px #3fc75d, 0 0 4px #fff"; // highlight trending
        item.innerHTML = `
      <div class="sector-name">${sector.name}</div>
      <div class="sector-change">${sector.change_pct > 0 ? "+" : ""}${sector.change_pct.toFixed(2)}%</div>
    `;
        grid.appendChild(item);
    });
}
function renderScalpingTable() {
    const tbody = document.getElementById("scalping-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    scalpingLog.forEach(signal => {
        const row = document.createElement("tr");
        row.className = (signal.status === "completed") ? "scalping-closed" : "scalping-active";
        row.innerHTML = `
            <td>${signal.time || "--"}</td>
            <td>${signal.instrument || "--"}</td>
            <td>${signal.type || "--"}</td>
            <td>${signal.strike || "--"}</td>
            <td class="${signal.direction === "Buy" ? "price-positive" : "price-negative"}">${signal.direction || "--"}</td>
            <td>${signal.strategy === "VW" ? "VWAP BOUNCE" : (signal.strategy || "--")}</td>
            <td><b>${signal.probability || "--"}%</b></td>
            <td>${signal.status === "in progress" ? '<span style="color:#2bf542;font-weight:bold;">IN PROGRESS</span>' : '<span style="color:#999">COMPLETED</span>'}</td>
            <td>${signal.exitTime || "--"}</td>
            <td>
                ${signal.status === "completed" 
                ? (signal.result === "Passed" 
                    ? "<span style='color:#0bf548;font-weight:600;'>Passed</span>"
                    : "<span style='color:#ff355e;font-weight:600;'>Failed</span>")
                : "--"}
            </td>
        `;
        tbody.appendChild(row);
    });
}
// --- Global variables for refresh and sorting ---
let refreshInterval;
let currentRefreshRate = 5000; // 5 seconds default
let currentSortColumn = null;
let currentSortDirection = 'asc';

// --- Chart Switch Logic ---
let chartType = 'candlestick'; // 'candlestick' or 'line'
let niftyChart = null;

// Sample candlestick data for demonstration
const candlestickData = {
    datasets: [{
        label: 'NIFTY (Candlestick)',
        data: [
            { x: new Date('2025-08-21T09:00:00'), o: 24300, h: 24400, l: 24200, c: 24350 },
            { x: new Date('2025-08-21T10:00:00'), o: 24350, h: 24480, l: 24300, c: 24400 },
            { x: new Date('2025-08-21T11:00:00'), o: 24400, h: 24550, l: 24380, c: 24500 },
            { x: new Date('2025-08-21T12:00:00'), o: 24500, h: 24550, l: 24400, c: 24450 },
            { x: new Date('2025-08-21T13:00:00'), o: 24450, h: 24510, l: 24400, c: 24430 },
        ]
    }]
};

// Sample line data for demonstration
const lineData = {
    labels: ['09:00', '10:00', '11:00', '12:00', '13:00'],
    datasets: [{
        label: 'NIFTY (Line)',
        data: [24350, 24400, 24500, 24450, 24430],
        borderColor: '#3fc75d',
        backgroundColor: 'rgba(63, 199, 93, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 2
    }]
};
// --- Chart rendering and toggle logic ---
function renderNiftyChart() {
    const ctx = document.getElementById('nifty-candlestick-chart').getContext('2d');
    if (niftyChart) niftyChart.destroy();
    if (chartType === 'candlestick') {
        niftyChart = new Chart(ctx, {
            type: 'candlestick',
            data: candlestickData,
            options: {
                plugins: { legend: { display: true } },
                scales: { x: { type: 'time', time: { unit: 'hour' } }, y: {} }
            }
        });
    } else {
        niftyChart = new Chart(ctx, {
            type: 'line',
            data: lineData,
            options: {
                plugins: { legend: { display: true } },
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: {}, y: {} }
            }
        });
    }
}

function setupChartTypeToggle() {
    document.querySelectorAll('input[name="chart-type"]').forEach((el) =>
        el.addEventListener('change', function () {
            chartType = this.value;
            renderNiftyChart();
        })
    );
}

// --- Dashboard Initialization ---
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
    showLoading();
    setTimeout(() => {
        hideLoading();
    }, 1500);
});

function initializeDashboard() {
    updateDateTime();
    updateMarketStatus();
    renderIndicesTable();
    renderSectorHeatmap();
    renderBTSTTable();
    renderTradingAlerts();
    renderGainersLosers();
    renderNiftyChart();
    setupChartTypeToggle();
    setupEventListeners();
    updateScalpingSignals();     // <-- Create initial signals/log
    renderScalpingTable();       // <-- Render them immediately
    startAutoRefresh();          // <-- Begin the periodic updates
}

// Date and time updates
function updateDateTime() {
    const now = new Date();
    const timeOptions = {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    };
    const dateOptions = {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
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
    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
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
// --- RENDER SCALPING LOG TABLE ---
function renderScalpingTable() {
    const tbody = document.getElementById("scalping-tbody");
    if (!tbody) return;
    tbody.innerHTML = ""; // Clear old

    scalpingLog.forEach(signal => {
        const row = document.createElement("tr");
        row.className = (signal.status === "completed") ? "scalping-closed" : "scalping-active";
        row.innerHTML = `
      <td>${signal.time || "--"}</td>
      <td>${signal.instrument || "--"}</td>
      <td>${signal.type || "--"}</td>
      <td>${signal.strike || "--"}</td>
      <td class="${signal.direction === "Buy" ? "price-positive" : "price-negative"}">${signal.direction || "--"}</td>
      <td>${signal.strategy === "VW" ? "VWAP BOUNCE" : (signal.strategy || "--")}</td>
      <td><b>${signal.probability || "--"}%</b></td>
      <td>${signal.status === "in progress" ? '<span style="color:#2bf542;font-weight:bold;">IN PROGRESS</span>' : '<span style="color:#999">COMPLETED</span>'}</td>
      <td>${signal.exitTime || "--"}</td>
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
// --- Event listeners, Tab, Table, Chart Helpers ---

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Timeframe switching (optional: demo purpose with random values)
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

    // Sound alerts checkbox (you can ignore/mute in demo)
    document.getElementById('sound-alerts').addEventListener('change', (e) => {
        if (e.target.checked) {
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
            console.log('Escape pressed');
        }
    });
}

// --- Tab helper
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// --- Timeframe update (random demo data)
function updateChartTimeframe(timeframe) {
    // Demo: just randomize line chart for now
    const chartData = generateCandlestickData();
    if (chartType === 'line' && niftyChart && niftyChart.data) {
        niftyChart.data.labels = chartData.labels;
        niftyChart.data.datasets[0].data = chartData.prices;
        niftyChart.update();
    }
    // For candlestick, you could apply similar logic with ohlc demo
}

// --- Sort table
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

// --- Data/Chart randomization for demo
function generateCandlestickData() {
    const labels = [];
    const prices = [];
    const basePrice = 24350;
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * 5);
        labels.push(date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        const randomChange = (Math.random() - 0.5) * 100;
        const price = basePrice + randomChange + (Math.sin(i / 5) * 50);
        prices.push(price.toFixed(2));
    }
    return { labels, prices };
}
// --- Real-time simulation, refresh, export, and utilities ---

// Simulate real-time data updates
function simulateDataUpdate() {
    marketData.indices.forEach(index => {
        const changePercent = (Math.random() - 0.5) * 0.5; // ±0.25%
        const priceChange = index.price * (changePercent / 100);
        index.price += priceChange;
        index.change += priceChange;
        index.change_pct = (index.change / (index.price - index.change)) * 100;
        if (index.price > index.high) index.high = index.price;
        if (index.price < index.low) index.low = index.price;
        index.volume += Math.floor(Math.random() * 100000);
    });

    marketData.btstStocks.forEach(stock => {
        const changePercent = (Math.random() - 0.5) * 1;
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

// --- Auto-refresh management
function startAutoRefresh() {
    clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        simulateDataUpdate();
        renderIndicesTable();
        renderBTSTTable();
        updateDateTime();
        updateMarketStatus();
        updateScalpingSignals();
        renderScalpingTable();
        // Simulate chart update occasionally
        if (Math.random() > 0.7) {
            updateChartTimeframe('1m');
        }
    }, currentRefreshRate);

    // Update datetime every second
    setInterval(updateDateTime, 1000);
}

// --- Export functionality
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
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    return csvContent;
}

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

// --- Formatting utilities
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

// --- Loading overlays
function showLoading() {
    document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('show');
}

// --- Initialize loading state at startup
showLoading();
