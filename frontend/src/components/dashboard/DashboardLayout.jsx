import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Code,
  Zap,
  TrendingUp,
  Share2,
  Download,
  Award,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import "./Dashboard.css";

/**
 * Main Dashboard Layout Component
 * Displays HackerRank analytics in a Bento Grid layout
 */
export const DashboardLayout = ({ data, username }) => {
  // Extract data with safe defaults
  const badges = data?.badges || [];
  const totalStars =
    data?.totalStars || badges.reduce((acc, b) => acc + (b.stars || 0), 0);
  const problemsSolved = data?.problemsSolved || 0;
  const profileName = data?.name || username;

  // Calculate badge level distribution for donut chart
  const goldBadges = badges.filter((b) => b.stars >= 5).length;
  const silverBadges = badges.filter((b) => b.stars >= 3 && b.stars < 5).length;
  const bronzeBadges = badges.filter((b) => b.stars < 3).length;

  const chartData = [
    { name: "Gold", value: goldBadges, color: "#fbbf24" },
    { name: "Silver", value: silverBadges, color: "#9ca3af" },
    { name: "Bronze", value: bronzeBadges, color: "#d97706" },
  ].filter((d) => d.value > 0);

  // Animation variants for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        {/* Header */}
        <motion.header
          className="glass-card dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1>HackerRank Analytics</h1>
            <p>Performance metrics for {profileName}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary">
              <Share2 size={16} /> Share
            </button>
            <button className="btn btn-primary">
              <Download size={16} /> Export Report
            </button>
          </div>
        </motion.header>

        {/* Bento Grid */}
        <motion.div
          className="bento-grid"
          style={{ marginTop: 24 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Performance Card */}
          <motion.div
            className="glass-card span-4 row-2"
            variants={itemVariants}
          >
            <h3 className="section-title">
              <Trophy size={20} color="#fbbf24" /> Overall Performance
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              {/* Big Stats */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 24 }}>
                  <div
                    className="label"
                    style={{
                      color: "var(--dash-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Total Stars Earned
                  </div>
                  <div
                    style={{
                      fontSize: "4rem",
                      fontWeight: 700,
                      color: "#fbbf24",
                      lineHeight: 1,
                    }}
                  >
                    {totalStars}
                  </div>
                  <div className="progress-bar" style={{ marginTop: 12 }}>
                    <div
                      className="fill yellow"
                      style={{ width: `${Math.min(totalStars * 10, 100)}%` }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--dash-text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {totalStars >= 10
                      ? "Pro Level Achiever! 🏆"
                      : `${10 - totalStars} more stars to Pro`}
                  </div>
                </div>

                <div>
                  <div
                    className="label"
                    style={{
                      color: "var(--dash-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Badges Collected
                  </div>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: "#10b981",
                      lineHeight: 1,
                    }}
                  >
                    {badges.length}
                  </div>
                </div>
              </div>

              {/* Donut Chart */}
              {chartData.length > 0 && (
                <div
                  className="chart-container"
                  style={{ width: 180, height: 180 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stat Card - Problems Solved */}
          <motion.div
            className="glass-card span-2 stat-card"
            variants={itemVariants}
          >
            <div className="icon-wrap blue">
              <Code size={20} />
            </div>
            <span className="label">Submissions</span>
            <span className="value blue">{problemsSolved}</span>
            <span className="trend">
              <TrendingUp size={12} /> Active
            </span>
          </motion.div>

          {/* Stat Card - Total Stars */}
          <motion.div
            className="glass-card span-2 stat-card"
            variants={itemVariants}
          >
            <div className="icon-wrap yellow">
              <Zap size={20} />
            </div>
            <span className="label">Total Stars</span>
            <span className="value yellow">{totalStars}</span>
            <div className="progress-bar">
              <div
                className="fill yellow"
                style={{ width: `${(totalStars / 50) * 100}%` }}
              />
            </div>
          </motion.div>

          {/* Badge Level Breakdown */}
          <motion.div
            className="glass-card span-2 row-2"
            variants={itemVariants}
          >
            <h3 className="section-title">
              <Award size={18} /> Badge Levels
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginTop: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🥇
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--dash-text-muted)",
                    }}
                  >
                    Gold (5★)
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "#fbbf24",
                    }}
                  >
                    {goldBadges}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d1d5db, #9ca3af)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🥈
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--dash-text-muted)",
                    }}
                  >
                    Silver (3★)
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "#9ca3af",
                    }}
                  >
                    {silverBadges}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d97706, #b45309)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🥉
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--dash-text-muted)",
                    }}
                  >
                    Bronze (1★)
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "#d97706",
                    }}
                  >
                    {bronzeBadges}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Badges Gallery */}
          <motion.div className="glass-card span-4" variants={itemVariants}>
            <h3 className="section-title">🏅 Earned Badges</h3>

            {badges.length > 0 ? (
              <div className="badges-scroll">
                {badges.map((badge, idx) => (
                  <div key={idx} className="badge-item">
                    <div
                      className={`badge-icon ${badge.stars >= 5 ? "gold" : badge.stars >= 3 ? "silver" : "bronze"}`}
                    >
                      {badge.stars >= 5 ? "🥇" : badge.stars >= 3 ? "🥈" : "🥉"}
                    </div>
                    <span className="badge-name" title={badge.name}>
                      {badge.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--dash-text-muted)",
                      }}
                    >
                      {"★".repeat(badge.stars)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{ color: "var(--dash-text-muted)", fontStyle: "italic" }}
              >
                No badges earned yet. Start solving problems!
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardLayout;
