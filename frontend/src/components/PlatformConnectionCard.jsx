import React, { useState } from 'react';

const PlatformConnectionCard = ({ platform, onConnect, onDisconnect, onTest, onSync, onUpdateSettings }) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [credentials, setCredentials] = useState({
    username: platform.username || '',
    apiKey: platform.apiKey || '',
    token: platform.token || '',
  });
  const [settings, setSettings] = useState({
    syncProblems: platform.settings?.syncProblems ?? true,
    syncSubmissions: platform.settings?.syncSubmissions ?? true,
    syncContests: platform.settings?.syncContests ?? false,
    autoSync: platform.settings?.autoSync ?? true,
  });
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getPlatformIcon = (name) => {
    const icons = {
      'LeetCode': '💻',
      'Codeforces': '🏆',
      'HackerRank': '👨‍💻',
      'CodeChef': '👨‍🍳',
      'GitHub': '🐙',
      'AtCoder': '🎯',
      'TopCoder': '🔝',
    };
    return icons[name] || '💡';
  };

  const getStatusColor = (status) => {
    const colors = {
      connected: '#22c55e',
      disconnected: '#6b7280',
      error: '#ef4444',
      syncing: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  };

  const getHealthStatus = () => {
    if (!platform.connected) return { text: 'Not Connected', color: '#6b7280' };
    if (platform.lastSyncError) return { text: 'Error', color: '#ef4444' };
    if (platform.syncing) return { text: 'Syncing...', color: '#f59e0b' };
    if (!platform.lastSync) return { text: 'Never Synced', color: '#f59e0b' };
    
    const lastSync = new Date(platform.lastSync);
    if (isNaN(lastSync.getTime())) return { text: 'Invalid Date', color: '#f59e0b' };
    
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync < 1) return { text: 'Healthy', color: '#22c55e' };
    if (hoursSinceSync < 24) return { text: 'Good', color: '#3b82f6' };
    return { text: 'Outdated', color: '#f59e0b' };
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const syncDate = new Date(date);
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return syncDate.toLocaleDateString();
  };

  const handleConnect = () => {
    onConnect(platform.id, credentials);
    setShowCredentials(false);
  };

  const handleTest = async () => {
    setTesting(true);
    const actualPlatformId = platform.id.replace('temp_', '') || platform.platformId;
    await onTest(actualPlatformId, credentials);
    setTimeout(() => setTesting(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    const actualPlatformId = platform.id.replace('temp_', '');
    await onSync(actualPlatformId);
    setTimeout(() => setSyncing(false), 2000);
  };

  const handleSaveSettings = () => {
    const actualPlatformId = platform.id.replace('temp_', '');
    onUpdateSettings(actualPlatformId, settings);
    setShowSettings(false);
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="platform-connection-card">
      <div className="platform-connection-header">
        <div className="platform-info">
          <span className="platform-icon">{getPlatformIcon(platform.name)}</span>
          <div className="platform-details">
            <h3 className="platform-name">{platform.name}</h3>
            <span className="platform-username">{platform.username || 'Not configured'}</span>
          </div>
        </div>
        <div 
          className="connection-status" 
          style={{ backgroundColor: getStatusColor(platform.status) }}
        >
          {platform.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="platform-connection-body">
        {platform.connected && (
          <>
            <div className="platform-stats">
              <div className="stat-item">
                <span className="stat-label">Health</span>
                <span className="stat-value" style={{ color: healthStatus.color }}>
                  {healthStatus.text}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Sync</span>
                <span className="stat-value">{formatLastSync(platform.lastSync)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Problems Synced</span>
                <span className="stat-value">{platform.problemsSynced || 0}</span>
              </div>
            </div>

            {platform.lastSyncError && (
              <div className="sync-error">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{platform.lastSyncError}</span>
              </div>
            )}
          </>
        )}

        {!platform.connected && !showCredentials && (
          <div className="not-connected-message">
            <p>Connect your {platform.name} account to sync your progress</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCredentials(true)}
            >
              Connect Account
            </button>
          </div>
        )}

        {showCredentials && (
          <div className="credentials-form">
            <h4>Connect {platform.name}</h4>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                placeholder={`Your ${platform.name} username`}
              />
            </div>
            {platform.requiresApiKey && (
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                  placeholder="Your API key"
                />
                <span className="form-hint">Find your API key in {platform.name} settings</span>
              </div>
            )}
            {platform.requiresToken && (
              <div className="form-group">
                <label>Access Token</label>
                <input
                  type="password"
                  value={credentials.token}
                  onChange={(e) => setCredentials({...credentials, token: e.target.value})}
                  placeholder="Your access token"
                />
              </div>
            )}
            <div className="form-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCredentials(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-outline"
                onClick={handleTest}
                disabled={testing || !credentials.username}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConnect}
                disabled={!credentials.username}
              >
                Connect
              </button>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="settings-panel">
            <h4>Sync Settings</h4>
            <div className="settings-options">
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.syncProblems}
                  onChange={(e) => setSettings({...settings, syncProblems: e.target.checked})}
                />
                <span>Sync Problems</span>
              </label>
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.syncSubmissions}
                  onChange={(e) => setSettings({...settings, syncSubmissions: e.target.checked})}
                />
                <span>Sync Submissions</span>
              </label>
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.syncContests}
                  onChange={(e) => setSettings({...settings, syncContests: e.target.checked})}
                />
                <span>Sync Contests</span>
              </label>
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                />
                <span>Auto Sync (Daily)</span>
              </label>
            </div>
            <div className="form-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveSettings}
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {platform.connected && !showCredentials && !showSettings && (
        <div className="platform-connection-footer">
          <button 
            className="btn btn-icon"
            onClick={handleSync}
            disabled={syncing}
            title="Sync Now"
          >
            🔄 {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <button 
            className="btn btn-icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️ Settings
          </button>
          <button 
            className="btn btn-icon btn-danger"
            onClick={() => {
              const actualPlatformId = platform.id.replace('temp_', '');
              onDisconnect(actualPlatformId);
            }}
            title="Disconnect"
          >
            🔌 Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default PlatformConnectionCard;
