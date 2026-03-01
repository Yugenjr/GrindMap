import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import "./Dashboard.css";

/**
 * Error state component for the dashboard
 * Shows when user is not found or scraping fails
 */
export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="dashboard">
      <div
        className="dashboard-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          className="glass-card"
          style={{ textAlign: "center", maxWidth: 400, padding: 40 }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <AlertCircle size={32} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h2>

          <p
            style={{
              color: "var(--dash-text-muted)",
              marginBottom: 24,
              fontSize: "0.9rem",
            }}
          >
            {message ||
              "Unable to load HackerRank data. Please check the username and try again."}
          </p>

          {onRetry && (
            <button
              className="btn btn-primary"
              onClick={onRetry}
              style={{ margin: "0 auto" }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component
 * Shows when user has no data/badges
 */
export const EmptyState = ({ username }) => {
  return (
    <div className="dashboard">
      <div
        className="dashboard-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          className="glass-card"
          style={{ textAlign: "center", maxWidth: 400, padding: 40 }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🏆
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8 }}>
            No badges yet
          </h2>

          <p style={{ color: "var(--dash-text-muted)", fontSize: "0.9rem" }}>
            <strong>{username}</strong> hasn't earned any badges on HackerRank
            yet. Start solving problems to earn your first badge!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
