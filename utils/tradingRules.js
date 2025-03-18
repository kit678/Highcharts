/**
 * Trading Rules and Strategies Module
 * 
 * Provides pre-defined trading rules and strategy templates
 * for use with the backtesting system.
 */

import { calculateAngleBetweenPoints } from './indicators';

/**
 * Create a rule that trades based on pivot point and angle
 * 
 * @param {Number} minAngle - Minimum angle to trigger (degrees)
 * @param {Number} maxAngle - Maximum angle to trigger (degrees)
 * @param {String} direction - 'up' or 'down' for the expected price movement
 * @param {Number} pivotLookback - Number of candles to check for pivot
 * @param {Number} priceToBarRatio - Price-to-bar ratio for angle calculation
 * @returns {Object} Condition and action functions
 */
const pivotAngleRule = (minAngle, maxAngle, direction, pivotLookback = 5, priceToBarRatio = 0.00369) => {
  return {
    name: `Pivot ${direction === 'up' ? 'Bottom' : 'Top'} Angle ${minAngle}°-${maxAngle}°`,
    
    // Condition checks if we have a valid pivot point with the correct angle
    condition: (context) => {
      const { index, data, high, low } = context;
      
      // Need enough historical data
      if (index < pivotLookback * 2) return false;
      
      // Check for pivot point
      let isPivot = true;
      const isPivotTop = direction === 'down';
      const pivotPrice = isPivotTop ? high : low;
      
      // Check surrounding bars to confirm pivot
      for (let i = index - pivotLookback; i <= index + pivotLookback; i++) {
        if (i === index || i < 0 || i >= data.length) continue;
        
        const comparePrice = isPivotTop ? data[i][2] : data[i][3]; // high or low
        
        if (isPivotTop && comparePrice >= pivotPrice) {
          isPivot = false;
          break;
        } else if (!isPivotTop && comparePrice <= pivotPrice) {
          isPivot = false;
          break;
        }
      }
      
      if (!isPivot) return false;
      
      // Find the previous pivot for angle calculation
      let prevPivotIndex = -1;
      let prevPivotPrice = 0;
      
      // Search backward for the opposite type of pivot
      for (let i = index - 1; i > pivotLookback; i--) {
        let isPrevPivot = true;
        const isPrevPivotTop = !isPivotTop; // Opposite type
        const price = isPrevPivotTop ? data[i][2] : data[i][3]; // high or low
        
        for (let j = i - pivotLookback; j <= i + pivotLookback; j++) {
          if (j === i || j < 0 || j >= data.length) continue;
          
          const comparePrice = isPrevPivotTop ? data[j][2] : data[j][3];
          
          if (isPrevPivotTop && comparePrice >= price) {
            isPrevPivot = false;
            break;
          } else if (!isPrevPivotTop && comparePrice <= price) {
            isPrevPivot = false;
            break;
          }
        }
        
        if (isPrevPivot) {
          prevPivotIndex = i;
          prevPivotPrice = price;
          break;
        }
      }
      
      // No previous pivot found
      if (prevPivotIndex === -1) return false;
      
      // Calculate angle between pivots
      const x1 = data[prevPivotIndex][0]; // timestamp
      const y1 = prevPivotPrice;
      const x2 = data[index][0]; // timestamp
      const y2 = pivotPrice;
      
      const angle = calculateAngleBetweenPoints(x1, y1, x2, y2, priceToBarRatio);
      
      // Check if angle is within desired range
      return angle >= minAngle && angle <= maxAngle;
    },
    
    // Action opens a position in the expected direction
    action: (context) => {
      const { timestamp, close, account } = context;
      
      // Calculate position size (1% of account)
      const positionSize = 0.01 * account.balance / close;
      
      // Open position in the appropriate direction
      account.openPosition(
        timestamp,
        close,
        direction === 'up' ? 'buy' : 'sell',
        positionSize,
        `${direction === 'up' ? 'Bullish' : 'Bearish'} Angle Pattern (${minAngle}°-${maxAngle}°)`
      );
    }
  };
};

