import React, { useState, useEffect, useRef } from 'react';
import { BacktestEngine } from '../utils/backtesting';
import { pivotAngleRule, trendlineBreakRule, candleAngleIntersectionRule, createExitRules } from '../utils/tradingRules';

/**
 * Backtesting Panel Component
 * 
 * Provides controls for running a backtest and visualizing results.
 */
const BacktestingPanel = ({ data, chartInstance, priceToBarRatio }) => {
  const backtestEngineRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [results, setResults] = useState(null);
  const [selectedRules, setSelectedRules] = useState({
    pivotAngle: true,
    trendlineBreak: true,
    candleIntersection: false,
    takeProfitStopLoss: true
  });
  const [ruleParams, setRuleParams] = useState({
    pivotAngle: {
      minAngle: 30,
      maxAngle: 60,
      direction: 'up',
      pivotLookback: 5
    },
    trendlineBreak: {
      breakoutThreshold: 1
    },
    candleIntersection: {
      angle: 45,
      pivotLookback: 5
    },
    takeProfitStopLoss: {
      takeProfit: 5,
      stopLoss: 2
    }
  });
  
  // Initialize backtest engine
  useEffect(() => {
    if (!data || !data.length) return;
    
    // Create new backtest engine
    const backtestEngine = new BacktestEngine(data);
    backtestEngineRef.current = backtestEngine;
    
    // Add event listeners
    backtestEngine.on('candle', handleCandleUpdate);
    backtestEngine.on('complete', handleBacktestComplete);
    
    setIsInitialized(true);
    
    return () => {
      // Clean up on unmount
      if (backtestEngineRef.current) {
        backtestEngineRef.current.stop();
      }
    };
  }, [data]);
  
  // Apply selected rules when they change
  useEffect(() => {
    if (!backtestEngineRef.current || !isInitialized) return;
    
    // Clear existing rules
    backtestEngineRef.current.rules = [];
    
    // Add selected rules
    applySelectedRules();
    
  }, [selectedRules, ruleParams, isInitialized, priceToBarRatio]);
  
  // Apply the selected trading rules to the backtest engine
  const applySelectedRules = () => {
    const engine = backtestEngineRef.current;
    if (!engine) return;
    
    // Pivot Angle Rule
    if (selectedRules.pivotAngle) {
      const { minAngle, maxAngle, direction, pivotLookback } = ruleParams.pivotAngle;
      const rule = pivotAngleRule(minAngle, maxAngle, direction, pivotLookback, priceToBarRatio);
      engine.addRule(rule.condition, rule.action, rule.name);
    }
    
    // Trendline Break Rule
    if (selectedRules.trendlineBreak) {
      const { breakoutThreshold } = ruleParams.trendlineBreak;
      const rule = trendlineBreakRule(breakoutThreshold);
      engine.addRule(rule.condition, rule.action, rule.name);
    }
    
    // Candle Intersection Rule
    if (selectedRules.candleIntersection) {
      const { angle, pivotLookback } = ruleParams.candleIntersection;
      const rule = candleAngleIntersectionRule(angle, pivotLookback, priceToBarRatio);
      engine.addRule(rule.condition, rule.action, rule.name);
    }
    
    // Take Profit/Stop Loss Rule
    if (selectedRules.takeProfitStopLoss) {
      const { takeProfit, stopLoss } = ruleParams.takeProfitStopLoss;
      const rule = createExitRules(takeProfit, stopLoss);
      engine.addRule(rule.condition, rule.action, rule.name);
    }
  };
  
  // Handle candle updates during backtest
  const handleCandleUpdate = (data) => {
    setCurrentIndex(data.index);
    setProgress((data.index / (backtestEngineRef.current?.data.length || 1)) * 100);
    
    // Update chart if available
    updateChartMarkers(data);
  };
  
  // Update chart with trade markers
  const updateChartMarkers = (data) => {
    if (!chartInstance) return;
    
    // Clear existing trade markers
    if (chartInstance.annotations) {
      const existingAnnotations = chartInstance.annotations.filter(a => a.options.id?.startsWith('trade-'));
      existingAnnotations.forEach(a => a.destroy());
    }
    
    // Add markers for open positions
    data.account.positions.forEach(position => {
      const color = position.side === 'buy' ? '#22c55e' : '#ef4444';
      
      // Add entry marker
      chartInstance.addAnnotation({
        id: `trade-${position.id}-entry`,
        labels: [{
          point: { x: position.entryTimestamp, y: position.entryPrice },
          text: position.side === 'buy' ? '▲' : '▼',
          backgroundColor: color,
          borderColor: 'white',
          borderWidth: 1,
          borderRadius: 12,
          padding: 5,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white'
          }
        }]
      });
    });
    
    // Add markers for closed trades
    data.account.trades.slice(-5).forEach(trade => {
      const pnlColor = trade.pnl >= 0 ? '#22c55e' : '#ef4444';
      
      // Add exit marker
      chartInstance.addAnnotation({
        id: `trade-${trade.id}-exit`,
        labels: [{
          point: { x: trade.exitTimestamp, y: trade.exitPrice },
          text: trade.pnl >= 0 ? '✓' : '✗',
          backgroundColor: pnlColor,
          borderColor: 'white',
          borderWidth: 1,
          borderRadius: 12,
          padding: 5,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white'
          }
        }]
      });
    });
  };
  
  // Handle backtest completion
  const handleBacktestComplete = (data) => {
    setIsRunning(false);
    setIsPaused(false);
    setResults(data.stats);
    console.log('Backtest completed:', data.stats);
  };
  
  // Start the backtest
  const startBacktest = () => {
    if (!backtestEngineRef.current) return;
    
    // Reset previous results
    setResults(null);
    
    // Start backtest engine
    backtestEngineRef.current.start(true, 100);
    setIsRunning(true);
    setIsPaused(false);
  };
  
  // Pause the backtest
  const pauseBacktest = () => {
    if (!backtestEngineRef.current) return;
    
    backtestEngineRef.current.pause();
    setIsPaused(true);
  };
  
  // Resume the backtest
  const resumeBacktest = () => {
    if (!backtestEngineRef.current) return;
    
    backtestEngineRef.current.resume();
    setIsPaused(false);
  };
  
  // Stop the backtest
  const stopBacktest = () => {
    if (!backtestEngineRef.current) return;
    
    backtestEngineRef.current.stop();
    setIsRunning(false);
    setIsPaused(false);
  };
  
  // Step forward one candle
  const stepForward = () => {
    if (!backtestEngineRef.current) return;
    
    if (!isRunning) {
      backtestEngineRef.current.start(false);
      setIsRunning(true);
      setIsPaused(true);
    } else {
      backtestEngineRef.current.next();
    }
  };
  
  // Step backward one candle
  const stepBackward = () => {
    if (!backtestEngineRef.current || !isRunning) return;
    
    backtestEngineRef.current.previous();
  };
  
  // Change playback speed
  const changeSpeed = (speed) => {
    if (!backtestEngineRef.current) return;
    
    backtestEngineRef.current.setSpeed(speed);
    setPlaybackSpeed(speed);
  };
  
  // Toggle a rule
  const toggleRule = (ruleName) => {
    setSelectedRules(prev => ({
      ...prev,
      [ruleName]: !prev[ruleName]
    }));
  };
  
  // Update a rule parameter
  const updateRuleParam = (ruleName, paramName, value) => {
    setRuleParams(prev => ({
      ...prev,
      [ruleName]: {
        ...prev[ruleName],
        [paramName]: value
      }
    }));
  };
  
  return (
    <div className="backtesting-panel bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Backtesting</h2>
      
      {/* Control Panel */}
      <div className="flex flex-wrap gap-2 mb-4">
        {!isRunning ? (
          <button 
            onClick={startBacktest}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!isInitialized}
          >
            Start Backtest
          </button>
        ) : isPaused ? (
          <button 
            onClick={resumeBacktest}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Resume
          </button>
        ) : (
          <button 
            onClick={pauseBacktest}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Pause
          </button>
        )}
        
        {isRunning && (
          <button 
            onClick={stopBacktest}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop
          </button>
        )}
        
        <button 
          onClick={stepBackward}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          disabled={!isRunning || currentIndex <= 0}
        >
          &lt;
        </button>
        
        <button 
          onClick={stepForward}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          disabled={!isInitialized || (isRunning && currentIndex >= backtestEngineRef.current?.data.length - 1)}
        >
          &gt;
        </button>
        
        <div className="flex items-center ml-4">
          <label className="mr-2">Speed:</label>
          <select 
            value={playbackSpeed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>
      
      {/* Progress Bar */}
      {isRunning && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {/* Rules Configuration */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Trading Rules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pivot Angle Rule */}
          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Pivot Angle Pattern</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={selectedRules.pivotAngle}
                  onChange={() => toggleRule('pivotAngle')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Angle Range</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    className="border rounded px-2 py-1 w-20"
                    value={ruleParams.pivotAngle.minAngle}
                    onChange={(e) => updateRuleParam('pivotAngle', 'minAngle', Number(e.target.value))}
                    min="0"
                    max="90"
                    disabled={!selectedRules.pivotAngle}
                  />
                  <span>to</span>
                  <input 
                    type="number" 
                    className="border rounded px-2 py-1 w-20"
                    value={ruleParams.pivotAngle.maxAngle}
                    onChange={(e) => updateRuleParam('pivotAngle', 'maxAngle', Number(e.target.value))}
                    min="0"
                    max="90"
                    disabled={!selectedRules.pivotAngle}
                  />
                  <span>degrees</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Direction</label>
                <select 
                  className="border rounded px-2 py-1"
                  value={ruleParams.pivotAngle.direction}
                  onChange={(e) => updateRuleParam('pivotAngle', 'direction', e.target.value)}
                  disabled={!selectedRules.pivotAngle}
                >
                  <option value="up">Bullish (Up)</option>
                  <option value="down">Bearish (Down)</option>
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Pivot Lookback</label>
                <input 
                  type="number" 
                  className="border rounded px-2 py-1"
                  value={ruleParams.pivotAngle.pivotLookback}
                  onChange={(e) => updateRuleParam('pivotAngle', 'pivotLookback', Number(e.target.value))}
                  min="1"
                  max="20"
                  disabled={!selectedRules.pivotAngle}
                />
              </div>
            </div>
          </div>
          
          {/* Take Profit / Stop Loss */}
          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Take Profit / Stop Loss</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={selectedRules.takeProfitStopLoss}
                  onChange={() => toggleRule('takeProfitStopLoss')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Take Profit (%)</label>
                <input 
                  type="number" 
                  className="border rounded px-2 py-1"
                  value={ruleParams.takeProfitStopLoss.takeProfit}
                  onChange={(e) => updateRuleParam('takeProfitStopLoss', 'takeProfit', Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                  disabled={!selectedRules.takeProfitStopLoss}
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Stop Loss (%)</label>
                <input 
                  type="number" 
                  className="border rounded px-2 py-1"
                  value={ruleParams.takeProfitStopLoss.stopLoss}
                  onChange={(e) => updateRuleParam('takeProfitStopLoss', 'stopLoss', Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                  disabled={!selectedRules.takeProfitStopLoss}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Panel */}
      {results && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Results</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Return</div>
              <div className={`text-xl font-bold ${results.percentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {results.percentReturn.toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Win Rate</div>
              <div className="text-xl font-bold">
                {results.winRate.toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Profit Factor</div>
              <div className="text-xl font-bold">
                {results.profitFactor.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Max Drawdown</div>
              <div className="text-xl font-bold text-red-600">
                {results.maxDrawdownPercent.toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Total Trades</div>
              <div className="text-xl font-bold">
                {results.trades}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Winning Trades</div>
              <div className="text-xl font-bold text-green-600">
                {results.winningTrades}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Losing Trades</div>
              <div className="text-xl font-bold text-red-600">
                {results.losingTrades}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Final Balance</div>
              <div className="text-xl font-bold">
                ${results.finalBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestingPanel; 