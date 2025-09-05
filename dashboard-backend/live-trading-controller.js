const { v4: uuidv4 } = require('uuid');

class LiveTradingController {
  constructor(flattradeService) {
    this.flattradeService = flattradeService;
    this.paperTradingSessions = new Map();
    console.log('📊 Live Trading Controller initialized');
  }

  // Start a paper trading session
  async startPaperTradingSession(initialCapital = 100000) {
    try {
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        initialCapital: initialCapital,
        currentCapital: initialCapital,
        positions: [],
        trades: [],
        startTime: new Date(),
        status: 'active',
        performance: {
          totalPnL: 0,
          realizedPnL: 0,
          unrealizedPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0
        }
      };

      this.paperTradingSessions.set(sessionId, session);
      console.log(`✅ Paper trading session started: ${sessionId}`);
      
      return session;
    } catch (error) {
      console.error('Error starting paper trading session:', error);
      throw error;
    }
  }

  // Get portfolio for a session
  async getPortfolio(sessionId) {
    try {
      const session = this.paperTradingSessions.get(sessionId);
      if (!session) {
        throw new Error('Trading session not found');
      }

      // Update current prices for all positions
      for (let position of session.positions) {
        try {
          const currentPrice = await this.flattradeService.getLivePrice(position.symbol);
          position.currentPrice = currentPrice;
          position.unrealizedPnL = (currentPrice - position.avgPrice) * position.quantity;
        } catch (error) {
          console.error(`Error updating price for ${position.symbol}:`, error.message);
        }
      }

      // Calculate performance metrics
      session.performance.unrealizedPnL = session.positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);
      session.performance.totalPnL = session.performance.realizedPnL + session.performance.unrealizedPnL;

      return {
        sessionId: sessionId,
        currentCapital: session.currentCapital,
        positions: session.positions,
        performance: session.performance,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting portfolio:', error);
      throw error;
    }
  }

  // Execute a paper trade
  async executePaperTrade(sessionId, tradeData) {
    try {
      const session = this.paperTradingSessions.get(sessionId);
      if (!session) {
        throw new Error('Trading session not found');
      }

      const { symbol, side, quantity, orderType = 'market', price } = tradeData;

      // Get current market price
      const currentPrice = await this.flattradeService.getLivePrice(symbol);
      const executePrice = orderType === 'market' ? currentPrice : (price || currentPrice);

      // Calculate trade value
      const tradeValue = executePrice * quantity;

      // Check if sufficient capital for buy orders
      if (side === 'buy' && tradeValue > session.currentCapital) {
        throw new Error('Insufficient capital for trade');
      }

      // Create trade record
      const trade = {
        id: uuidv4(),
        symbol: symbol,
        side: side,
        quantity: quantity,
        price: executePrice,
        value: tradeValue,
        timestamp: new Date(),
        orderType: orderType
      };

      // Update session
      session.trades.push(trade);
      session.performance.totalTrades++;

      // Update positions
      this.updatePosition(session, trade);

      // Update capital
      if (side === 'buy') {
        session.currentCapital -= tradeValue;
      } else {
        session.currentCapital += tradeValue;
      }

      console.log(`📈 Paper trade executed: ${side} ${quantity} ${symbol} @ ${executePrice}`);
      
      return {
        success: true,
        trade: trade,
        session: {
          currentCapital: session.currentCapital,
          totalTrades: session.performance.totalTrades
        }
      };
    } catch (error) {
      console.error('Error executing paper trade:', error);
      throw error;
    }
  }

  // Update position after trade
  updatePosition(session, trade) {
    const existingPosition = session.positions.find(pos => pos.symbol === trade.symbol);

    if (!existingPosition) {
      // New position
      if (trade.side === 'buy') {
        session.positions.push({
          symbol: trade.symbol,
          quantity: trade.quantity,
          avgPrice: trade.price,
          currentPrice: trade.price,
          unrealizedPnL: 0,
          realizedPnL: 0
        });
      }
    } else {
      // Update existing position
      if (trade.side === 'buy') {
        // Add to position
        const totalQuantity = existingPosition.quantity + trade.quantity;
        const totalValue = (existingPosition.quantity * existingPosition.avgPrice) + (trade.quantity * trade.price);
        existingPosition.avgPrice = totalValue / totalQuantity;
        existingPosition.quantity = totalQuantity;
      } else {
        // Reduce position
        if (trade.quantity >= existingPosition.quantity) {
          // Close position completely
          const realizedPnL = (trade.price - existingPosition.avgPrice) * existingPosition.quantity;
          existingPosition.realizedPnL += realizedPnL;
          session.performance.realizedPnL += realizedPnL;
          
          if (realizedPnL > 0) {
            session.performance.winningTrades++;
          } else {
            session.performance.losingTrades++;
          }

          // Remove position if completely closed
          if (trade.quantity === existingPosition.quantity) {
            const index = session.positions.indexOf(existingPosition);
            session.positions.splice(index, 1);
          } else {
            // Partial close - create new position with remaining quantity
            existingPosition.quantity = trade.quantity - existingPosition.quantity;
          }
        } else {
          // Partial close
          const realizedPnL = (trade.price - existingPosition.avgPrice) * trade.quantity;
          existingPosition.realizedPnL += realizedPnL;
          existingPosition.quantity -= trade.quantity;
          session.performance.realizedPnL += realizedPnL;
          
          if (realizedPnL > 0) {
            session.performance.winningTrades++;
          } else {
            session.performance.losingTrades++;
          }
        }
      }
    }
  }

  // Get session status
  getSessionStatus(sessionId) {
    const session = this.paperTradingSessions.get(sessionId);
    if (!session) {
      return { status: 'not_found' };
    }

    return {
      status: session.status,
      sessionId: sessionId,
      startTime: session.startTime,
      totalTrades: session.performance.totalTrades,
      currentCapital: session.currentCapital,
      totalPnL: session.performance.totalPnL
    };
  }

  // Stop session
  stopSession(sessionId) {
    const session = this.paperTradingSessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      session.endTime = new Date();
      console.log(`🛑 Paper trading session stopped: ${sessionId}`);
      return true;
    }
    return false;
  }

  // Get all active sessions
  getActiveSessions() {
    const activeSessions = [];
    for (let [sessionId, session] of this.paperTradingSessions) {
      if (session.status === 'active') {
        activeSessions.push({
          sessionId: sessionId,
          startTime: session.startTime,
          currentCapital: session.currentCapital,
          totalTrades: session.performance.totalTrades,
          totalPnL: session.performance.totalPnL
        });
      }
    }
    return activeSessions;
  }
}

module.exports = LiveTradingController;
