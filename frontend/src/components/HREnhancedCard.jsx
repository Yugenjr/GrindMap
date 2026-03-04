import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Target, TrendingUp, Award, Zap } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar,
} from "recharts";
import html2canvas from "html2canvas";
import "./HREnhancedCard.css";

/**
 * Enhanced HackerRank Card Component
 * Features: Bento Grid, Glassmorphism, Animations, Progress Tracking, Export
 */
const HREnhancedCard = ({ data, username }) => {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  if (!data || data.error) {
    return (
      <div className="hr-enhanced-card hr-enhanced-card--empty">
        <div className="hr-empty-icon">🏅</div>
        <h3>HackerRank Analytics</h3>
        <p>{data?.error || "Enter username and fetch to see analytics"}</p>
      </div>
    );
  }

  const badges = data.badges || [];
  const totalStars =
    data.totalStars || badges.reduce((acc, b) => acc + (b.stars || 0), 0);
  const problemsSolved = data.problemsSolved || 0;

  // Badge level counts
  const goldBadges = badges.filter((b) => b.stars >= 5).length;
  const silverBadges = badges.filter((b) => b.stars >= 3 && b.stars < 5).length;
  const bronzeBadges = badges.filter((b) => b.stars < 3).length;

  // Donut chart data
  const chartData = [
    { name: "Gold", value: goldBadges, color: "#fbbf24" },
    { name: "Silver", value: silverBadges, color: "#9ca3af" },
    { name: "Bronze", value: bronzeBadges, color: "#d97706" },
  ].filter((d) => d.value > 0);

  // Progress tracking data (Target: 5 stars per category)
  const progressData = badges.map((badge) => ({
    name: badge.name,
    current: badge.stars,
    target: 5,
    percentage: (badge.stars / 5) * 100,
  }));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Export as PNG
  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `hackerrank-stats-${username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className="hr-enhanced-card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="hr-header" variants={itemVariants}>
        <div className="hr-header-left">
          <span className="hr-icon">🏅</span>
          <div>
            <h3>HackerRank Analytics</h3>
            <p className="hr-username">@{username}</p>
          </div>
        </div>
        <button
          className="hr-export-btn"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={16} />
          {exporting ? "Exporting..." : "Export PNG"}
        </button>
      </motion.div>

      {/* Bento Grid */}
      <div className="hr-bento-grid">
        {/* Total Stars - Large Card */}
        <motion.div
          className="hr-bento-item hr-bento-stars"
          variants={itemVariants}
        >
          <div className="hr-stat-icon">
            <Zap size={24} />
          </div>
          <span className="hr-stat-label">Total Stars</span>
          <span className="hr-stat-value hr-gold">{totalStars}</span>
          <div className="hr-level-badge">
            {totalStars >= 20
              ? "🏆 Master"
              : totalStars >= 10
                ? "⭐ Expert"
                : "📈 Rising"}
          </div>
        </motion.div>

        {/* Badges Count */}
        <motion.div className="hr-bento-item" variants={itemVariants}>
          <div className="hr-stat-icon hr-green">
            <Award size={20} />
          </div>
          <span className="hr-stat-label">Badges</span>
          <span className="hr-stat-value hr-green">{badges.length}</span>
        </motion.div>

        {/* Submissions */}
        <motion.div className="hr-bento-item" variants={itemVariants}>
          <div className="hr-stat-icon hr-blue">
            <TrendingUp size={20} />
          </div>
          <span className="hr-stat-label">Submissions</span>
          <span className="hr-stat-value hr-blue">{problemsSolved}</span>
        </motion.div>

        {/* Donut Chart */}
        {chartData.length > 0 && (
          <motion.div
            className="hr-bento-item hr-bento-chart"
            variants={itemVariants}
          >
            <span className="hr-stat-label">Badge Distribution</span>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
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
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="hr-chart-legend">
              <span className="hr-legend gold">🥇 {goldBadges}</span>
              <span className="hr-legend silver">🥈 {silverBadges}</span>
              <span className="hr-legend bronze">🥉 {bronzeBadges}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Tracking */}
      {progressData.length > 0 && (
        <motion.div className="hr-progress-section" variants={itemVariants}>
          <h4 className="hr-section-title">
            <Target size={16} /> Road to Gold (5★)
          </h4>
          <div className="hr-progress-list">
            {progressData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="hr-progress-item">
                <div className="hr-progress-header">
                  <span className="hr-progress-name">{item.name}</span>
                  <span className="hr-progress-stars">{item.current}/5 ★</span>
                </div>
                <div className="hr-progress-bar">
                  <motion.div
                    className="hr-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    style={{
                      background:
                        item.current >= 5
                          ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                          : item.current >= 3
                            ? "linear-gradient(90deg, #9ca3af, #6b7280)"
                            : "linear-gradient(90deg, #d97706, #b45309)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Badges Gallery */}
      {badges.length > 0 && (
        <motion.div className="hr-badges-section" variants={itemVariants}>
          <h4 className="hr-section-title">🏅 Earned Badges</h4>
          <div className="hr-badges-grid">
            {badges.map((badge, idx) => (
              <motion.div
                key={idx}
                className={`hr-badge ${badge.stars >= 5 ? "gold" : badge.stars >= 3 ? "silver" : "bronze"}`}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="hr-badge-hex">
                  <span className="hr-badge-num">
                    {badge.name.match(/\d+/)?.[0] || "★"}
                  </span>
                  <span className="hr-badge-cat">
                    {badge.name.replace(/\d+\s*/g, "").trim()}
                  </span>
                </div>
                <span className="hr-badge-stars">
                  {"★".repeat(Math.min(badge.stars, 5))}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HREnhancedCard;