/**
 * Create a rule that closes positions when price breaks a trendline
 * 
 * @param {Number} breakoutThresholdPercent - Percentage threshold for trendline break
 * @returns {Object} Condition and action functions
 */
const trendlineBreakRule = (breakoutThresholdPercent = 1) => {
  return {
    name: `Trendline Break (${breakoutThresholdPercent}%)`,
    
    // Check if price has broken the trendline
    condition: (context) => {
      const { account, close, high, low, index, data } = context;
      
      // Only check if we have open positions
      if (!account.positions.length) return false;
      
      let positionToClose = null;
      
      // Check each position for trendline break
      for (const position of account.positions) {
        // Get entry candle
        const entryIndex = data.findIndex(candle => candle[0] === position.entryTimestamp);
        if (entryIndex === -1) continue;
        
        // Find pivot before entry (simplified - assume entry was at pivot)
        const pivotBeforeEntry = entryIndex;
        
        // Calculate trendline value at current candle
        const x1 = data[pivotBeforeEntry][0]; // timestamp
        const y1 = position.side === 'buy' ? data[pivotBeforeEntry][3] : data[pivotBeforeEntry][2]; // low for buy, high for sell
        const x2 = data[index][0]; // current timestamp
        
        // Calculate the expected trendline value using linear interpolation
        const slope = position.side === 'buy' ? 1 : -1; // simplified slope direction based on position
        const timeElapsed = x2 - x1;
        const expectedTrendlineValue = y1 + (slope * timeElapsed * 0.0001); // simplified trendline calculation
        
        // Check for break
        const threshold = expectedTrendlineValue * (breakoutThresholdPercent / 100);
        
        if (position.side === 'buy' && low < expectedTrendlineValue - threshold) {
          positionToClose = position;
          break;
        } else if (position.side === 'sell' && high > expectedTrendlineValue + threshold) {
          positionToClose = position;
          break;
        }
      }
      
      return positionToClose !== null;
    },
    
    // Close the position that has broken its trendline
    action: (context) => {
      const { account, close, timestamp } = context;
      
      // Close all positions for simplicity
      // In a real implementation, we would identify which position to close
      account.positions.forEach(position => {
        account.closePosition(
          position.id,
          timestamp,
          close,
          'Trendline Break'
        );
      });
    }
  };
};

/**
 * Create a rule based on candle intersection with a drawn angle
 * 
 * @param {Number} angle - Angle in degrees
 * @param {Number} pivotLookback - Number of candles to identify pivots
 * @param {Number} priceToBarRatio - Price-to-bar ratio for angle calculation
 * @returns {Object} Condition and action functions
 */
