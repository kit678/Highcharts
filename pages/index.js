import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaPlus, FaSpinner, FaSyncAlt, FaChartLine, FaRuler } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import TickerCard from '../components/TickerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppContext } from '../contexts/AppContext';
import { getLevelsForAllTickers } from '../utils/api';

export default function Home() {
  const { tickers, sunPosition, loading, error, lastUpdated, refreshData } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      await getLevelsForAllTickers(true);
      toast.success('Refreshed all ticker levels');
      refreshData();
    } catch (error) {
      console.error('Error refreshing levels:', error);
      toast.error('Failed to refresh levels');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Layout title="Dashboard | GannSq9">
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="title">Gann Square of 9 Levels</h1>
            <p className="subtitle">
              Trading levels based on planetary positions and Gann's Square of 9 theory
            </p>
          </div>
          <div className="header-actions">
            <Link href="/tradingview-chart-tester">
              <a className="chart-btn">
                <FaRuler className="icon" />
                <span>Chart Tester</span>
              </a>
            </Link>
            <Link href="/ChartDemo">
              <a className="chart-btn">
                <FaChartLine className="icon" />
                <span>Advanced Chart</span>
              </a>
            </Link>
            <Link href="/add-ticker">
              <a className="add-btn">
                <FaPlus className="icon" />
                <span>Add Ticker</span>
              </a>
            </Link>
            <button
              className="refresh-all-btn"
              onClick={handleRefreshAll}
              disabled={refreshing || loading}
            >
              <FaSyncAlt className={refreshing ? 'spinning' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="3rem" />
            <p>Loading tickers and levels...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={refreshData}>
              Try Again
            </button>
          </div>
        ) : tickers.length === 0 ? (
          <div className="empty-state">
            <h2>No Tickers Added Yet</h2>
            <p>
              Add your first ticker to start tracking Gann Square of 9 levels.
            </p>
            <Link href="/add-ticker">
              <a className="add-first-btn">
                <FaPlus className="icon" />
                <span>Add Your First Ticker</span>
              </a>
            </Link>
          </div>
        ) : (
          <>
            <div className="sun-position-info">
              <h2>Current Sun Position</h2>
              {sunPosition ? (
                <div className="sun-details">
                  <div className="sun-value">
                    <span className="label">Longitude:</span>
                    <span className="value">{sunPosition.longitude.toFixed(4)}°</span>
                  </div>
                  <div className="sun-value">
                    <span className="label">Declination:</span>
                    <span className="value">{sunPosition.declination.toFixed(4)}°</span>
                  </div>
                  <div className="sun-value">
                    <span className="label">Right Ascension:</span>
                    <span className="value">{sunPosition.right_ascension.toFixed(4)}°</span>
                  </div>
                  <div className="sun-value">
                    <span className="label">Updated:</span>
                    <span className="value">
                      {new Date(lastUpdated).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="no-data">Sun position data not available</p>
              )}
            </div>

            <div className="tickers-grid">
              {tickers.map((ticker) => (
                <TickerCard key={ticker} ticker={ticker} />
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          padding: 1rem 0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .title {
          font-size: 2rem;
          color: var(--primary-color);
          margin: 0 0 0.5rem 0;
        }

        .subtitle {
          color: var(--gray-dark);
          margin: 0;
          font-size: 1.1rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .add-btn, .refresh-all-btn, .chart-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius);
          font-weight: 500;
          font-size: 1rem;
          transition: 0.3s;
          cursor: pointer;
        }

        .chart-btn {
          background-color: #27ae60;
          color: white;
          text-decoration: none;
        }

        .chart-btn:hover {
          background-color: #2ecc71;
        }

        .add-btn {
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
        }

        .add-btn:hover {
          background-color: #2980b9;
        }

        .refresh-all-btn {
          background-color: var(--secondary-color);
          color: white;
          border: none;
        }

        .refresh-all-btn:hover:not(:disabled) {
          background-color: #16a085;
        }

        .refresh-all-btn:disabled {
          background-color: var(--gray);
          cursor: not-allowed;
        }

        .icon {
          font-size: 0.9rem;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container,
        .error-container,
        .empty-state {
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

        .empty-state h2 {
          margin-top: 0;
          color: var(--text-color);
        }

        .empty-state p {
          color: var(--gray-dark);
          margin-bottom: 1.5rem;
        }

        .add-first-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--primary-color);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius);
          text-decoration: none;
          font-weight: 500;
        }

        .sun-position-info {
          background-color: white;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .sun-position-info h2 {
          margin-top: 0;
          color: var(--primary-color);
          font-size: 1.3rem;
          margin-bottom: 1rem;
        }

        .sun-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .sun-value {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 0.85rem;
          color: var(--gray-dark);
          margin-bottom: 0.25rem;
        }

        .value {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .no-data {
          color: var(--gray-dark);
          font-style: italic;
        }

        .tickers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .chart-btn, .add-btn, .refresh-all-btn {
            flex: 1;
            justify-content: center;
          }

          .sun-details {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </Layout>
  );
} 