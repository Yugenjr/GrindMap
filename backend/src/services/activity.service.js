/**
 * Activity service - handles activity scoring and tracking
 * NO DIRECT SERVICE DEPENDENCIES - uses DI container
 */
class ActivityService {
  constructor(container = null) {
    this.container = container;
  }

  /**
   * Compute activity score from normalized data
   */
  computeActivityScore(normalized) {
    if (normalized.totalSolved > 0) return 1;
    return 0;
  }

  /**
   * Get platform service (lazy loaded)
   */
  getPlatformService() {
    return this.container?.get('platformService');
  }

  /**
   * Get heatmap service (lazy loaded)
   */
  getHeatmapService() {
    return this.container?.get('heatmapService');
  }
}

export default ActivityService;