import React from 'react';
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

const LineChart = ({
  title,
  data = [],
  xKey,
  lines = [],
  height = 280,
  description,
  referenceLines = [],
  containerRef,
  onExport,
}) => (
  <div className="chart-card" ref={containerRef}>
    <div className="chart-card__header">
      <div>
        <p className="chart-card__eyebrow">Line</p>
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
        <ReLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis tick={{ fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <Tooltip />
          <Legend />
          {referenceLines.map((line) => (
            <ReferenceLine key={line.label} y={line.y} stroke={line.color || '#94a3b8'} label={line.label} strokeDasharray="3 3" />
          ))}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              fill={line.fill || 'none'}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default LineChart;
