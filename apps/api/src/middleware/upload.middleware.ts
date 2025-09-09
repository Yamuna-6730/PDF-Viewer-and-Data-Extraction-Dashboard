import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '26214400', 10); // 25MB default

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to only allow PDFs
const fileFilter = (_req: any, file: Express.Multer.File, cb: FileFilterCallback): void => {
  // Check file extension
  if (!file.originalname.toLowerCase().endsWith('.pdf')) {
    return cb(new Error('Only PDF files are allowed'));
  }

  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid file type. Only PDF files are allowed'));
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow single file upload
  },
});

// Middleware function for single file upload
export const uploadSingle = upload.single('pdf');

// Error handling middleware for multer errors
export const handleUploadError = (error: any, _req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size allowed is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Only one file allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Use "pdf" as the field name';
        break;
      default:
        message = error.message || 'File upload error';
        break;
    }

    res.status(statusCode).json({
      success: false,
      error: message
    });
    return;
  }

  if (error.message.includes('Only PDF files are allowed') || 
      error.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      error: error.message
    });
    return;
  }

  next(error);
};

// Validate uploaded file
export const validateUploadedFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded. Please upload a PDF file'
    });
    return;
  }

  // Additional validation
  if (!req.file.buffer || req.file.buffer.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Uploaded file is empty'
    });
    return;
  }

  // Validate file size again (just in case)
  if (req.file.size > MAX_FILE_SIZE) {
    res.status(400).json({
      success: false,
      error: `File too large. Maximum size allowed is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
    });
    return;
  }

  next();
};

export default {
  uploadSingle,
  handleUploadError,
  validateUploadedFile
};
