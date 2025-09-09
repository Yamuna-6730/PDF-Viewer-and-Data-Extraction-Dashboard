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

    // Set appropriate headers
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
