import BaseNormalizer from './common.normalizer.js';

class CodeChefNormalizer extends BaseNormalizer {
  get platform() {
    return 'codechef';
  }

  get totalSolved() {
    return this.getField('problemsSolved') || 0;
  }

  get rank() {
    return this.getField('globalRank') || null;
  }

  get countryRank() {
    return this.getField('countryRank') || null;
  }

  get totalStars() {
    return this.getField('stars') || 0;
  }

  normalize() {
    const base = super.normalize();
    return {
      ...base,
      countryRank: this.countryRank,
      totalStars: this.totalStars,
    };
  }
}

export function normalizeCodeChef(input) {
  const normalizer = new CodeChefNormalizer(input);
  return normalizer.normalize();
}
