import React, { useState, lazy, Suspense } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import CircularProgress from "./components/CircularProgress";
import DemoPage from "./components/DemoPage";
import BadgeCollection from "./components/BadgeCollection";
import GoalDashboard from "./components/GoalDashboard";
import UsernameInputs from "./components/UsernameInputs";
import PlatformCard from "./components/PlatformCard";
import ThemeToggle from "./components/ThemeToggle";
import ContributorsHallOfFame from "./components/ContributorsHallOfFame";
import {
  DashboardLayout,
  LoadingSkeleton,
  ErrorState,
} from "./components/dashboard";

import { ThemeProvider } from "./contexts/ThemeContext";
import UserProfile from "./components/UserProfile";
import AuthModal from "./components/AuthModal";
import RepoStats from "./components/RepoStats";
import { useGrindMapData } from "./hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "./utils/platforms";
import ErrorBoundary from "./components/ErrorBoundary";

const AnalyticsDashboard = lazy(
  () => import("./components/AnalyticsDashboard"),
);

function AppContent() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
  const [showHRDashboard, setShowHRDashboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRepoStats, setShowRepoStats] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [user, setUser] = useState(null);

  // Dynamic overall goal with localStorage persistence
  const [overallGoal, setOverallGoal] = useState(() => {
    const savedGoal = localStorage.getItem("overallGoal");
    return savedGoal ? parseInt(savedGoal, 10) : OVERALL_GOAL;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(overallGoal);

  const { isAuthenticated, loading: authLoading } = useAuth();

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

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userName = params.get("name");

    if (token) {
      localStorage.setItem("authToken", token);
      if (userName) localStorage.setItem("userName", userName);
      setUser({ name: userName, token });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem("authToken");
      const storedName = localStorage.getItem("userName");
      if (storedToken) setUser({ name: storedName, token: storedToken });
    }
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/github";
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    setUser(null);
  };

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  const today = new Date();

  const handleGoalEdit = () => {
    setIsEditingGoal(true);
    setTempGoal(overallGoal);
  };

  const handleGoalChange = (e) => {
    setTempGoal(parseInt(e.target.value) || 0);
  };

  const handleGoalSave = () => {
    setOverallGoal(tempGoal);
    localStorage.setItem("overallGoal", tempGoal);
    setIsEditingGoal(false);
  };

  const handleGoalCancel = () => {
    setTempGoal(overallGoal);
    setIsEditingGoal(false);
  };

  if (authLoading) {
    return (
      <div className="app">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  const btnStyle = {
    padding: "0.5rem 1rem",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

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
          <Suspense fallback={<div>Loading analytics...</div>}>
            <AnalyticsDashboard platformData={platformData} />
          </Suspense>
        </>
      ) : showBadges ? (
        <>
          <button onClick={() => setShowBadges(false)} className="back-btn">
            ← Back to Main
          </button>
          <BadgeCollection />
        </>
      ) : showGoals ? (
        <>
          <button onClick={() => setShowGoals(false)} className="back-btn">
            ← Back to Main
          </button>
          <GoalDashboard />
        </>
      ) : showContributors ? (
        <ContributorsHallOfFame onBack={() => setShowContributors(false)} />
      ) : showRepoStats ? (
        <>
          <button onClick={() => setShowRepoStats(false)} className="back-btn">
            ← Back to Main
          </button>
          <RepoStats />
        </>
      ) : showHRDashboard ? (
        <>
          <button
            onClick={() => setShowHRDashboard(false)}
            className="back-btn"
          >
            ← Back to Main
          </button>
          {loading.hackerrank ? (
            <LoadingSkeleton />
          ) : platformData.hackerrank?.error ? (
            <ErrorState
              message={platformData.hackerrank.error}
              onRetry={() => {
                setShowHRDashboard(false);
              }}
            />
          ) : (
            <DashboardLayout
              data={platformData.hackerrank}
              username={usernames.hackerrank}
            />
          )}
        </>
      ) : (
        <>
          {/* Header with Auth */}
          <div className="app-header">
            <h1>GrindMap</h1>
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="auth-trigger-btn"
              >
                Sign In
              </button>
            )}
          </div>

          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(8px)",
              height: "60px",
              borderRadius: "10px",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-evenly",
              padding: "0.5rem 1rem",
            }}
          >
            <button
              onClick={() => setShowAnalytics(true)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={btnStyle}
            >
              View Analytics
            </button>

            <button
              onClick={() => setShowHRDashboard(true)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(46,200,102,0.3)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={{ ...btnStyle, border: "1px solid #2ec866" }}
            >
              🏅 HR Analytics
            </button>

            <button
              onClick={() => setShowBadges(true)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={btnStyle}
            >
              🏆 Achievements
            </button>

            <button
              onClick={() => setShowGoals(true)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={btnStyle}
            >
              🎯 Goals
            </button>
            <button
              onClick={() => setShowContributors(true)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={btnStyle}
            >
              👥 Contributors
            </button>
            <button
              onClick={() => setShowRepoStats(true)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(100,149,237,0.3)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={{ ...btnStyle, border: "1px solid #6495ED" }}
            >
              📊 Repo Stats
            </button>
          </div>

          <ThemeToggle />

          <UsernameInputs
            usernames={usernames}
            onChange={handleChange}
            onFetch={fetchAll}
            loading={loading}
          />

          <div className="overall">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <h2 style={{ margin: 0 }}>Overall Progress</h2>
              {!isEditingGoal && (
                <button
                  onClick={handleGoalEdit}
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.85em",
                    border: "none",
                    background: "rgba(76, 175, 80, 0.2)",
                    color: "#4caf50",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(76, 175, 80, 0.3)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(76, 175, 80, 0.2)")
                  }
                >
                  ✏️ Edit Goal
                </button>
              )}
            </div>

            <CircularProgress
              solved={totalSolved}
              goal={overallGoal}
              color="#4caf50"
            />

            {isEditingGoal ? (
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    value={tempGoal}
                    onChange={handleGoalChange}
                    style={{
                      padding: "8px 12px",
                      fontSize: "1em",
                      borderRadius: "6px",
                      border: "2px solid #4caf50",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "var(--theme-text)",
                      width: "120px",
                      textAlign: "center",
                    }}
                    autoFocus
                  />
                  <span>problems</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={handleGoalSave}
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.9em",
                      border: "none",
                      background: "#4caf50",
                      color: "white",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#45a049")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#4caf50")
                    }
                  >
                    ✓ Save
                  </button>
                  <button
                    onClick={handleGoalCancel}
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.9em",
                      border: "none",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "var(--theme-text)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.2)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.1)")
                    }
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p>
                {totalSolved} / {overallGoal} problems solved
              </p>
            )}
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
                loading={loading}
              />
            ))}
          </div>

          {/* Today's Activity */}
          <div className="today-activity">
            <h2>
              Today's Activity (
              {today.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              )
            </h2>
            <div className="activity-list">
              {PLATFORMS.map((plat) => {
                const submittedToday = hasSubmittedToday(plat.key);
                const hasData =
                  platformData[plat.key] && !platformData[plat.key].error;

                return (
                  <div
                    key={plat.key}
                    className={`activity-item ${
                      submittedToday
                        ? "done"
                        : hasData
                          ? "active-no-sub"
                          : "missed"
                    }`}
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
          </div>
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
