# GrindMap Backend

## 📋 Overview

The GrindMap backend is a Node.js/Express API that provides competitive programming statistics from multiple platforms including LeetCode, Codeforces, and CodeChef.

## 🏗️ Architecture

### Project Structure
```
src/
├── config/          # Configuration files
├── constants/       # Application constants
├── controllers/     # HTTP request handlers
├── middlewares/     # Express middlewares
├── models/          # Database models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions
├── app.js          # Express app configuration
└── server.js       # Server entry point
```

### Design Principles
- **Single Responsibility Principle**: Each module has one clear purpose
- **Separation of Concerns**: Controllers, services, and utilities are separated
- **Consistent Error Handling**: Centralized error management
- **Input Validation**: All inputs are validated and sanitized
- **Security First**: Multiple security layers implemented

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables
Create a `.env` file:
```env
NODE_ENV=development
PORT=5001
JWT_SECRET=your_jwt_secret_here
```

## 📚 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Endpoints

#### Health Check
```http
GET /health
```

#### Scraping Endpoints
```http
GET /api/scrape/leetcode/:username
GET /api/scrape/codeforces/:username  
GET /api/scrape/codechef/:username
GET /api/scrape/platforms
```

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

### Response Format
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

## 🔧 Development

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🛡️ Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Sanitization**: XSS protection
- **Security Headers**: OWASP recommended headers
- **CORS Configuration**: Controlled cross-origin access
- **JWT Authentication**: Secure user sessions

## 📊 Monitoring

- **Request Logging**: All requests are logged
- **Security Monitoring**: Suspicious activity detection
- **Performance Tracking**: Response time monitoring
- **Health Checks**: Server status endpoint

## 🚀 Deployment

### Docker
```bash
docker build -t grindmap-backend .
docker run -p 5001:5001 grindmap-backend
```

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure proper JWT_SECRET
- [ ] Set up SSL/TLS
- [ ] Configure reverse proxy
- [ ] Set up monitoring
- [ ] Configure logging

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Run linting before committing
5. Use conventional commit messages

## 📝 License

MIT License - see LICENSE file for details