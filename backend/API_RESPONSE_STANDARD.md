# API Response Standards

## Overview

All API endpoints in the GrindMap backend follow a consistent response structure to ensure seamless frontend integration and predictable error handling.

## Response Structure

### Success Response

All successful API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "meta": {
    // Optional metadata (pagination, timestamps, etc.)
  }
}
```

#### Fields:
- **success** (boolean): Always `true` for successful responses
- **message** (string): Human-readable success message
- **data** (object|array|null): The actual response data. Can be `null` for operations that don't return data (e.g., delete operations)
- **meta** (object, optional): Additional metadata such as pagination info, timestamps, etc.

### Error Response

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": {
    "code": "ERROR_CODE",
    "details": {},
    "stack": "Error stack trace (development only)"
  }
}
```

#### Fields:
- **success** (boolean): Always `false` for error responses
- **message** (string): Human-readable error message
- **error** (object): Error details
  - **code** (string): Machine-readable error code (see Error Codes section)
  - **details** (object, optional): Additional error context
  - **stack** (string, optional): Stack trace (only in development mode)

## HTTP Status Codes

### Success Codes
- **200 OK**: Successful GET, PUT, PATCH, or DELETE request
- **201 Created**: Successful POST request that creates a resource
- **204 No Content**: Successful request with no response body

### Client Error Codes
- **400 Bad Request**: Invalid request data or validation error
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource not found
- **409 Conflict**: Conflict with existing resource
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Invalid response from upstream server
- **503 Service Unavailable**: Server temporarily unavailable

## Error Codes

All errors include a machine-readable error code in the `error.code` field:

### Authentication & Authorization
- `INVALID_CREDENTIALS`: Invalid username or password
- `USER_EXISTS`: User already registered
- `USER_NOT_FOUND`: User account not found
- `UNAUTHORIZED`: Authentication required
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: JWT token is invalid or malformed

### Validation
- `VALIDATION_ERROR`: Request validation failed
- `MISSING_REQUIRED_FIELDS`: Required fields are missing
- `INVALID_INPUT`: Input data format is invalid

### Database
- `DATABASE_ERROR`: Database operation failed
- `DUPLICATE_ENTRY`: Duplicate unique field value

### Scraping
- `SCRAPE_FAILED`: Platform scraping failed
- `PLATFORM_NOT_FOUND`: Platform not supported
- `RATE_LIMIT_EXCEEDED`: Too many requests to external platform

### Generic
- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `NOT_FOUND`: Resource or route not found
- `BAD_REQUEST`: Invalid request

## Usage Examples

### Using the Response Utility in Controllers

```javascript
import { sendSuccess, RESPONSE_MESSAGES, ERROR_CODES } from '../utils/response.util.js';
import { AppError } from '../utils/appError.js';

// Success response
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data: { user },
  });
});

// Success response with metadata
export const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const users = await User.find().limit(limit).skip((page - 1) * limit);
  const total = await User.countDocuments();
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data: { users },
    meta: {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// Error response
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError(
      'User not found',
      404,
      true,
      ERROR_CODES.USER_NOT_FOUND
    ));
  }
  
  await user.delete();
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.DELETE_SUCCESS,
    data: null,
  });
});
```

### Paginated Response Helper

For paginated responses, use the `paginatedResponse` helper:

```javascript
import { sendSuccess, paginatedResponse } from '../utils/response.util.js';

export const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const users = await User.find().limit(limit).skip((page - 1) * limit);
  const total = await User.countDocuments();
  
  const { data, meta } = paginatedResponse(users, page, limit, total);
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data,
    meta,
  });
});
```

## Example API Responses

### User Registration (Success)

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### User Registration Error (Duplicate)

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "existing@example.com",
  "password": "password123"
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "User already exists",
  "error": {
    "code": "USER_EXISTS"
  }
}
```

### Login (Success)

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login Error (Invalid Credentials)

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "wrongPassword"
}
```

**Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "message": "Invalid credentials",
  "error": {
    "code": "INVALID_CREDENTIALS"
  }
}
```

### Get User Profile (Success)

**Request:**
```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "bio": "Software developer",
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-15T14:30:00.000Z"
    }
  }
}
```

### Validation Error

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "invalid-email"
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "email must be a valid email, password is required",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

### Not Found Error

**Request:**
```http
GET /api/users/nonexistent
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "message": "User not found",
  "error": {
    "code": "USER_NOT_FOUND"
  }
}
```

### Paginated Response Example

**Request:**
```http
GET /api/activities?page=2&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "platform": "leetcode",
      "problemsSolved": 150,
      "date": "2026-02-28"
    }
    // ... more items
  ],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": true
    }
  }
}
```

## Frontend Integration

### TypeScript Interfaces

```typescript
// Standard API Response
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: any;
  };
  error?: {
    code: string;
    details?: any;
    stack?: string;
  };
}

// Pagination Metadata
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Usage in API client
async function fetchUser(id: string): Promise<ApiResponse<{ user: User }>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### Axios Interceptor Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const apiError = error.response?.data;
    
    // Handle consistent error structure
    if (apiError?.error?.code === 'TOKEN_EXPIRED') {
      // Refresh token or redirect to login
    }
    
    // Return standardized error
    return Promise.reject({
      message: apiError?.message || 'An error occurred',
      code: apiError?.error?.code || 'UNKNOWN_ERROR',
      details: apiError?.error?.details,
    });
  }
);
```

## Best Practices

1. **Always use the response utility functions** (`sendSuccess`, `sendError`) in controllers
2. **Use predefined messages** from `RESPONSE_MESSAGES` for consistency
3. **Use predefined error codes** from `ERROR_CODES` for machine-readable errors
4. **Include meaningful error details** in the `meta` field when creating `AppError`
5. **Use appropriate HTTP status codes** for different scenarios
6. **Don't expose sensitive information** in error messages (especially in production)
7. **Use the `paginatedResponse` helper** for list endpoints with pagination
8. **Keep error messages user-friendly** while error codes remain technical
9. **Document all custom error codes** in this file when adding new ones
10. **Test error scenarios** to ensure consistent error handling

## Adding New Error Codes

When adding new error codes, follow these steps:

1. Add the error code to `ERROR_CODES` in `response.util.js`:
```javascript
export const ERROR_CODES = {
  // ... existing codes
  NEW_ERROR_CODE: 'NEW_ERROR_CODE',
};
```

2. Use it in your controller:
```javascript
return next(new AppError('Error message', 400, true, ERROR_CODES.NEW_ERROR_CODE));
```

3. Document it in this file under the Error Codes section

## Migration Guide

For existing endpoints that don't follow this standard:

1. Import the response utility:
```javascript
import { sendSuccess, RESPONSE_MESSAGES, ERROR_CODES } from '../utils/response.util.js';
```

2. Replace direct `res.json()` calls:
```javascript
// Before
res.json({ user });

// After
return sendSuccess(res, {
  statusCode: 200,
  message: RESPONSE_MESSAGES.FETCH_SUCCESS,
  data: { user },
});
```

3. Update error handling:
```javascript
// Before
return next(new AppError('User not found', 404));

// After
return next(new AppError('User not found', 404, true, ERROR_CODES.USER_NOT_FOUND));
```

## Testing

### Example Test Cases

```javascript
describe('API Response Standards', () => {
  it('should return success response with correct structure', async () => {
    const response = await request(app).get('/api/users/profile');
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
  });
  
  it('should return error response with correct structure', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrong' });
    
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code');
  });
});
```

## Changelog

### Version 1.0.0 (March 2026)
- Initial standardization of API responses
- Added consistent success and error response structures
- Implemented error codes for all error types
- Created response utility functions
- Updated all existing controllers to use standard responses
- Added comprehensive documentation

---

For questions or suggestions regarding API response standards, please open an issue or contact the backend team.
