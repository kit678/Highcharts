/**
 * Backtesting Module for Trading Strategies
 * 
 * Provides functionality for:
 * - Candle-by-candle simulation
 * - Strategy evaluation
 * - Performance tracking
 */

/**
 * A simulated trading account for backtesting
 */
class SimulatedAccount {
  constructor(initialBalance = 10000) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.positions = [];
    this.trades = [];
    this.equity = [{ timestamp: Date.now(), value: initialBalance }];
  }
  
  /**
   * Open a new position
   * @param {Object} position - Position details
   * @param {Number} timestamp - Entry timestamp
   * @param {Number} price - Entry price
   * @param {String} side - 'buy' or 'sell'
   * @param {Number} size - Position size
   * @param {String} reason - Reason for entry
   */
  openPosition(timestamp, price, side, size, reason = '') {
    const cost = price * size;
    const positionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Check if we have enough balance
    if (side === 'buy' && cost > this.balance) {
      console.warn('Insufficient balance to open position');
      return null;
    }
    
    // Create position
    const position = {
      id: positionId,
      entryTimestamp: timestamp,
      entryPrice: price,
      side: side,
      size: size,
      currentPrice: price,
      pnl: 0,
      status: 'open',
      reason: reason
    };
    
    // Add to positions list
    this.positions.push(position);
    
    // Adjust balance
    if (side === 'buy') {
      this.balance -= cost;
    }
    
    return positionId;
  }
  
  /**
   * Close an existing position
   * @param {String} positionId - ID of position to close
   * @param {Number} timestamp - Exit timestamp
   * @param {Number} price - Exit price
   * @param {String} reason - Reason for exit
   */
  closePosition(positionId, timestamp, price, reason = '') {
    // Find position
    const positionIndex = this.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) {
      console.warn(`Position ${positionId} not found`);
      return false;
    }
    
    const position = this.positions[positionIndex];
    if (position.status !== 'open') {
      console.warn(`Position ${positionId} is already closed`);
      return false;
    }
    
    // Calculate PnL
    const exitValue = position.size * price;
    const entryValue = position.size * position.entryPrice;
    const pnl = position.side === 'buy' ? 
      exitValue - entryValue : 
      entryValue - exitValue;
    
    // Update position
    position.exitTimestamp = timestamp;
    position.exitPrice = price;
    position.pnl = pnl;
    position.status = 'closed';
    position.exitReason = reason;
    
    // Add to trades history
    this.trades.push({
      ...position,
      pnlPercent: (pnl / entryValue) * 100
    });
    
    // Remove from active positions
    this.positions.splice(positionIndex, 1);
    
    // Update balance
    this.balance += exitValue + (position.side === 'buy' ? pnl : 0);
    
    // Update equity
    this.updateEquity(timestamp);
    
    return true;
  }
  
  /**
   * Update all open positions with current price
   * @param {Number} timestamp - Current timestamp
   * @param {Number} price - Current price
   */
  updatePositions(timestamp, price) {
    this.positions.forEach(position => {
      position.currentPrice = price;
      
      // Update unrealized PnL
      const currentValue = position.size * price;
      const entryValue = position.size * position.entryPrice;
      position.pnl = position.side === 'buy' ? 
        currentValue - entryValue : 
        entryValue - currentValue;
    });
    
    // Update equity curve
    this.updateEquity(timestamp);
  }
  
  /**
   * Update equity value
   * @param {Number} timestamp - Current timestamp
   */
  updateEquity(timestamp) {
    // Calculate unrealized PnL from all open positions
    const unrealizedPnl = this.positions.reduce((total, position) => {
      return total + position.pnl;
    }, 0);
    
    // Current equity = cash balance + unrealized PnL
    const currentEquity = this.balance + unrealizedPnl;
    
    // Add to equity curve
    this.equity.push({
      timestamp,
      value: currentEquity
    });
  }
  
  /**
   * Get account statistics
   */
  getStats() {
    // Calculate overall performance
    const finalEquity = this.equity[this.equity.length - 1]?.value || this.balance;
    const totalReturn = finalEquity - this.initialBalance;
    const percentReturn = (totalReturn / this.initialBalance) * 100;
    
    // Calculate trade statistics
    const winningTrades = this.trades.filter(t => t.pnl > 0);
    const losingTrades = this.trades.filter(t => t.pnl < 0);
    
    const winRate = winningTrades.length / (this.trades.length || 1) * 100;
    
    const avgWin = winningTrades.length ? 
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    
    const avgLoss = losingTrades.length ? 
      losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;
      
    // Calculate drawdown
    let maxEquity = this.initialBalance;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    
    this.equity.forEach(point => {
      if (point.value > maxEquity) {
        maxEquity = point.value;
      }
      
      const drawdown = maxEquity - point.value;
      const drawdownPercent = (drawdown / maxEquity) * 100;
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    });
    
    return {
      initialBalance: this.initialBalance,
      finalBalance: finalEquity,
      totalReturn,
      percentReturn,
      trades: this.trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      maxDrawdown,
      maxDrawdownPercent,
      profitFactor: Math.abs(avgWin / avgLoss) || 0
    };
  }
}

