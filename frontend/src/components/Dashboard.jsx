import React, { useState, lazy, Suspense } from "react";
import "../App.css";
import styles from "./Dashboard.module.css";
import CircularProgress from "./CircularProgress";

import DemoPage from "./DemoPage";
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"));
const BadgeCollection = lazy(() => import("./BadgeCollection"));
const GoalList = lazy(() => import("./GoalList"));
const GoalSetting = lazy(() => import("./GoalSetting"));
import UsernameInputs from "./UsernameInputs";
import PlatformCard from "./PlatformCard";
import LoadingFallback from "./LoadingFallback";
import { useGrindMapData } from "../hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "../utils/platforms";

// Progress History Component
const ProgressHistory = ({ platformData, totalSolved }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/user/progress-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to load progress history:', error);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className={styles.progressHistory}>
      <h3>Progress History</h3>
      {loading ? (
        <p>Loading history...</p>
      ) : (
        <div className={styles.historyStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Days Tracked</span>
            <span className={styles.statValue}>{history.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Current Streak</span>
            <span className={styles.statValue}>
              {history.filter(h => h.submittedToday).length > 0 ? 'Active' : '0'}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Best Streak</span>
            <span className={styles.statValue}>
              {Math.max(...history.map(h => h.data?.solved || 0), 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

function Dashboard() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [activityCollapsed, setActivityCollapsed] = useState(false);

  const {
    usernames,
    platformData,
    loading,
    totalSolved,
    handleChange,
    fetchAll,
    getPlatformPercentage,
    hasSubmittedToday,
  } = useGrindMapData();

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  // Today's Activity Logic
  const today = new Date();

  return (
    <div className="app">
      {showDemo ? (
        <>
          <DemoPage onBack={() => setShowDemo(false)} />
        </>
      ) : showAnalytics ? (
        <>
          <button onClick={() => setShowAnalytics(false)} className="back-btn">
            ← Back to Main
          </button>
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsDashboard platformData={platformData} />
          </Suspense>
        </>
      ) : showBadges ? (
        <>
          <button onClick={() => setShowBadges(false)} className="back-btn">
            ← Back to Main
          </button>
          <Suspense fallback={<LoadingFallback />}>
            <BadgeCollection />
          </Suspense>
        </>
      ) : (
        <>
          <div className={styles.buttonContainer}>
            <button
              onClick={() => setShowDemo(true)}
              className={styles.demoButton}
            >
              View Demo
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className={styles.analyticsButton}
            >
              View Analytics
            </button>
            <button
              onClick={() => setShowBadges(true)}
              className={styles.achievementsButton}
            >
              🏆 Achievements
            </button>
          </div>
          <h1>GrindMap</h1>

          <UsernameInputs
            usernames={usernames}
            onChange={handleChange}
            onFetch={fetchAll}
            loading={loading}
          />

          <div className="overall">
            <h2>Overall Progress</h2>
            <CircularProgress
              solved={totalSolved}
              goal={OVERALL_GOAL}
              color="#4caf50"
            />
            <p>
              {totalSolved} / {OVERALL_GOAL} problems solved
            </p>
          </div>

          <div className="platforms-grid">
            {PLATFORMS.map((plat) => (
              <PlatformCard
                key={plat.key}
                platform={plat}
                data={platformData[plat.key]}
                expanded={expanded}
                onToggle={toggleExpand}
                percentage={getPlatformPercentage(plat.key)}
              />
            ))}
          </div>

          {/* Progress History */}
          <ProgressHistory platformData={platformData} totalSolved={totalSolved} />

          {/* Today's Activity */}
          <div className="today-activity">
            <div className="activity-header">
              <h2>
                Today's Activity (
                {today.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                )
              </h2>
              <button
                className="activity-toggle-btn"
                onClick={() => setActivityCollapsed(!activityCollapsed)}
                aria-label={activityCollapsed ? "Expand Today's Activity" : "Collapse Today's Activity"}
              >
                {activityCollapsed ? "▼" : "▲"}
              </button>
            </div>
            {!activityCollapsed && (
              <div className="activity-list">
                {PLATFORMS.map((plat) => {
                  const submittedToday = hasSubmittedToday(plat.key);
                  const hasData =
                    platformData[plat.key] && !platformData[plat.key].error;

                  return (
                    <div
                      key={plat.key}
                      className={`activity-item ${submittedToday ? "done" : hasData ? "active-no-sub" : "missed"}`}
                    >
                      <span>{plat.name}</span>
                      <span>
                        {submittedToday
                          ? "✅ Coded Today"
                          : hasData
                            ? "✅ Active (No submission today)"
                            : "❌ No Data"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;