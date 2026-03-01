/**
 * API Response Standards - Usage Examples
 * 
 * This file demonstrates how to use the standardized response utilities
 * in various common scenarios throughout the application.
 */

import { sendSuccess, paginatedResponse, RESPONSE_MESSAGES, ERROR_CODES } from '../utils/response.util.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ========================================
// EXAMPLE 1: Simple GET Request
// ========================================
export const getResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new AppError(
      'Resource not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data: { resource },
  });
});

// ========================================
// EXAMPLE 2: Create Resource (POST)
// ========================================
export const createResource = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;
  
  // Check for duplicates
  const exists = await Resource.findOne({ name });
  if (exists) {
    return next(new AppError(
      'Resource with this name already exists',
      409,
      true,
      ERROR_CODES.DUPLICATE_ENTRY,
      { field: 'name' }
    ));
  }
  
  const resource = await Resource.create({ name, description });
  
  return sendSuccess(res, {
    statusCode: 201,
    message: RESPONSE_MESSAGES.CREATE_SUCCESS,
    data: { resource },
  });
});

// ========================================
// EXAMPLE 3: Update Resource (PUT/PATCH)
// ========================================
export const updateResource = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;
  
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    return next(new AppError(
      'Resource not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  // Update fields
  resource.name = name || resource.name;
  resource.description = description || resource.description;
  
  const updated = await resource.save();
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.UPDATE_SUCCESS,
    data: { resource: updated },
  });
});

// ========================================
// EXAMPLE 4: Delete Resource
// ========================================
export const deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);
  
  if (!resource) {
    return next(new AppError(
      'Resource not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.DELETE_SUCCESS,
    data: null,
  });
});

// ========================================
// EXAMPLE 5: List with Pagination
// ========================================
export const listResources = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  
  const skip = (page - 1) * limit;
  const resources = await Resource.find()
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip);
  
  const total = await Resource.countDocuments();
  
  const { data, meta } = paginatedResponse(resources, page, limit, total);
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data,
    meta,
  });
});

// ========================================
// EXAMPLE 6: Search with Filters
// ========================================
export const searchResources = asyncHandler(async (req, res, next) => {
  const { query, category, status, page = 1, limit = 10 } = req.query;
  
  // Build filter object
  const filter = {};
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;
  
  const skip = (page - 1) * limit;
  const resources = await Resource.find(filter)
    .limit(parseInt(limit))
    .skip(skip);
  
  const total = await Resource.countDocuments(filter);
  
  const { data, meta } = paginatedResponse(resources, page, limit, total);
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data,
    meta: {
      ...meta,
      filters: { query, category, status },
    },
  });
});

// ========================================
// EXAMPLE 7: Nested Resources
// ========================================
export const getResourceWithRelations = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id)
    .populate('author', 'name email')
    .populate('category');
  
  if (!resource) {
    return next(new AppError(
      'Resource not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data: {
      resource,
      relatedResources: await Resource.find({ category: resource.category._id })
        .limit(5)
        .select('name description'),
    },
  });
});

// ========================================
// EXAMPLE 8: Bulk Operations
// ========================================
export const bulkDeleteResources = asyncHandler(async (req, res, next) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new AppError(
      'Please provide an array of IDs to delete',
      400,
      true,
      ERROR_CODES.INVALID_INPUT
    ));
  }
  
  const result = await Resource.deleteMany({ _id: { $in: ids } });
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.DELETE_SUCCESS,
    data: {
      deletedCount: result.deletedCount,
    },
    meta: {
      requested: ids.length,
      deleted: result.deletedCount,
    },
  });
});

// ========================================
// EXAMPLE 9: Validation Errors
// ========================================
export const createWithValidation = asyncHandler(async (req, res, next) => {
  const { email, age, name } = req.body;
  
  // Manual validation
  const errors = [];
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  if (age && (age < 18 || age > 100)) {
    errors.push('Age must be between 18 and 100');
  }
  
  if (!name || name.length < 3) {
    errors.push('Name must be at least 3 characters');
  }
  
  if (errors.length > 0) {
    return next(new AppError(
      errors.join(', '),
      400,
      true,
      ERROR_CODES.VALIDATION_ERROR,
      { fields: errors }
    ));
  }
  
  const resource = await Resource.create({ email, age, name });
  
  return sendSuccess(res, {
    statusCode: 201,
    message: RESPONSE_MESSAGES.CREATE_SUCCESS,
    data: { resource },
  });
});

// ========================================
// EXAMPLE 10: Async Operations with Status
// ========================================
export const initiateAsyncOperation = asyncHandler(async (req, res, next) => {
  const operation = await AsyncOperation.create({
    userId: req.user.id,
    status: 'pending',
    type: req.body.type,
  });
  
  // Start async process (e.g., background job)
  processInBackground(operation._id);
  
  return sendSuccess(res, {
    statusCode: 202, // Accepted
    message: 'Operation initiated successfully',
    data: {
      operationId: operation._id,
      status: operation.status,
      statusUrl: `/api/operations/${operation._id}/status`,
    },
  });
});