/**
 * Backtesting engine for simulating trading strategies
 */
class BacktestEngine {
  constructor(data, initialBalance = 10000) {
    this.data = data;
    this.currentIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.playbackSpeed = 1;
    this.account = new SimulatedAccount(initialBalance);
    this.listeners = {
      candle: [],
      trade: [],
      complete: []
    };
    this.rules = [];
  }
  
  /**
   * Add a trading rule
   * @param {Function} condition - Function that returns true when condition is met
   * @param {Function} action - Function to execute when condition is met
   * @param {String} name - Name of the rule
   */
  addRule(condition, action, name = 'Unnamed Rule') {
    this.rules.push({
      name,
      condition,
      action,
      stats: {
        triggered: 0,
        lastTriggered: null
      }
    });
    
    return this.rules.length - 1; // Return rule index
  }
  
  /**
   * Register event listener
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }
  
  /**
   * Emit event to all listeners
   * @param {String} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  /**
   * Start the backtest
   * @param {Boolean} autoRun - Whether to automatically run through all candles
   * @param {Number} interval - Interval between candles in ms (if autoRun is true)
   */
  start(autoRun = true, interval = 200) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.currentIndex = 0;
    
    // Reset account
    this.account = new SimulatedAccount(this.account.initialBalance);
    
    if (autoRun) {
      this.runSimulation(interval);
    } else {
      this.processCurrentCandle();
    }
    
    return this;
  }
  
  /**
   * Pause the backtest
   */
  pause() {
    this.isPaused = true;
    return this;
  }
  
  /**
   * Resume the backtest
   */
  resume() {
    if (!this.isRunning) return this.start();
    
    this.isPaused = false;
    this.runSimulation();
    
    return this;
  }
  
  /**
   * Stop the backtest
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    
    return this;
  }
  
  /**
   * Set playback speed
   * @param {Number} speed - Playback speed multiplier
   */
  setSpeed(speed) {
    this.playbackSpeed = speed;
    return this;
  }
  
  /**
   * Move to the next candle
   */
  next() {
    if (!this.isRunning || this.currentIndex >= this.data.length - 1) return;
    
    this.currentIndex++;
    this.processCurrentCandle();
    
    return this;
  }
  
  /**
   * Move to the previous candle
   */
  previous() {
    if (!this.isRunning || this.currentIndex <= 0) return;
    
    this.currentIndex--;
    this.processCurrentCandle();
    
    return this;
  }
  
  /**
   * Process the current candle
   */
  processCurrentCandle() {
    if (this.currentIndex >= this.data.length) {
      this.complete();
      return;
    }
    
    const candle = this.data[this.currentIndex];
    
    // Update positions with current price
    this.account.updatePositions(candle[0], candle[4]); // timestamp, close price
    
    // Check trading rules
    this.checkRules(candle);
    
    // Emit candle event
    this.emit('candle', {
      index: this.currentIndex,
      candle,
      account: this.account
    });
  }
  
  /**
   * Run the simulation automatically
   * @param {Number} interval - Time between candles in ms
   */
  runSimulation(interval = 200) {
    if (!this.isRunning || this.isPaused) return;
    
    // Process current candle
    this.processCurrentCandle();
    
    // Move to next candle after interval
    if (this.currentIndex < this.data.length - 1) {
      const adjustedInterval = interval / this.playbackSpeed;
      
      setTimeout(() => {
        this.currentIndex++;
        this.runSimulation(interval);
      }, adjustedInterval);
    } else {
      this.complete();
    }
  }
  
  /**
   * Check if any trading rules are triggered
   * @param {Array} candle - Current candle data
   */
  checkRules(candle) {
    // Extract OHLC data
    const [timestamp, open, high, low, close, volume] = candle;
    
    // Create candle context object for rule evaluation
    const context = {
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      index: this.currentIndex,
      data: this.data,
      account: this.account
    };
    
    // Check each rule
    this.rules.forEach(rule => {
      try {
        if (rule.condition(context)) {
          // Rule condition met, execute action
          rule.action(context);
          
          // Update rule statistics
          rule.stats.triggered++;
          rule.stats.lastTriggered = timestamp;
        }
      } catch (error) {
        console.error(`Error in rule ${rule.name}:`, error);
      }
    });
  }
  
  /**
   * Complete the backtest
   */
  complete() {
    this.isRunning = false;
    
    // Calculate final account value
    const stats = this.account.getStats();
    
    // Emit complete event
    this.emit('complete', {
      stats,
      account: this.account
    });
  }
  
  /**
   * Get current backtest status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      progress: this.data.length ? (this.currentIndex / this.data.length) * 100 : 0,
      playbackSpeed: this.playbackSpeed,
      rules: this.rules.map(r => ({
        name: r.name,
        triggered: r.stats.triggered,
        lastTriggered: r.stats.lastTriggered
      })),
      accountStats: this.account.getStats()
    };
  }
}

export { SimulatedAccount, BacktestEngine }; 