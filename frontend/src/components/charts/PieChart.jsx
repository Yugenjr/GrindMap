import React from 'react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const PieChart = ({
  title,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  height = 280,
  description,
  colors = ['#0891b2', '#f97316', '#22c55e', '#6366f1', '#e11d48', '#14b8a6'],
  containerRef,
  onExport,
}) => (
  <div className="chart-card" ref={containerRef}>
    <div className="chart-card__header">
      <div>
        <p className="chart-card__eyebrow">Pie</p>
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
        <RePieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={90} label>
            {data.map((entry, index) => (
              <Cell key={entry[nameKey]} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default PieChart;
