import React from 'react';

const GoalCard = ({ goal, onProgressChange, onStatusChange, onDelete, onEdit, onMarkDone }) => {
  const handleProgressInput = (event) => {
    const next = Number(event.target.value);
    onProgressChange(goal.id, next);
  };

  const togglePause = () => {
    const nextStatus = goal.status === 'paused' ? 'active' : 'paused';
    onStatusChange(goal.id, nextStatus);
  };

  return (
    <div className="goal-card">
      <div className="goal-card__top">
        <div>
          <p className="goal-card__eyebrow">{goal.timeframe} • {goal.type}</p>
          <h3>{goal.title}</h3>
          <p className="goal-card__meta">
            Target: {goal.target} • Difficulty: {goal.difficulty} • Platform: {goal.platform}
          </p>
        </div>
        <span className={`status-badge status-${goal.status}`}>{goal.status}</span>
      </div>

      <p className="goal-card__description">{goal.description || 'Stay consistent and keep shipping solutions.'}</p>

      <div className="progress-row">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${Math.min(goal.progress, 100)}%` }} />
        </div>
        <span className="progress-value">{Math.min(goal.progress, 100)}%</span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={Math.min(goal.progress, 100)}
        onChange={handleProgressInput}
        className="progress-slider"
      />

      <div className="goal-card__actions">
        <button className="ghost-button" type="button" onClick={() => onEdit(goal)}>Edit</button>
        <button className="ghost-button" type="button" onClick={togglePause}>
          {goal.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button className="primary-button" type="button" onClick={() => onMarkDone(goal.id)}>Mark Done</button>
        <button className="danger-button" type="button" onClick={() => onDelete(goal.id)}>Delete</button>
      </div>
    </div>
  );
};

export default GoalCard;
