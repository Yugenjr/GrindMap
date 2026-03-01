import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [type, setType] = useState('global');
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [type]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leaderboard?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/leaderboard/rank', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUserRank(data);
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  return (
    <div className="leaderboard">
      <button onClick={onBack} className="back-btn">← Back</button>
      <h2>Social Leaderboard</h2>

      <div className="leaderboard-controls">
        <button
          className={type === 'global' ? 'active' : ''}
          onClick={() => setType('global')}
        >
          Global
        </button>
        <button
          className={type === 'friends' ? 'active' : ''}
          onClick={() => setType('friends')}
        >
          Friends
        </button>
      </div>

      {userRank && (
        <div className="user-rank">
          Your Rank: {userRank.rank || 'Private'} (Score: {userRank.totalScore})
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <div key={user._id} className="leaderboard-item">
              <span className="rank">#{index + 1}</span>
              <span className="username">{user.username}</span>
              <span className="score">{user.totalScore}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;