# Chart Interval Selection Fix

## Issue
The chart was not updating when a different interval (1m, 5m, 15m, etc.) was selected from the dropdown. While the UI was correctly changing the state, the data fetching mechanism wasn't properly handling the interval parameter.

## Root Cause
1. The `fetchData` function referenced in `pages/api/history/[symbol].js` was missing from `utils/api.js`
2. The demo data generation wasn't accounting for different time intervals
3. Logging was insufficient to troubleshoot the issue

## Changes Made

### 1. Added Missing `fetchData` Function to `utils/api.js`
- Implemented a proper `fetchData` function with support for different intervals
- Added validation for interval parameter with fallback to '1d' if invalid
- Included detailed error handling and logging
- Added a helper function to generate appropriate demo data when API fails

### 2. Enhanced `fetchStockData` in `pages/highstock-tradingview.js`
- Improved logging with more details about requests and responses
- Added better error handling with clear messages
- Ensured interval parameter is properly passed to the API

### 3. Updated Demo Data Generation
- Modified `generateDemoData` to support different time intervals
- Adjusted the time increments based on selected interval (1m, 5m, 15m, etc.)
- Added appropriate volatility calculations for different time frames
- Enhanced consistency in demo data generation

## Testing
The changes ensure that:
1. The chart updates correctly when a different interval is selected
2. Error handling is improved with fallback to appropriate demo data
3. Time increments and price movements in demo data match the selected interval
4. Logging is enhanced to help troubleshoot any future issues

## Future Improvements
1. Add caching for API responses to reduce load on Yahoo Finance API
2. Implement more robust error handling for specific API limitations (e.g., 1m data only available for last 7 days)
3. Add visual feedback about data limitations for certain intervals 