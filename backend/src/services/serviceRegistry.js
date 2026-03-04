import { container } from '../utils/diContainer.js';
import PlatformService from './platform.service.js';
import ActivityService from './activity.service.js';
import HeatmapService from './heatmap.service.js';

/**
 * Service registry - initializes all services with dependency injection
 * Prevents circular dependencies by lazy loading
 */
class ServiceRegistry {
  static initialize() {
    // Register service factories
    container.register('platformService', (container) => new PlatformService(container));
    container.register('activityService', (container) => new ActivityService(container));
    container.register('heatmapService', (container) => new HeatmapService(container));
  }

  /**
   * Get platform service instance
   */
  static getPlatformService() {
    return container.get('platformService');
  }

  /**
   * Get activity service instance
   */
  static getActivityService() {
    return container.get('activityService');
  }

  /**
   * Get heatmap service instance
   */
  static getHeatmapService() {
    return container.get('heatmapService');
  }
}

// Initialize services on module load
ServiceRegistry.initialize();

export default ServiceRegistry;