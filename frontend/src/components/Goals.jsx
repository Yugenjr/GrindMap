import React, { useEffect, useMemo, useState } from 'react';
import GoalCard from './GoalCard';
import AchievementBadge from './AchievementBadge';
import { goalsAPI } from '../utils/api';
import './Goals.css';

const GOAL_TEMPLATES = [
  { title: 'Beginner Sprint', type: 'problems', target: 5, timeframe: 'weekly', difficulty: 'Easy', platform: 'LeetCode' },
  { title: 'Intermediate Momentum', type: 'problems', target: 15, timeframe: 'monthly', difficulty: 'Medium', platform: 'Codeforces' },
  { title: 'Advanced Hard Push', type: 'difficulty', target: 8, timeframe: 'monthly', difficulty: 'Hard', platform: 'All' },
  { title: 'Contest Ready', type: 'contest', target: 2, timeframe: 'monthly', difficulty: 'Any', platform: 'CodeChef' },
];

const QUOTES = [
  'Small wins stack into streaks.',
  'Progress over perfection, always.',
  'Consistency beats intensity.',
  'Show up today so tomorrow is easier.',
  'Every solved problem is a rep for your brain.',
];

const defaultForm = {
  title: '',
  type: 'problems',
  target: 5,
  timeframe: 'weekly',
  platform: 'All',
  difficulty: 'Any',
  description: '',
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const loadGoals = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await goalsAPI.getGoals();
        setGoals(response.data.goals || []);
        setAchievements(response.data.achievements || []);
        setStats(response.data.stats || {});
      } catch (err) {
        console.error('Failed to load goals', err);
        setError('Unable to load goals right now.');
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  const completionRate = useMemo(() => stats.completionRate || 0, [stats]);
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const historyGoals = useMemo(() => goals.filter((g) => g.status === 'completed' || g.status === 'failed'), [goals]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!form.title.trim()) {
        setError('Please add a goal title.');
        return;
      }

      if (editingId) {
        const response = await goalsAPI.updateGoal(editingId, form);
        applyGoalUpdate(response.data.goal, response.data.stats);
      } else {
        const response = await goalsAPI.createGoal(form);
        setGoals((prev) => [...prev, response.data.goal]);
        if (response.data.stats) setStats(response.data.stats);
      }

      setForm(defaultForm);
      setEditingId(null);
      setError('');
    } catch (err) {
      console.error('Save goal failed', err);
      setError('Unable to save goal.');
    }
  };

  const applyGoalUpdate = (updatedGoal, nextStats) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    if (nextStats) setStats(nextStats);
    if (updatedGoal.status === 'completed') {
      setNotification(`Congrats! You completed "${updatedGoal.title}"`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleProgressChange = async (id, progress) => {
    try {
      const payload = progress >= 100 ? { progress, status: 'completed' } : { progress };
      const response = await goalsAPI.updateGoal(id, payload);
      applyGoalUpdate(response.data.goal, response.data.stats);
    } catch (err) {
      console.error('Progress update failed', err);
      setError('Could not update progress.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const response = await goalsAPI.updateGoal(id, { status });
      applyGoalUpdate(response.data.goal, response.data.stats);
    } catch (err) {
      console.error('Status change failed', err);
      setError('Could not update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const response = await goalsAPI.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      if (response.data.stats) setStats(response.data.stats);
    } catch (err) {
      console.error('Delete failed', err);
      setError('Could not delete goal.');
    }
  };

  const handleEdit = (goal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      type: goal.type,
      target: goal.target,
      timeframe: goal.timeframe,
      platform: goal.platform,
      difficulty: goal.difficulty,
      description: goal.description || '',
    });
  };

  const handleTemplate = (template) => {
    setForm({ ...form, ...template });
    setEditingId(null);
  };

  const handleMarkDone = (id) => handleProgressChange(id, 100);

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  if (loading) {
    return (
      <div className="goals-loading">
        <div className="spinner" />
        <p>Loading your goals...</p>
      </div>
    );
  }

  return (
    <div className="goals-page">
      <header className="goals-header">
        <div>
          <p className="eyebrow">Goal Engine</p>
          <h1>Goals & Progress Tracker</h1>
          <p className="lede">Set targets, track progress, and celebrate achievements.</p>
        </div>
        <div className="header-actions">
          <div className="quote">{quote}</div>
          {notification && <div className="toast">{notification}</div>}
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="goal-stats">
        <div className="stat-card">
          <p className="stat-label">Completion Rate</p>
          <p className="stat-value">{completionRate}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active Goals</p>
          <p className="stat-value">{stats.active || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Completed</p>
          <p className="stat-value">{stats.completed || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Streak Days</p>
          <p className="stat-value">{stats.streakDays || 0}</p>
        </div>
      </section>

      <section className="goal-form-card">
        <div className="form-header">
          <div>
            <p className="eyebrow">Create goal</p>
            <h2>{editingId ? 'Edit Goal' : 'New Goal'}</h2>
          </div>
          <div className="template-row">
            {GOAL_TEMPLATES.map((template) => (
              <button key={template.title} type="button" className="ghost-button" onClick={() => handleTemplate(template)}>
                {template.title}
              </button>
            ))}
          </div>
        </div>

        <form className="goal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Weekly grind, streak, or contest goal"
                required
              />
            </label>
            <label>
              <span>Goal Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="problems">Problems solved</option>
                <option value="streak">Streak days</option>
                <option value="difficulty">Specific difficulty</option>
                <option value="contest">Contest participation</option>
              </select>
            </label>
            <label>
              <span>Target</span>
              <input
                type="number"
                min="1"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
              />
            </label>
            <label>
              <span>Timeframe</span>
              <select value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              <span>Platform</span>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                <option value="All">All</option>
                <option value="LeetCode">LeetCode</option>
                <option value="Codeforces">Codeforces</option>
                <option value="CodeChef">CodeChef</option>
                <option value="HackerRank">HackerRank</option>
                <option value="AtCoder">AtCoder</option>
              </select>
            </label>
            <label>
              <span>Difficulty</span>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="Any">Any</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
          </div>
          <label className="full-width">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add context or success criteria"
              rows={3}
            />
          </label>

          <div className="form-actions">
            {editingId && (
              <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(defaultForm); }}>
                Cancel edit
              </button>
            )}
            <button type="submit" className="primary-button">{editingId ? 'Update Goal' : 'Create Goal'}</button>
          </div>
        </form>
      </section>

      <section className="goals-list">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Active goals</p>
            <h2>Stay on track</h2>
          </div>
        </div>

        {activeGoals.length === 0 ? (
          <div className="empty-state">
            <h3>No active goals</h3>
            <p>Set a goal to start tracking progress.</p>
          </div>
        ) : (
          <div className="goal-grid">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onProgressChange={handleProgressChange}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onMarkDone={handleMarkDone}
              />
            ))}
          </div>
        )}
      </section>

      <section className="achievements">
        <div className="section-heading">
          <p className="eyebrow">Achievements</p>
          <h2>Badges</h2>
        </div>
        <div className="badge-grid">
          {achievements.map((badge) => (
            <AchievementBadge key={badge.id} badge={badge} />
          ))}
        </div>
      </section>

      <section className="goal-history">
        <div className="section-heading">
          <p className="eyebrow">History</p>
          <h2>Completion log</h2>
        </div>
        {historyGoals.length === 0 ? (
          <p className="muted">No completed goals yet.</p>
        ) : (
          <ul className="history-list">
            {historyGoals.map((goal) => (
              <li key={goal.id}>
                <span>{goal.title}</span>
                <span className={`status-badge status-${goal.status}`}>{goal.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Goals;
