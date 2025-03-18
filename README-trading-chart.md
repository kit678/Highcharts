# TradingView-like Charting with Granular Price-to-Bar Ratio Locking

This component replicates TradingView's charting experience with a focus on implementing a granular "price-to-bar" ratio locking feature that ensures drawn shapes preserve their geometry (angles and proportions) when zooming or panning.

## Key Features

1. **TradingView-like Charting**
   - Candlestick/OHLC data visualization
   - Technical indicators
   - Manual drawing tools
   - Zoom and pan functionality

2. **Granular Price-to-Bar Ratio Locking**
   - Lock the chart's scale by maintaining a fixed ratio between price units and time units
   - Support for very granular values (e.g., 0.00369)
   - Preserves angle measurements regardless of zoom level

3. **Manual Drawing Tools**
   - Draw trend lines, horizontal/vertical lines, channels, etc.
   - Calculate and display the angle of drawn lines
   - Maintain angle consistency when zooming or panning with ratio locking

4. **Backtesting Integration**
   - Use the charts for backtesting trading strategies
   - Test angle-based trading rules

## How to Use

### Setting the Price-to-Bar Ratio

The price-to-bar ratio is a constant `c` that defines how many price units correspond to one bar (time unit). This is crucial for maintaining consistent angle measurements on the chart.

To set the ratio:

1. Navigate to the Chart Tester page
2. Use the "Price-to-Bar Ratio" input field to enter your desired value (default is 0.00369)
3. The chart will automatically update to maintain this ratio when zooming or panning

The ratio affects how angles are calculated and displayed. A typical value used in TradingView might be around 0.00369, but you can experiment with different values.

### Drawing on the Chart

To draw on the chart:

1. Use the drawing tools in the top toolbar of the chart
2. Click on "Lines" to access line drawing tools
3. Select a drawing tool (e.g., "Trend Line")
4. Click and drag on the chart to draw the line
5. The angle of the line will be calculated and displayed

### Verifying Angle Consistency

To verify that angles remain consistent:

1. Draw a trend line on the chart with ratio locking enabled
2. Note the displayed angle
3. Zoom in or out on the chart
4. The angle should remain the same, regardless of zoom level
5. You can compare this with a similar line drawn in TradingView

### Comparing with TradingView

To compare with TradingView:

1. Set the same price-to-bar ratio in both our chart and TradingView
2. Draw identical lines on both charts
3. Verify that the angles match
4. Test zooming behavior on both platforms

## Implementation Details

### Price-to-Bar Ratio Locking

The price-to-bar ratio locking works by maintaining a constant relationship between price and time units. When the chart is zoomed or panned:

1. The component detects changes to the X-axis (time) extremes
2. It calculates how many bars are currently visible
3. Based on the price-to-bar ratio and number of visible bars, it calculates the appropriate price range
4. The Y-axis (price) extremes are then adjusted accordingly

This ensures that the visual angle of trend lines remains consistent regardless of zoom level, which is essential for angle-based trading strategies.

### Drawing Tool Implementation

The drawing tools are implemented using Highstock's Stock Tools module. When a line is drawn:

1. The start and end coordinates are captured
2. The angle is calculated using the `calculateAngleBetweenPoints` function
3. The angle calculation takes into account the price-to-bar ratio
4. The angle is displayed to the user

## Technical Architecture

The main components are:

- `HighstockTradingViewChart.js` - The core chart component
- `dataUtils.js` - Utilities for data formatting and calculation
- `indicators.js` - Custom technical indicators and angle calculation
- `chartOptionsBuilder.js` - Chart configuration options
- `highchartsInit.js` - Initialization of Highcharts and required modules

## Future Enhancements

Planned future enhancements include:

- More drawing tools and annotations
- Saving and loading drawn objects
- Enhanced angle-based trading strategies
- Support for more technical indicators
- Enhanced backtesting capabilities

## Troubleshooting

If angles appear inconsistent:

1. Ensure ratio locking is enabled
2. Verify that a valid price-to-bar ratio is set
3. Check the browser console for any errors
4. Try refreshing the chart data

## Credits

This implementation uses:

- Highcharts/Highstock for the charting library
- React and Next.js for the front-end framework

## Installation

1. Add the required dependencies:

```bash
npm install --save highcharts @highcharts/stock-tools mathjs
```

2. Import the necessary modules in your application:

```jsx
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';
```

## Integration

Add the component to your Next.js page:

```jsx
<HighstockTradingViewChart 
  data={chartData} 
  title="AAPL Stock Chart"
  initialPriceToBarRatio={0.00369}
/>
```

### Props

- `data`: Array of OHLCV data in format `[timestamp, open, high, low, close, volume]`
- `title`: Chart title
- `initialPriceToBarRatio`: Starting ratio between price and bar (time) units (default: `0.00369`)
- `showControls`: Show ratio controls (default: `true`)
- `showDebug`: Show debugging information (default: `false`)
- `onChartLoad`: Callback when chart is loaded
- `onChartRedraw`: Callback when chart is redrawn

## Testing the Price-to-Bar Ratio

1. Open the chart and draw a trendline at a specific angle.
2. Use the ratio controls to set a fixed price-to-bar ratio (e.g., 0.00369).
3. Enable ratio locking by clicking the "Lock Ratio" button.
4. Zoom in/out or pan the chart to verify that the angle of the trendline remains consistent.

You can verify the angle by:
- Looking at the angle display that appears next to each drawn line
- Comparing with the same angle drawn in TradingView with the same price-to-bar ratio

## How the Price-to-Bar Ratio Locking Works

The price-to-bar ratio (c) is defined as:

```
c = (price units / bar units)
```

When zooming or panning, the chart maintains this relationship by:
1. Calculating the desired visible price range based on the time range
2. Adjusting both axes accordingly to maintain the exact ratio
3. Preserving the angle of drawn lines regardless of zoom level

## Technical Implementation

The ratio locking is implemented via:
- Custom event handlers for the chart's zoom and pan actions
- Overriding the default Highcharts axis behavior to enforce the ratio
- Custom callback functions that recalculate the visible range on both axes

## Backtesting Features

The backtesting module allows you to:
1. Define trading rules based on pivot points and angles
2. Simulate trading on historical data
3. Analyze results including return, win rate, and drawdown

To use backtesting:
1. Navigate to the `/backtest` page
2. Toggle the backtesting panel using the dedicated button in the chart toolbar
3. Configure trading rules and parameters
4. Run the backtest to see results

## Browser Compatibility

Tested and compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This component uses Highcharts which requires a license for commercial use. Make sure you have a valid Highcharts license if you're using this in a commercial product. 