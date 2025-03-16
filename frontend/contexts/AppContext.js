import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllTickers, getSunPosition } from '../utils/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tickers, setTickers] = useState([]);
  const [sunPosition, setSunPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch tickers and sun position
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tickers
      const tickersData = await getAllTickers();
      setTickers(tickersData || []);

      // Fetch sun position
      const sunData = await getSunPosition();
      setSunPosition(sunData);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh sun position every 15 minutes
    const interval = setInterval(() => {
      getSunPosition()
        .then(data => {
          setSunPosition(data);
          setLastUpdated(new Date());
        })
        .catch(err => console.error('Error refreshing sun position:', err));
    }, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Add ticker to the list
  const addTickerToList = (ticker) => {
    setTickers(prev => [...prev, ticker]);
  };

  // Remove ticker from the list
  const removeTickerFromList = (ticker) => {
    setTickers(prev => prev.filter(t => t !== ticker));
  };

  const refreshData = () => {
    fetchData();
  };

  return (
    <AppContext.Provider
      value={{
        tickers,
        sunPosition,
        loading,
        error,
        lastUpdated,
        addTickerToList,
        removeTickerFromList,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export default AppContext; 