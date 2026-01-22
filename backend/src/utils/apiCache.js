// Simple in-memory cache for API responses
class APICache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  set(key, data, ttlSeconds = 900) {
    this.cache.set(key, data);
    this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    if (Date.now() > this.ttl.get(key)) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Generate cache key for platform data
  static platformKey(platform, username) {
    return `${platform}:${username}`;
  }
}

export default new APICache();