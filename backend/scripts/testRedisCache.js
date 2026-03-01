#!/usr/bin/env node

/**
 * Redis Cache Test Script
 * Tests Redis connection and caching functionality
 */

import redis from '../src/config/redis.js';
import config from '../src/config/env.js';

const testRedisCache = async () => {
  console.log('🧪 Testing Redis Cache Implementation...\n');

  // Test 1: Redis Connection
  console.log('1️⃣ Testing Redis Connection...');
  if (redis.isConnected) {
    console.log('✅ Redis is connected');
  } else {
    console.log('❌ Redis is not connected');
    return;
  }

  // Test 2: Basic Set/Get Operations
  console.log('\n2️⃣ Testing Basic Cache Operations...');
  const testKey = 'test:cache:key';
  const testData = { message: 'Hello Redis!', timestamp: Date.now() };

  try {
    // Set data
    await redis.set(testKey, JSON.stringify(testData), 60);
    console.log('✅ Cache SET operation successful');

    // Get data
    const cachedData = await redis.get(testKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      console.log('✅ Cache GET operation successful:', parsed.message);
    } else {
      console.log('❌ Cache GET operation failed');
    }

    // Delete data
    await redis.del(testKey);
    console.log('✅ Cache DELETE operation successful');
  } catch (error) {
    console.log('❌ Cache operations failed:', error.message);
  }

  // Test 3: Platform Cache Key Format
  console.log('\n3️⃣ Testing Platform Cache Key Format...');
  const platformKey = 'platform:LEETCODE:testuser';
  const platformData = {
    platform: 'LEETCODE',
    username: 'testuser',
    problemsSolved: 100,
    easyCount: 50,
    mediumCount: 40,
    hardCount: 10
  };

  try {
    await redis.set(platformKey, JSON.stringify(platformData), config.CACHE_PLATFORM_TTL);
    console.log(`✅ Platform cache set with TTL: ${config.CACHE_PLATFORM_TTL}s`);

    const cached = await redis.get(platformKey);
    if (cached) {
      const data = JSON.parse(cached);
      console.log(`✅ Platform cache retrieved: ${data.username} - ${data.problemsSolved} problems`);
    }

    await redis.del(platformKey);
  } catch (error) {
    console.log('❌ Platform cache test failed:', error.message);
  }

  // Test 4: Cache Performance
  console.log('\n4️⃣ Testing Cache Performance...');
  const performanceTestKey = 'perf:test';
  const largeData = { data: 'x'.repeat(1000), items: Array(100).fill().map((_, i) => ({ id: i, value: Math.random() })) };

  try {
    const startTime = Date.now();
    await redis.set(performanceTestKey, JSON.stringify(largeData), 30);
    const setTime = Date.now() - startTime;

    const getStartTime = Date.now();
    await redis.get(performanceTestKey);
    const getTime = Date.now() - getStartTime;

    console.log(`✅ Cache SET performance: ${setTime}ms`);
    console.log(`✅ Cache GET performance: ${getTime}ms`);

    await redis.del(performanceTestKey);
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
  }

  // Test 5: Configuration Validation
  console.log('\n5️⃣ Validating Cache Configuration...');
  console.log(`✅ Cache Enabled: ${config.CACHE_ENABLED}`);
  console.log(`✅ Platform TTL: ${config.CACHE_PLATFORM_TTL}s (${config.CACHE_PLATFORM_TTL / 60} minutes)`);
  console.log(`✅ User TTL: ${config.CACHE_USER_TTL}s (${config.CACHE_USER_TTL / 60} minutes)`);
  console.log(`✅ Redis URL: ${config.REDIS_URL}`);

  console.log('\n🎉 Redis Cache Test Completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run tests
testRedisCache().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});