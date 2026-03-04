/**
 * Heatmap service - handles heatmap generation and data processing
 * NO DIRECT SERVICE DEPENDENCIES - uses DI container
 */
class HeatmapService {
  constructor(container = null) {
    this.container = container;
  }

  /**
   * Generate heatmap data from activity data
   */
  generateHeatmapData(activityData) {
    const heatmapData = {};
    
    activityData.forEach(activity => {
      const date = activity.date.toISOString().split('T')[0];
      heatmapData[date] = (heatmapData[date] || 0) + activity.score;
    });
    
    return heatmapData;
  }

  /**
   * Get activity service (lazy loaded)
   */
  getActivityService() {
    return this.container?.get('activityService');
  }

  /**
   * Get platform service (lazy loaded)
   */
  getPlatformService() {
    return this.container?.get('platformService');
  }
}

export default HeatmapService;