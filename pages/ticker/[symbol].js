import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaArrowLeft, FaSyncAlt, FaDownload, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import GannSquareChart from '../../components/GannSquareChart';
import { getLevelsForTicker, removeTicker, getTradingViewScript } from '../../utils/api';
import { useAppContext } from '../../contexts/AppContext';

export default function TickerDetail() {
  const router = useRouter();
  const { symbol } = router.query;
  const { removeTickerFromList } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [levels, setLevels] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      fetchLevels();
    }
  }, [symbol]);

  const fetchLevels = async (recalculate = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLevelsForTicker(symbol, recalculate);
      setLevels(data);
    } catch (error) {
      console.error(`Error fetching levels for ${symbol}:`, error);
      setError('Failed to fetch levels data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLevels(true);
    toast.info(`Refreshing levels for ${symbol}`);
  };

  const handleRemove = async () => {
    if (window.confirm(`Are you sure you want to remove ${symbol} from tracked tickers?`)) {
      try {
        setRemoving(true);
        await removeTicker(symbol);
        removeTickerFromList(symbol);
        toast.success(`Removed ${symbol} from tracked list`);
        router.push('/');
      } catch (error) {
        console.error(`Error removing ${symbol}:`, error);
        toast.error(`Failed to remove ${symbol}`);
        setRemoving(false);
      }
    }
  };

  const handleDownloadScript = async () => {
    try {
      setScriptLoading(true);
      const script = await getTradingViewScript(symbol);
      
      // Create a blob and download link
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GannSq9_${symbol}.pine`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`TradingView script for ${symbol} downloaded`);
    } catch (error) {
      console.error(`Error downloading script for ${symbol}:`, error);
      toast.error('Failed to download TradingView script');
    } finally {
      setScriptLoading(false);
    }
  };

  if (!symbol) {
    return null; // Wait for router to be ready
  }

  return (
    <Layout title={`${symbol} | GannSq9`}>
      <div className="ticker-detail-page">
        <div className="page-header">
          <Link href="/">
            <a className="back-link">
              <FaArrowLeft className="icon" />
              <span>Back to Dashboard</span>
            </a>
          </Link>
          
          <div className="header-main">
            <h1 className="title">{symbol}</h1>
            <div className="actions">
              <button
                className="action-btn refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing || loading}
              >
                <FaSyncAlt className={refreshing ? 'spinning' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Levels'}</span>
              </button>
              
              <button
                className="action-btn script-btn"
                onClick={handleDownloadScript}
                disabled={scriptLoading || loading}
              >
                <FaDownload className={scriptLoading ? 'spinning' : ''} />
                <span>{scriptLoading ? 'Generating...' : 'Download TradingView Script'}</span>
              </button>
              
              <a
                href={`https://www.tradingview.com/chart/?symbol=${symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn tradingview-btn"
              >
                <FaExternalLinkAlt />
                <span>Open in TradingView</span>
              </a>
              
              <button
                className="action-btn remove-btn"
                onClick={handleRemove}
                disabled={removing}
              >
                <FaTrash />
                <span>{removing ? 'Removing...' : 'Remove Ticker'}</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="3rem" />
            <p>Loading {symbol} levels...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={() => fetchLevels()}>
              Try Again
            </button>
          </div>
        ) : levels ? (
          <div className="detail-content">
            <div className="price-card">
              <h2 className="section-title">Current Price</h2>
              <div className="price-value">${levels.price.toFixed(2)}</div>
              <div className="price-updated">
                Updated: {new Date(levels.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Gann Square Chart Visualization */}
            <div className="chart-container">
              <h2 className="section-title">Gann Square of 9 Visualization</h2>
              <GannSquareChart 
                levels={levels} 
                price={levels.price} 
                sunPosition={levels.sun_position} 
              />
            </div>

            <div className="levels-grid">
              <div className="levels-card up-levels">
                <h2 className="section-title">Up Levels</h2>
                <table className="levels-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Price</th>
                      <th>Distance</th>
                      <th>Angle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.up_levels.map((level, index) =>
                      level ? (
                        <tr key={`up-${index}`}>
                          <td className="level-number">{index + 1}</td>
                          <td className="level-price">${level.toFixed(2)}</td>
                          <td className="level-distance up">
                            +{((level - levels.price) / levels.price * 100).toFixed(2)}%
                          </td>
                          <td className="level-angle">{(index + 1) * 45}°</td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              </div>

              <div className="levels-card down-levels">
                <h2 className="section-title">Down Levels</h2>
                <table className="levels-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Price</th>
                      <th>Distance</th>
                      <th>Angle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.down_levels.map((level, index) =>
                      level ? (
                        <tr key={`down-${index}`}>
                          <td className="level-number">{index + 1}</td>
                          <td className="level-price">${level.toFixed(2)}</td>
                          <td className="level-distance down">
                            {((level - levels.price) / levels.price * 100).toFixed(2)}%
                          </td>
                          <td className="level-angle">{(index + 1) * 45}°</td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="info-cards">
              <div className="card sun-info">
                <h2 className="section-title">Sun Position</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Longitude</div>
                    <div className="info-value">{levels.sun_position.longitude.toFixed(4)}°</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Declination</div>
                    <div className="info-value">{levels.sun_position.declination.toFixed(4)}°</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Right Ascension</div>
                    <div className="info-value">{levels.sun_position.right_ascension.toFixed(4)}°</div>
                  </div>
                </div>
              </div>

              <div className="card gann-info">
                <h2 className="section-title">Gann Square Info</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Cardinal Cross</div>
                    <div className="info-value">0°, 90°, 180°, 270°</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Fixed Cross</div>
                    <div className="info-value">45°, 135°, 225°, 315°</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Natural Squares</div>
                    <div className="info-value">√1, √2, √3, √4...</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Calculation Date</div>
                    <div className="info-value">{new Date(levels.calculation_time).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .ticker-detail-page {
          padding: 1rem 0;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 1rem;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: #2980b9;
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .title {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin: 0;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border-radius: var(--border-radius);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          text-decoration: none;
        }

        .refresh-btn {
          background-color: var(--primary-color);
          color: white;
          border: none;
        }

        .refresh-btn:hover:not(:disabled) {
          background-color: #2980b9;
        }

        .script-btn {
          background-color: var(--secondary-color);
          color: white;
          border: none;
        }

        .script-btn:hover:not(:disabled) {
          background-color: #16a085;
        }

        .tradingview-btn {
          background-color: #1e88e5;
          color: white;
          border: none;
        }

        .tradingview-btn:hover {
          background-color: #1565c0;
        }

        .remove-btn {
          background-color: white;
          color: var(--danger-color);
          border: 1px solid var(--danger-color);
        }

        .remove-btn:hover:not(:disabled) {
          background-color: var(--danger-color);
          color: white;
        }

        .action-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .icon {
          font-size: 0.875rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background-color: white;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          text-align: center;
        }

        .loading-container p {
          margin-top: 1rem;
          color: var(--gray-dark);
        }

        .error-message {
          color: var(--danger-color);
          margin-bottom: 1.5rem;
        }

        .retry-btn {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .price-card {
          background-color: white;
          padding: 1.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          text-align: center;
        }

        .chart-container {
          background-color: white;
          padding: 1.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
        }

        .section-title {
          margin-top: 0;
          margin-bottom: 1rem;
          color: var(--primary-color);
          font-size: 1.3rem;
          text-align: center;
        }

        .price-value {
          font-size: 3rem;
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.5rem;
        }

        .price-updated {
          color: var(--gray-dark);
          font-size: 0.9rem;
        }

        .levels-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .levels-card {
          background-color: white;
          padding: 1.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
        }

        .up-levels .section-title {
          color: var(--success-color);
        }

        .down-levels .section-title {
          color: var(--danger-color);
        }

        .levels-table {
          width: 100%;
          border-collapse: collapse;
        }

        .levels-table th {
          background-color: var(--gray-light);
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .levels-table td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--gray-light);
        }

        .levels-table tr:last-child td {
          border-bottom: none;
        }

        .level-number {
          width: 4rem;
          text-align: center;
          background-color: var(--gray-light);
          border-radius: 0.25rem;
          font-weight: 600;
        }

        .level-price {
          font-weight: 600;
        }

        .level-distance {
          font-weight: 500;
        }

        .level-distance.up {
          color: var(--success-color);
        }

        .level-distance.down {
          color: var(--danger-color);
        }

        .info-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .card {
          background-color: white;
          padding: 1.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.85rem;
          color: var(--gray-dark);
        }

        .info-value {
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .header-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .actions {
            width: 100%;
            justify-content: space-between;
          }

          .action-btn {
            padding: 0.6rem 0.75rem;
            font-size: 0.8rem;
          }

          .levels-grid,
          .info-cards {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
} 