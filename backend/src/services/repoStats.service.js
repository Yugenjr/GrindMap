import RepoStats from "../models/repoStats.model.js";

class RepoStatsService {
  // Increment view count
  static async incrementViews(ip, userAgent) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let stats = await RepoStats.findOne({ type: 'view' });

      if (!stats) {
        stats = new RepoStats({
          type: 'view',
          count: 0,
          uniqueVisitors: [],
          dailyStats: []
        });
      }

      // Check if this visitor is unique (within last 24 hours)
      const recentVisitor = stats.uniqueVisitors.find(
        v => v.ip === ip && 
        (Date.now() - new Date(v.timestamp).getTime()) < 24 * 60 * 60 * 1000
      );

      if (!recentVisitor) {
        // New unique visitor
        stats.uniqueVisitors.push({ ip, userAgent, timestamp: new Date() });
        
        // Limit stored visitors to last 1000
        if (stats.uniqueVisitors.length > 1000) {
          stats.uniqueVisitors = stats.uniqueVisitors.slice(-1000);
        }
      }

      // Increment total count
      stats.count += 1;

      // Update daily stats
      const todayStats = stats.dailyStats.find(
        d => d.date.getTime() === today.getTime()
      );

      if (todayStats) {
        todayStats.count += 1;
      } else {
        stats.dailyStats.push({ date: today, count: 1 });
        
        // Keep only last 30 days
        if (stats.dailyStats.length > 30) {
          stats.dailyStats = stats.dailyStats.slice(-30);
        }
      }

      await stats.save();
      return stats;
    } catch (error) {
      throw new Error(`Failed to increment views: ${error.message}`);
    }
  }

  // Get current stats
  static async getStats() {
    try {
      const stats = await RepoStats.findOne({ type: 'view' });
      
      if (!stats) {
        return {
          totalViews: 0,
          uniqueVisitors: 0,
          todayViews: 0,
          last30Days: []
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStats = stats.dailyStats.find(
        d => d.date.getTime() === today.getTime()
      );

      return {
        totalViews: stats.count,
        uniqueVisitors: stats.uniqueVisitors.length,
        todayViews: todayStats ? todayStats.count : 0,
        last30Days: stats.dailyStats.slice(-30)
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  // Generate SVG badge
  static generateBadge(count) {
    const countStr = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
    const width = 90 + countStr.length * 7;

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${width}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h45v20H0z"/>
    <path fill="#4c1" d="M45 0h${width - 45}v20H45z"/>
    <path fill="url(#b)" d="M0 0h${width}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="23" y="15" fill="#010101" fill-opacity=".3">views</text>
    <text x="23" y="14">views</text>
    <text x="${45 + (width - 45) / 2}" y="15" fill="#010101" fill-opacity=".3">${countStr}</text>
    <text x="${45 + (width - 45) / 2}" y="14">${countStr}</text>
  </g>
</svg>`.trim();
  }
}

export default RepoStatsService;
