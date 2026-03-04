import express from 'express';
import FileUploadController from '../controllers/fileUpload.controller.js';
import { secureUpload, validateUpload } from '../middlewares/secureUpload.middleware.js';
import { advancedRateLimit } from '../middlewares/antiBypassRateLimit.middleware.js';
import { param } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Upload files with security middleware
router.post('/upload',
  advancedRateLimit,
  secureUpload.array('files', 3),
  validateUpload,
  FileUploadController.uploadFiles
);

// Delete file
router.delete('/:fileId',
  advancedRateLimit,
  [
    param('fileId').isMongoId().withMessage('Invalid file ID format').escape(),
    handleValidationErrors
  ],
  FileUploadController.deleteFile
);

// Get upload info
router.get('/info', (req, res) => {
  res.json({
    success: true,
    limits: {
      maxFileSize: '5MB',
      maxFiles: 3,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
    }
  });
});

export default router;