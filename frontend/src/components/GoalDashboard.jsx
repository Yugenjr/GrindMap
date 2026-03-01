import React, { useState, useEffect } from 'react';
import GoalCard from './GoalCard';
import './GoalDashboard.css';

const GoalDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchGoals();
    fetchTemplates();
    fetchStats();
  }, []);

  const fetchGoals = async (status = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = status ? `/api/goals?status=${status}` : '/api/goals';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/goals/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId, newValue, note = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newValue, note })
      });

      if (response.ok) {
        await fetchGoals();
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleEditGoal = (goal) => {
    // TODO: Implement edit functionality
    console.log('Edit goal:', goal);
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchGoals();
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId,
          customizations: {
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            priority: 'medium',
            reminderFrequency: 'weekly'
          }
        })
      });

      if (response.ok) {
        await fetchGoals();
        await fetchStats();
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create goal from template:', error);
    }
  };

  const filteredGoals = goals.filter(goal => {
    switch (activeTab) {
      case 'active': return goal.status === 'active';
      case 'completed': return goal.status === 'completed';
      case 'overdue': return goal.isOverdue;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="goal-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your goals...</p>
      </div>
    );
  }

  return (
    <div className="goal-dashboard">
      <div className="goal-header">
        <h1>🎯 Goal Dashboard</h1>
        <div className="goal-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.activeGoals || 0}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.completedGoals || 0}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Math.round(stats.completionRate || 0)}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.overdueGoals || 0}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      <div className="goal-controls">
        <div className="goal-tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active ({goals.filter(g => g.status === 'active').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({goals.filter(g => g.status === 'completed').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue ({goals.filter(g => g.isOverdue).length})
          </button>
        </div>

        <button
          className="create-goal-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-goal-form">
          <h3>Choose a Goal Template</h3>
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template._id} className="template-card">
                <div className="template-icon">
                  {template.category === 'problems' && '🎯'}
                  {template.category === 'rating' && '📈'}
                  {template.category === 'streak' && '🔥'}
                  {template.category === 'time' && '⚡'}
                  {template.category === 'consistency' && '📅'}
                </div>
                <h4>{template.title}</h4>
                <p>{template.description}</p>
                <div className="template-meta">
                  <span className={`difficulty ${template.difficulty}`}>
                    {template.difficulty}
                  </span>
                  <span className="duration">{template.estimatedDuration} days</span>
                  <span className="reward">{template.reward.points} pts</span>
                </div>
                <button
                  className="select-template-btn"
                  onClick={() => handleCreateFromTemplate(template._id)}
                >
                  Select This Goal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="goals-list">
        {filteredGoals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No goals found</h3>
            <p>
              {activeTab === 'active' && "You don't have any active goals. Create your first goal to get started!"}
              {activeTab === 'completed' && "You haven't completed any goals yet. Keep working towards your targets!"}
              {activeTab === 'overdue' && "Great job! No overdue goals at the moment."}
            </p>
            {activeTab === 'active' && (
              <button
                className="create-first-goal-btn"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Goal
              </button>
            )}
          </div>
        ) : (
          filteredGoals.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onUpdateProgress={handleUpdateProgress}
              onEdit={() => handleEditGoal(goal)}
              onDelete={() => handleDeleteGoal(goal._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GoalDashboard;