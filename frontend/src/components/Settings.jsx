import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI } from '../utils/api';
import './Settings.css';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');
  const navigate = useNavigate();

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    dailyReminders: true,
    weeklyDigest: true,
    streakReminders: true,
    reminderFrequency: 'daily', // daily, weekly, never
    reminderTime: '09:00',
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // public, private, friends
    showEmail: false,
    showStats: true,
    showBadges: true,
    showActivity: true,
    allowDataSharing: false,
    allowAnalytics: true,
  });

  // Display Preferences
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light', // light, dark, auto
    dashboardLayout: 'grid', // grid, list, compact
    showAnimations: true,
    compactMode: false,
    fontSize: 'medium', // small, medium, large
    language: 'en',
  });

  // Platform Integration
  const [platformSettings, setplatformSettings] = useState({
    autoSync: true,
    syncFrequency: 'hourly', // realtime, hourly, daily, manual
    notifyOnSync: false,
    connectedPlatforms: [], // Will be populated from API
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30, // minutes
    showActiveSessions: true,
    loginAlerts: true,
  });

  // Active Sessions (mock data for now)
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      const settings = response.data;

      // Update state with loaded settings
      if (settings.notifications) setNotificationSettings(settings.notifications);
      if (settings.privacy) setPrivacySettings(settings.privacy);
      if (settings.display) setDisplaySettings(settings.display);
      if (settings.platform) setplatformSettings(settings.platform);
      if (settings.security) setSecuritySettings(settings.security);
      if (settings.activeSessions) setActiveSessions(settings.activeSessions);

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async (settingType) => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let dataToSave = {};
      switch (settingType) {
        case 'notifications':
          dataToSave = { notifications: notificationSettings };
          break;
        case 'privacy':
          dataToSave = { privacy: privacySettings };
          break;
        case 'display':
          dataToSave = { display: displaySettings };
          break;
        case 'platform':
          dataToSave = { platform: platformSettings };
          break;
        case 'security':
          dataToSave = { security: securitySettings };
          break;
        default:
          break;
      }

      await settingsAPI.updateSettings(dataToSave);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save settings';
      setErrorMessage(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async (format) => {
    try {
      const response = await settingsAPI.exportData(format);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grindmap-data-${Date.now()}.${format}`;
      a.click();
      setSuccessMessage(`Data exported successfully as ${format.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to export data');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await settingsAPI.terminateSession(sessionId);
      setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
      setSuccessMessage('Session terminated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to terminate session');
    }
  };

  const handleToggle2FA = async () => {
    try {
      const newValue = !securitySettings.twoFactorEnabled;
      await settingsAPI.toggle2FA(newValue);
      setSecuritySettings({ ...securitySettings, twoFactorEnabled: newValue });
      setSuccessMessage(`Two-Factor Authentication ${newValue ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to toggle 2FA');
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings & Preferences</h1>
        <p>Customize your GrindMap experience</p>
      </div>

      <div className="settings-content">
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

        {/* Tabs Navigation */}
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifications
          </button>
          <button
            className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            🔒 Privacy
          </button>
          <button
            className={`tab-button ${activeTab === 'display' ? 'active' : ''}`}
            onClick={() => setActiveTab('display')}
          >
            🎨 Display
          </button>
          <button
            className={`tab-button ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            🔗 Platforms
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🛡️ Security
          </button>
          <button
            className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            📦 Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-panel">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p className="section-description">Manage how and when you receive notifications</p>

              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email Notifications</label>
                    <p>Receive updates via email</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Push Notifications</label>
                    <p>Receive browser push notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Daily Reminders</label>
                    <p>Get reminded to solve problems daily</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailyReminders}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          dailyReminders: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Weekly Digest</label>
                    <p>Receive weekly summary of your progress</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyDigest}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          weeklyDigest: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Streak Reminders</label>
                    <p>Never lose your streak with reminders</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.streakReminders}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          streakReminders: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Reminder Frequency</label>
                    <p>How often to send reminders</p>
                  </div>
                  <select
                    value={notificationSettings.reminderFrequency}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        reminderFrequency: e.target.value,
                      })
                    }
                    className="setting-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Reminder Time</label>
                    <p>Preferred time for daily reminders</p>
                  </div>
                  <input
                    type="time"
                    value={notificationSettings.reminderTime}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        reminderTime: e.target.value,
                      })
                    }
                    className="setting-input"
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleSaveSettings('notifications')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>Privacy Settings</h2>
              <p className="section-description">Control who can see your information</p>

              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Profile Visibility</label>
                    <p>Who can view your profile</p>
                  </div>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        profileVisibility: e.target.value,
                      })
                    }
                    className="setting-select"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Show Email Address</label>
                    <p>Display email on your profile</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.showEmail}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showEmail: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Show Statistics</label>
                    <p>Display your coding stats publicly</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.showStats}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showStats: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Show Badges</label>
                    <p>Display earned badges on profile</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.showBadges}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showBadges: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Show Activity</label>
                    <p>Display recent activity publicly</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.showActivity}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showActivity: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Allow Data Sharing</label>
                    <p>Share anonymized data for research</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowDataSharing}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          allowDataSharing: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Allow Analytics</label>
                    <p>Help us improve with usage analytics</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowAnalytics}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          allowAnalytics: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleSaveSettings('privacy')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="settings-section">
              <h2>Display Preferences</h2>
              <p className="section-description">Customize the look and feel</p>

              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Theme</label>
                    <p>Choose your preferred color scheme</p>
                  </div>
                  <select
                    value={displaySettings.theme}
                    onChange={(e) =>
                      setDisplaySettings({
                        ...displaySettings,
                        theme: e.target.value,
                      })
                    }
                    className="setting-select"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Dashboard Layout</label>
                    <p>Choose how to display dashboard</p>
                  </div>
                  <select
                    value={displaySettings.dashboardLayout}
                    onChange={(e) =>
                      setDisplaySettings({
                        ...displaySettings,
                        dashboardLayout: e.target.value,
                      })
                    }
                    className="setting-select"
                  >
                    <option value="grid">Grid View</option>
                    <option value="list">List View</option>
                    <option value="compact">Compact View</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Font Size</label>
                    <p>Adjust text size for readability</p>
                  </div>
                  <select
                    value={displaySettings.fontSize}
                    onChange={(e) =>
                      setDisplaySettings({
                        ...displaySettings,
                        fontSize: e.target.value,
                      })
                    }
                    className="setting-select"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Show Animations</label>
                    <p>Enable smooth transitions and effects</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={displaySettings.showAnimations}
                      onChange={(e) =>
                        setDisplaySettings({
                          ...displaySettings,
                          showAnimations: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Compact Mode</label>
                    <p>Reduce spacing for more content</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={displaySettings.compactMode}
                      onChange={(e) =>
                        setDisplaySettings({
                          ...displaySettings,
                          compactMode: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Language</label>
                    <p>Choose your preferred language</p>
                  </div>
                  <select
                    value={displaySettings.language}
                    onChange={(e) =>
                      setDisplaySettings({
                        ...displaySettings,
                        language: e.target.value,
                      })
                    }
                    className="setting-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="hi">हिन्दी</option>
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleSaveSettings('display')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Display Settings'}
              </button>
            </div>
          )}

          {/* Platform Integration Tab */}
          {activeTab === 'platform' && (
            <div className="settings-section">
              <h2>Platform Integration</h2>
              <p className="section-description">Manage connected coding platforms</p>

              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Auto-Sync</label>
                    <p>Automatically sync platform data</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={platformSettings.autoSync}
                      onChange={(e) =>
                        setplatformSettings({
                          ...platformSettings,
                          autoSync: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Sync Frequency</label>
                    <p>How often to sync platform data</p>
                  </div>
                  <select
                    value={platformSettings.syncFrequency}
                    onChange={(e) =>
                      setplatformSettings({
                        ...platformSettings,
                        syncFrequency: e.target.value,
                      })
                    }
                    className="setting-select"
                    disabled={!platformSettings.autoSync}
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Notify on Sync</label>
                    <p>Get notified when sync completes</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={platformSettings.notifyOnSync}
                      onChange={(e) =>
                        setplatformSettings({
                          ...platformSettings,
                          notifyOnSync: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="connected-platforms">
                  <h3>Connected Platforms</h3>
                  {platformSettings.connectedPlatforms.length === 0 ? (
                    <p className="no-platforms">No platforms connected yet</p>
                  ) : (
                    <div className="platforms-list">
                      {platformSettings.connectedPlatforms.map((platform) => (
                        <div key={platform.id} className="platform-item">
                          <div className="platform-info">
                            <span className="platform-icon">{platform.icon}</span>
                            <div>
                              <strong>{platform.name}</strong>
                              <p>Connected {platform.connectedDate}</p>
                            </div>
                          </div>
                          <button className="btn btn-secondary btn-small">
                            Manage
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate('/platform-manager')}
                  >
                    + Add Platform
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleSaveSettings('platform')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Platform Settings'}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <p className="section-description">Protect your account</p>

              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Two-Factor Authentication</label>
                    <p>Add extra layer of security</p>
                  </div>
                  <div className="setting-action">
                    <span className={`status-badge ${securitySettings.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                      {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={handleToggle2FA}
                      disabled={saving}
                    >
                      {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Session Timeout</label>
                    <p>Auto logout after inactivity (minutes)</p>
                  </div>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                    className="setting-input"
                    min="5"
                    max="120"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Login Alerts</label>
                    <p>Get notified of new login attempts</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={securitySettings.loginAlerts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          loginAlerts: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Active Sessions */}
                <div className="active-sessions">
                  <h3>Active Sessions</h3>
                  {activeSessions.length === 0 ? (
                    <p className="no-sessions">No other active sessions</p>
                  ) : (
                    <div className="sessions-list">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="session-item">
                          <div className="session-info">
                            <div className="session-header">
                              <strong>{session.device}</strong>
                              {session.current && <span className="current-badge">Current</span>}
                            </div>
                            <p>{session.location}</p>
                            <p className="session-time">Last active: {session.lastActive}</p>
                          </div>
                          {!session.current && (
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleTerminateSession(session.id)}
                            >
                              Terminate
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleSaveSettings('security')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          )}

          {/* Data Export Tab */}
          {activeTab === 'data' && (
            <div className="settings-section">
              <h2>Data Management</h2>
              <p className="section-description">Export, backup, or delete your data</p>

              <div className="settings-group">
                <div className="data-section">
                  <h3>Export Your Data</h3>
                  <p>Download a copy of your GrindMap data</p>
                  <div className="export-buttons">
                    <button
                      className="btn btn-outline"
                      onClick={() => handleExportData('json')}
                    >
                      Export as JSON
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleExportData('csv')}
                    >
                      Export as CSV
                    </button>
                  </div>
                </div>

                <div className="data-section">
                  <h3>Backup Settings</h3>
                  <p>Create a backup of your settings and preferences</p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleExportData('backup')}
                  >
                    Create Backup
                  </button>
                </div>

                <div className="data-section danger-section">
                  <h3>Delete All Data</h3>
                  <p className="danger-text">
                    This will permanently delete all your activity, statistics, and settings.
                    This action cannot be undone.
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => navigate('/profile')}
                  >
                    Go to Account Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
