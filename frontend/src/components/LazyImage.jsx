/**
 * Image Lazy Loading Component
 * Loads images only when they enter the viewport
 */
import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

const LazyImage = ({
  src,
  alt,
  placeholder = '/placeholder.png',
  className = '',
  style = {},
  threshold = 0.1,
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    // Check if IntersectionObserver is supported
    if (!window.IntersectionObserver) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(placeholder);
    onError?.();
  };

  return (
    <div
      className={`lazy-image-container ${className}`}
      style={style}
      ref={imageRef}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {!isLoaded && !hasError && (
        <div className="lazy-image-spinner">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
