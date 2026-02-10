import React, { useState, useEffect } from 'react';
import PlatformConnectionCard from './PlatformConnectionCard';
import { platformAPI } from '../utils/api';
import './PlatformManager.css';

const PlatformManager = () => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availablePlatforms] = useState([
    { id: 'leetcode', name: 'LeetCode', requiresApiKey: false, requiresToken: false },
    { id: 'codeforces', name: 'Codeforces', requiresApiKey: true, requiresToken: false },
    { id: 'hackerrank', name: 'HackerRank', requiresApiKey: true, requiresToken: false },
    { id: 'codechef', name: 'CodeChef', requiresApiKey: false, requiresToken: false },
    { id: 'github', name: 'GitHub', requiresApiKey: false, requiresToken: true },
    { id: 'atcoder', name: 'AtCoder', requiresApiKey: false, requiresToken: false },
    { id: 'topcoder', name: 'TopCoder', requiresApiKey: true, requiresToken: false },
  ]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const response = await platformAPI.getPlatforms();
      setPlatforms(response.data.platforms || []);
    } catch (error) {
      console.error('Error loading platforms:', error);
      showNotification('Failed to load platforms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platformId, credentials) => {
    try {
      // Extract the actual platform ID from temp IDs
      const actualPlatformId = platformId.replace('temp_', '');
      const response = await platformAPI.connectPlatform(actualPlatformId, credentials);
      showNotification(`Successfully connected to ${response.data.platform.name || 'platform'}`, 'success');
      await loadPlatforms();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to connect platform', 'error');
      // Remove temporary platform on connection failure
      setPlatforms(platforms.filter(p => p.id !== platformId));
    }
  };

  const handleDisconnect = async (platformId) => {
    if (!window.confirm('Are you sure you want to disconnect this platform?')) {
      return;
    }

    try {
      await platformAPI.disconnectPlatform(platformId);
      showNotification('Platform disconnected successfully', 'success');
      await loadPlatforms();
    } catch (error) {
      showNotification('Failed to disconnect platform', 'error');
    }
  };

  const handleTest = async (platformId, credentials) => {
    try {
      const response = await platformAPI.testConnection(platformId, credentials);
      if (response.data.success) {
        showNotification('Connection test successful!', 'success');
      } else {
        showNotification(response.data.message || 'Connection test failed', 'error');
      }
    } catch (error) {
      showNotification('Connection test failed', 'error');
    }
  };

  const handleSync = async (platformId) => {
    try {
      const response = await platformAPI.syncPlatform(platformId);
      showNotification(`Synced ${response.data.synced} items successfully`, 'success');
      await loadPlatforms();
    } catch (error) {
      showNotification('Sync failed', 'error');
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const connectedPlatforms = platforms.filter(p => p.connected);
      let successCount = 0;
      
      for (const platform of connectedPlatforms) {
        try {
          await platformAPI.syncPlatform(platform.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync ${platform.name}:`, error);
        }
      }

      showNotification(`Synced ${successCount} of ${connectedPlatforms.length} platforms`, 'success');
      await loadPlatforms();
    } catch (error) {
      showNotification('Failed to sync all platforms', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleUpdateSettings = async (platformId, settings) => {
    try {
      await platformAPI.updateSettings(platformId, settings);
      showNotification('Settings updated successfully', 'success');
      await loadPlatforms();
    } catch (error) {
      showNotification('Failed to update settings', 'error');
    }
  };

  const handleAddPlatform = async (platformConfig) => {
    try {
      // Create a temporary platform entry for the new platform
      const newPlatform = {
        id: `temp_${platformConfig.id}`,
        platformId: platformConfig.id,
        name: platformConfig.name,
        username: '',
        connected: false,
        status: 'disconnected',
        lastSync: null,
        problemsSynced: 0,
        lastSyncError: null,
        syncing: false,
        requiresApiKey: platformConfig.requiresApiKey,
        requiresToken: platformConfig.requiresToken,
        settings: {
          syncProblems: true,
          syncSubmissions: true,
          syncContests: false,
          autoSync: true,
        },
      };
      
      // Add the temporary platform to the list
      setPlatforms([...platforms, newPlatform]);
      setSelectedPlatform(null);
      setShowAddModal(false);
      showNotification(`Ready to connect ${platformConfig.name}. Scroll down to see the form.`, 'info');
    } catch (error) {
      showNotification('Error adding platform', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getConnectedCount = () => platforms.filter(p => p.connected).length;
  const getTotalSynced = () => platforms.reduce((sum, p) => sum + (p.problemsSynced || 0), 0);

  const getAvailableToAdd = () => {
    const connectedIds = platforms.map(p => p.platformId);
    return availablePlatforms.filter(p => !connectedIds.includes(p.id));
  };

  if (loading) {
    return (
      <div className="platform-manager-loading">
        <div className="spinner"></div>
        <p>Loading platforms...</p>
      </div>
    );
  }

  return (
    <div className="platform-manager-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="platform-manager-header">
        <div className="header-content">
          <h1>Platform Connections</h1>
          <p>Manage your coding platform accounts and sync settings</p>
        </div>
      </div>

      <div className="platform-stats">
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-info">
            <span className="stat-value">{getConnectedCount()}</span>
            <span className="stat-label">Connected Platforms</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{getTotalSynced()}</span>
            <span className="stat-label">Total Problems Synced</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <span className="stat-value">{platforms.length}</span>
            <span className="stat-label">Total Platforms</span>
          </div>
        </div>
      </div>

      <div className="platform-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          disabled={getAvailableToAdd().length === 0}
        >
          ➕ Add Platform
        </button>
        <button 
          className="btn btn-outline"
          onClick={handleSyncAll}
          disabled={syncingAll || getConnectedCount() === 0}
        >
          {syncingAll ? '🔄 Syncing All...' : '🔄 Sync All'}
        </button>
        <button 
          className="btn btn-secondary"
          onClick={loadPlatforms}
        >
          🔃 Refresh
        </button>
      </div>

      <div className="platforms-grid">
        {platforms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔌</div>
            <h3>No platforms connected</h3>
            <p>Add your first coding platform to start syncing your progress</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Add Platform
            </button>
          </div>
        ) : (
          platforms.map(platform => (
            <PlatformConnectionCard
              key={platform.id}
              platform={platform}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onTest={handleTest}
              onSync={handleSync}
              onUpdateSettings={handleUpdateSettings}
            />
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Platform</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="platform-options">
                {getAvailableToAdd().map(platform => (
                  <div
                    key={platform.id}
                    className="platform-option"
                    onClick={() => handleAddPlatform(platform)}
                  >
                    <span className="platform-option-name">{platform.name}</span>
                    <span className="platform-option-arrow">→</span>
                  </div>
                ))}
                {getAvailableToAdd().length === 0 && (
                  <p className="no-platforms">All available platforms are already added</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformManager;
