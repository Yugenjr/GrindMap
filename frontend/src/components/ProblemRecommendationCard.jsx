import React from 'react';

const ProblemRecommendationCard = ({ problem, onSkip, onAddToList, onBookmark }) => {
  return (
    <div className="rec-card">
      <div className="rec-card__top">
        <div>
          <p className="rec-card__eyebrow">{problem.platform} • {problem.difficulty}</p>
          <h3 className="rec-card__title">{problem.title}</h3>
          <p className="rec-card__reason">{problem.reason}</p>
        </div>
        <span className={`rec-badge rec-badge--${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
      </div>

      <div className="rec-card__meta">
        <span>Acceptance: {problem.acceptance}%</span>
        <span>Tags: {(problem.tags || []).join(', ')}</span>
      </div>

      <div className="rec-card__actions">
        <button type="button" className="ghost-button" onClick={() => onSkip(problem.id)}>
          Skip
        </button>
        <button type="button" className="primary-button" onClick={() => onAddToList(problem)}>
          Add to practice list
        </button>
        <button type="button" className="ghost-button" onClick={() => onBookmark(problem.id)}>
          {problem.bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
      </div>
    </div>
  );
};

export default ProblemRecommendationCard;
