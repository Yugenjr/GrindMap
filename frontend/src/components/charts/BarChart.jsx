import React from 'react';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const BarChart = ({
  title,
  data = [],
  bars = [],
  xKey,
  height = 280,
  description,
  stacked = false,
  containerRef,
  onExport,
}) => (
  <div className="chart-card" ref={containerRef}>
    <div className="chart-card__header">
      <div>
        <p className="chart-card__eyebrow">Bar</p>
        <h3>{title}</h3>
        {description && <p className="chart-card__subtitle">{description}</p>}
      </div>
      {onExport && (
        <button className="ghost-button" type="button" onClick={onExport} aria-label={`Export ${title}`}>
          Export
        </button>
      )}
    </div>
    <div className="chart-card__body">
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis tick={{ fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <Tooltip />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              stackId={stacked ? 'stack' : undefined}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default BarChart;
