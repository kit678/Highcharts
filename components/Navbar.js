import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSun, FaChartLine, FaPlus, FaBars, FaTimes, FaChartBar, FaFlask, FaRuler } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';

const Navbar = () => {
  const router = useRouter();
  const { sunPosition, lastUpdated } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString();
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link href="/">
          <a className="logo">
            <FaChartLine className="logo-icon" />
            <span>GannSq9</span>
          </a>
        </Link>

        <div className="sun-info">
          {sunPosition && (
            <>
              <FaSun className="sun-icon" />
              <div className="sun-details">
                <span>{sunPosition.zodiac_sign} {sunPosition.degrees_in_sign.toFixed(2)}°</span>
                <span className="last-updated">Updated: {formatTime(lastUpdated)}</span>
              </div>
            </>
          )}
        </div>

        <button className="menu-toggle" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`nav-links ${isOpen ? 'show' : ''}`}>
          <li>
            <Link href="/">
              <a className={router.pathname === '/' ? 'active' : ''}>
                Dashboard
              </a>
            </Link>
          </li>
          <li>
            <Link href="/highstock-tradingview">
              <a className={router.pathname === '/highstock-tradingview' ? 'active' : ''}>
                <FaChartBar className="icon" />
                Highstock Chart
              </a>
            </Link>
          </li>
          <li>
            <Link href="/backtest">
              <a className={router.pathname === '/backtest' ? 'active' : ''}>
                <FaFlask className="icon" />
                Backtesting
              </a>
            </Link>
          </li>
          <li>
            <Link href="/tradingview-chart-tester">
              <a className={router.pathname === '/tradingview-chart-tester' ? 'active' : ''}>
                <FaRuler className="icon" />
                Chart Tester
              </a>
            </Link>
          </li>
          <li>
            <Link href="/add-ticker">
              <a className={router.pathname === '/add-ticker' ? 'active' : ''}>
                <FaPlus className="icon" />
                Add Ticker
              </a>
            </Link>
          </li>
        </ul>
      </div>

      <style jsx>{`
        .navbar {
          background-color: var(--primary-color);
          color: white;
          padding: 1rem 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }

        .logo-icon {
          margin-right: 0.5rem;
          font-size: 1.5rem;
        }

        .nav-links {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-links li {
          margin-left: 1.5rem;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 2px solid transparent;
          transition: border-color 0.3s;
        }

        .nav-links a:hover,
        .nav-links a.active {
          border-color: var(--secondary-color);
        }

        .icon {
          margin-right: 0.5rem;
        }

        .sun-info {
          display: flex;
          align-items: center;
          margin-right: 1rem;
          font-size: 0.9rem;
        }

        .sun-icon {
          color: #f1c40f;
          margin-right: 0.5rem;
          font-size: 1.25rem;
        }

        .sun-details {
          display: flex;
          flex-direction: column;
        }

        .last-updated {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-wrap: wrap;
          }

          .menu-toggle {
            display: block;
            order: 3;
          }

          .nav-links {
            display: none;
            flex-direction: column;
            width: 100%;
            order: 4;
            margin-top: 1rem;
          }

          .nav-links.show {
            display: flex;
          }

          .nav-links li {
            margin: 0;
            width: 100%;
            text-align: center;
          }

          .nav-links a {
            padding: 0.75rem 0;
            width: 100%;
            justify-content: center;
          }

          .sun-info {
            order: 2;
            flex-grow: 1;
            justify-content: flex-end;
            margin-right: 1rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 