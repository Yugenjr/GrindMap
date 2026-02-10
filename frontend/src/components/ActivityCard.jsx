import React from 'react';
import './ActivityHistory.css';

const ActivityCard = ({ activity }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return '#22c55e';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#667eea';
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      leetcode: '💻',
      codeforces: '🏆',
      codechef: '👨‍🍳',
      hackerrank: '🎯',
      github: '🐙',
      atcoder: '🎌',
      default: '📝',
    };
    return icons[platform?.toLowerCase()] || icons.default;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimeSpent = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="activity-card">
      <div className="activity-card-header">
        <div className="activity-platform">
          <span className="platform-icon">{getPlatformIcon(activity.platform)}</span>
          <span className="platform-name">{activity.platform}</span>
        </div>
        <span className="activity-date">{formatDate(activity.date)}</span>
      </div>

      <div className="activity-card-body">
        <h3 className="activity-title">
          {activity.problemLink ? (
            <a 
              href={activity.problemLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="problem-link"
            >
              {activity.problemName}
            </a>
          ) : (
            activity.problemName
          )}
        </h3>

        <div className="activity-meta">
          <span 
            className="difficulty-badge"
            style={{ 
              backgroundColor: `${getDifficultyColor(activity.difficulty)}20`,
              color: getDifficultyColor(activity.difficulty),
              border: `1px solid ${getDifficultyColor(activity.difficulty)}`
            }}
          >
            {activity.difficulty}
          </span>
          
          {activity.status && (
            <span className={`status-badge ${activity.status.toLowerCase()}`}>
              {activity.status === 'Solved' ? '✓' : '○'} {activity.status}
            </span>
          )}

          {activity.timeSpent && (
            <span className="time-badge">
              ⏱️ {formatTimeSpent(activity.timeSpent)}
            </span>
          )}

          {activity.language && (
            <span className="language-badge">
              {activity.language}
            </span>
          )}
        </div>

        {activity.tags && activity.tags.length > 0 && (
          <div className="activity-tags">
            {activity.tags.slice(0, 4).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
            {activity.tags.length > 4 && (
              <span className="tag more-tags">+{activity.tags.length - 4}</span>
            )}
          </div>
        )}

        {activity.notes && (
          <p className="activity-notes">{activity.notes}</p>
        )}
      </div>

      <div className="activity-card-footer">
        <div className="activity-stats">
          {activity.attempts && (
            <span className="stat">
              <span className="stat-label">Attempts:</span>
              <span className="stat-value">{activity.attempts}</span>
            </span>
          )}
          {activity.score && (
            <span className="stat">
              <span className="stat-label">Score:</span>
              <span className="stat-value">{activity.score}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
