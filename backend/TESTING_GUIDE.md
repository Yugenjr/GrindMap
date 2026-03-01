# Testing Guide

> Comprehensive testing framework for GRIND-MAPP backend
> 
> **Issue**: #359 - Comprehensive Testing  
> **Status**: Complete  
> **Coverage**: Scrapers, Controllers, Utilities, Services, Integration Tests

---

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Writing Tests](#writing-tests)
6. [Test Categories](#test-categories)
7. [Mocking Strategies](#mocking-strategies)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The testing framework provides comprehensive coverage for all backend components:

- **Unit Tests**: Individual functions and utilities
- **Integration Tests**: API endpoints and workflows
- **Scraper Tests**: Platform data extraction
- **Controller Tests**: Request handling
- **Service Tests**: Business logic
- **Security Tests**: Vulnerability detection

### Framework Stack

```javascript
{
  "jest": "^29.7.0",           // Test runner
  "supertest": "^6.3.3",       // HTTP assertions
  "babel-jest": "^29.7.0",     // ES6 module support
}
```

---

## Test Structure

```
backend/src/__tests__/
├── controllers.test.js        # Controller tests
├── integration.test.js        # End-to-end tests
├── scrapers.test.js          # Scraper tests
├── security.test.js          # Security tests
├── services.test.js          # Service tests
└── utilities.test.js         # Utility tests
```

### File Naming Convention

- `*.test.js` - Test files
- `__tests__/` - Test directory
- Co-located with source when appropriate

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test scrapers.test.js
npm test controllers.test.js
npm test integration.test.js
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Watch Mode (Development)

```bash
npm test -- --watch
```

### Run Tests in CI Mode

```bash
npm test -- --ci --coverage --maxWorkers=2
```

### Debug Tests

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Test Coverage

### Current Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Statements | 80% | 85% |
| Branches | 75% | 78% |
| Functions | 80% | 82% |
| Lines | 80% | 85% |

### Generate Coverage Report

```bash
npm test -- --coverage --coverageDirectory=coverage
```

View HTML coverage report:
```bash
open coverage/lcov-report/index.html
```

### Coverage Configuration

In `jest.config.json`:

```json
{
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
    "!src/**/*.test.js"
  ],
  "coverageThreshold": {
    "global": {
      "statements": 80,
      "branches": 75,
      "functions": 80,
      "lines": 80
    }
  }
}
```

---

## Writing Tests

### Basic Test Structure

```javascript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Async Tests

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Errors

```javascript
it('should throw error for invalid input', () => {
  expect(() => {
    functionThatThrows();
  }).toThrow('Expected error message');
});

it('should reject promise', async () => {
  await expect(asyncFunctionThatRejects())
    .rejects
    .toThrow('Expected error');
});
```

### Mocking Functions

```javascript
import { jest } from '@jest/globals';

// Mock entire module
jest.mock('../../models/user.model.js');

// Mock specific function
const mockFunction = jest.fn().mockReturnValue('mocked');

// Mock resolved promise
const mockAsync = jest.fn().mockResolvedValue({ data: 'test' });

// Mock rejected promise
const mockError = jest.fn().mockRejectedValue(new Error('Error'));
```

---

## Test Categories

### 1. Scraper Tests (`scrapers.test.js`)

Tests for platform data extraction:

```javascript
describe('LeetCode Scraper', () => {
  it('should scrape valid user profile', async () => {
    const username = 'testuser';
    const result = await scrapeLeetCode(username);
    
    expect(result).toHaveProperty('problemsSolved');
    expect(result).toHaveProperty('rating');
  });
});
```

**Coverage:**
- ✅ LeetCode scraper
- ✅ Codeforces scraper
- ✅ CodeChef scraper
- ✅ GitHub scraper
- ✅ Error handling
- ✅ Data validation
- ✅ Performance tests

### 2. Controller Tests (`controllers.test.js`)

Tests for request handlers:

```javascript
describe('Auth Controller', () => {
  it('should register user successfully', async () => {
    const userData = {
      name: 'Test',
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    const response = await registerUser(userData);
    
    expect(response).toHaveProperty('token');
    expect(response.user).not.toHaveProperty('password');
  });
});
```

**Coverage:**
- ✅ Authentication (register, login, logout)
- ✅ User operations (profile, update, delete)
- ✅ Scraping endpoints
- ✅ Input validation
- ✅ Error responses

### 3. Utility Tests (`utilities.test.js`)

Tests for helper functions:

```javascript
describe('Response Utility', () => {
  it('should send success response', () => {
    const res = mockRes();
    
    sendSuccess(res, {
      message: 'Success',
      data: { id: 1 }
    });
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: { id: 1 }
    });
  });
});
```

**Coverage:**
- ✅ Response utility
- ✅ Security utility
- ✅ AsyncHandler
- ✅ AppError
- ✅ Date utility
- ✅ Retry utility
- ✅ Logger utility

### 4. Service Tests (`services.test.js`)

Tests for business logic:

```javascript
describe('LeetCode Normalizer', () => {
  it('should normalize raw data', () => {
    const rawData = { /* API response */ };
    const normalized = normalizeLeetCode(rawData);
    
    expect(normalized).toHaveProperty('problemsSolved');
    expect(normalized.problemsSolved).toBeGreaterThanOrEqual(0);
  });
});
```

**Coverage:**
- ✅ Data normalization (all platforms)
- ✅ Activity tracking
- ✅ Heatmap generation
- ✅ Platform detection

### 5. Integration Tests (`integration.test.js`)

Tests for complete workflows:

```javascript
describe('Authentication Flow', () => {
  it('should complete full registration and login', async () => {
    // Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    expect(registerResponse.status).toBe(201);
    
    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    
    expect(loginResponse.status).toBe(200);
  });
});
```

**Coverage:**
- ✅ Authentication flows
- ✅ Protected routes
- ✅ Scraping workflows
- ✅ Rate limiting
- ✅ Security validation
- ✅ Error handling
- ✅ Database operations

### 6. Security Tests (`security.test.js`)

Tests for security features:

```javascript
describe('Security Validation', () => {
  it('should detect XSS attempts', () => {
    const malicious = '<script>alert(1)</script>';
    const threat = detectXSS(malicious);
    
    expect(threat.detected).toBe(true);
    expect(threat.type).toBe('XSS');
  });
});
```

**Coverage:**
- ✅ XSS detection
- ✅ SQL injection detection
- ✅ NoSQL injection detection
- ✅ Input sanitization
- ✅ Password validation
- ✅ JWT security

---

## Mocking Strategies

### Mock Express Request/Response

```javascript
const mockReq = () => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};
```

### Mock Database Models

```javascript
jest.mock('../models/user.model.js');

User.findById = jest.fn().mockResolvedValue({
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
});
```

### Mock External APIs

```javascript
jest.mock('axios');

axios.get = jest.fn().mockResolvedValue({
  data: { /* mocked response */ }
});
```

### Mock Environment Variables

```javascript
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.NODE_ENV;
});
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test -- --ci --coverage --maxWorkers=2
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm test -- --findRelatedTests --bail
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:integration": "jest integration.test.js",
    "test:unit": "jest --testPathIgnorePatterns=integration"
  }
}
```

---

## Best Practices

### 1. Test Naming

✅ **Good:**
```javascript
it('should return 404 when user not found', () => {});
it('should hash password before saving', () => {});
```

❌ **Bad:**
```javascript
it('test user', () => {});
it('works', () => {});
```

### 2. Test Organization

```javascript
describe('UserController', () => {
  describe('Registration', () => {
    it('should register with valid data', () => {});
    it('should reject duplicate email', () => {});
    it('should validate password strength', () => {});
  });
  
  describe('Login', () => {
    it('should login with valid credentials', () => {});
    it('should reject invalid credentials', () => {});
  });
});
```

### 3. Arrange-Act-Assert Pattern

```javascript
it('should calculate total correctly', () => {
  // Arrange
  const items = [1, 2, 3];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(6);
});
```

### 4. Test Independence

```javascript
// ✅ Each test is independent
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any shared state
});

