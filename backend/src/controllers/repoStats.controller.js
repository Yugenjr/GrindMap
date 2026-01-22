import RepoStatsService from "../services/repoStats.service.js";

export const trackView = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    await RepoStatsService.incrementViews(ip, userAgent);
    
    res.status(200).json({ 
      success: true,
      message: 'View tracked successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await RepoStatsService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getViewBadge = async (req, res) => {
  try {
    const stats = await RepoStatsService.getStats();
    const svg = RepoStatsService.generateBadge(stats.totalViews);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
  } catch (error) {
    res.status(500).send('Error generating badge');
  }
};
