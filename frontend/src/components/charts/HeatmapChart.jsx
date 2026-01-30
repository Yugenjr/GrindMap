import React from 'react';

const HeatmapChart = ({
  title,
  data = [],
  description,
  containerRef,
  onExport,
}) => {
  const maxValue = Math.max(
    0,
    ...data.flatMap((row) => row.values?.map((value) => value.count) || [])
  );

  const getIntensity = (value) => {
    if (!maxValue) return 0;
    const ratio = value / maxValue;
    if (ratio === 0) return 0;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  return (
    <div className="chart-card" ref={containerRef}>
      <div className="chart-card__header">
        <div>
          <p className="chart-card__eyebrow">Heatmap</p>
          <h3>{title}</h3>
          {description && <p className="chart-card__subtitle">{description}</p>}
        </div>
        {onExport && (
          <button className="ghost-button" type="button" onClick={onExport} aria-label={`Export ${title}`}>
            Export
          </button>
        )}
      </div>
      <div className="chart-card__body heatmap-card">
        <div className="heatmap-grid">
          <div className="heatmap-grid__header">
            <span />
            {[0, 4, 8, 12, 16, 20].map((hour) => (
              <span key={hour}>{hour}:00</span>
            ))}
          </div>
          {data.map((row) => (
            <div className="heatmap-grid__row" key={row.day}>
              <span className="heatmap-grid__label">{row.day}</span>
              <div className="heatmap-grid__cells">
                {row.values.map((value) => (
                  <div
                    key={`${row.day}-${value.hour}`}
                    className={`heatmap-cell heatmap-intensity-${getIntensity(value.count)}`}
                    title={`${row.day} ${value.hour}:00 - ${value.count} sessions`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
