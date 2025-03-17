import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import Layout from '../components/Layout';
import AddTickerForm from '../components/AddTickerForm';

export default function AddTicker() {
  return (
    <Layout title="Add Ticker | GannSq9">
      <div className="add-ticker-page">
        <div className="page-header">
          <Link href="/">
            <a className="back-link">
              <FaArrowLeft className="icon" />
              <span>Back to Dashboard</span>
            </a>
          </Link>
          <h1 className="title">Add New Ticker</h1>
        </div>

        <div className="content-wrapper">
          <AddTickerForm />
          
          <div className="info-card">
            <h2>About Gann Square of 9</h2>
            <p>
              W.D. Gann's Square of 9 is a powerful market analysis tool that attempts to predict potential price levels
              based on geometric and astronomical relationships. This theory considers that market movements are
              influenced by mathematical relationships and astronomical positions.
            </p>
            
            <h3>How It Works</h3>
            <p>
              The Square of 9 calculator takes the current sun position and uses it to determine important price levels
              that may act as support or resistance for the given asset. These levels often coincide with significant
              market turning points.
            </p>
            
            <h3>Usage Tips</h3>
            <ul>
              <li>Add multiple tickers to track different assets simultaneously</li>
              <li>Check levels daily as they update with the sun's movement</li>
              <li>Look for price convergence near these levels as potential entry or exit points</li>
              <li>Use in conjunction with other technical analysis tools for confirmation</li>
            </ul>
            
            <div className="disclaimer">
              <h3>Disclaimer</h3>
              <p>
                Trading involves risk. These levels are provided for informational purposes only and should not be
                considered as financial advice. Always conduct your own research before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .add-ticker-page {
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

        .icon {
          font-size: 0.875rem;
        }

        .title {
          font-size: 2rem;
          color: var(--primary-color);
          margin: 0;
        }

        .content-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .info-card {
          background-color: white;
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
        }

        .info-card h2 {
          margin-top: 0;
          color: var(--primary-color);
          font-size: 1.5rem;
        }

        .info-card h3 {
          margin: 1.5rem 0 0.75rem;
          font-size: 1.2rem;
          color: var(--secondary-color);
        }

        .info-card p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .info-card ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .info-card li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .disclaimer {
          margin-top: 2rem;
          padding: 1rem;
          background-color: var(--gray-light);
          border-radius: var(--border-radius);
          border-left: 4px solid var(--warning-color);
        }

        .disclaimer h3 {
          margin-top: 0;
          color: var(--warning-color);
        }

        .disclaimer p {
          font-size: 0.9rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            grid-template-columns: 1fr;
          }
          
          .info-card {
            order: 2;
          }
        }
      `}</style>
    </Layout>
  );
} 