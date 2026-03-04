import React, { useState, useEffect } from 'react';
import './Friends.css';

const Friends = ({ onBack }) => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      // Assuming there's a search endpoint, for now just filter friends
      const filtered = friends.filter(friend =>
        friend.username.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      });
      fetchFriends();
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchUsers(term);
  };

  return (
    <div className="friends">
      <button onClick={onBack} className="back-btn">← Back</button>
      <h2>Friends</h2>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(user => (
              <div key={user._id} className="search-item">
                <span>{user.username}</span>
                <button onClick={() => addFriend(user._id)}>Add Friend</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h3>Your Friends</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="friends-list">
          {friends.map(friend => (
            <div key={friend._id} className="friend-item">
              <span>{friend.username}</span>
              <span>Score: {friend.totalScore}</span>
              <button onClick={() => removeFriend(friend._id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;