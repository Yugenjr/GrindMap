# ✅ Detailed Jest Testing Documentation (GrindMap Backend)

## Purpose of Jest Tests in this Project
The backend uses Jest for automated testing to ensure that:
- Core logic remains stable while making changes
- API endpoints return correct responses
- Normalizers format data consistently
- Controllers & middleware integration works correctly
- Tests also help ensure that contributors can safely refactor without breaking functionality.

## Testing Setup Overview

### Tech Used
- Jest → test runner + assertion framework
- Supertest → API testing by calling Express routes without starting server
- ESM Support → since backend uses import/export

### Project Test Structure

#### Test Files Location
```
backend/src/tests/
```
Example:
- normalizers.test.js
- health.test.js
- api.integration.test.js

### How to Run Tests

#### Run all tests
```bash
cd backend
npm test
```

#### Run with open handle detection (recommended)
```bash
npm test -- --detectOpenHandles
```

#### Run a specific test file
```bash
npm test -- src/tests/health.test.js
```

## Important Jest Config Changes

### backend/jest.config.json
We added:
```json
"setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
```

✅ Why this is needed:
- Ensures environment variables + test config is applied before any test runs
- Makes test runs consistent across machines

### Jest Setup File

#### backend/jest.setup.js
This file is executed automatically before tests run.
Typical tasks done here:
- set NODE_ENV=test
- set required env vars to prevent failures

Example:
```javascript
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
```

✅ Benefits:
- Prevents undefined variables crashing tests
- Makes CI stable

## Key Fix: Disabling Production Security Middlewares in Tests

### Problem
Your health test was failing like:
```
expected 200, got 429
```
Because production middleware blocked supertest requests:
- rate limiter
- bot detection

### Fix Applied in server.js
We detect test mode:
```javascript
const IS_TEST = NODE_ENV === "test";
```
Then bypass advanced security middlewares:
```javascript
if (!IS_TEST) {
  app.use(distributedRateLimit);
  app.use(botDetection);
  app.use(geoSecurityCheck);
  app.use(securityAudit);
  app.use(abuseDetection);
}
```

✅ Why this is safe:
- Only affects test environment
- Production and dev behavior remains unchanged

## ESM Mocking (Biggest Jest Issue)

### Why mocking failed earlier
Errors like:
- require is not defined
- jest is not defined

Because the project uses ESM modules, not CommonJS.

### Correct way to mock ESM modules in Jest
✅ Use:
- `import { jest } from '@jest/globals';`
- `jest.unstable_mockModule()`
- dynamic import after mocking

Example (your working pattern):
```javascript
import { jest } from '@jest/globals';

jest.unstable_mockModule('../services/scraping/leetcode.scraper.js', () => ({
  scrapeLeetCode: jest.fn()
}));

const { scrapeLeetCode } = await import('../services/scraping/leetcode.scraper.js');
```

✅ Why dynamic import is required:
- Because ESM modules are loaded immediately, so mocks must be registered before importing.

## Integration Testing with Supertest

### What is Supertest doing?
It calls Express app directly:
```javascript
const response = await request(app)
  .get('/api/scrape/leetcode/testuser')
  .expect(200);
```

✅ It does NOT require server.listen
✅ It runs faster and avoids open handle issues

## What Each Test Type Covers

### A) Normalizers Unit Tests (normalizers.test.js)
Tests pure transformation functions like:
- normalizeCodeforces()
- normalizeCodeChef()

✅ No network
✅ No DB
✅ Fast + stable

### B) Health Endpoint Tests (health.test.js)
Tests:
- /health route returns expected JSON structure
- fields exist: success, timestamp, database, etc.

✅ Ensures monitoring endpoint doesn't break

### C) API Integration Tests (api.integration.test.js)
Tests actual Express routes end-to-end:
- route matching
- middleware chain
- controller flow

External dependencies are mocked:
- scrapers mocked (avoid puppeteer/network)

✅ Very important for PR validation

## Common Problems & Solutions

### Problem: 429 Too Many Requests during tests
✅ Solution: bypass rate limiting in test mode

### Problem: "require is not defined"
✅ Solution: use ESM mocking with unstable_mockModule

### Problem: Puppeteer/Chrome errors
✅ Solution: mock scraping services instead of calling real ones

### Problem: "Jest did not exit..."
✅ Fix: do not start DB/WebSocket scheduler in tests, or bypass them when NODE_ENV=test

## Final Verification

After changes:
```bash
npm test -- --detectOpenHandles
```

Expected output:
- ✅ Test Suites: 3 passed
- ✅ Tests: 9 passed
- ✅ 0 failed
