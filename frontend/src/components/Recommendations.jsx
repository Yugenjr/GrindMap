import React, { useEffect, useMemo, useState } from 'react';
import ProblemRecommendationCard from './ProblemRecommendationCard';
import TopicWeaknessChart from './TopicWeaknessChart';
import { recommendationsAPI } from '../utils/api';
import './Recommendations.css';

const defaultFilters = {
  difficulty: 'all',
  platform: 'all',
  topics: '',
  mode: 'mixed',
};

const Recommendations = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [recommendations, setRecommendations] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [practiceList, setPracticeList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const parsedTopics = useMemo(
    () => filters.topics.split(',').map((t) => t.trim()).filter(Boolean),
    [filters.topics]
  );

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await recommendationsAPI.getRecommendations({
        difficulty: filters.difficulty,
        platform: filters.platform,
        topics: parsedTopics,
        mode: filters.mode,
        limit: 15,
      });
      setRecommendations(response.data.recommendations || []);
      setWeakTopics(response.data.weakTopics || []);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to load recommendations', err);
      setError('Unable to load recommendations right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.difficulty, filters.platform, filters.topics, filters.mode, refreshKey]);

  const handleBookmark = async (id) => {
    try {
      await recommendationsAPI.bookmark(id);
      setRecommendations((prev) => prev.map((item) => (
        item.id === id ? { ...item, bookmarked: true } : item
      )));
    } catch (err) {
      console.error('Bookmark failed', err);
    }
  };

  const handleSkip = async (id) => {
    try {
      await recommendationsAPI.skip(id);
      setRecommendations((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Skip failed', err);
    }
  };

  const handleAddToList = (problem) => {
    setPracticeList((prev) => {
      if (prev.find((p) => p.id === problem.id)) return prev;
      return [...prev, problem];
    });
  };

  const refresh = () => setRefreshKey((x) => x + 1);

  if (loading) {
    return (
      <div className="recs-loading">
        <div className="spinner" />
        <p>Building your recommendations...</p>
      </div>
    );
  }

  return (
    <div className="recs-page">
      <header className="recs-header">
        <div>
          <p className="eyebrow">Smart suggestions</p>
          <h1>Problem Recommendations</h1>
          <p className="lede">Practice weak areas, level up, and keep momentum.</p>
        </div>
        <div className="recs-actions">
          <button type="button" className="ghost-button" onClick={refresh}>Refresh</button>
        </div>
      </header>

      {error && <div className="recs-alert">{error}</div>}

      <section className="recs-filters">
        <label>
          <span>Difficulty</span>
          <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
            <option value="all">All</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label>
          <span>Platform</span>
          <select value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })}>
            <option value="all">All</option>
            <option value="LeetCode">LeetCode</option>
            <option value="Codeforces">Codeforces</option>
            <option value="CodeChef">CodeChef</option>
            <option value="HackerRank">HackerRank</option>
          </select>
        </label>
        <label>
          <span>Topics (comma separated)</span>
          <input
            type="text"
            value={filters.topics}
            onChange={(e) => setFilters({ ...filters, topics: e.target.value })}
            placeholder="dp, graphs, strings"
          />
        </label>
        <label>
          <span>Mode</span>
          <select value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })}>
            <option value="mixed">Balanced</option>
            <option value="weak">Practice weak areas</option>
            <option value="level-up">Level up</option>
            <option value="review">Review similar problems</option>
          </select>
        </label>
      </section>

      <section className="recs-panels">
        <div className="recs-panel">
          <div className="section-heading">
            <p className="eyebrow">Recommendations</p>
            <h2>Curated problems</h2>
          </div>
          {recommendations.length === 0 ? (
            <div className="empty-state">
              <h3>No matches</h3>
              <p>Try relaxing filters or refreshing.</p>
            </div>
          ) : (
            <div className="recs-grid">
              {recommendations.map((problem) => (
                <ProblemRecommendationCard
                  key={problem.id}
                  problem={problem}
                  onSkip={handleSkip}
                  onAddToList={handleAddToList}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="recs-sidebar">
          <div className="recs-side-card">
            <TopicWeaknessChart data={weakTopics} />
          </div>

          <div className="recs-side-card">
            <div className="section-heading">
              <p className="eyebrow">Practice list</p>
              <h3>Saved picks ({practiceList.length})</h3>
            </div>
            {practiceList.length === 0 ? (
              <p className="muted">Add problems to build your practice queue.</p>
            ) : (
              <ul className="practice-list">
                {practiceList.map((item) => (
                  <li key={item.id}>
                    <span>{item.title}</span>
                    <span className="rec-badge rec-badge--pill">{item.platform}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="recs-side-card">
            <div className="section-heading">
              <p className="eyebrow">Recent practice</p>
              <h3>History</h3>
            </div>
            {history.length === 0 ? (
              <p className="muted">No recent activity.</p>
            ) : (
              <ul className="history-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <div>
                      <p className="history-title">{item.title}</p>
                      <p className="history-sub">{item.platform} • {item.difficulty}</p>
                    </div>
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Recommendations;
