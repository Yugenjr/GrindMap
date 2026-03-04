import React from "react";
import "./Dashboard.css";

/**
 * Loading skeleton for the dashboard
 * Uses CSS shimmer animation defined in Dashboard.css
 */
export const LoadingSkeleton = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        {/* Header Skeleton */}
        <header className="glass-card dashboard-header">
          <div>
            <div
              className="skeleton"
              style={{ width: 200, height: 32, marginBottom: 8 }}
            />
            <div className="skeleton" style={{ width: 150, height: 16 }} />
          </div>
          <div className="header-actions">
            <div
              className="skeleton"
              style={{ width: 80, height: 40, borderRadius: 12 }}
            />
            <div
              className="skeleton"
              style={{ width: 120, height: 40, borderRadius: 12 }}
            />
          </div>
        </header>

        {/* Bento Grid Skeleton */}
        <div className="bento-grid" style={{ marginTop: 24 }}>
          {/* Large Card */}
          <div className="glass-card span-4 row-2">
            <div
              className="skeleton"
              style={{ width: 180, height: 24, marginBottom: 24 }}
            />
            <div
              className="skeleton"
              style={{ width: "100%", height: 200, borderRadius: 16 }}
            />
          </div>

          {/* Stat Cards */}
          <div className="glass-card span-2">
            <div
              className="skeleton"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                marginBottom: 12,
              }}
            />
            <div
              className="skeleton"
              style={{ width: 100, height: 14, marginBottom: 8 }}
            />
            <div className="skeleton" style={{ width: 80, height: 40 }} />
          </div>

          <div className="glass-card span-2">
            <div
              className="skeleton"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                marginBottom: 12,
              }}
            />
            <div
              className="skeleton"
              style={{ width: 100, height: 14, marginBottom: 8 }}
            />
            <div className="skeleton" style={{ width: 80, height: 40 }} />
          </div>

          {/* Donut Chart */}
          <div className="glass-card span-2 row-2">
            <div
              className="skeleton"
              style={{ width: 160, height: 20, marginBottom: 16 }}
            />
            <div
              className="skeleton"
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Badges */}
          <div className="glass-card span-4">
            <div
              className="skeleton"
              style={{ width: 120, height: 20, marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ width: 100, height: 130, borderRadius: 16 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
