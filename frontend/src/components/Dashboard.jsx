import React, { useState, lazy, Suspense } from "react";
import "../App.css";
import CircularProgress from "./CircularProgress";

import DemoPage from "./DemoPage";
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"));
const BadgeCollection = lazy(() => import("./BadgeCollection"));
import UsernameInputs from "./UsernameInputs";
import PlatformCard from "./PlatformCard";
import LoadingFallback from "./LoadingFallback";
import { useGrindMapData } from "../hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "../utils/platforms";

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
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <button
              onClick={() => setShowDemo(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              View Demo
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              View Analytics
            </button>
            <button
              onClick={() => setShowBadges(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#9b59b6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
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