# GannSq9 - Gann Square of 9 Trading Levels Calculator

This tool calculates Gann Square of 9 trading levels based on the position of the sun in the tropical zodiac. It helps identify potential market reaction points for various stocks and assets.

## Features

- Calculate Gann Square of 9 levels based on current sun position
- Automatically fetch current prices for multiple ticker symbols
- Generate both upward and downward potential market reaction levels
- Update levels as price breaches occur
- Optional TradingView integration for chart visualization

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gannsq9.git
cd gannsq9
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure your Firestore credentials (optional, for data persistence):
- Create a Firebase project
- Generate a service account key and save it as `serviceAccountKey.json` in the root directory
- Configure environment variables in `.env`

4. Start the application:
```bash
uvicorn app.main:app --reload
```

5. Access the web interface at http://localhost:8000

## Usage

1. Add ticker symbols in the web interface
2. View calculated Gann Square of 9 levels for each ticker
3. The tool will automatically update levels as price breaches occur

## How it Works

The tool uses W.D. Gann's Square of 9 theory, which suggests markets react to specific price levels based on mathematical relationships to the current position of the sun.

1. The sun's position is calculated using the Swiss Ephemeris library
2. The current price of each asset is obtained
3. Gann Square of 9 calculations are performed to identify potential reaction levels
4. Levels are monitored for breaches, and new levels are calculated accordingly

## License

MIT

# TradingView-like Chart with Granular Price-to-Bar Ratio Locking

This project implements a Next.js chart component that replicates TradingView's charting experience, with a specific focus on maintaining a precise price-to-bar ratio when zooming or panning. This ensures that drawn lines and geometric patterns maintain their correct angles regardless of the view.

## Key Features

- **Highstock Integration**: Leverages Highstock's powerful financial charting capabilities
- **Granular Price-to-Bar Ratio Locking**: Maintains exact price-to-bar ratio (e.g., 0.00369) when zooming or panning
- **Support for Indicators**: Toggle and display technical indicators 
- **Backtesting Capability**: Integrated backtesting panel for strategy testing

## Implementation Details

### Price-to-Bar Ratio Locking

The price-to-bar ratio locking is the core feature of this component. It ensures that:

1. The ratio between price units and time bars remains constant
2. Angles of lines/patterns are preserved when zooming or panning
3. Chart behavior matches TradingView's functionality

The ratio is defined as:

```
priceToBarRatio = priceUnits / barCount
```

Where:
- `priceUnits` is the vertical range (in price)
- `barCount` is the number of bars visible in the chart

When locked, zooming or panning the X-axis will automatically adjust the Y-axis to maintain this exact ratio.

### RatioLockManager

The implementation uses a dedicated `RatioLockManager` class that:

1. Encapsulates all ratio locking logic in one place
2. Handles event management and prevents recursive callbacks
3. Provides multiple fallback mechanisms to handle edge cases
4. Efficiently calculates visible bars and appropriate price ranges

## Usage

### Installation

```bash
npm install
npm run dev
```

### Setting the Price-to-Bar Ratio

1. Check the "Lock Price-to-Bar Ratio" checkbox to enable the feature
2. Enter the desired ratio in the input field (e.g., 0.00369)
3. Click "Apply" or press Enter to set the ratio

### Testing Angle Consistency

To verify the angle consistency works properly:

1. Lock the ratio at a specific value (e.g., 0.00369)
2. Use TradingView with the same ratio setting as a reference
3. Draw a trendline on both charts with the same points
4. Zoom in/out and pan around - the angle should remain the same on both charts

## Component Integration

### Basic Usage

```jsx
import HighstockTradingViewChart from '../components/HighstockTradingViewChart';

export default function ChartPage() {
  const data = [...]; // OHLC data

  return (
    <div>
      <h1>TradingView-like Chart</h1>
      <HighstockTradingViewChart 
        data={data} 
        title="Price Chart"
        initialPriceToBarRatio={0.00369}
      />
    </div>
  );
}
```

### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Array | `[]` | OHLC data array |
| `title` | String | 'Price Chart' | Chart title |
| `initialPriceToBarRatio` | Number | 0.00369 | Initial price-to-bar ratio |

## Implementation Notes

The price-to-bar ratio locking is implemented using:

1. Explicit event handling of Highstock's `afterSetExtremes` events
2. Careful tracking of X and Y axis changes
3. Calculation of bar count based on visible data points
4. Applying coordinated Y-axis adjustments when X-axis changes

## Troubleshooting

If ratio locking isn't working properly:

1. Check browser console for debug logs
2. Verify that `RatioLockManager` is properly initialized
3. Check that the chart has visible data points
4. Try increasing the ratio value for more noticeable effects

## License

MIT 