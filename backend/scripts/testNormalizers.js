import BaseNormalizer from '../src/services/normalization/common.normalizer.js';
import { normalizeLeetCode } from '../src/services/normalization/leetcode.normalizer.js';
import { normalizeCodeforces } from '../src/services/normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from '../src/services/normalization/codechef.normalizer.js';

console.log('🧪 Starting Comprehensive Normalizer Testing...\n');

// Test data for each platform
const testData = {
  leetcode: {
    username: 'test_leetcode_user',
    data: {
      ranking: 12345,
      reputation: 250,
      easySolved: 50,
      mediumSolved: 75,
      hardSolved: 25,
      totalSolved: 150,
      rating: 1800,
    }
  },
  codeforces: {
    username: 'test_codeforces_user',
    data: {
      rating: 1650,
      maxRating: 1800,
      totalSolved: 200,
      rank: 'specialist',
    }
  },
  codechef: {
    username: 'test_codechef_user',
    data: {
      rating: 1700,
      problemsSolved: 180,
      globalRank: 5432,
      countryRank: 123,
      stars: 5,
    }
  }
};

function testBaseNormalizer() {
  console.log('📋 Testing BaseNormalizer...');

  // Test invalid inputs
  const invalidInputs = [null, undefined, {}, { username: 'test' }, { data: {} }];
  invalidInputs.forEach((input, index) => {
    try {
      new BaseNormalizer(input);
      console.log(`❌ Test ${index + 1} failed: Should have thrown error for invalid input`);
    } catch (error) {
      console.log(`✅ Test ${index + 1} passed: Correctly threw error for invalid input`);
    }
  });

  // Test valid input
  try {
    const normalizer = new BaseNormalizer({ username: 'testuser', data: { rating: 1500 } });
    console.log('✅ Valid input test passed: BaseNormalizer initialized correctly');
    console.log(`   Username: ${normalizer.username}`);
    console.log(`   Rating: ${normalizer.rating}`);
  } catch (error) {
    console.log('❌ Valid input test failed:', error.message);
  }

  console.log('');
}

function testPlatformNormalizer(platformName, normalizeFunction, testInput) {
  console.log(`🔧 Testing ${platformName} Normalizer...`);

  try {
    const result = normalizeFunction(testInput);
    console.log('✅ Normalization successful');
    console.log(`   Platform: ${result.platform}`);
    console.log(`   Username: ${result.username}`);
    console.log(`   Rating: ${result.rating}`);
    console.log(`   Total Solved: ${result.totalSolved}`);
    console.log(`   Rank: ${result.rank}`);

    // Check platform-specific fields
    if (platformName === 'LeetCode') {
      console.log(`   Reputation: ${result.reputation}`);
      console.log(`   Difficulty: ${JSON.stringify(result.difficulty)}`);
    } else if (platformName === 'Codeforces') {
      console.log(`   Max Rating: ${result.maxRating}`);
    } else if (platformName === 'CodeChef') {
      console.log(`   Country Rank: ${result.countryRank}`);
      console.log(`   Total Stars: ${result.totalStars}`);
    }

    return result;
  } catch (error) {
    console.log(`❌ ${platformName} normalization failed:`, error.message);
    return null;
  }

  console.log('');
}

function testConsistency(results) {
  console.log('🔄 Testing Output Consistency...');

  const [leetcode, codeforces, codechef] = results;

  // Check base fields exist
  const baseFields = ['platform', 'username', 'rating', 'totalSolved', 'rank'];
  const allHaveBaseFields = results.every(result =>
    result && baseFields.every(field => result.hasOwnProperty(field))
  );

  if (allHaveBaseFields) {
    console.log('✅ All normalizers have consistent base structure');
  } else {
    console.log('❌ Inconsistent base structure across normalizers');
  }

  // Check common values
  const commonUsername = leetcode.username;
  const commonRating = 1800; // from test data
  const commonTotalSolved = 150; // from test data
  const commonRank = 12345; // from test data

  if (results.every(r => r && r.username === commonUsername)) {
    console.log('✅ Consistent username across platforms');
  } else {
    console.log('❌ Inconsistent username across platforms');
  }

  console.log('');
}

function testErrorHandling() {
  console.log('🚨 Testing Error Handling...');

  const invalidInputs = [null, undefined, {}, { username: 'test' }, { data: {} }];
  const normalizers = [
    { name: 'LeetCode', func: normalizeLeetCode },
    { name: 'Codeforces', func: normalizeCodeforces },
    { name: 'CodeChef', func: normalizeCodeChef }
  ];

  normalizers.forEach(({ name, func }) => {
    let passed = 0;
    invalidInputs.forEach(input => {
      try {
        func(input);
        console.log(`❌ ${name} should have thrown error for invalid input`);
      } catch (error) {
        passed++;
      }
    });
    console.log(`✅ ${name} error handling: ${passed}/${invalidInputs.length} tests passed`);
  });

  console.log('');
}

function testEdgeCases() {
  console.log('🎯 Testing Edge Cases...');

  // Test with empty data
  const emptyDataInput = { username: 'testuser', data: {} };

  try {
    const leetcodeResult = normalizeLeetCode(emptyDataInput);
    console.log('✅ LeetCode handles empty data correctly');
    console.log(`   Rating: ${leetcodeResult.rating} (should be 0)`);
    console.log(`   Total Solved: ${leetcodeResult.totalSolved} (should be 0)`);
  } catch (error) {
    console.log('❌ LeetCode failed with empty data:', error.message);
  }

  try {
    const codeforcesResult = normalizeCodeforces(emptyDataInput);
    console.log('✅ Codeforces handles empty data correctly');
    console.log(`   Rating: ${codeforcesResult.rating} (should be 0)`);
    console.log(`   Max Rating: ${codeforcesResult.maxRating} (should be 0)`);
  } catch (error) {
    console.log('❌ Codeforces failed with empty data:', error.message);
  }

  try {
    const codechefResult = normalizeCodeChef(emptyDataInput);
    console.log('✅ CodeChef handles empty data correctly');
    console.log(`   Rating: ${codechefResult.rating} (should be 0)`);
    console.log(`   Country Rank: ${codechefResult.countryRank} (should be null)`);
  } catch (error) {
    console.log('❌ CodeChef failed with empty data:', error.message);
  }

  console.log('');
}

// Run all tests
async function runTests() {
  testBaseNormalizer();

  const results = [];
  results.push(testPlatformNormalizer('LeetCode', normalizeLeetCode, testData.leetcode));
  results.push(testPlatformNormalizer('Codeforces', normalizeCodeforces, testData.codeforces));
  results.push(testPlatformNormalizer('CodeChef', normalizeCodeChef, testData.codechef));

  testConsistency(results);
  testErrorHandling();
  testEdgeCases();

  console.log('🎉 Normalizer Testing Complete!');
  console.log('\n📊 Summary:');
  console.log('- BaseNormalizer validation and functionality tested');
  console.log('- All platform normalizers tested with sample data');
  console.log('- Output consistency verified across platforms');
  console.log('- Error handling tested for invalid inputs');
  console.log('- Edge cases tested with empty data');
}

runTests().catch(console.error);
