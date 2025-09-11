import express from 'express';
import { uploadSingle, handleUploadError, validateUploadedFile } from '../middleware/upload.middleware';
import { getStorageService } from '../services/fileStorage.service';
import { IApiResponse, IUploadResponse } from '../types/invoice.types';

const router = express.Router();

/**
 * POST /upload
 * Upload a PDF file
 */
router.post('/', 
  uploadSingle as unknown as express.RequestHandler,
  handleUploadError,
  validateUploadedFile,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const file = req.file!;
      const storageService = getStorageService();

      // Upload file to storage
      const fileMetadata = await storageService.upload(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      const response: IApiResponse<IUploadResponse> = {
        success: true,
        data: {
          fileId: fileMetadata.fileId,
          fileName: fileMetadata.fileName,
          fileSize: fileMetadata.fileSize,
          uploadedAt: fileMetadata.uploadedAt
        },
        message: 'File uploaded successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Upload error:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /upload/:fileId
 * Get file information
 */
router.get('/:fileId', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
      return;
    }

    const storageService = getStorageService();
    const fileInfo = await storageService.getFileInfo(fileId);

    const response: IApiResponse = {
      success: true,
      data: fileInfo,
      message: 'File information retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Get file info error:', error);
    
    let statusCode = 500;
    let message = 'Failed to get file information';

    if (error instanceof Error && error.message.includes('not found')) {
      statusCode = 404;
      message = 'File not found';
    }

    const response: IApiResponse = {
      success: false,
      error: message
    };

    res.status(statusCode).json(response);
  }
});

/**
 * OPTIONS /upload/:fileId/view
 * Handle CORS preflight for view endpoint
 */
router.options('/:fileId/view', (req: express.Request, res: express.Response): void => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

/**
 * GET /upload/:fileId/view
 * View a file inline (for embedding in iframe)
 */
router.get('/:fileId/view', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    console.log('View endpoint called with fileId:', fileId);
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
      return;
    }

    const storageService = getStorageService();
    console.log('Storage service obtained:', storageService.constructor.name);
    
    // Get file info first
    console.log('Getting file info for:', fileId);
    const fileInfo = await storageService.getFileInfo(fileId);
    console.log('File info retrieved:', fileInfo);
    
    // Get file content
    console.log('Downloading file content...');
    const fileBuffer = await storageService.download(fileId);
    console.log('File downloaded, size:', fileBuffer.length, 'bytes');

    // Set appropriate headers for inline display
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Remove CSP header to allow iframe embedding
    res.removeHeader('Content-Security-Policy');
    
    console.log('Sending file buffer to client');
    res.send(fileBuffer);
  } catch (error) {
    console.error('View error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    
    let statusCode = 500;
    let message = 'Failed to view file';

    if (error instanceof Error && error.message.includes('not found')) {
      statusCode = 404;
      message = 'File not found';
    }

    const response: IApiResponse = {
      success: false,
      error: message,
      details: error instanceof Error ? error.message : String(error)
    };

    res.status(statusCode).json(response);
  }
});

/**
 * GET /upload/:fileId/download
 * Download a file
 */
router.get('/:fileId/download', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
      return;
    }

    const storageService = getStorageService();
    
    // Get file info first
    const fileInfo = await storageService.getFileInfo(fileId);
    
    // Download file content
    const fileBuffer = await storageService.download(fileId);

    // Set appropriate headers for download
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
    
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download error:', error);
    
    let statusCode = 500;
    let message = 'Failed to download file';

    if (error instanceof Error && error.message.includes('not found')) {
      statusCode = 404;
      message = 'File not found';
    }

    const response: IApiResponse = {
      success: false,
      error: message
    };

    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /upload/:fileId
 * Delete a file
 */
router.delete('/:fileId', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
      return;
    }

    const storageService = getStorageService();
    await storageService.delete(fileId);

    const response: IApiResponse = {
      success: true,
      message: 'File deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete error:', error);
    
    let statusCode = 500;
    let message = 'Failed to delete file';

    if (error instanceof Error && error.message.includes('not found')) {
      statusCode = 404;
      message = 'File not found';
    }

    const response: IApiResponse = {
      success: false,
      error: message
    };

    res.status(statusCode).json(response);
  }
});

export default router;
