import fs from 'fs/promises';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler.js';
import Logger from '../utils/logger.js';

class FileUploadController {
  // Handle secure file upload
  uploadFiles = asyncHandler(async (req, res) => {
    const uploadedFiles = req.files.map(file => ({
      id: path.parse(file.filename).name,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString()
    }));
    
    Logger.info('Files uploaded successfully', {
      count: uploadedFiles.length,
      files: uploadedFiles.map(f => f.originalName)
    });
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  });
  
  // Delete uploaded file
  deleteFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    
    // Validate file ID (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }
    
    try {
      // Find file with this ID
      const uploadDir = 'uploads/temp/';
      const files = await fs.readdir(uploadDir);
      const targetFile = files.find(file => file.startsWith(fileId));
      
      if (!targetFile) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
      
      await fs.unlink(path.join(uploadDir, targetFile));
      
      Logger.info('File deleted successfully', { fileId, filename: targetFile });
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      Logger.error('File deletion failed', { fileId, error: error.message });
      throw error;
    }
  });
}

export default new FileUploadController();