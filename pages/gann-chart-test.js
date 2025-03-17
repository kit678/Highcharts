import React, { useState } from 'react';
import Layout from '../components/Layout';
import GannSquareChart from '../components/GannSquareChart';

const GannChartTest = () => {
  const [targetNumber, setTargetNumber] = useState(81);
  const [maxRings, setMaxRings] = useState(4);
  const [cellSize, setCellSize] = useState(40);
  const [highlightSpokes, setHighlightSpokes] = useState(true);

  return (
    <Layout title="Gann Chart Test">
      <div className="container">
        <h1>Gann Square of 9 Chart Test</h1>
        
        <div className="controls">
          <div className="form-group">
            <label>Target Number:</label>
            <input 
              type="number" 
              value={targetNumber} 
              onChange={(e) => setTargetNumber(parseInt(e.target.value) || 1)} 
              min="1" 
            />
          </div>
          
          <div className="form-group">
            <label>Max Rings:</label>
            <input 
              type="number" 
              value={maxRings} 
              onChange={(e) => setMaxRings(parseInt(e.target.value) || 1)} 
              min="1" 
              max="10" 
            />
          </div>
          
          <div className="form-group">
            <label>Cell Size (px):</label>
            <input 
              type="number" 
              value={cellSize} 
              onChange={(e) => setCellSize(parseInt(e.target.value) || 20)} 
              min="20" 
              max="80" 
            />
          </div>
          
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                checked={highlightSpokes} 
                onChange={(e) => setHighlightSpokes(e.target.checked)} 
              />
              Highlight Spokes
            </label>
          </div>
        </div>
        
        <div className="chart-container">
          <GannSquareChart 
            targetNumber={targetNumber}
            maxRings={maxRings}
            cellSize={cellSize}
            highlightSpokes={highlightSpokes}
          />
        </div>
        
        <style jsx>{`
          .container {
            padding: 20px;
          }
          .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .form-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .chart-container {
            margin-top: 20px;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default GannChartTest; 