const candleAngleIntersectionRule = (angle, pivotLookback = 5, priceToBarRatio = 0.00369) => {
  let lastPivots = [];
  
  return {
    name: `Candle-Angle Intersection (${angle}°)`,
    
    // Check if a candle intersects with a line drawn at the specified angle
    condition: (context) => {
      const { index, data, high, low, open, close } = context;
      
      // Need enough data
      if (index < pivotLookback * 2) return false;
      
      // Refresh pivot points every 5 candles to reduce computation
      if (index % 5 === 0 || lastPivots.length === 0) {
        // Find the last two pivots (simplistic approach)
        const pivots = [];
        
        for (let i = index - 1; i >= pivotLookback && pivots.length < 2; i--) {
          let isPivotHigh = true;
          let isPivotLow = true;
          
          for (let j = i - pivotLookback; j <= i + pivotLookback; j++) {
            if (j === i || j < 0 || j >= data.length) continue;
            
            if (data[i][2] <= data[j][2]) isPivotHigh = false;
            if (data[i][3] >= data[j][3]) isPivotLow = false;
          }
          
          if (isPivotHigh) {
            pivots.push({ index: i, price: data[i][2], type: 'high' });
          } else if (isPivotLow) {
            pivots.push({ index: i, price: data[i][3], type: 'low' });
          }
          
          if (pivots.length >= 2) break;
        }
        
        lastPivots = pivots;
      }
      
      // Need at least 2 pivots
      if (lastPivots.length < 2) return false;
      
      // Use the most recent pivots
      const pivot1 = lastPivots[0];
      const pivot2 = lastPivots[1];
      
      // Calculate the slope and angle between pivots
      const x1 = data[pivot1.index][0]; // timestamp
      const y1 = pivot1.price;
      const x2 = data[pivot2.index][0]; // timestamp
      const y2 = pivot2.price;
      
      const calculatedAngle = calculateAngleBetweenPoints(x1, y1, x2, y2, priceToBarRatio);
      
      // Check if calculated angle is close to the target angle
      if (Math.abs(calculatedAngle - angle) > 5) return false;
      
      // Draw a line from the most recent pivot at the specified angle
      const startX = data[pivot1.index][0];
      const startY = pivot1.price;
      const currentX = data[index][0];
      
      // Calculate expected Y at current X using the angle
      const angleRad = (angle * Math.PI) / 180;
      const scaledDeltaX = (currentX - startX) * priceToBarRatio;
      const expectedY = startY + (Math.tan(angleRad) * scaledDeltaX);
      
      // Check if current candle intersects with the line
      return (high >= expectedY && low <= expectedY) ||
             (open >= expectedY && close <= expectedY) ||
             (open <= expectedY && close >= expectedY);
    },
    
    // Open a position based on the intersection
    action: (context) => {
      const { timestamp, close, account } = context;
      
      // Determine trade direction based on angle
      const direction = (angle > 0 && angle < 180) ? 'buy' : 'sell';
      
      // Calculate position size (1% of account)
      const positionSize = 0.01 * account.balance / close;
      
      // Open position
      account.openPosition(
        timestamp,
        close,
        direction,
        positionSize,
        `Angle Intersection (${angle}°)`
      );
    }
  };
};

/**
 * Create common exit rules (take profit, stop loss)
 * 
 * @param {Number} takeProfitPercent - Take profit percentage
 * @param {Number} stopLossPercent - Stop loss percentage
 * @returns {Object} Condition and action functions
 */
const createExitRules = (takeProfitPercent = 5, stopLossPercent = 2) => {
  return {
    name: `Take Profit / Stop Loss (${takeProfitPercent}% / ${stopLossPercent}%)`,
    
    // Check if any positions have hit take profit or stop loss levels
    condition: (context) => {
      const { account, close } = context;
      
      if (!account.positions.length) return false;
      
      for (const position of account.positions) {
        const entryPrice = position.entryPrice;
        const currentPrice = close;
        
        const pnlPercent = position.side === 'buy' ?
          ((currentPrice - entryPrice) / entryPrice) * 100 :
          ((entryPrice - currentPrice) / entryPrice) * 100;
        
        if (pnlPercent >= takeProfitPercent || pnlPercent <= -stopLossPercent) {
          return true;
        }
      }
      
      return false;
    },
    
    // Close positions that hit take profit or stop loss
    action: (context) => {
      const { account, close, timestamp } = context;
      
      for (const position of account.positions) {
        const entryPrice = position.entryPrice;
        const currentPrice = close;
        
        const pnlPercent = position.side === 'buy' ?
          ((currentPrice - entryPrice) / entryPrice) * 100 :
          ((entryPrice - currentPrice) / entryPrice) * 100;
        
        if (pnlPercent >= takeProfitPercent) {
          account.closePosition(
            position.id,
            timestamp,
            close,
            `Take Profit (${takeProfitPercent}%)`
          );
        } else if (pnlPercent <= -stopLossPercent) {
          account.closePosition(
            position.id,
            timestamp,
            close,
            `Stop Loss (${stopLossPercent}%)`
          );
        }
      }
    }
  };
};

export {
  pivotAngleRule,
  trendlineBreakRule,
  candleAngleIntersectionRule,
  createExitRules
}; 