import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Secure file upload configuration
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'text/plain': '.txt'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;

// Secure storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!ALLOWED_TYPES[file.mimetype]) {
    return cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
  
  // Check file extension matches MIME type
  const expectedExt = ALLOWED_TYPES[file.mimetype];
  const actualExt = path.extname(file.originalname).toLowerCase();
  
  if (expectedExt !== actualExt) {
    return cb(new Error('File extension does not match MIME type'), false);
  }
  
  cb(null, true);
};

// Configure multer with security settings
export const secureUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fieldNameSize: 100,
    fieldSize: 1024
  }
});

// File validation middleware
export const validateUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files uploaded'
    });
  }
  
  // Additional security checks
  for (const file of req.files) {
    // Check for null bytes (directory traversal)
    if (file.originalname.includes('\0')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    // Check filename length
    if (file.originalname.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Filename too long'
      });
    }
  }
  
  next();
};