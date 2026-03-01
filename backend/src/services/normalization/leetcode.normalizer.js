import BaseNormalizer from './common.normalizer.js';

class LeetCodeNormalizer extends BaseNormalizer {
  get platform() {
    return 'LEETCODE';
  }

  get rank() {
    return this.getField('ranking') || null;
  }

  get reputation() {
    return this.getField('reputation') || 0;
  }

  get solvedToday() {
    return null; // not available yet
  }

  get difficulty() {
    return {
      easy: this.getField('easySolved') || 0,
      medium: this.getField('mediumSolved') || 0,
      hard: this.getField('hardSolved') || 0,
    };
  }

  normalize() {
    const base = super.normalize();
    return {
      ...base,
      solvedToday: this.solvedToday,
      difficulty: this.difficulty,
      reputation: this.reputation,
    };
  }
}

export function normalizeLeetCode(input) {
  const normalizer = new LeetCodeNormalizer(input);
  return normalizer.normalize();
}
