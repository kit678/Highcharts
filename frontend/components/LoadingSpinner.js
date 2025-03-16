import React from 'react';

const LoadingSpinner = ({ size = '2rem', color = 'var(--secondary-color)' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 2rem 0;
        }
        .spinner {
          width: ${size};
          height: ${size};
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-left-color: ${color};
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 