// ❌ Don't depend on test order
let sharedState; // Avoid this
```

### 5. Clear Assertions

```javascript
// ✅ Specific assertions
expect(response.status).toBe(200);
expect(response.data).toHaveProperty('user');

// ❌ Vague assertions
expect(response).toBeTruthy();
```

### 6. Test Edge Cases

```javascript
describe('divide function', () => {
  it('should divide positive numbers', () => {});
  it('should divide negative numbers', () => {});
  it('should handle division by zero', () => {});
  it('should handle null inputs', () => {});
});
```

---

## Troubleshooting

### Common Issues

#### 1. Module Import Errors

**Error:**
```
Cannot use import statement outside a module
```

**Solution:**
Ensure `jest.config.json` has:
```json
{
  "transform": {
    "^.+\\.js$": "babel-jest"
  }
}
```

#### 2. Async Test Timeouts

**Error:**
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution:**
```javascript
it('should handle long operation', async () => {
  // Your test
}, 10000); // Increase timeout to 10s
```

#### 3. Mock Not Working

**Error:**
```
Mock not being called
```

**Solution:**
```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Ensure mock is set before importing
jest.mock('./module');
import { function } from './module';
```

#### 4. Coverage Not Generated

**Solution:**
```bash
# Ensure coverage is enabled
npm test -- --coverage --collectCoverageFrom="src/**/*.js"
```

---

## Test Metrics

### Performance Targets

- ⚡ Unit tests: < 100ms each
- ⚡ Integration tests: < 500ms each
- ⚡ Full suite: < 30 seconds

### Quality Metrics

- ✅ All tests pass
- ✅ No random failures
- ✅ Clear, descriptive test names
- ✅ Independent tests
- ✅ Comprehensive coverage

---

## Resources

### Jest Documentation
- [Getting Started](https://jestjs.io/docs/getting-started)
- [API Reference](https://jestjs.io/docs/api)
- [Matchers](https://jestjs.io/docs/expect)

### Supertest
- [GitHub Repository](https://github.com/visionmedia/supertest)
- [API Documentation](https://github.com/visionmedia/supertest#api)

### Testing Best Practices
- [Testing JavaScript](https://testingjavascript.com/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Next Steps

1. **Expand Coverage**: Add more edge case tests
2. **Performance Tests**: Add load testing
3. **E2E Tests**: Add full application tests
4. **Visual Regression**: Add screenshot testing
5. **Mutation Testing**: Add Stryker.js

---

## Support

For questions or issues:

1. Check this guide
2. Review existing tests
3. Check Jest documentation
4. Open an issue on GitHub

---

**Last Updated**: January 2024  
**Maintained By**: GRIND-MAPP Team
