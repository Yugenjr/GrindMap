import axios from 'axios';
import CircuitBreaker from './circuitBreaker.js';
import RetryManager from './retryManager.js';
import Logger from './logger.js';
import redis from '../config/redis.js';

class ApiClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL;
    this.timeout = options.timeout || 10000;
    this.name = options.name || 'ApiClient';
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': 'GrindMap/1.0 (https://grindmap.dev)',
        ...options.headers
      }
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      name: this.name,
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000
    });

    // Initialize retry manager
    this.retryManager = new RetryManager({
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        Logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          client: this.name
        });
        return config;
      },
      (error) => {
        Logger.error('API Request Error', { error: error.message, client: this.name });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        Logger.debug(`API Response: ${response.status} ${response.config.url}`, {
          client: this.name,
          responseTime: response.config.metadata?.endTime - response.config.metadata?.startTime
        });
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const message = error.message;
        
        Logger.warn(`API Error: ${status || 'Network'} ${error.config?.url}`, {
          client: this.name,
          error: message,
          status
        });

        // Transform error for better handling
        if (status === 429) {
          error.code = 'RATE_LIMITED';
        } else if (status >= 500) {
          error.code = 'SERVER_ERROR';
        } else if (!error.response) {
          error.code = 'NETWORK_ERROR';
        }

        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) {
    return this.request('GET', url, null, config);
  }

  async post(url, data, config = {}) {
    return this.request('POST', url, data, config);
  }

  async request(method, url, data = null, config = {}) {
    const requestConfig = {
      method,
      url,
      data,
      ...config,
      metadata: { startTime: Date.now() }
    };

    // Check cache first for GET requests
    if (method === 'GET' && config.cache !== false) {
      const cached = await this.getFromCache(url, config.cacheKey);
      if (cached) {
        Logger.debug(`Cache hit for ${url}`, { client: this.name });
        return { data: cached, fromCache: true };
      }
    }

    const operation = async () => {
      requestConfig.metadata.startTime = Date.now();
      const response = await this.client.request(requestConfig);
      requestConfig.metadata.endTime = Date.now();
      
      // Cache successful GET responses
      if (method === 'GET' && response.status === 200 && config.cache !== false) {
        await this.setCache(url, response.data, config.cacheKey, config.cacheTTL);
      }
      
      return response;
    };

    try {
      // Execute with circuit breaker and retry logic
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryManager.execute(operation, {
          client: this.name,
          method,
          url
        });
      });

      return response;
    } catch (error) {
      // Try to return cached data as fallback
      if (method === 'GET') {
        const fallback = await this.getFallbackData(url, config.cacheKey);
        if (fallback) {
          Logger.info(`Returning fallback data for ${url}`, { client: this.name });
          return { data: fallback, fromFallback: true };
        }
      }
      
      throw error;
    }
  }

  async getFromCache(url, cacheKey) {
    try {
      const key = cacheKey || `api_cache:${this.name}:${url}`;
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      Logger.warn('Cache read error', { error: error.message });
      return null;
    }
  }

  async setCache(url, data, cacheKey, ttl = 300) {
    try {
      const key = cacheKey || `api_cache:${this.name}:${url}`;
      await redis.set(key, JSON.stringify(data), ttl);
      
      // Also store as fallback with longer TTL
      const fallbackKey = `fallback:${key}`;
      await redis.set(fallbackKey, JSON.stringify(data), ttl * 10);
    } catch (error) {
      Logger.warn('Cache write error', { error: error.message });
    }
  }

  async getFallbackData(url, cacheKey) {
    try {
      const key = cacheKey || `api_cache:${this.name}:${url}`;
      const fallbackKey = `fallback:${key}`;
      const cached = await redis.get(fallbackKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      Logger.warn('Fallback data read error', { error: error.message });
      return null;
    }
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  // Static method to create platform-specific clients
  static createLeetCodeClient() {
    return new ApiClient({
      name: 'LeetCode',
      baseURL: 'https://leetcode.com',
      timeout: 15000,
      maxRetries: 3,
      failureThreshold: 3
    });
  }

  static createCodeForcesClient() {
    return new ApiClient({
      name: 'CodeForces',
      baseURL: 'https://codeforces.com',
      timeout: 10000,
      maxRetries: 2,
      failureThreshold: 5
    });
  }

  static createCodeChefClient() {
    return new ApiClient({
      name: 'CodeChef',
      baseURL: 'https://www.codechef.com',
      timeout: 12000,
      maxRetries: 3,
      failureThreshold: 4
    });
  }

  static createGitHubClient() {
    return new ApiClient({
      name: 'GitHub',
      baseURL: 'https://api.github.com',
      timeout: 8000,
      maxRetries: 2,
      failureThreshold: 3,
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  }
}

export default ApiClient;