import BaseNormalizer from './common.normalizer.js';

class CodeforcesNormalizer extends BaseNormalizer {
  get platform() {
    return 'codeforces';
  }

  get maxRating() {
    return this.getField('maxRating') || 0;
  }

  normalize() {
    const base = super.normalize();
    return {
      ...base,
      maxRating: this.maxRating,
    };
  }
}

export function normalizeCodeforces(input) {
  const normalizer = new CodeforcesNormalizer(input);
  return normalizer.normalize();
}
