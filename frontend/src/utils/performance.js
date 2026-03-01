/**
 * Performance monitoring utility
 * Tracks and reports Web Vitals and custom performance metrics
 */

import { useEffect } from 'react';

// Track custom performance marks and measures
export const performanceMark = (name) => {
  if (performance && performance.mark) {
    performance.mark(name);
  }
};

export const performanceMeasure = (name, startMark, endMark) => {
  if (performance && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure?.duration || 0;
    } catch (error) {
      console.warn('Performance measure failed:', error);
      return 0;
    }
  }
  return 0;
};

// Track component render time
export const trackComponentRender = (componentName) => {
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  const measureName = `${componentName}-render`;

  return {
    start: () => performanceMark(startMark),
    end: () => {
      performanceMark(endMark);
      const duration = performanceMeasure(measureName, startMark, endMark);
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(
          `Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`
        );
      }
      
      return duration;
    },
  };
};

// Track data fetching performance
export const trackDataFetch = async (fetchName, fetchFn) => {
  const startMark = `fetch-${fetchName}-start`;
  const endMark = `fetch-${fetchName}-end`;
  const measureName = `fetch-${fetchName}`;

  performanceMark(startMark);
  
  try {
    const result = await fetchFn();
    performanceMark(endMark);
    const duration = performanceMeasure(measureName, startMark, endMark);
    
    // Log slow fetches
    if (duration > 1000) {
      console.warn(
        `Slow fetch detected: ${fetchName} took ${duration.toFixed(2)}ms`
      );
    }
    
    return result;
  } catch (error) {
    performanceMark(endMark);
    performanceMeasure(measureName, startMark, endMark);
    throw error;
  }
};

// Get all performance metrics
export const getPerformanceMetrics = () => {
  if (!performance || !performance.getEntriesByType) {
    return {};
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  const metrics = {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart || 0,
    tcp: navigation?.connectEnd - navigation?.connectStart || 0,
    ttfb: navigation?.responseStart - navigation?.requestStart || 0,
    download: navigation?.responseEnd - navigation?.responseStart || 0,
    domInteractive: navigation?.domInteractive || 0,
    domComplete: navigation?.domComplete || 0,
    loadComplete: navigation?.loadEventEnd || 0,

    // Paint timing
    fcp: paint?.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
    
    // Custom measures
    customMeasures: performance.getEntriesByType('measure').map((m) => ({
      name: m.name,
      duration: m.duration,
    })),
  };

  return metrics;
};

// Log performance summary to console
export const logPerformanceSummary = () => {
  const metrics = getPerformanceMetrics();
  
  console.group('🚀 Performance Metrics');
  console.log('DNS Lookup:', `${metrics.dns?.toFixed(2)}ms`);
  console.log('TCP Connection:', `${metrics.tcp?.toFixed(2)}ms`);
  console.log('Time to First Byte:', `${metrics.ttfb?.toFixed(2)}ms`);
  console.log('Download Time:', `${metrics.download?.toFixed(2)}ms`);
  console.log('DOM Interactive:', `${metrics.domInteractive?.toFixed(2)}ms`);
  console.log('DOM Complete:', `${metrics.domComplete?.toFixed(2)}ms`);
  console.log('Load Complete:', `${metrics.loadComplete?.toFixed(2)}ms`);
  console.log('First Contentful Paint:', `${metrics.fcp?.toFixed(2)}ms`);
  
  if (metrics.customMeasures?.length > 0) {
    console.group('Custom Measures');
    metrics.customMeasures.forEach((m) => {
      console.log(`${m.name}:`, `${m.duration.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
};

// Monitor long tasks (tasks taking >50ms)
export const monitorLongTasks = () => {
  if (!window.PerformanceObserver) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(
          `⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`,
          entry
        );
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // longtask may not be supported in all browsers
    console.log('Long task monitoring not supported');
  }
};

// React performance hook
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const tracker = trackComponentRender(componentName);
    tracker.start();

    return () => {
      tracker.end();
    };
  }, [componentName]);
};

// Log performance on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait a bit for all metrics to be available
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        logPerformanceSummary();
        monitorLongTasks();
      }
    }, 1000);
  });
}

export default {
  performanceMark,
  performanceMeasure,
  trackComponentRender,
  trackDataFetch,
  getPerformanceMetrics,
  logPerformanceSummary,
  monitorLongTasks,
  usePerformanceMonitor,
};
