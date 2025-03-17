/**
 * Update the OHLC display element with point data
 */
const updateOHLCDisplay = (point, container = null) => {
  if (typeof document === 'undefined' || !point) return;
  
  try {
    const formatNumber = (num, decimals = 2) => {
      if (typeof num !== 'number' || isNaN(num)) return '-';
      return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    // Extract data from point
    let date, open, high, low, close, volume;
    
    if (Array.isArray(point)) {
      [date, open, high, low, close, volume] = point;
    } else if (point.options) {
      date = point.x;
      open = point.open || point.options.open;
      high = point.high || point.options.high;
      low = point.low || point.options.low;
      close = point.close || point.options.close;
      volume = point.options.volume;
    } else {
      date = point.x;
      open = point.open;
      high = point.high;
      low = point.low;
      close = point.close;
      volume = point.volume;
    }
    
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const ohlcHtml = `
      <span style="font-weight:bold">${formattedDate} ${time}</span> &nbsp; | &nbsp;
      <span style="color:#333">O:</span> <span style="font-weight:bold">${formatNumber(open)}</span> &nbsp;
      <span style="color:#333">H:</span> <span style="font-weight:bold">${formatNumber(high)}</span> &nbsp;
      <span style="color:#333">L:</span> <span style="font-weight:bold">${formatNumber(low)}</span> &nbsp;
      <span style="color:#333">C:</span> <span style="font-weight:bold">${formatNumber(close)}</span>
      ${volume ? `&nbsp; <span style="color:#3060cf">V:</span> <span style="font-weight:bold">${formatNumber(volume, 0)}</span>` : ''}
    `;
    
    const ohlcDisplay = document.getElementById('ohlc-display');
    if (ohlcDisplay) {
      ohlcDisplay.innerHTML = ohlcHtml;
      ohlcDisplay.style.display = 'block';
    } else if (container) {
      // Create element if it doesn't exist and container is provided
      const display = document.createElement('div');
      display.id = 'ohlc-display';
      display.className = 'ohlc-display';
      display.innerHTML = ohlcHtml;
      container.appendChild(display);
    }
  } catch (error) {
    console.error('Error updating OHLC display:', error);
  }
};

/**
 * Calculate angle between two points
 */
const calculateAngle = (x1, y1, x2, y2) => {
  try {
    const angleRad = Math.atan2(y2 - y1, x2 - x1);
    const angleDeg = angleRad * (180 / Math.PI);
    
    let angle = 90 - angleDeg;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;
    
    return parseFloat(angle.toFixed(1));
  } catch (error) {
    console.error('Error calculating angle:', error);
    return 0;
  }
};

export { updateOHLCDisplay, calculateAngle }; 