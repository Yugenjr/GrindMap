import React from 'react';
import './LoadingFallback.css';

const LoadingFallback = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-fallback">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingFallback;
