import React from 'react';
import './ActivityHistory.css';

const Timeline = ({ activities }) => {
  const groupActivitiesByDate = () => {
    const grouped = {};
    activities.forEach(activity => {
      const date = new Date(activity.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });
    return grouped;
  };

  const groupedActivities = groupActivitiesByDate();

  const getPlatformColor = (platform) => {
    const colors = {
      leetcode: '#FFA116',
      codeforces: '#1F8ACB',
      codechef: '#5B4638',
      hackerrank: '#00EA64',
      github: '#333',
      atcoder: '#000',
      default: '#667eea',
    };
    return colors[platform?.toLowerCase()] || colors.default;
  };

  return (
    <div className="timeline-container">
      {Object.entries(groupedActivities).map(([date, activities], dateIndex) => (
        <div key={dateIndex} className="timeline-date-group">
          <div className="timeline-date-header">
            <div className="timeline-date-badge">{date}</div>
            <div className="timeline-date-line"></div>
          </div>

          <div className="timeline-items">
            {activities.map((activity, activityIndex) => (
              <div key={activityIndex} className="timeline-item">
                <div 
                  className="timeline-marker"
                  style={{ backgroundColor: getPlatformColor(activity.platform) }}
                >
                  <span className="timeline-marker-inner"></span>
                </div>

                <div className="timeline-content">
                  <div className="timeline-item-header">
                    <h4 className="timeline-title">
                      {activity.problemLink ? (
                        <a 
                          href={activity.problemLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="timeline-link"
                        >
                          {activity.problemName}
                        </a>
                      ) : (
                        activity.problemName
                      )}
                    </h4>
                    <span className="timeline-platform">{activity.platform}</span>
                  </div>

                  <div className="timeline-item-meta">
                    <span className={`timeline-difficulty ${activity.difficulty?.toLowerCase()}`}>
                      {activity.difficulty}
                    </span>
                    {activity.status && (
                      <span className={`timeline-status ${activity.status.toLowerCase()}`}>
                        {activity.status}
                      </span>
                    )}
                    {activity.timeSpent && (
                      <span className="timeline-time">
                        {activity.timeSpent < 60 
                          ? `${activity.timeSpent}m` 
                          : `${Math.floor(activity.timeSpent / 60)}h ${activity.timeSpent % 60}m`
                        }
                      </span>
                    )}
                  </div>

                  {activity.tags && activity.tags.length > 0 && (
                    <div className="timeline-tags">
                      {activity.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span key={tagIndex} className="timeline-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(groupedActivities).length === 0 && (
        <div className="timeline-empty">
          <p>No activities found</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;
