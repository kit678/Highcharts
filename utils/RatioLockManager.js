/**
 * RatioLockManager.js
 * 
 * Encapsulates the price-to-bar ratio locking functionality to make it more robust
 * and less susceptible to breaking from other feature changes.
 */

import { calculateBarTimeLength } from './dataUtils';

class RatioLockManager {
  constructor() {
    this.chart = null;
    this.priceToBarRatio = 0.00369; // Default ratio
    this.isLocked = false;
    this.isBusy = false;
    this.previousState = null;
    this.updateInProgress = false;
  }

  /**
   * Initialize the manager with a chart instance
   * @param {Object} chart - Highcharts instance
   * @param {number} ratio - Initial price-to-bar ratio
   * @param {boolean} isLocked - Initial lock state
   */
  initialize(chart, ratio, isLocked = false) {
    this.chart = chart;
    this.priceToBarRatio = ratio;
    this.isLocked = isLocked;
    
    // Store reference on chart for easier access
    if (chart) {
      chart._ratioLockManager = this;
      
      // Add flag to chart
      chart.ratioLocked = isLocked;
      
      console.log("RatioLockManager initialized:", {
        ratio,
        isLocked
      });
    }
    
    return this;
  }

  /**
   * Set the price-to-bar ratio
   * @param {number} ratio - New ratio
   * @param {boolean} applyNow - Whether to apply the ratio immediately
   */
  setRatio(ratio, applyNow = false) {
    if (typeof ratio !== 'number' || ratio <= 0) {
      console.warn("Invalid ratio:", ratio);
      return;
    }
    
    this.priceToBarRatio = ratio;
    console.log("Price-to-bar ratio updated:", ratio);
    
    if (applyNow && this.isLocked && this.chart) {
      this.applyRatioLock();
    }
    
    return this;
  }

  /**
   * Set the lock state
   * @param {boolean} isLocked - New lock state
   */
  setLocked(isLocked) {
    const previousLockState = this.isLocked;
    this.isLocked = !!isLocked;
    
    console.log("Price-to-bar ratio lock state:", isLocked ? "Locked" : "Unlocked");
    
    // Update chart flag
    if (this.chart) {
      this.chart.ratioLocked = this.isLocked;
    }
    
    // If we're enabling the lock, apply it
    if (!previousLockState && this.isLocked && this.chart) {
      this.applyRatioLock();
    }
    
    return this;
  }

  /**
   * Handle extremes change
   * @param {Object} axis - The axis that changed
   * @param {Object} e - The event object
   */
  handleSetExtremes(axis, e) {
    if (!this.isLocked || !this.chart || this.updateInProgress) return;
    
    // Set flag to prevent recursive updates
    this.updateInProgress = true;
    
    try {
      const xAxis = axis.isXAxis ? axis : this.chart.xAxis[0];
      const yAxis = axis.isXAxis ? this.chart.yAxis[0] : axis;
      
      if (!xAxis || !yAxis) {
        console.warn("Missing axis, cannot apply ratio lock");
        this.updateInProgress = false;
        return;
      }
      
      const series = this.chart.series[0];
      if (!series) {
        console.warn("No series available, cannot apply ratio lock");
        this.updateInProgress = false;
        return;
      }
      
      // Get bar count and calculate price range
      const { barTimeLength, barsInView } = calculateBarTimeLength(series, xAxis);
      
      // Fallback if bar count calculation fails
      let effectiveBarsInView = barsInView;
      if (effectiveBarsInView <= 0) {
        // Create a fallback using visible points
        const visiblePoints = this._getVisiblePoints(series, xAxis);
        
        // If we have at least 2 visible points, use their count
        if (visiblePoints.length >= 2) {
          effectiveBarsInView = visiblePoints.length;
        } else if (series.points && series.points.length > 0) {
          // If no visible points, estimate from total range
          const totalPoints = series.points;
          const timeRange = xAxis.max - xAxis.min;
          const totalTimeRange = totalPoints[totalPoints.length - 1].x - totalPoints[0].x;
          effectiveBarsInView = Math.max(1, (timeRange / totalTimeRange) * totalPoints.length);
        } else {
          // Last resort fallback
          effectiveBarsInView = 100;
        }
      }
      
      // Calculate target price range
      const targetPriceRange = this.priceToBarRatio * effectiveBarsInView;
      
      // Get price center from visible points
      const { minPrice, maxPrice } = this._getVisiblePriceRange(series, xAxis);
      const priceCenter = (minPrice + maxPrice) / 2;
      
      // Only apply if this is an X-axis change or specifically triggered update
      // and the Y-axis range would actually change
      if ((axis.isXAxis || e.trigger === 'ratioChange' || e.trigger === 'init') && 
          this._shouldUpdateYAxis(yAxis, priceCenter, targetPriceRange)) {
        
        // Apply new Y-axis range
        yAxis.setExtremes(
          priceCenter - targetPriceRange / 2,
          priceCenter + targetPriceRange / 2,
          true,  // redraw
          false, // no animation
          { syncYAxis: true } // Prevent recursion
        );
        
        console.log("Applied ratio lock:", {
          barsInView: effectiveBarsInView,
          targetPriceRange,
          newMin: priceCenter - targetPriceRange / 2,
          newMax: priceCenter + targetPriceRange / 2
        });
      }
    } catch (error) {
      console.error("Error applying ratio lock:", error);
    } finally {
      // Reset update flag
      setTimeout(() => {
        this.updateInProgress = false;
      }, 50);
    }
  }

