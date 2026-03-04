/**
 * Base Normalizer class for standardizing platform data normalization
 * Provides consistent input/output contracts for all platform normalizers
 */
class BaseNormalizer {
  constructor(input) {
    if (!input || typeof input !== 'object' || !input.username || !input.data) {
      throw new Error('Normalizer requires input object with { username, data }');
    }
    this.username = input.username;
    this.rawData = input.data;
  }

  get platform() {
    throw new Error('Subclasses must implement platform getter');
  }

  get rating() {
    return this.getField('rating') || 0;
  }

  get totalSolved() {
    return this.getField('totalSolved') || this.getField('problemsSolved') || 0;
  }

  get rank() {
    return this.getField('rank') || this.getField('globalRank') || null;
  }

  getField(field) {
    return this.rawData[field];
  }

  normalize() {
    return {
      platform: this.platform,
      username: this.username,
      rating: this.rating,
      totalSolved: this.totalSolved,
      rank: this.rank,
    };
  }
}

export default BaseNormalizer;
