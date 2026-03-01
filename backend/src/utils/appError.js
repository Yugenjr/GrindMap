export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = null, meta = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.code = code;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message, statusCode, code = null, meta = null) => new AppError(message, statusCode, true, code, meta);