import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChartLine, FaTrash, FaExternalLinkAlt, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { removeTicker } from '../utils/api';
import { useAppContext } from '../contexts/AppContext';
import { getLevelsForTicker } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const TickerCard = ({ ticker }) => {
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { removeTickerFromList } = useAppContext();

  const fetchLevels = async (recalculate = false) => {
    try {
      setLoading(true);
      const data = await getLevelsForTicker(ticker, recalculate);
      setLevels(data);
    } catch (error) {
      console.error(`Error fetching levels for ${ticker}:`, error);
      toast.error(`Failed to fetch levels for ${ticker}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [ticker]);

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await removeTicker(ticker);
      removeTickerFromList(ticker);
      toast.success(`Removed ${ticker} from tracked list`);
    } catch (error) {
      console.error(`Error removing ${ticker}:`, error);
      toast.error(`Failed to remove ${ticker}`);
      setIsRemoving(false);
    }
  };

  const handleRefresh = () => {
    fetchLevels(true);
    toast.info(`Refreshing levels for ${ticker}`);
  };

  return (
    <div className="ticker-card">
      <div className="card-header">
        <h3 className="ticker-symbol">{ticker}</h3>
        <div className="card-actions">
          <button
            className="action-btn refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh levels"
          >
            <FaSyncAlt className={loading ? 'spinning' : ''} />
          </button>
          <button
            className="action-btn remove-btn"
            onClick={handleRemove}
            disabled={isRemoving}
            title="Remove ticker"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="card-content">
        {loading ? (
          <LoadingSpinner size="1.5rem" />
        ) : levels ? (
          <>
            <div className="price-info">
              <div className="current-price">
                <span className="label">Current Price:</span>
                <span className="value">${levels.price.toFixed(2)}</span>
              </div>
              <div className="timestamp">
                <span className="label">Last Updated:</span>
                <span className="value">
                  {new Date(levels.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="levels-container">
              <div className="up-levels">
                <h4>Up Levels</h4>
                <ul className="levels-list">
                  {levels.up_levels.map((level, index) =>
                    level ? (
                      <li key={`up-${index}`} className="level-item">
                        <span className="level-index">{index + 1}</span>
                        <span className="level-value">${level.toFixed(2)}</span>
                        <span className="level-distance">
                          {((level - levels.price) / levels.price * 100).toFixed(2)}%
                        </span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>

              <div className="down-levels">
                <h4>Down Levels</h4>
                <ul className="levels-list">
                  {levels.down_levels.map((level, index) =>
                    level ? (
                      <li key={`down-${index}`} className="level-item">
                        <span className="level-index">{index + 1}</span>
                        <span className="level-value">${level.toFixed(2)}</span>
                        <span className="level-distance">
                          {((level - levels.price) / levels.price * 100).toFixed(2)}%
                        </span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="error-message">Failed to load levels</div>
        )}
      </div>

      <div className="card-footer">
        <Link href={`/ticker/${ticker}`}>
          <a className="view-details-btn">
            <FaChartLine className="icon" />
            <span>View Details</span>
          </a>
        </Link>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${ticker}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tradingview-btn"
        >
          <FaExternalLinkAlt className="icon" />
          <span>TradingView</span>
        </a>
      </div>

      <style jsx>{`
        .ticker-card {
          background-color: white;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          transition: transform 0.3s, box-shadow 0.3s;
          overflow: hidden;
        }

        .ticker-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: var(--primary-color);
          color: white;
        }

        .ticker-symbol {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
        }

        .action-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-btn:hover {
          color: var(--secondary-color);
        }

        .remove-btn:hover {
          color: var(--danger-color);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .card-content {
          padding: 1rem;
          min-height: 200px;
        }

        .price-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray);
        }

        .current-price, .timestamp {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 0.75rem;
          color: var(--gray-dark);
          margin-bottom: 0.25rem;
        }

        .value {
          font-weight: 600;
        }

        .levels-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .up-levels, .down-levels {
          flex: 1;
        }

        .up-levels h4, .down-levels h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          text-align: center;
        }

        .up-levels h4 {
          color: var(--success-color);
        }

        .down-levels h4 {
          color: var(--danger-color);
        }

        .levels-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.9rem;
        }

        .level-item {
          display: flex;
          justify-content: space-between;
          padding: 0.35rem 0;
          border-bottom: 1px solid var(--gray-light);
        }

        .level-item:last-child {
          border-bottom: none;
        }

        .level-index {
          width: 1.5rem;
          text-align: center;
          background-color: var(--gray-light);
          border-radius: 50%;
          font-size: 0.75rem;
          height: 1.5rem;
          line-height: 1.5rem;
        }

        .level-value {
          font-weight: 600;
        }

        .level-distance {
          font-size: 0.75rem;
          color: var(--gray-dark);
        }

        .up-levels .level-distance {
          color: var(--success-color);
        }

        .down-levels .level-distance {
          color: var(--danger-color);
        }

        .error-message {
          text-align: center;
          color: var(--danger-color);
          padding: 2rem 0;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background-color: var(--gray-light);
        }

        .view-details-btn, .tradingview-btn {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: var(--border-radius);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: background-color 0.3s;
        }

        .view-details-btn {
          background-color: var(--secondary-color);
          color: white;
        }

        .view-details-btn:hover {
          background-color: #2980b9;
        }

        .tradingview-btn {
          background-color: white;
          color: var(--text-color);
          border: 1px solid var(--gray);
        }

        .tradingview-btn:hover {
          background-color: var(--gray-light);
        }

        .icon {
          margin-right: 0.5rem;
          font-size: 0.875rem;
        }

        @media (max-width: 600px) {
          .levels-container {
            flex-direction: column;
          }

          .card-footer {
            flex-direction: column;
            gap: 0.5rem;
          }

          .view-details-btn, .tradingview-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default TickerCard; 