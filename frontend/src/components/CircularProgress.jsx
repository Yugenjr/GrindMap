import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const CircularProgress = ({ percentage, solved, goal, color, size = 'medium', tooltip }) => {
  const sizes = {
    small: 100,
    medium: 150,
    large: 240
  };
  const width = sizes[size];

  // Calculate percentage from solved/goal if provided, otherwise use percentage prop
  const calculatedPercentage = solved !== undefined && goal !== undefined
    ? Math.round((solved / goal) * 100)
    : (percentage || 0);

  // Use theme color if not provided
  const progressColor = color || 'var(--theme-progress)';

  return (
    <div style={{ width: `${width}px`, height: `${width}px`, margin: '20px auto' }} title={tooltip}>
      <CircularProgressbar
        value={calculatedPercentage}
        text={`${calculatedPercentage}%`}
        styles={buildStyles({
          textSize: '16px',
          pathColor: progressColor,
          textColor: 'var(--theme-text)',
          trailColor: 'var(--theme-border)',
          pathTransitionDuration: 0.8,
        })}
      />
    </div>
  );
};

export default CircularProgress;