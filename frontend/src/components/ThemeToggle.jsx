import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { currentTheme, themes, switchTheme, customColors, updateCustomColor, resetCustomColors } = useTheme();
  const [showCustomizer, setShowCustomizer] = useState(false);

  const themeOptions = [
    { key: 'light', name: 'Light', icon: '☀️' },
    { key: 'dark', name: 'Dark', icon: '🌙' },
    { key: 'blue', name: 'Blue', icon: '🔵' },
    { key: 'purple', name: 'Purple', icon: '🟣' },
    { key: 'green', name: 'Green', icon: '🟢' },
    { key: 'orange', name: 'Orange', icon: '🟠' }
  ];

  const customizableColors = [
    { key: 'primary', label: 'Primary Color', default: '#667eea' },
    { key: 'secondary', label: 'Secondary Color', default: '#764ba2' },
    { key: 'progress', label: 'Progress Bar Color', default: '#28a745' },
    { key: 'heatmap-low', label: 'Heatmap Low', default: '#e3f2fd' },
    { key: 'heatmap-medium', label: 'Heatmap Medium', default: '#2196f3' },
    { key: 'heatmap-high', label: 'Heatmap High', default: '#0d47a1' }
  ];

  return (
    <div className="theme-toggle-container">
      <div className="theme-toggle-header">
        <button
          className="theme-toggle-button"
          onClick={() => setShowCustomizer(!showCustomizer)}
          title="Theme Settings"
          aria-label="Open theme customizer"
          aria-expanded={showCustomizer}
          aria-controls="theme-customizer"
        >
          🎨 Theme
        </button>
      </div>

      {showCustomizer && (
        <div className="theme-customizer">
          <div className="theme-selector">
            <h4>Choose Theme</h4>
            <div className="theme-grid">
              {themeOptions.map((theme) => (
                <button
                  key={theme.key}
                  className={`theme-option ${currentTheme === theme.key ? 'active' : ''}`}
                  onClick={() => switchTheme(theme.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      switchTheme(theme.key);
                    }
                  }}
                  title={theme.name}
                  aria-label={`Select ${theme.name} theme`}
                  aria-pressed={currentTheme === theme.key}
                >
                  <span className="theme-icon">{theme.icon}</span>
                  <span className="theme-name">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="color-customizer">
            <h4>Customize Colors</h4>
            <div className="color-pickers">
              {customizableColors.map((color) => (
                <div key={color.key} className="color-picker-item">
                  <label htmlFor={`color-${color.key}`}>{color.label}</label>
                  <div className="color-input-group">
                    <input
                      id={`color-${color.key}`}
                      type="color"
                      value={customColors[color.key] || color.default}
                      onChange={(e) => updateCustomColor(color.key, e.target.value)}
                      className="color-input"
                    />
                    <span className="color-value">
                      {customColors[color.key] || color.default}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="customizer-actions">
              <button
                className="reset-colors-btn"
                onClick={resetCustomColors}
                disabled={Object.keys(customColors).length === 0}
              >
                Reset to Theme Colors
              </button>
            </div>
          </div>

          <div className="theme-preview">
            <h4>Preview</h4>
            <div className="preview-elements">
              <div className="preview-button">Sample Button</div>
              <div className="preview-progress">
                <div className="preview-progress-bar" style={{ width: '75%' }}></div>
              </div>
              <div className="preview-heatmap">
                <div className="heatmap-cell low"></div>
                <div className="heatmap-cell medium"></div>
                <div className="heatmap-cell high"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;