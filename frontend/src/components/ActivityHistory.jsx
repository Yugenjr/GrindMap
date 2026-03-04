import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityAPI } from '../utils/api';
import ActivityCard from './ActivityCard';
import Timeline from './Timeline';
import './ActivityHistory.css';

const ActivityHistory = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'timeline', 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    platform: 'all',
    difficulty: 'all',
    status: 'all',
    dateRange: 'all', // all, today, week, month, custom
    startDate: '',
    endDate: '',
  });

  // Statistics
  const [stats, setStats] = useState({
    totalProblems: 0,
    solvedToday: 0,
    solvedThisWeek: 0,
    solvedThisMonth: 0,
    currentStreak: 0,
    longestStreak: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byPlatform: {},
  });

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, filters, searchQuery]);

  const loadActivities = async () => {
    try {
      const response = await activityAPI.getActivities();
      const activitiesData = response.data.activities || [];
      setActivities(activitiesData);
      calculateStatistics(activitiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoading(false);
    }
  };

  const calculateStatistics = (activitiesData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const solved = activitiesData.filter(a => a.status === 'Solved');
    
    const byDifficulty = {
      easy: solved.filter(a => a.difficulty?.toLowerCase() === 'easy').length,
      medium: solved.filter(a => a.difficulty?.toLowerCase() === 'medium').length,
      hard: solved.filter(a => a.difficulty?.toLowerCase() === 'hard').length,
    };

    const byPlatform = {};
    solved.forEach(activity => {
      const platform = activity.platform || 'Unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    });

    const solvedToday = solved.filter(a => new Date(a.date) >= today).length;
    const solvedThisWeek = solved.filter(a => new Date(a.date) >= weekAgo).length;
    const solvedThisMonth = solved.filter(a => new Date(a.date) >= monthAgo).length;

    // Calculate streak
    const sortedDates = [...new Set(solved.map(a => new Date(a.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      
      if (date.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      tempStreak = 1;
      for (let j = i + 1; j < sortedDates.length; j++) {
        const curr = new Date(sortedDates[j - 1]);
        const next = new Date(sortedDates[j]);
        const diff = (curr - next) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    setStats({
      totalProblems: solved.length,
      solvedToday,
      solvedThisWeek,
      solvedThisMonth,
      currentStreak,
      longestStreak,
      byDifficulty,
      byPlatform,
    });
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.problemName?.toLowerCase().includes(query) ||
        activity.platform?.toLowerCase().includes(query) ||
        activity.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Platform filter
    if (filters.platform !== 'all') {
      filtered = filtered.filter(a => a.platform?.toLowerCase() === filters.platform.toLowerCase());
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(a => a.difficulty?.toLowerCase() === filters.difficulty.toLowerCase());
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(a => a.status?.toLowerCase() === filters.status.toLowerCase());
    }

    // Date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(a => new Date(a.date) >= today);
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(a => new Date(a.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(a => new Date(a.date) >= monthAgo);
        break;
      case 'custom':
        if (filters.startDate) {
          filtered = filtered.filter(a => new Date(a.date) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
          filtered = filtered.filter(a => new Date(a.date) <= new Date(filters.endDate));
        }
        break;
      default:
        break;
    }

    setFilteredActivities(filtered);
  };

  const handleExport = async (format) => {
    try {
      const dataToExport = filteredActivities.map(activity => ({
        date: activity.date,
        platform: activity.platform,
        problemName: activity.problemName,
        difficulty: activity.difficulty,
        status: activity.status,
        timeSpent: activity.timeSpent,
        language: activity.language,
        tags: activity.tags?.join(', '),
      }));

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-history-${Date.now()}.json`;
        a.click();
      } else if (format === 'csv') {
        const headers = ['Date', 'Platform', 'Problem', 'Difficulty', 'Status', 'Time Spent', 'Language', 'Tags'];
        const csvData = [
          headers.join(','),
          ...dataToExport.map(row => [
            row.date,
            row.platform,
            `"${row.problemName}"`,
            row.difficulty,
            row.status,
            row.timeSpent || '',
            row.language || '',
            `"${row.tags || ''}"`,
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-history-${Date.now()}.csv`;
        a.click();
      }

      setSuccessMessage(`Exported ${filteredActivities.length} activities as ${format.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to export data');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const renderCalendarHeatmap = () => {
    const months = 12;
    const weeks = [];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // Generate weeks grid
    for (let i = 0; i < months * 4; i++) {
      const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekDays = [];
      
      for (let j = 0; j < 7; j++) {
        const day = new Date(weekStart.getTime() + j * 24 * 60 * 60 * 1000);
        const dayActivities = activities.filter(a => 
          new Date(a.date).toDateString() === day.toDateString() && a.status === 'Solved'
        );
        weekDays.push({
          date: day,
          count: dayActivities.length,
        });
      }
      weeks.push(weekDays);
    }

    const getHeatmapColor = (count) => {
      if (count === 0) return '#ebedf0';
      if (count === 1) return '#9be9a8';
      if (count <= 3) return '#40c463';
      if (count <= 5) return '#30a14e';
      return '#216e39';
    };

    return (
      <div className="calendar-heatmap">
        <h3>Activity Calendar</h3>
        <div className="heatmap-container">
          <div className="heatmap-months">
            {Array.from({ length: months }, (_, i) => {
              const month = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
              return (
                <div key={i} className="heatmap-month">
                  {month.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              );
            })}
          </div>
          <div className="heatmap-grid">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="heatmap-day"
                    style={{ backgroundColor: getHeatmapColor(day.count) }}
                    title={`${day.date.toLocaleDateString()}: ${day.count} problems`}
                  >
                    <span className="heatmap-day-tooltip">
                      {day.date.toLocaleDateString()}<br />
                      {day.count} {day.count === 1 ? 'problem' : 'problems'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="legend-item" style={{ backgroundColor: '#ebedf0' }}></div>
            <div className="legend-item" style={{ backgroundColor: '#9be9a8' }}></div>
            <div className="legend-item" style={{ backgroundColor: '#40c463' }}></div>
            <div className="legend-item" style={{ backgroundColor: '#30a14e' }}></div>
            <div className="legend-item" style={{ backgroundColor: '#216e39' }}></div>
            <span>More</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="activity-loading">
        <div className="spinner"></div>
        <p>Loading activity history...</p>
      </div>
    );
  }

  return (
    <div className="activity-history-container">
      <div className="activity-header">
        <h1>Activity History</h1>
        <p>Track your coding journey over time</p>
      </div>

      {/* Messages */}
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

      {/* Statistics Summary */}
      <div className="activity-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalProblems}</h3>
            <p>Total Solved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.solvedToday}</h3>
            <p>Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.solvedThisWeek}</h3>
            <p>This Week</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.currentStreak}</h3>
            <p>Current Streak</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.longestStreak}</h3>
            <p>Longest Streak</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📆</div>
          <div className="stat-content">
            <h3>{stats.solvedThisMonth}</h3>
            <p>This Month</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="activity-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search problems, platforms, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <select
            value={filters.platform}
            onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Platforms</option>
            <option value="leetcode">LeetCode</option>
            <option value="codeforces">Codeforces</option>
            <option value="codechef">CodeChef</option>
            <option value="hackerrank">HackerRank</option>
            <option value="github">GitHub</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="solved">Solved</option>
            <option value="attempted">Attempted</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {filters.dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="date-input"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="date-input"
              />
            </>
          )}
        </div>

        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Card View"
          >
            📋
          </button>
          <button
            className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Timeline View"
          >
            📅
          </button>
          <button
            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            title="Calendar View"
          >
            🗓️
          </button>
        </div>

        <div className="export-controls">
          <button className="export-btn" onClick={() => handleExport('json')}>
            Export JSON
          </button>
          <button className="export-btn" onClick={() => handleExport('csv')}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredActivities.length}</strong> of <strong>{activities.length}</strong> activities
        </p>
      </div>

      {/* Content Views */}
      <div className="activity-content">
        {viewMode === 'cards' && (
          <div className="activity-cards-grid">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                <ActivityCard key={index} activity={activity} />
              ))
            ) : (
              <div className="no-activities">
                <p>No activities found matching your filters</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'timeline' && (
          <Timeline activities={filteredActivities} />
        )}

        {viewMode === 'calendar' && (
          renderCalendarHeatmap()
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;
