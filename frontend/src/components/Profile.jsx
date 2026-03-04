import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import BadgeCollection from './BadgeCollection';
import AnalyticsDashboard from './AnalyticsDashboard';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Profile edit form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    bio: '',
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          username: parsedUser.username || parsedUser.email?.split('@')[0] || '',
          bio: parsedUser.bio || '',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    return errors;
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      setErrorMessage('Please fix the errors below');
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
      });

      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to update profile';
      setErrorMessage(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    } else if (!/(?=.*[A-Z])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase letter';
    } else if (!/(?=.*[a-z])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain lowercase letter';
    } else if (!/(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain digit';
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to change password';
      setErrorMessage(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await authAPI.deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      navigate('/login');
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to delete account';
      setErrorMessage(errMsg);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account and view your achievements</p>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="success-banner">
              <span className="icon">✓</span>
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="error-banner">
              <span className="icon">⚠</span>
              {errorMessage}
            </div>
          )}

          {/* Profile Header with Avatar */}
          <div className="profile-header-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="profile-info-header">
              <h2>{user?.name || 'User'}</h2>
              <p className="username">@{user?.username || 'username'}</p>
              <p className="email">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="profile-form">
            {!isEditing ? (
              /* View Mode */
              <div className="profile-details">
                <div className="detail-item">
                  <label>Full Name</label>
                  <p>{formData.name}</p>
                </div>
                <div className="detail-item">
                  <label>Email Address</label>
                  <p>{formData.email}</p>
                </div>
                <div className="detail-item">
                  <label>Username</label>
                  <p>@{formData.username}</p>
                </div>
                <div className="detail-item">
                  <label>Bio</label>
                  <p>{formData.bio || '(No bio added yet)'}</p>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="profile-form-fields">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Your username"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows="4"
                    disabled={saving}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="profile-actions">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsEditing(true);
                      setErrorMessage('');
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                  >
                    {showPasswordChange ? 'Cancel' : 'Change Password'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      loadUserProfile();
                      setErrorMessage('');
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Password Change Section */}
          {showPasswordChange && (
            <form onSubmit={handleSubmitPasswordChange} className="password-change-form">
              <h3>Change Password</h3>

              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={saving}
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="error-text">{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={saving}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="error-text">{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={saving}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="error-text">{passwordErrors.confirmPassword}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordErrors({});
                    setErrorMessage('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Delete Account Section */}
          <div className="danger-zone">
            <h3 className="danger-title">Danger Zone</h3>
            <p className="danger-text">Once you delete your account, there is no going back. Please be certain.</p>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            >
              {showDeleteConfirm ? 'Cancel Deletion' : 'Delete Account'}
            </button>

            {showDeleteConfirm && (
              <div className="delete-confirmation">
                <p className="confirmation-text">
                  Are you sure you want to delete your account? This action cannot be undone.
                </p>
                <div className="confirmation-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="profile-achievements">
          <div className="section-title">
            <h2>Your Achievements</h2>
          </div>
          <BadgeCollection />
        </div>

        {/* Analytics Section */}
        <div className="profile-analytics">
          <div className="section-title">
            <h2>Your Statistics</h2>
          </div>
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
};

export default Profile;
