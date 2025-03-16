import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaHome, FaChartLine } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChartLayout = ({ children, title = 'Advanced Chart - GannSq9' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Advanced charting with TradingView Lightweight Charts" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="chart-layout">
        <header className="chart-header">
          <div className="logo">GannSq9</div>
          <nav className="nav-links">
            <Link href="/">
              <a className="nav-link">
                <FaHome />
                <span>Home</span>
              </a>
            </Link>
          </nav>
        </header>
        
        <main className="chart-main">
          {children}
        </main>
        
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>

      <style jsx>{`
        .chart-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #1e222d;
          color: #d1d4dc;
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background-color: #131722;
          border-bottom: 1px solid #2a2e39;
          height: 60px;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #5d9cf5;
        }
        
        .nav-links {
          display: flex;
          gap: 1rem;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #d1d4dc;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        
        .nav-link:hover {
          background-color: #2a2e39;
        }
        
        .chart-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </>
  );
};

export default ChartLayout; 