export const getOperationStatus = asyncHandler(async (req, res, next) => {
  const operation = await AsyncOperation.findById(req.params.id);
  
  if (!operation) {
    return next(new AppError(
      'Operation not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data: {
      operationId: operation._id,
      status: operation.status,
      progress: operation.progress,
      result: operation.result,
    },
  });
});

// ========================================
// EXAMPLE 11: File Upload Response
// ========================================
export const uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError(
      'No file uploaded',
      400,
      true,
      ERROR_CODES.MISSING_REQUIRED_FIELDS
    ));
  }
  
  const file = await File.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    path: req.file.path,
    userId: req.user.id,
  });
  
  return sendSuccess(res, {
    statusCode: 201,
    message: 'File uploaded successfully',
    data: {
      file: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        url: `/uploads/${file.filename}`,
      },
    },
  });
});

// ========================================
// EXAMPLE 12: Aggregate Data Response
// ========================================
export const getStatistics = asyncHandler(async (req, res, next) => {
  const stats = await Resource.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgValue: { $avg: '$value' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
  
  const totalCount = await Resource.countDocuments();
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data: {
      statistics: stats,
      summary: {
        totalResources: totalCount,
        categories: stats.length,
      },
    },
  });
});

// ========================================
// EXAMPLE 13: Authorization Check
// ========================================
export const updateOwnResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new AppError(
      'Resource not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  // Check ownership
  if (resource.userId.toString() !== req.user.id.toString()) {
    return next(new AppError(
      'You do not have permission to update this resource',
      403,
      true,
      ERROR_CODES.UNAUTHORIZED
    ));
  }
  
  resource.name = req.body.name || resource.name;
  const updated = await resource.save();
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.UPDATE_SUCCESS,
    data: { resource: updated },
  });
});

// ========================================
// EXAMPLE 14: Conditional Response
// ========================================
export const getResourceWithConditions = asyncHandler(async (req, res, next) => {
  const { includeStats, includeRelated } = req.query;
  
  const resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new AppError(
      'Resource not found',
      404,
      true,
      ERROR_CODES.NOT_FOUND
    ));
  }
  
  const data = { resource };
  
  // Conditionally include additional data
  if (includeStats === 'true') {
    data.stats = await getResourceStats(resource._id);
  }
  
  if (includeRelated === 'true') {
    data.related = await Resource.find({ category: resource.category })
      .limit(5)
      .select('name');
  }
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.FETCH_SUCCESS,
    data,
  });
});

// ========================================
// EXAMPLE 15: Rate Limited Response
// ========================================
export const rateLimitedEndpoint = asyncHandler(async (req, res, next) => {
  // Rate limiting is typically handled by middleware, but you might
  // want to return remaining quota info
  
  const result = await performExpensiveOperation();
  
  return sendSuccess(res, {
    statusCode: 200,
    message: RESPONSE_MESSAGES.OPERATION_SUCCESS,
    data: { result },
    meta: {
      rateLimit: {
        limit: req.rateLimit?.limit,
        remaining: req.rateLimit?.remaining,
        reset: req.rateLimit?.reset,
      },
    },
  });
});

// ========================================
// Helper Functions (examples)
// ========================================

async function processInBackground(operationId) {
  // Simulate background processing
  setTimeout(async () => {
    await AsyncOperation.findByIdAndUpdate(operationId, {
      status: 'completed',
      completedAt: new Date(),
    });
  }, 5000);
}

async function getResourceStats(resourceId) {
  return {
    views: 1234,
    likes: 56,
    shares: 12,
  };
}

async function performExpensiveOperation() {
  // Simulate expensive operation
  return { data: 'processed' };
}

// Mock models for examples
class Resource {
  static async findById(id) { /* ... */ }
  static async findOne(query) { /* ... */ }
  static async find(query) { return { sort: () => ({ limit: () => ({ skip: () => [] }) }) }; }
  static async create(data) { /* ... */ }
  static async countDocuments(filter) { return 0; }
  static async deleteMany(query) { return { deletedCount: 0 }; }
  static async findByIdAndDelete(id) { /* ... */ }
  static async findByIdAndUpdate(id, update) { /* ... */ }
  static async aggregate(pipeline) { return []; }
  async save() { return this; }
}

class AsyncOperation {
  static async create(data) { /* ... */ }
  static async findById(id) { /* ... */ }
  static async findByIdAndUpdate(id, update) { /* ... */ }
}

class File {
  static async create(data) { /* ... */ }
}
