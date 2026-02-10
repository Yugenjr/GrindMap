import React from 'react';

const AchievementBadge = ({ badge }) => {
  return (
    <div className={`badge ${badge.unlocked ? 'badge--unlocked' : 'badge--locked'}`}>
      <div className="badge__icon">{badge.icon}</div>
      <div>
        <p className="badge__title">{badge.title}</p>
        <p className="badge__description">{badge.description}</p>
        <p className="badge__status">{badge.unlocked ? 'Unlocked' : 'Locked'}</p>
      </div>
    </div>
  );
};

export default AchievementBadge;
