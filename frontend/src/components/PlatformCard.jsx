import React from "react";
import CircularProgress from "./CircularProgress";
import ActivityHeatmap from "./ActivityHeatmap";
import PlatformCardSkeleton from "./PlatformCardSkeleton";
import styles from "./PlatformCard.module.css";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import HREnhancedCard from "./HREnhancedCard";

const PlatformCard = ({
  platform,
  data,
  expanded,
  onToggle,
  percentage,
  loading,
}) => {
  const isExpanded = expanded === platform.key;

  if (loading) {
    return <PlatformCardSkeleton platform={platform} />;
  }

  if (!data) {
    return (
      <div
        className={`platform-card ${styles.card} ${isExpanded ? "expanded" : ""
          }`}
        onClick={() => onToggle(platform.key)}
      >
        <div className="card-header">
          <h3 className={styles.title} style={{ color: platform.color }}>
            {platform.name}
          </h3>
          <div className="platform-progress">
            <CircularProgress
              percentage={percentage}
              color={platform.color}
              size={isExpanded ? "large" : "medium"}
              tooltip="No data"
            />
          </div>
        </div>
        <p className={styles.placeholder}>Enter username and refresh</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div
        className={`platform-card ${styles.card} ${isExpanded ? "expanded" : ""
          }`}
        onClick={() => onToggle(platform.key)}
      >
        <div className="card-header">
          <h3 className={styles.title} style={{ color: platform.color }}>
            {platform.name}
          </h3>
          <div className="platform-progress">
            <CircularProgress
              percentage={0}
              color={platform.color}
              size={isExpanded ? "large" : "medium"}
              tooltip={data.error || "Error"}
            />
          </div>
        </div>
        <p className="error-msg">{data.error}</p>
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(platform.key);
    }
  };

  const tooltipText = data.totalSolved !== undefined
    ? `Solved: ${data.totalSolved} / ${data.totalQuestions || "Unknown"}`
    : data.solved !== undefined
      ? `Solved: ${data.solved}`
      : `Percentage: ${percentage}%`;

  return (
    <div
      className={`platform-card ${styles.card} ${isExpanded ? "expanded" : ""}`}
      onClick={() => onToggle(platform.key)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex="0"
      aria-label={`${platform.name} platform card, ${isExpanded ? 'expanded' : 'collapsed'}`}
      aria-expanded={isExpanded}
    >
      <div className="card-header">
        <h3 className={styles.title} style={{ color: platform.color }}>
          {platform.name}
        </h3>
        <div className="platform-progress">
          <CircularProgress
            percentage={percentage}
            color={platform.color}
            size={isExpanded ? "large" : "medium"}
            tooltip={tooltipText}
          />
        </div>
      </div>

      <div className="summary">
        {data.totalSolved !== undefined && (
          <p>
            <strong>{data.totalSolved}</strong> solved ({percentage}%)
          </p>
        )}
        {data.solved !== undefined && (
          <p>
            <strong>{data.solved}</strong> solved
          </p>
        )}
        {data.rating !== undefined && (
          <p>
            Rating: <strong>{data.rating}</strong>
          </p>
        )}
        {data.rank && (
          <p>
            Rank: <strong>{data.rank}</strong>
          </p>
        )}
        {data.problem_fully_solved !== undefined && (
          <p>
            Fully Solved: <strong>{data.problem_fully_solved}</strong>
          </p>
        )}
      </div>

      {isExpanded && (
        <div className="details">
          {platform.key === "leetcode" && (
            <>
              <div className="difficulty-breakdown">
                <div className="diff-item">
                  <span style={{ color: "#00af9b" }}>Easy</span>
                  <strong>{data.easySolved}</strong>
                </div>
                <div className="diff-item">
                  <span style={{ color: "#ffb800" }}>Medium</span>
                  <strong>{data.mediumSolved}</strong>
                </div>
                <div className="diff-item">
                  <span style={{ color: "#ff2d55" }}>Hard</span>
                  <strong>{data.hardSolved}</strong>
                </div>
              </div>

              <div className="ranking">
                Global Ranking: <strong>#{data.ranking || "N/A"}</strong>
              </div>

              <div className="heatmap-section">
                <h4>Submission Heatmap</h4>
                {data.submissionCalendar ? (
                  <ActivityHeatmap
                    data={Object.entries(data.submissionCalendar || {}).map(
                      ([ts, count]) => ({
                        date: new Date(parseInt(ts) * 1000)
                          .toISOString()
                          .split("T")[0],
                        count,
                      }),
                    )}
                  />
                ) : (
                  <p>No calendar data</p>
                )}
              </div>
            </>
          )}

          {platform.key === "codeforces" && (
            <div className="expanded-details">
              <p>
                Current Rating: <strong>{data.rating}</strong>
              </p>
              <p>
                Current Rank: <strong>{data.rank}</strong>
              </p>
              <p>
                Max Rating: <strong>{data.maxRating || "N/A"}</strong>
              </p>
            </div>
          )}

          {platform.key === "codechef" && (
            <div className="expanded-details">
              <p>
                Stars: <strong>{data.total_stars || 0} ⭐</strong>
              </p>
              <p>
                Global Rank: <strong>#{data.global_rank || "N/A"}</strong>
              </p>
              <p>
                Country Rank: <strong>#{data.country_rank || "N/A"}</strong>
              </p>
            </div>
          )}

          {platform.key === "hackerearth" && (
            <div className="expanded-details">
              <p>
                Badges Earned: <strong>{data.badges || 0}</strong>
              </p>
              <p>
                Recent Activity: <strong>{data.activity || 0}</strong>
              </p>
            </div>
          )}

          {platform.key === "hackerrank" && (
            <HREnhancedCard data={data} username={data?.username || "user"} />
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformCard;
