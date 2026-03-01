import dbManager from '../utils/databaseManager.js';
import Logger from '../utils/logger.js';

// Database operation wrapper with circuit breaker
export const dbOperation = async (operation, context = '') => {
  return dbManager.executeOperation(operation, context);
};

// Model operation wrapper with retry logic
export const modelOperation = async (model, operation, data = null, options = {}) => {
  const { retries = 2, context = '' } = options;
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await dbOperation(async () => {
        switch (operation) {
          case 'find':
            return await model.find(data);
          case 'findOne':
            return await model.findOne(data);
          case 'findById':
            return await model.findById(data);
          case 'create':
            return await model.create(data);
          case 'updateOne':
            return await model.updateOne(data.filter, data.update);
          case 'deleteOne':
            return await model.deleteOne(data);
          case 'aggregate':
            return await model.aggregate(data);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      }, `${context} - ${operation}`);
    } catch (error) {
      Logger.warn('Model operation failed', {
        model: model.modelName,
        operation,
        attempt,
        error: error.message,
        willRetry: attempt <= retries
      });
      
      if (attempt > retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Transaction wrapper with circuit breaker
export const dbTransaction = async (operations) => {
  return dbOperation(async () => {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      const results = [];
      for (const op of operations) {
        const result = await op(session);
        results.push(result);
      }
      
      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }, 'transaction');
};