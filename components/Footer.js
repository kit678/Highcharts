import React from 'react';
import { FaGithub, FaCodeBranch, FaChartLine } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <FaChartLine className="footer-icon" />
            <span>GannSq9</span>
          </div>
          <div className="footer-description">
            Gann Square of 9 Trading Levels Calculator based on sun position
          </div>
          <div className="footer-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              <FaGithub className="footer-link-icon" />
              <span>GitHub</span>
            </a>
            <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              <FaCodeBranch className="footer-link-icon" />
              <span>TradingView</span>
            </a>
          </div>
          <div className="footer-copyright">
            &copy; {currentYear} GannSq9. All rights reserved.
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background-color: var(--primary-color);
          color: white;
          padding: 2rem 0;
          margin-top: 2rem;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .footer-icon {
          margin-right: 0.5rem;
          font-size: 1.5rem;
        }

        .footer-description {
          max-width: 600px;
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }

        .footer-links {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .footer-link {
          display: flex;
          align-items: center;
          color: white;
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-link:hover {
          color: var(--secondary-color);
        }

        .footer-link-icon {
          margin-right: 0.5rem;
        }

        .footer-copyright {
          font-size: 0.875rem;
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .footer-links {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer; 