import React from "react";
import {
  Trophy,
  Code,
  Zap,
  Target,
  Share2,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/**
 * 1. ANALYSIS DASHBOARD LAYOUT (Bento Grid)
 * Requires 'lucide-react' for icons.
 * Uses CSS Grid for the Bento layout.
 */
export const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="flex justify-between items-center bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/50 shadow-2xl">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              HackerRank Analytics
            </h1>
            <p className="text-slate-400 mt-1">Real-time performance metrics</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 text-sm font-medium">
              <Share2 size={16} /> Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-900/20 text-sm font-medium">
              <Download size={16} /> Export Report
            </button>
          </div>
        </header>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {/* Main Stats - Large Card */}
          <div className="col-span-1 md:col-span-4 lg:col-span-4 row-span-2 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Overall Performance
              </h3>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                Top 5%
              </span>
            </div>
            {/* Chart placeholder */}
            <div className="h-64 w-full flex items-center justify-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
              <ResponsiveContainer width="100%" height="100%">
                <SkillRadarChart />
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stat Card 1 - Problems Solved */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Code size={20} />
              </div>
              <span className="text-slate-400 text-sm">Problems Solved</span>
            </div>
            <p className="text-4xl font-bold mt-2 font-mono">342</p>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> +12 this week
            </p>
          </div>

          {/* Stat Card 2 - Total Stars */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Zap size={20} />
              </div>
              <span className="text-slate-400 text-sm">Total Stars</span>
            </div>
            <p className="text-4xl font-bold mt-2 font-mono text-yellow-400">
              28
            </p>
            <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
              <div className="bg-yellow-500 h-full w-[70%] rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Level 4 Scholar</p>
          </div>

          {/* Difficulty Donut Chart Container */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-semibold mb-4">
              Difficulty Distribution
            </h3>
            <div className="h-48 w-full">
              <DifficultyDonutChart />
            </div>
          </div>

          {/* Badges Grid (Scrollable) */}
          <div className="col-span-1 md:col-span-4 lg:col-span-4 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-semibold mb-4">Earned Badges</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {/* Mock Badge Items */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="min-w-[100px] h-[120px] bg-slate-800/50 rounded-xl flex flex-col items-center justify-center border border-slate-700"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full mb-2 shadow-lg" />
                  <span className="text-xs font-medium">Gold Level</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. SKILL RADAR CHART (Recharts)
 * Visualizes proficiency across different domains.
 */
const SkillRadarChart = () => {
  const data = [
    { name: "Problem Solving", uv: 100, fill: "#10b981" }, // Emerald
    { name: "Python", uv: 80, fill: "#3b82f6" }, // Blue
    { name: "Algorithms", uv: 90, fill: "#8b5cf6" }, // Violet
    { name: "Data Structures", uv: 70, fill: "#f59e0b" }, // Amber
    { name: "SQL", uv: 40, fill: "#ef4444" }, // Red
  ];

  return (
    <ResponsiveContainer width={250} height={250}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="20%"
        outerRadius="100%"
        barSize={10}
        data={data}
      >
        <RadialBar
          minAngle={15}
          label={{ position: "insideStart", fill: "#fff" }}
          background
          clockWise
          dataKey="uv"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            borderColor: "#334155",
            color: "#fff",
          }}
          itemStyle={{ color: "#fff" }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

/**
 * 3. DIFFICULTY DONUT CHART (Recharts)
 * Simple donut chart with custom colors matching the dark theme.
 */
const DifficultyDonutChart = () => {
  const data = [
    { name: "Easy", value: 400 },
    { name: "Medium", value: 300 },
    { name: "Hard", value: 300 },
  ];
  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Emerald, Amber, Red

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            borderColor: "#1e293b",
            borderRadius: "12px",
          }}
          itemStyle={{ color: "#e2e8f0" }}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
};
