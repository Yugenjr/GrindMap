/**
 * Dependency Injection Container
 * Resolves circular dependencies by lazy loading services
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  /**
   * Register a service factory
   */
  register(name, factory) {
    this.factories.set(name, factory);
  }

  /**
   * Get service instance (lazy loaded)
   */
  get(name) {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    const instance = factory(this);
    this.services.set(name, instance);
    return instance;
  }

  /**
   * Clear all services (for testing)
   */
  clear() {
    this.services.clear();
  }
}

export const container = new DIContainer();