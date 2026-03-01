import path from 'path';
import { AppError } from '../utils/appError.js';

// File upload security
export const fileUploadSecurity = (req, res, next) => {
  // Check for file upload attempts in non-file endpoints
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    return next(new AppError('File uploads not allowed on this endpoint', 400));
  }

  // Check for suspicious file-related headers
  const suspiciousHeaders = [
    'x-file-name',
    'x-file-type',
    'x-upload-file',
    'content-disposition'
  ];

  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      return next(new AppError('File upload headers detected', 400));
    }
  }

  next();
};

// Validate file extensions in request data
export const validateFileExtensions = (req, res, next) => {
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1'
  ];

  const checkForFiles = (obj) => {
    if (typeof obj !== 'object' || obj === null) return false;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Check if value looks like a filename
        if (value.includes('.') && value.length > 3) {
          const ext = path.extname(value).toLowerCase();
          if (dangerousExtensions.includes(ext)) {
            return true;
          }
        }
      } else if (typeof value === 'object' && checkForFiles(value)) {
        return true;
      }
    }
    return false;
  };

  if (req.body && checkForFiles(req.body)) {
    return next(new AppError('Dangerous file extension detected', 400));
  }

  if (req.query && checkForFiles(req.query)) {
    return next(new AppError('Dangerous file extension in query', 400));
  }

  next();
};

// Check for base64 encoded files
export const detectEncodedFiles = (req, res, next) => {
  const base64Pattern = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,([a-zA-Z0-9\/+=]+)$/;
  
  const checkForBase64 = (obj) => {
    if (typeof obj !== 'object' || obj === null) return false;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (base64Pattern.test(value) || (value.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(value))) {
          return true;
        }
      } else if (typeof value === 'object' && checkForBase64(value)) {
        return true;
      }
    }
    return false;
  };

  if (req.body && checkForBase64(req.body)) {
    return next(new AppError('Encoded file upload detected', 400));
  }

  next();
};