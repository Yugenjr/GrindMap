import React, { useState, useEffect } from 'react';
import Badge from './Badge';
import { API_BASE_URL } from '../utils/api';
import './BadgeCollection.css';

const BadgeCollection = ({ userId }) => {
  const [badgesData, setBadgesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('earned');

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/badges/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data = await response.json();
      setBadgesData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markBadgesAsSeen = async (badgeIds) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/badges/seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ badgeIds })
      });

      // Update local state
      setBadgesData(prev => ({
        ...prev,
        earned: prev.earned.map(ub =>
          badgeIds.includes(ub.badge._id) ? { ...ub, isNew: false } : ub
        )
      }));
    } catch (err) {
      console.error('Failed to mark badges as seen:', err);
    }
  };

  if (loading) {
    return (
      <div className="badge-collection loading">
        <div className="loading-spinner"></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge-collection error">
        <p>Failed to load badges: {error}</p>
        <button onClick={fetchBadges} className="retry-btn">Retry</button>
      </div>
    );
  }

  const { earned, upcoming, stats } = badgesData;

  return (
    <div className="badge-collection">
      <div className="badge-header">
        <h2>Achievement System</h2>
        <div className="stats-overview">
          <div className="stat-item">
            <span className="stat-value">{stats.totalPoints}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.badgeCount}</span>
            <span className="stat-label">Badges</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.totalProblemsSolved}</span>
            <span className="stat-label">Problems</span>
          </div>
        </div>
      </div>

      <div className="badge-tabs">
        <button
          className={`tab-btn ${activeTab === 'earned' ? 'active' : ''}`}
          onClick={() => setActiveTab('earned')}
        >
          Earned ({earned.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          In Progress ({upcoming.length})
        </button>
      </div>

      <div className="badge-content">
        {activeTab === 'earned' && (
          <div className="earned-badges">
            {earned.length === 0 ? (
              <div className="empty-state">
                <p>No badges earned yet. Keep solving problems to unlock achievements!</p>
              </div>
            ) : (
              <div className="badges-grid">
                {earned.map((userBadge) => (
                  <Badge
                    key={userBadge._id}
                    badge={userBadge.badge}
                    userBadge={userBadge}
                    size="medium"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="upcoming-badges">
            {upcoming.length === 0 ? (
              <div className="empty-state">
                <p>All available badges earned! You're a coding legend! 🏆</p>
              </div>
            ) : (
              <div className="badges-grid">
                {upcoming.map((item) => (
                  <Badge
                    key={item.badge._id}
                    badge={item.badge}
                    showProgress={true}
                    progress={item.progress}
                    size="medium"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mark new badges as seen */}
      {earned.some(ub => ub.isNew) && (
        <div className="badge-actions">
          <button
            className="mark-seen-btn"
            onClick={() => {
              const newBadgeIds = earned.filter(ub => ub.isNew).map(ub => ub.badge._id);
              markBadgesAsSeen(newBadgeIds);
            }}
          >
            Mark All as Seen
          </button>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;