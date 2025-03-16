# Highstock TradingView-like Chart Component

A Next.js chart component that replicates TradingView's charting experience, with a strong focus on implementing a "price-to-bar" ratio locking feature and manual drawing tools.

## Features

- **TradingView-like Charting**: Built using Highcharts Stock (Highstock) to provide a professional financial charting experience
- **Manual Drawing Tools**: Includes tools for drawing trendlines, shapes, and annotations (via Highstock's Stock Tools module)
- **Price-to-Bar Ratio Locking**: Maintains a fixed ratio between price units and time units to preserve drawing angles when zooming or panning
- **Angle Calculation**: Automatically calculates and displays the angle of drawn trendlines
- **Customizable**: Easily adjustable price-to-bar ratio with a UI control

## Installation

To use this component in your Next.js project, you need to install the following dependencies:

```bash
npm install highcharts highcharts-react-official --save
```

## Usage

### Basic Implementation

```jsx
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';

// Sample OHLC data
const ohlcData = [
  [timestamp1, open1, high1, low1, close1],
  [timestamp2, open2, high2, low2, close2],
  // ...more data points
];

// In your component's render method
return (
  <div className="chart-container">
    <HighstockTradingViewChart 
      data={ohlcData} 
      title="AAPL Stock Price"
      initialPriceToBarRatio={0.00369}
    />
  </div>
);
```

### Required CSS

Make sure to include the Highcharts Stock Tools CSS files in your page's `<Head>` section:

```jsx
<Head>
  <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/stocktools/gui.css" />
  <link rel="stylesheet" type="text/css" href="https://code.highcharts.com/css/annotations/popup.css" />
</Head>
```

Alternatively, you can import the included CSS file:

```jsx
import '../styles/highstock-styles.css';
```

## Props

The component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Array | `[]` | OHLC data in the format `[timestamp, open, high, low, close]` or an array of objects with `timestamp/date`, `open`, `high`, `low`, `close` properties |
| `title` | String | `'Price Chart'` | Chart title |
| `initialPriceToBarRatio` | Number | `0.00369` | Initial price-to-bar ratio value |

## Understanding Price-to-Bar Ratio Locking

The price-to-bar ratio (denoted as constant `c`) defines how many price units correspond to one bar (time unit). This is a critical feature for technical analysis as it ensures that drawing angles remain consistent regardless of zoom level.

### How it Works:

1. **Ratio Definition**: The ratio is defined as `price_units / bar_units`.
2. **Scale Locking**: When the chart is zoomed or panned, both the x-axis (time) and y-axis (price) scales update together to preserve the exact ratio.
3. **Angle Preservation**: This ensures that a trendline's angle remains consistent no matter how much you zoom in or out.

### Calculating the Ratio:

The component automatically handles the calculation of appropriate Y-axis scaling based on the price-to-bar ratio. When zooming or panning, the `afterSetExtremes` event adjusts the Y-axis range to maintain the locked ratio.

### Testing Against TradingView:

To verify that the component works correctly:
1. Set the same price-to-bar ratio in both this component and in TradingView
2. Draw a trendline at the same start and end points on both charts
3. Verify that the angles match
4. Zoom in/out and confirm the angles remain consistent

## Manual Drawing Tools

The component leverages Highstock's Stock Tools module to provide an intuitive UI for manually drawing on the chart. The most common drawing tools include:

- Trendlines
- Horizontal/Vertical lines
- Rectangles and circles
- Fibonacci retracements
- Text annotations

When a line is drawn, the component automatically calculates its angle and displays it next to the line. This angle information is useful for technical analysis.

## Customization

You can customize the stock tools that appear in the toolbar by modifying the `buttons` array in the `stockTools.gui` configuration:

```jsx
stockTools: {
  gui: {
    enabled: true,
    buttons: [
      'indicators',
      'separator',
      'simpleShapes',
      'lines',
      'crookedLines',
      // ...add or remove buttons as needed
    ]
  }
}
```

For a complete list of available tools, refer to the [Highcharts Stock Tools documentation](https://api.highcharts.com/highstock/stockTools).

## Browser Compatibility

This component works in all modern browsers that support Highcharts:
- Chrome, Firefox, Safari, Edge (latest versions)
- Internet Explorer 11 (with polyfills)

## License

This component is subject to the same license as your Highcharts license. Please ensure you have the appropriate Highcharts license for your use case. 