  /**
   * Apply the ratio lock to the current chart view
   */
  applyRatioLock() {
    if (!this.chart || !this.isLocked) return;
    
    try {
      const xAxis = this.chart.xAxis[0];
      if (xAxis) {
        this.handleSetExtremes(xAxis, { trigger: 'ratioChange' });
      }
    } catch (error) {
      console.error("Error applying ratio lock:", error);
    }
    
    return this;
  }

  /**
   * Get visible points from a series
   * @private
   */
  _getVisiblePoints(series, xAxis) {
    if (!series || !series.points || !xAxis) return [];
    
    return series.points.filter(p => p.x >= xAxis.min && p.x <= xAxis.max);
  }

  /**
   * Get price range of visible points
   * @private
   */
  _getVisiblePriceRange(series, xAxis) {
    const visiblePoints = this._getVisiblePoints(series, xAxis);
    let minPrice = Infinity, maxPrice = -Infinity;
    
    if (visiblePoints.length > 0) {
      visiblePoints.forEach(point => {
        // Handle both OHLC and regular series
        minPrice = Math.min(minPrice, point.low || point.y || 0);
        maxPrice = Math.max(maxPrice, point.high || point.y || 0);
      });
    } else if (series.yData && series.yData.length > 0) {
      // If no visible points, use all data
      const yData = series.yData;
      for (let i = 0; i < yData.length; i++) {
        const value = yData[i];
        // Handle both array (OHLC) and scalar values
        if (Array.isArray(value)) {
          minPrice = Math.min(minPrice, Math.min(...value));
          maxPrice = Math.max(maxPrice, Math.max(...value));
        } else {
          minPrice = Math.min(minPrice, value);
          maxPrice = Math.max(maxPrice, value);
        }
      }
    } else {
      // Last resort fallback
      minPrice = xAxis.min || 0;
      maxPrice = xAxis.max || 100;
    }
    
    return { minPrice, maxPrice };
  }

  /**
   * Determine if Y-axis needs updating
   * @private
   */
  _shouldUpdateYAxis(yAxis, priceCenter, targetPriceRange) {
    if (!yAxis) return false;
    
    // Check if the change would be significant enough to apply
    const currentMin = yAxis.min;
    const currentMax = yAxis.max;
    const newMin = priceCenter - targetPriceRange / 2;
    const newMax = priceCenter + targetPriceRange / 2;
    
    // Don't update if the change is very small
    const threshold = 0.0001;
    return Math.abs(currentMin - newMin) > threshold || 
           Math.abs(currentMax - newMax) > threshold;
  }
}

export default RatioLockManager; 