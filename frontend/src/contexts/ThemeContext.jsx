import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme definitions
export const themes = {
  light: {
    name: 'Light',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#2c3e50',
      textSecondary: '#6c757d',
      border: '#e9ecef',
      shadow: 'rgba(0, 0, 0, 0.1)',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      progress: '#28a745',
      heatmap: {
        low: '#e3f2fd',
        medium: '#2196f3',
        high: '#0d47a1'
      }
    }
  },
  navyOrange: {
    name: 'Navy & Orange',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      background: '#020617',
      surface: '#0b1120',
      text: '#e5e7eb',
      textSecondary: '#9ca3af',
      border: '#1f2937',
      shadow: 'rgba(15, 23, 42, 0.8)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      progress: '#f97316',
      heatmap: {
        low: '#1e293b',
        medium: '#f97316',
        high: '#ffedd5'
      }
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#333333',
      shadow: 'rgba(0, 0, 0, 0.3)',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      progress: '#4caf50',
      heatmap: {
        low: '#1a237e',
        medium: '#3949ab',
        high: '#e8eaf6'
      }
    }
  },
  blue: {
    name: 'Blue',
    colors: {
      primary: '#1976d2',
      secondary: '#42a5f5',
      background: '#e3f2fd',
      surface: '#ffffff',
      text: '#0d47a1',
      textSecondary: '#1976d2',
      border: '#bbdefb',
      shadow: 'rgba(25, 118, 210, 0.1)',
      success: '#2e7d32',
      warning: '#f57c00',
      error: '#d32f2f',
      info: '#0288d1',
      progress: '#1976d2',
      heatmap: {
        low: '#e3f2fd',
        medium: '#2196f3',
        high: '#0d47a1'
      }
    }
  },
  purple: {
    name: 'Purple',
    colors: {
      primary: '#7b1fa2',
      secondary: '#ba68c8',
      background: '#f3e5f5',
      surface: '#ffffff',
      text: '#4a148c',
      textSecondary: '#7b1fa2',
      border: '#ce93d8',
      shadow: 'rgba(123, 31, 162, 0.1)',
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f',
      info: '#7b1fa2',
      progress: '#7b1fa2',
      heatmap: {
        low: '#f3e5f5',
        medium: '#ba68c8',
        high: '#4a148c'
      }
    }
  },
  green: {
    name: 'Green',
    colors: {
      primary: '#388e3c',
      secondary: '#4caf50',
      background: '#e8f5e8',
      surface: '#ffffff',
      text: '#1b5e20',
      textSecondary: '#388e3c',
      border: '#a5d6a7',
      shadow: 'rgba(56, 142, 60, 0.1)',
      success: '#2e7d32',
      warning: '#f57c00',
      error: '#d32f2f',
      info: '#388e3c',
      progress: '#388e3c',
      heatmap: {
        low: '#e8f5e8',
        medium: '#4caf50',
        high: '#1b5e20'
      }
    }
  },
  orange: {
    name: 'Orange',
    colors: {
      primary: '#f57c00',
      secondary: '#ff9800',
      background: '#fff3e0',
      surface: '#ffffff',
      text: '#e65100',
      textSecondary: '#f57c00',
      border: '#ffcc02',
      shadow: 'rgba(245, 124, 0, 0.1)',
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f',
      info: '#f57c00',
      progress: '#f57c00',
      heatmap: {
        low: '#fff3e0',
        medium: '#ff9800',
        high: '#e65100'
      }
    }
  }
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Load theme from localStorage on initialization
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('grindmap-theme');
    return (savedTheme && themes[savedTheme]) ? savedTheme : 'navyOrange';
  });

  // Load custom colors from localStorage on initialization
  const [customColors, setCustomColors] = useState(() => {
    const savedCustomColors = localStorage.getItem('grindmap-custom-colors');
    if (savedCustomColors) {
      try {
        return JSON.parse(savedCustomColors);
      } catch (error) {
        console.error('Failed to parse saved custom colors:', error);
      }
    }
    return {};
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('grindmap-theme', currentTheme);
  }, [currentTheme]);

  // Save custom colors to localStorage when they change
  useEffect(() => {
    localStorage.setItem('grindmap-custom-colors', JSON.stringify(customColors));
  }, [customColors]);

  // Apply theme to CSS variables
  useEffect(() => {
    const theme = themes[currentTheme];
    if (theme) {
      const root = document.documentElement;

      // Apply base theme colors
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--theme-${key}`, value);
        } else if (typeof value === 'object') {
          // Handle nested objects like heatmap
          Object.entries(value).forEach(([subKey, subValue]) => {
            root.style.setProperty(`--theme-${key}-${subKey}`, subValue);
          });
        }
      });

      // Apply custom colors (override theme colors)
      Object.entries(customColors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });

      // Set theme attribute for CSS selectors
      root.setAttribute('data-theme', currentTheme);
    }
  }, [currentTheme, customColors]);

  const resetCustomColors = () => {
    setCustomColors({});
  };

  const getCurrentTheme = () => {
    return {
      ...themes[currentTheme],
      colors: {
        ...themes[currentTheme].colors,
        ...customColors
      }
    };
  };

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const updateCustomColor = (colorKey, colorValue) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: colorValue
    }));
  };

  const value = {
    currentTheme,
    themes: Object.keys(themes),
    customColors,
    switchTheme,
    updateCustomColor,
    resetCustomColors,
    getCurrentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};