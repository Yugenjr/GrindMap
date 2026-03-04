import ApiClient from '../../utils/apiClient.js';
import BaseScraper from './baseScraper.js';

// Create CodeForces API client with circuit breaker
const codeforcesClient = ApiClient.createCodeForcesClient();

class CodeforcesScraper extends BaseScraper {
  constructor() {
    super('CODEFORCES', {
      enableRetry: true, // Enable retry for consistency
      enableFallback: true, // Enable fallback for consistency
      cacheTTL: 600 // 10 minutes cache
    });
  }

  async _executeScrape(validatedUsername) {
    const response = await this._withRetry(
      async () => {
        return await codeforcesClient.get(`/api/user.info?handles=${validatedUsername}`, {
          cacheTTL: this.options.cacheTTL,
          cacheKey: this._getCacheKey(validatedUsername)
        });
      },
      validatedUsername,
      { apiEndpoint: 'codeforces.com/api' }
    );

    return response;
  }

  _validateResponse(data) {
    // Validate Codeforces API response format
    if (data.status !== 'OK') {
      if (data.comment?.includes('not found')) {
        throw new Error('User not found');
      }
      throw new Error(data.comment || 'API returned error status');
    }

    if (!data.result || data.result.length === 0) {
      throw new Error('User not found');
    }
  }

  _getErrorContext() {
    return {
      apiEndpoint: 'codeforces.com/api',
      circuitBreakerState: codeforcesClient.getCircuitBreakerState()
    };
  } catch (error) {
    const message =
      error?.message === "Invalid username"
        ? "Invalid username"
        : normalizeCfError(error, "Failed to fetch Codeforces data");

    // Centralized error forwarding
    throw new AppError(message, 500);
  }
}

// Create singleton instance
const codeforcesScraper = new CodeforcesScraper();

export async function fetchCodeforcesStats(username) {
  return await codeforcesScraper.scrape(username);
}
