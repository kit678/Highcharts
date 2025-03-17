import React, { useState } from 'react';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { addTicker } from '../utils/api';
import { useAppContext } from '../contexts/AppContext';

const AddTickerForm = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTickerToList, refreshData } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticker.trim()) {
      toast.error('Please enter a valid ticker symbol');
      return;
    }

    // Convert to uppercase
    const formattedTicker = ticker.trim().toUpperCase();
    
    try {
      setLoading(true);
      await addTicker(formattedTicker);
      addTickerToList(formattedTicker);
      
      toast.success(`Added ${formattedTicker} to tracked tickers`);
      setTicker('');
      
      // Refresh data to include the new ticker
      refreshData();
    } catch (error) {
      console.error('Error adding ticker:', error);
      toast.error(error.response?.data?.detail || 'Failed to add ticker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-ticker-form">
      <h2>Add New Ticker</h2>
      <p className="description">
        Add a stock ticker to track its Gann Square of 9 levels.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="ticker">Ticker Symbol</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g. AAPL, MSFT, TSLA"
              disabled={loading}
              autoComplete="off"
              className="ticker-input"
            />
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !ticker.trim()}
            >
              {loading ? (
                <FaSpinner className="spinner" />
              ) : (
                <FaPlus />
              )}
              {loading ? 'Adding...' : 'Add Ticker'}
            </button>
          </div>
          <small className="help-text">
            Enter a valid stock ticker symbol. Cryptocurrency symbols should be followed by -USD (e.g. BTC-USD).
          </small>
        </div>
      </form>

      <div className="examples">
        <h3>Popular Tickers</h3>
        <div className="example-buttons">
          {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'JPM', 'BTC-USD'].map((example) => (
            <button
              key={example}
              type="button"
              className="example-btn"
              onClick={() => setTicker(example)}
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .add-ticker-form {
          background-color: white;
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          margin-bottom: 2rem;
        }

        h2 {
          margin-top: 0;
          color: var(--primary-color);
          font-size: 1.5rem;
        }

        .description {
          color: var(--gray-dark);
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .input-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .ticker-input {
          flex: 1;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 1px solid var(--gray);
          border-radius: var(--border-radius);
          transition: border-color 0.3s;
        }

        .ticker-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          padding: 0 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #2980b9;
        }

        .submit-btn:disabled {
          background-color: var(--gray);
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .help-text {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: var(--gray-dark);
        }

        .examples {
          margin-top: 2rem;
        }

        .examples h3 {
          font-size: 1rem;
          margin-bottom: 0.75rem;
          color: var(--text-color);
        }

        .example-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .example-btn {
          background-color: var(--gray-light);
          border: 1px solid var(--gray);
          border-radius: var(--border-radius);
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.3s, border-color 0.3s;
        }

        .example-btn:hover:not(:disabled) {
          background-color: white;
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .example-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .add-ticker-form {
            padding: 1.5rem;
          }

          .input-wrapper {
            flex-direction: column;
          }

          .submit-btn {
            width: 100%;
            justify-content: center;
            padding: 0.75rem 0;
          }

          .example-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AddTickerForm; 