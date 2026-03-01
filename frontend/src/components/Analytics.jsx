import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import HeatmapChart from './charts/HeatmapChart';
import { analyticsAPI } from '../utils/api';
import './Analytics.css';

const RANGE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This year', value: '1y' },
  { label: 'Custom', value: 'custom' },
];

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangePreset, setRangePreset] = useState('30d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const reportRef = useRef(null);
  const trendRef = useRef(null);
  const difficultyRef = useRef(null);
  const platformRef = useRef(null);
  const languageRef = useRef(null);
  const speedRef = useRef(null);
  const successRef = useRef(null);
  const comparisonRef = useRef(null);
  const heatmapRef = useRef(null);

  const buildRangeParams = () => {
    if (rangePreset === 'custom' && customRange.start && customRange.end) {
      return {
        startDate: new Date(customRange.start).toISOString(),
        endDate: new Date(customRange.end).toISOString(),
      };
    }

    const end = new Date();
    const start = new Date();

    switch (rangePreset) {
      case '7d':
        start.setDate(end.getDate() - 6);
        break;
      case '30d':
        start.setDate(end.getDate() - 29);
        break;
      case '90d':
        start.setDate(end.getDate() - 89);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const params = buildRangeParams();
        const response = await analyticsAPI.getOverview(params);
        setAnalytics(response.data);
      } catch (err) {
        console.error('Unable to load analytics', err);
        setError('Unable to load analytics right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [rangePreset, customRange.start, customRange.end]);

  const summaryCards = useMemo(() => ([
    {
      label: 'Total Solved',
      value: analytics?.summary?.totalSolved ?? 0,
      hint: 'Across all platforms',
    },
    {
      label: 'Success Rate',
      value: `${analytics?.summary?.successRate ?? 0}%`,
      hint: 'Solved vs attempts',
    },
    {
      label: 'Avg Solve Time',
      value: `${analytics?.summary?.avgTime ?? 0} mins`,
      hint: 'Per solved problem',
    },
    {
      label: 'Fastest Solve',
      value: `${analytics?.summary?.fastestSolve ?? 0} mins`,
      hint: 'Personal best',
    },
    {
      label: 'Languages Used',
      value: analytics?.summary?.languagesUsed ?? 0,
      hint: 'Language diversity',
    },
    {
      label: 'Platforms Tracked',
      value: analytics?.summary?.platformCount ?? 0,
      hint: 'Connections in scope',
    },
    {
      label: 'Peak Hour',
      value: analytics?.summary?.peakHour ?? 'N/A',
      hint: 'Most active time',
    },
    {
      label: 'Total Attempts',
      value: analytics?.summary?.totalAttempts ?? 0,
      hint: 'Including retries',
    },
  ]), [analytics]);

  const handleExport = async (ref, filename) => {
    if (!ref?.current) return;
    try {
      const dataUrl = await toPng(ref.current, { backgroundColor: '#f8fafc' });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      setError('Export failed. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePresetChange = (value) => {
    setRangePreset(value);
    if (value !== 'custom') {
      setCustomRange({ start: '', end: '' });
    }
  };

  const trends = analytics?.trends || {};
  const difficultyDistribution = analytics?.difficultyDistribution || [];
  const platformComparison = analytics?.platformComparison || [];
  const languageUsage = analytics?.languageUsage || [];
  const speedMetrics = analytics?.speedMetrics?.averageSolveTimeByWeek || [];
  const successRateByDifficultyOverTime = analytics?.successRateByDifficultyOverTime || [];
  const progressComparison = analytics?.progressComparison?.monthly || [];
  const productivityHeatmap = analytics?.productivityHeatmap || [];

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Building your analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page" ref={reportRef}>
      <header className="analytics-header no-print">
        <div>
          <p className="eyebrow">Performance Intelligence</p>
          <h1>Analytics & Insights</h1>
          <p className="lede">Visualize your coding patterns, strengths, and trajectory with a multi-angle dashboard.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={() => handleExport(reportRef, 'analytics-report')}>
            Export Report
          </button>
          <button type="button" className="primary-button" onClick={handlePrint}>
            Print View
          </button>
        </div>
      </header>

      <section className="analytics-filters no-print">
        <div className="filter-group">
          <label htmlFor="range">Date Range</label>
          <select id="range" value={rangePreset} onChange={(e) => handlePresetChange(e.target.value)}>
            {RANGE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        {rangePreset === 'custom' && (
          <div className="custom-range">
            <div className="filter-group">
              <label htmlFor="start">Start</label>
              <input
                id="start"
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="end">End</label>
              <input
                id="end"
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        )}
      </section>

      {error && <div className="analytics-error">{error}</div>}

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <div className="summary-card" key={card.label}>
            <p className="summary-label">{card.label}</p>
            <p className="summary-value">{card.value}</p>
            <p className="summary-hint">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="analytics-grid">
        <LineChart
          title="Time-based Trends"
          description="Daily solved count and success rate across the selected window."
          data={(trends.daily || []).map((item) => ({ ...item, successRate: item.successRate || 0 }))}
          xKey="label"
          lines={[
            { dataKey: 'solved', color: '#2563eb' },
            { dataKey: 'successRate', color: '#f97316' },
          ]}
          containerRef={trendRef}
          onExport={() => handleExport(trendRef, 'time-trends')}
        />

        <BarChart
          title="Difficulty Distribution"
          description="How attempts and solves break down by problem difficulty."
          data={difficultyDistribution}
          xKey="difficulty"
          bars={[
            { dataKey: 'solved', color: '#22c55e' },
            { dataKey: 'successRate', color: '#2563eb' },
          ]}
          stacked={false}
          containerRef={difficultyRef}
          onExport={() => handleExport(difficultyRef, 'difficulty-distribution')}
        />

        <BarChart
          title="Platform Comparison"
          description="Solved volume, success rate, and average time per platform."
          data={platformComparison}
          xKey="platform"
          bars={[
            { dataKey: 'solved', color: '#6366f1' },
            { dataKey: 'successRate', color: '#f97316' },
          ]}
          containerRef={platformRef}
          onExport={() => handleExport(platformRef, 'platform-comparison')}
        />

        <PieChart
          title="Language Usage"
          description="Share of submissions by programming language."
          data={languageUsage}
          containerRef={languageRef}
          onExport={() => handleExport(languageRef, 'language-usage')}
        />

        <LineChart
          title="Success Rate by Difficulty"
          description="Success trends for each difficulty over time."
          data={successRateByDifficultyOverTime}
          xKey="period"
          lines={[
            { dataKey: 'easy', color: '#22c55e' },
            { dataKey: 'medium', color: '#f59e0b' },
            { dataKey: 'hard', color: '#ef4444' },
          ]}
          containerRef={successRef}
          onExport={() => handleExport(successRef, 'success-by-difficulty')}
        />

        <LineChart
          title="Problem-Solving Speed"
          description="Average minutes to solve over recent weeks."
          data={speedMetrics}
          xKey="week"
          lines={[{ dataKey: 'minutes', color: '#0ea5e9', fill: '#cffafe' }]}
          referenceLines={[{ y: 45, label: 'Goal', color: '#94a3b8' }]}
          containerRef={speedRef}
          onExport={() => handleExport(speedRef, 'speed-trend')}
        />

        <LineChart
          title="Monthly Progress"
          description="Solved count and success rate month over month."
          data={progressComparison}
          xKey="label"
          lines={[
            { dataKey: 'solved', color: '#22c55e' },
            { dataKey: 'successRate', color: '#2563eb' },
          ]}
          containerRef={comparisonRef}
          onExport={() => handleExport(comparisonRef, 'monthly-progress')}
        />

        <HeatmapChart
          title="Peak Productivity Hours"
          description="Heatmap of submission intensity by weekday and hour."
          data={productivityHeatmap}
          containerRef={heatmapRef}
          onExport={() => handleExport(heatmapRef, 'productivity-heatmap')}
        />
      </section>
    </div>
  );
};

export default Analytics;
