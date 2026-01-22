import React, { useEffect, useState } from 'react';
import './RepoStats.css';

const RepoStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track view on component mount
    trackView();
    // Fetch stats
    fetchStats();
  }, []);

  const trackView = async () => {
    try {
      await fetch('/api/repo-stats/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/repo-stats/stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="repo-stats-container">
        <div className="stats-loading">Loading repository statistics...</div>
      </div>
    );
  }

  return (
    <div className="repo-stats-container">
      <div className="repo-stats-card">
        <h3 className="stats-title">📊 Repository Statistics</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon">👁️</div>
            <div className="stat-value">{stats?.totalViews?.toLocaleString() || 0}</div>
            <div className="stat-label">Total Views</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats?.uniqueVisitors || 0}</div>
            <div className="stat-label">Unique Visitors</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{stats?.todayViews || 0}</div>
            <div className="stat-label">Today's Views</div>
          </div>
        </div>
        
        {stats?.last30Days && stats.last30Days.length > 0 && (
          <div className="stats-chart">
            <h4>Last 30 Days Activity</h4>
            <div className="chart-bars">
              {stats.last30Days.slice(-7).map((day, index) => {
                const maxCount = Math.max(...stats.last30Days.map(d => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${height}%` }}
                      title={`${day.count} views`}
                    ></div>
                    <div className="chart-label">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoStats;
