import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const UserProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-profile">
      <div className="user-avatar">
        {getInitials(user.name)}
      </div>
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default UserProfile;