import React, { useState, useEffect } from 'react';

/**
 * GannLevelsTable Component
 * 
 * Displays Gann Square of 9 levels for a ticker in a table format.
 * 
 * @param {Object} props - Component props
 * @param {string} props.ticker - The ticker symbol
 * @param {number} props.price - The current price
 * @param {Array} props.upLevels - Array of up levels
 * @param {Array} props.downLevels - Array of down levels
 * @param {number} props.sunAngle - The sun angle used for calculation
 * @param {string} props.timestamp - The timestamp of the calculation
 */
const GannLevelsTable = ({ 
  ticker, 
  price, 
  upLevels = [], 
  downLevels = [], 
  sunAngle, 
  timestamp 
}) => {
  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleString();
  
  return (
    <div className="gann-levels-table">
      <h2>{ticker} Gann Square of 9 Levels</h2>
      <div className="price-info">
        <p><strong>Current Price:</strong> {price?.toFixed(2)}</p>
        <p><strong>Sun Angle:</strong> {sunAngle?.toFixed(2)}°</p>
        <p><strong>Last Updated:</strong> {formattedTime}</p>
      </div>
      
      <div className="levels-container">
        <div className="up-levels">
          <h3>Up Levels</h3>
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Price</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {upLevels.map((level, index) => (
                level && (
                  <tr key={`up-${index}`}>
                    <td>{index + 1}</td>
                    <td>{level.toFixed(2)}</td>
                    <td>{((level - price) / price * 100).toFixed(2)}%</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="down-levels">
          <h3>Down Levels</h3>
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Price</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {downLevels.map((level, index) => (
                level && (
                  <tr key={`down-${index}`}>
                    <td>{index + 1}</td>
                    <td>{level.toFixed(2)}</td>
                    <td>{((level - price) / price * 100).toFixed(2)}%</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="actions">
        <button onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${ticker}`, '_blank')}>
          View on TradingView
        </button>
        <button onClick={() => window.location.href = `/api/tradingview/${ticker}`}>
          Download Pine Script
        </button>
      </div>
      
      <style jsx>{`
        .gann-levels-table {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        
        h2 {
          text-align: center;
          color: #333;
        }
        
        .price-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px;
          background-color: #eee;
          border-radius: 5px;
        }
        
        .levels-container {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        
        .up-levels, .down-levels {
          flex: 1;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f2f2f2;
        }
        
        .up-levels table tr:hover {
          background-color: rgba(0, 255, 0, 0.1);
        }
        
        .down-levels table tr:hover {
          background-color: rgba(255, 0, 0, 0.1);
        }
        
        .actions {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        button {
          padding: 10px 15px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #45a049;
        }
      `}</style>
    </div>
  );
};

export default GannLevelsTable; 