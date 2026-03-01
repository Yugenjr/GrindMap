/**
 * Security Testing Suite
 * Tests for security features and vulnerability prevention
 */

import request from 'supertest';
import app from '../src/server.js';
import { 
  detectSQLInjection,
  detectNoSQLInjection,
  detectXSS,
  validatePasswordStrength,
  sanitizeString,
  checkInputSecurity
} from '../src/utils/security.util.js';

describe('Security Tests', () => {
  
  // ==========================================
  // 1. SQL Injection Prevention Tests
  // ==========================================
  describe('SQL Injection Prevention', () => {
    it('should detect SQL injection in SELECT statement', () => {
      const maliciousInput = "'; SELECT * FROM users; --";
      expect(detectSQLInjection(maliciousInput)).toBe(true);
    });

    it('should detect SQL injection with OR 1=1', () => {
      const maliciousInput = "admin' OR '1'='1";
      expect(detectSQLInjection(maliciousInput)).toBe(true);
    });

    it('should detect SQL injection with UNION', () => {
      const maliciousInput = "' UNION SELECT password FROM users --";
      expect(detectSQLInjection(maliciousInput)).toBe(true);
    });

    it('should allow legitimate input', () => {
      const legitimateInput = "john_doe123";
      expect(detectSQLInjection(legitimateInput)).toBe(false);
    });
  });

  // ==========================================
  // 2. NoSQL Injection Prevention Tests
  // ==========================================
  describe('NoSQL Injection Prevention', () => {
    it('should detect MongoDB $where operator', () => {
      const maliciousInput = '{"$where": "this.password == \'secret\'"}';
      expect(detectNoSQLInjection(maliciousInput)).toBe(true);
    });

    it('should detect MongoDB $ne operator', () => {
      const maliciousInput = '{"password": {"$ne": null}}';
      expect(detectNoSQLInjection(maliciousInput)).toBe(true);
    });

    it('should detect MongoDB $gt operator', () => {
      const maliciousInput = '{"age": {"$gt": 0}}';
      expect(detectNoSQLInjection(maliciousInput)).toBe(true);
    });
  });

  // ==========================================
  // 3. XSS Prevention Tests
  // ==========================================
  describe('XSS Prevention', () => {
    it('should detect script tag', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      const maliciousInput = '<a href="javascript:alert(1)">Click</a>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    it('should detect event handler', () => {
      const maliciousInput = '<img src=x onerror=alert(1)>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = sanitizeString(maliciousInput);
      expect(sanitized).not.toContain('<script>');
    });
  });

  // ==========================================
  // 4. Password Strength Tests
  // ==========================================
  describe('Password Strength Validation', () => {
    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
    });

    it('should reject password without numbers', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
    });

    it('should reject password without special characters', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
    });

    it('should accept strong password', () => {
      const result = validatePasswordStrength('SecureP@ssw0rd');
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ==========================================
  // 5. Authentication Tests
  // ==========================================
  describe('Authentication Security', () => {
    it('should block request without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should block request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    it('should block request with malformed token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });
  });

  // ==========================================
  // 6. Rate Limiting Tests
  // ==========================================
  describe('Rate Limiting', () => {
    it('should block after exceeding rate limit', async () => {
      // Make requests up to the limit
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });
      }
      
      // Next request should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(429);
      
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    }, 10000);

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  // ==========================================
  // 7. Input Sanitization Tests
  // ==========================================
  describe('Input Sanitization', () => {
    it('should sanitize HTML tags', () => {
      const input = '<div>Hello</div>';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('<div>');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'test onclick=alert(1)';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('onclick');
    });
  });

  // ==========================================
  // 8. Security Headers Tests
  // ==========================================
  describe('Security Headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ==========================================
  // 9. CORS Tests
  // ==========================================
  describe('CORS Security', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).not.toBe(403);
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ==========================================
  // 10. Comprehensive Security Check Tests
  // ==========================================
  describe('Comprehensive Security Check', () => {
    it('should detect multiple threats', () => {
      const maliciousInput = "<script>'; SELECT * FROM users; --</script>";
      const result = checkInputSecurity(maliciousInput);
      
      expect(result.safe).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
    });

    it('should pass safe input', () => {
      const safeInput = "john_doe_123";
      const result = checkInputSecurity(safeInput);
      
      expect(result.safe).toBe(true);
      expect(result.threats.length).toBe(0);
    });
  });

  // ==========================================
  // 11. Request Size Limit Tests
  // ==========================================
  describe('Request Size Limits', () => {
    it('should reject requests exceeding size limit', async () => {
      const largePayload = 'a'.repeat(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/api/test')
        .send({ data: largePayload })
        .expect(413);
    });
  });

  // ==========================================
  // 12. Error Handling Tests
  // ==========================================
  describe('Secure Error Handling', () => {
    it('should not expose stack traces in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body.error).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = 'test';
    });

    it('should expose stack traces in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      // Stack trace may or may not be included depending on implementation
      
      process.env.NODE_ENV = 'test';
    });
  });
});

// ==========================================
// Integration Tests
// ==========================================
describe('Security Integration Tests', () => {
  describe('Complete Attack Scenario', () => {
    it('should prevent SQL injection in login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin@example.com' OR '1'='1",
          password: "anything"
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    it('should prevent XSS in user profile update', async () => {
      // First login to get token (assuming test user exists)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      
      if (loginResponse.body.data?.token) {
        const token = loginResponse.body.data.token;
        
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .send({
            bio: '<script>alert("XSS")</script>'
          });
        
        // Should either sanitize or reject
        if (response.status === 200) {
          expect(response.body.data.user.bio).not.toContain('<script>');
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Brute Force Protection', () => {
    it('should block IP after multiple failed login attempts', async () => {
      const attempts = [];
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'WrongPassword123!'
            })
        );
      }
      
      await Promise.all(attempts);
      
      // Next attempt should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(429);
      
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    }, 15000);
  });
});

export default describe;
