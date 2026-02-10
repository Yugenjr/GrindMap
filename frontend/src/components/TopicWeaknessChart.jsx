import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const TopicWeaknessChart = ({ data = [] }) => {
  return (
    <div className="rec-chart">
      <div className="rec-chart__header">
        <div>
          <p className="rec-chart__eyebrow">Weak topics</p>
          <h3>Focus areas</h3>
          <p className="rec-chart__subtitle">Higher score means more practice needed.</p>
        </div>
      </div>
      <div className="rec-chart__body">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 40, right: 12, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#475569' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis dataKey="topic" type="category" tick={{ fill: '#475569' }} width={110} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <Tooltip />
            <Bar dataKey="weaknessScore" fill="#f97316" radius={[6, 6, 6, 6]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopicWeaknessChart;
