# TradingView-like Chart Component

A Next.js component that replicates TradingView's charting experience, with a strong focus on implementing a "price-to-bar" ratio locking feature that supports very granular values (e.g., 0.00369). Users can manually draw lines (such as trendlines) on the chart—just like in TradingView—and the drawn shapes preserve their geometry (angles and proportions) when zooming or panning.

## Features

1. **TradingView-like Candlestick Chart**
   - Renders historical price data with candlesticks
   - Supports zooming and panning with price-to-bar ratio preservation
   - Built with D3.js for maximum flexibility and control

2. **Granular Price-to-Bar Ratio Locking**
   - Lock the chart's scale by maintaining a fixed constant `c` (e.g., 0.00369)
   - The ratio defines how many price units correspond to one bar (time unit)
   - When zooming or panning, both the x-axis (time) and y-axis (price) scales update together to preserve the exact ratio

3. **Manual Drawing Tools**
   - Intuitive drawing mode for adding trendlines to the chart
   - Displays the angle of drawn lines
   - Maintains angle consistency during zoom and pan operations
   - Preserves line geometry regardless of view changes

## Installation

The component is designed to be used within a Next.js application using D3.js for rendering. Make sure you have the following dependencies installed:

```bash
npm install d3
```

## Usage

1. Import the component in your Next.js page:

```jsx
import TradingViewChart from '../components/TradingViewChart';
```

2. Use the component in your page:

```jsx
<TradingViewChart 
  data={candlestickData} 
  width={800} 
  height={500} 
/>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `data` | Array | Candlestick data in format `[{date, open, high, low, close, volume}, ...]` | `[]` |
| `width` | Number | Width of the chart in pixels | `800` |
| `height` | Number | Height of the chart in pixels | `500` |

### Data Format

The component expects data in the following format:

```javascript
[
  {
    date: "2023-01-01T00:00:00Z", // Date string or Date object
    open: 100.00,
    high: 105.00,
    low: 98.00,
    close: 103.50,
    volume: 1000 // Optional
  },
  // More data points...
]
```

## Testing the Price-to-Bar Ratio Locking

To test and verify that the price-to-bar ratio locking works correctly:

1. Launch the demo page at `/tradingview-chart`
2. Set the price-to-bar ratio to a specific value (e.g., 0.00369) in the input field
3. Draw a trendline on the chart by clicking the Draw button and dragging on the chart
4. Note the angle of the line displayed in the top toolbar
5. Zoom in/out or pan the chart and observe that:
   - The angle of the line remains consistent
   - The relationship between price and time units remains proportional

## Comparing with TradingView

To compare this implementation with TradingView:

1. Open TradingView and set the same price scale setting (equivalent to our price-to-bar ratio)
2. Draw a trendline on TradingView at the same angle
3. Observe that zooming and panning preserve the angle in both systems
4. Verify that the numerical angle values match between both implementations

## How It Works

### Price-to-Bar Ratio

The price-to-bar ratio is implemented by:

1. Calculating the time range in bars (e.g., days)
2. Multiplying by the constant ratio to determine the appropriate price range
3. Adjusting the y-axis scale to maintain this relationship during zooming

```javascript
// Calculate what the price range should be based on the ratio
const targetPriceRange = timeRangeBars * ratio;
```

### Drawing Tool

The drawing functionality:
1. Captures mouse events on the chart
2. Records start and end positions in data space (not screen space)
3. Calculates the angle using the raw data coordinates
4. Renders the line using D3's scaling functions

### Preserving Geometry

Geometry preservation is achieved by:
1. Storing all drawn objects in data coordinates
2. Recalculating screen positions whenever scales change
3. Ensuring the scales maintain the locked ratio during zoom operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 