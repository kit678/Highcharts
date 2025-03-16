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