import axios from 'axios';

class RequestManager {
  constructor() {
    this.activeRequests = new Set();
    this.defaultTimeout = 10000; // 10 seconds
  }

  async makeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.defaultTimeout);

    const requestConfig = {
      ...config,
      signal: controller.signal,
      timeout: config.timeout || this.defaultTimeout,
    };

    this.activeRequests.add(controller);

    try {
      const response = await axios(requestConfig);
      return response;
    } finally {
      clearTimeout(timeoutId);
      this.activeRequests.delete(controller);
    }
  }

  cleanup() {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  getActiveRequestCount() {
    return this.activeRequests.size;
  }
}

export default new RequestManager();
