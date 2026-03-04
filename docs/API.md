# GrindMap API Documentation

<div align="center">

**Complete API Reference for GrindMap Backend**

[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](https://github.com/Yugenjr/GrindMap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*Comprehensive documentation for all GrindMap API endpoints, including authentication, data fetching, and user management.*

</div>

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🔐 Authentication](#-authentication)
- [📊 Scraping Endpoints](#-scraping-endpoints)
- [👤 User Management](#-user-management)
- [🏆 Leaderboard](#-leaderboard)
- [🎯 Goals](#-goals)
- [👥 Friends](#-friends)
- [🏅 Badges](#-badges)
- [🔍 Tracing](#-tracing)
- [⚠️ Error Handling](#️-error-handling)
- [📏 Rate Limiting](#-rate-limiting)
- [🔧 Response Format](#-response-format)

---

## 🚀 Quick Start

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Content Type
All requests should include:
```
Content-Type: application/json
```

---

## 🔐 Authentication

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "60d5ecb74b24c72b8c8b4567",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "60d5ecb74b24c72b8c8b4567",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /auth/profile
Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "60d5ecb74b24c72b8c8b4567",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-06-25T10:30:00.000Z",
    "updatedAt": "2023-06-25T10:30:00.000Z"
  }
}
```

---

## 📊 Scraping Endpoints

### GET /scrape/leetcode/:username
Fetch LeetCode user statistics.

**Parameters:**
- `username` (path): LeetCode username

**Response (200):**
```json
{
  "success": true,
  "message": "LeetCode data fetched for john_doe",
  "data": {
    "platform": "leetcode",
    "username": "john_doe",
    "problemsSolved": 487,
    "easyCount": 245,
    "mediumCount": 198,
    "hardCount": 44,
    "acceptanceRate": 65.2,
    "ranking": 125000,
    "totalSubmissions": 1200
  }
}
```

### GET /scrape/codeforces/:username
Fetch CodeForces user statistics.

**Parameters:**
- `username` (path): CodeForces handle

**Response (200):**
```json
{
  "success": true,
  "message": "Codeforces data fetched for john_doe",
  "data": {
    "platform": "codeforces",
    "username": "john_doe",
    "rating": 1542,
    "rank": "Expert",
    "problemsSolved": 312,
    "contestCount": 45,
    "maxRating": 1678
  }
}
```

### GET /scrape/codechef/:username
Fetch CodeChef user statistics.

**Parameters:**
- `username` (path): CodeChef username

**Response (200):**
```json
{
  "success": true,
  "message": "CodeChef data fetched for john_doe",
  "data": {
    "platform": "codechef",
    "username": "john_doe",
    "rating": 1876,
    "stars": "4★",
    "problemsSolved": 156,
    "contestRating": 1750,
    "globalRank": 5432
  }
}
```

### GET /scrape/platforms
Get list of all supported platforms.

**Response (200):**
```json
{
  "success": true,
  "message": "Supported platforms retrieved",
  "data": {
    "platforms": [
      "leetcode",
      "codeforces",
      "codechef",
      "atcoder",
      "github",
      "skillrack"
    ]
  }
}
```

---

## 👤 User Management

### GET /user/profile
Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "60d5ecb74b24c72b8c8b4567",
    "name": "John Doe",
    "email": "john@example.com",
    "platforms": {
      "leetcode": "john_doe_lc",
      "codeforces": "john_doe_cf",
      "codechef": "john_doe_cc"
    },
    "preferences": {
      "theme": "dark",
      "notifications": true
    },
    "createdAt": "2023-06-25T10:30:00.000Z"
  }
}
```

### PUT /user/profile
Update authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "platforms": {
    "leetcode": "john_smith_lc",
    "codeforces": "john_smith_cf"
  },
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "60d5ecb74b24c72b8c8b4567",
    "name": "John Smith",
    "email": "john@example.com",
    "platforms": {
      "leetcode": "john_smith_lc",
      "codeforces": "john_smith_cf",
      "codechef": "john_doe_cc"
    },
    "preferences": {
      "theme": "light",
      "notifications": false
    }
  }
}
```

---

## 🏆 Leaderboard

### GET /leaderboard/
Get global leaderboard rankings.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of users to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "message": "Leaderboard retrieved successfully",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "60d5ecb74b24c72b8c8b4567",
        "name": "Alice Johnson",
        "totalProblems": 1250,
        "platforms": ["leetcode", "codeforces", "codechef"],
        "score": 2850
      },
      {
        "rank": 2,
        "userId": "60d5ecb74b24c72b8c8b4568",
        "name": "Bob Smith",
        "totalProblems": 1180,
        "platforms": ["leetcode", "codeforces"],
        "score": 2720
      }
    ],
    "totalUsers": 1250,
    "userRank": 15
  }
}
```

### GET /leaderboard/rank
Get current user's rank in leaderboard.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User rank retrieved successfully",
  "data": {
    "rank": 15,
    "totalUsers": 1250,
    "score": 2150,
    "percentile": 98.8
  }
}
```

---

## 🎯 Goals

### POST /goal/initialize
Initialize goal templates (Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Goal templates initialized successfully",
  "data": {
    "templatesCreated": 12
  }
}
```

### GET /goal/templates
Get available goal templates.

**Response (200):**
```json
{
  "success": true,
  "message": "Goal templates retrieved successfully",
  "data": {
    "templates": [
      {
        "_id": "60d5ecb74b24c72b8c8b4569",
        "title": "LeetCode Daily Solver",
        "description": "Solve 1 LeetCode problem every day",
        "target": 1,
        "frequency": "daily",
        "platform": "leetcode",
        "difficulty": "any",
        "duration": 30
      }
    ]
  }
}
```

### GET /goal/
Get authenticated user's goals.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Goals retrieved successfully",
  "data": {
    "goals": [
      {
        "_id": "60d5ecb74b24c72b8c8b456a",
        "title": "LeetCode Daily",
        "description": "Solve 1 problem daily",
        "target": 1,
        "current": 0,
        "frequency": "daily",
        "platform": "leetcode",
        "isCompleted": false,
        "createdAt": "2023-06-25T10:30:00.000Z",
        "deadline": "2023-07-25T10:30:00.000Z"
      }
    ]
  }
}
```

### POST /goal/custom
Create a custom goal.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Custom Goal",
  "description": "Solve 50 medium problems",
  "target": 50,
  "frequency": "weekly",
  "platform": "leetcode",
  "difficulty": "medium",
  "duration": 12
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Custom goal created successfully",
  "data": {
    "_id": "60d5ecb74b24c72b8c8b456b",
    "title": "Custom Goal",
    "description": "Solve 50 medium problems",
    "target": 50,
    "current": 0,
    "frequency": "weekly",
    "platform": "leetcode",
    "difficulty": "medium",
    "isCompleted": false,
    "createdAt": "2023-06-25T10:30:00.000Z",
    "deadline": "2023-09-25T10:30:00.000Z"
  }
}
```

### PATCH /goal/:goalId/progress
Update goal progress.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `goalId` (path): Goal ID

**Request Body:**
```json
{
  "increment": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Goal progress updated successfully",
  "data": {
    "_id": "60d5ecb74b24c72b8c8b456b",
    "title": "Custom Goal",
    "current": 1,
    "target": 50,
    "isCompleted": false
  }
}
```

---

## 👥 Friends

### GET /friends/
Get authenticated user's friends list.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friends retrieved successfully",
  "data": {
    "friends": [
      {
        "_id": "60d5ecb74b24c72b8c8b456c",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "platforms": {
          "leetcode": "jane_doe_lc"
        },
        "addedAt": "2023-06-20T10:30:00.000Z"
      }
    ]
  }
}
```

### POST /friends/add
Add a friend by email.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "email": "friend@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friend added successfully",
  "data": {
    "_id": "60d5ecb74b24c72b8c8b456c",
    "name": "Friend Name",
    "email": "friend@example.com",
    "addedAt": "2023-06-25T10:30:00.000Z"
  }
}
```

### DELETE /friends/:friendId
Remove a friend.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `friendId` (path): Friend's user ID

**Response (200):**
```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

---

## 🏅 Badges

### GET /badge/all
Get all available badges.

**Response (200):**
```json
{
  "success": true,
  "message": "All badges retrieved successfully",
  "data": {
    "badges": [
      {
        "_id": "60d5ecb74b24c72b8c8b456d",
        "name": "First Problem",
        "description": "Solve your first problem",
        "icon": "🎯",
        "category": "achievement",
        "criteria": {
          "type": "problems_solved",
          "value": 1
        }
      }
    ]
  }
}
```

### GET /badge/
Get authenticated user's badges.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User badges retrieved successfully",
  "data": {
    "badges": [
      {
        "_id": "60d5ecb74b24c72b8c8b456d",
        "name": "First Problem",
        "description": "Solve your first problem",
        "icon": "🎯",
        "earnedAt": "2023-06-25T10:30:00.000Z",
        "isNew": false
      }
    ],
    "stats": {
      "totalEarned": 5,
      "totalAvailable": 25
    }
  }
}
```

### POST /badge/check
Check and award new badges based on user stats.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Badges checked successfully",
  "data": {
    "newBadges": [
      {
        "_id": "60d5ecb74b24c72b8c8b456e",
        "name": "Century Club",
        "description": "Solve 100 problems",
        "icon": "💯",
        "earnedAt": "2023-06-25T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 🔍 Tracing

### GET /traces
Get all active traces (last 100).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "traces": [
      {
        "traceId": "abc123",
        "operation": "fetchLeetCodeData",
        "duration": 1250,
        "startTime": 1640995200000,
        "spanCount": 3
      }
    ],
    "total": 45
  }
}
```

### GET /traces/:traceId
Get specific trace details.

**Parameters:**
- `traceId` (path): Trace ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "traceId": "abc123",
    "operation": "fetchLeetCodeData",
    "startTime": 1640995200000,
    "duration": 1250,
    "spans": [
      {
        "name": "validateUsername",
        "startTime": 1640995200000,
        "duration": 50
      }
    ]
  }
}
```

---

## ⚠️ Error Handling

### Common Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `USER_EXISTS` | User already exists with this email | 400 |
| `INVALID_CREDENTIALS` | Invalid email or password | 401 |
| `USER_NOT_FOUND` | User not found | 404 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |
| `NOT_FOUND` | Resource not found | 404 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Access denied | 403 |

### Example Error Response
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorCode": "INVALID_CREDENTIALS"
}
```

---

## 📏 Rate Limiting

### Scraping Endpoints
- **Limit**: 100 requests per hour per IP
- **Window**: 1 hour
- **Applies to**: `/scrape/*` endpoints

### Authentication Endpoints
- **Limit**: 10 requests per minute per IP
- **Window**: 1 minute
- **Applies to**: `/auth/*` endpoints

### Rate Limit Response (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

---

## 🔧 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

### Pagination Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 250,
      "totalPages": 5
    }
  }
}
```

---

<div align="center">

**For questions or support, please open an issue on [GitHub](../../issues)**

*Last updated: January 2026*

</div>
