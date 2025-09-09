import { put } from '@vercel/blob';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import crypto from 'crypto';

export interface IFileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url?: string;
}

export interface IStorageService {
  upload(file: Buffer | Readable, fileName: string, mimeType: string): Promise<IFileMetadata>;
  download(fileId: string): Promise<Buffer>;
  delete(fileId: string): Promise<void>;
  getFileInfo(fileId: string): Promise<IFileMetadata>;
}

class VercelBlobStorageService implements IStorageService {
  async upload(file: Buffer, fileName: string, mimeType: string): Promise<IFileMetadata> {
    try {
      if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
        throw new Error('VERCEL_BLOB_READ_WRITE_TOKEN is not configured');
      }

      const fileId = crypto.randomUUID();
      const blob = await put(`${fileId}-${fileName}`, file, {
        access: 'public',
        contentType: mimeType,
      });

      return {
        fileId,
        fileName,
        fileSize: file.length,
        mimeType,
        uploadedAt: new Date().toISOString(),
        url: blob.url
      };
    } catch (error) {
      console.error('Vercel Blob upload error:', error);
      throw new Error(`Failed to upload file to Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async download(_fileId: string): Promise<Buffer> {
    try {
      // For Vercel Blob, we would need to store the URL and fetch it
      // This is a simplified implementation
      throw new Error('Download from Vercel Blob not implemented in this demo');
    } catch (error) {
      console.error('Vercel Blob download error:', error);
      throw new Error(`Failed to download file from Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(_fileId: string): Promise<void> {
    try {
      // For Vercel Blob, we would need to store the URL and delete it
      // This is a simplified implementation
      throw new Error('Delete from Vercel Blob not implemented in this demo');
    } catch (error) {
      console.error('Vercel Blob delete error:', error);
      throw new Error(`Failed to delete file from Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(_fileId: string): Promise<IFileMetadata> {
    throw new Error('Get file info from Vercel Blob not implemented in this demo');
  }
}

class GridFSStorageService implements IStorageService {
  private getBucket(): GridFSBucket {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    return new GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
  }

  async upload(file: Buffer | Readable, fileName: string, mimeType: string): Promise<IFileMetadata> {
    try {
      const fileId = crypto.randomUUID();
      const bucket = this.getBucket();
      
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStreamWithId(
          new ObjectId(fileId.replace(/-/g, '').substring(0, 24).padEnd(24, '0')),
          fileName,
          {
            contentType: mimeType,
            metadata: {
              fileId,
              originalName: fileName,
              uploadedAt: new Date().toISOString()
            }
          }
        );

        let fileSize = 0;

        if (Buffer.isBuffer(file)) {
          fileSize = file.length;
          const readable = Readable.from(file);
          readable.pipe(uploadStream);
        } else {
          file.on('data', (chunk) => {
            fileSize += chunk.length;
          });
          file.pipe(uploadStream);
        }

        uploadStream.on('error', (error) => {
          console.error('GridFS upload error:', error);
          reject(new Error(`Failed to upload file: ${error.message}`));
        });

        uploadStream.on('finish', () => {
          resolve({
            fileId,
            fileName,
            fileSize,
            mimeType,
            uploadedAt: new Date().toISOString()
          });
        });
      });
    } catch (error) {
      console.error('GridFS upload error:', error);
      throw new Error(`Failed to upload file to GridFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async download(fileId: string): Promise<Buffer> {
    try {
      const objectId = new ObjectId(fileId.replace(/-/g, '').substring(0, 24).padEnd(24, '0'));
      const bucket = this.getBucket();
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const downloadStream = bucket.openDownloadStream(objectId);

        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('error', (error) => {
          console.error('GridFS download error:', error);
          reject(new Error(`Failed to download file: ${error.message}`));
        });

        downloadStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });
    } catch (error) {
      console.error('GridFS download error:', error);
      throw new Error(`Failed to download file from GridFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const objectId = new ObjectId(fileId.replace(/-/g, '').substring(0, 24).padEnd(24, '0'));
      const bucket = this.getBucket();
      await bucket.delete(objectId);
    } catch (error) {
      console.error('GridFS delete error:', error);
      throw new Error(`Failed to delete file from GridFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(fileId: string): Promise<IFileMetadata> {
    try {
      const objectId = new ObjectId(fileId.replace(/-/g, '').substring(0, 24).padEnd(24, '0'));
      const bucket = this.getBucket();
      const files = await bucket.find({ _id: objectId }).toArray();
      
      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0];
      return {
        fileId: file.metadata?.fileId || fileId,
        fileName: file.filename,
        fileSize: file.length,
        mimeType: file.contentType || 'application/octet-stream',
        uploadedAt: file.metadata?.uploadedAt || file.uploadDate.toISOString()
      };
    } catch (error) {
      console.error('GridFS get file info error:', error);
      throw new Error(`Failed to get file info from GridFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Factory function to get the appropriate storage service
export function getStorageService(): IStorageService {
  const useVercelBlob = process.env.VERCEL_BLOB_READ_WRITE_TOKEN && 
                        process.env.NODE_ENV === 'production';
  
  if (useVercelBlob) {
    return new VercelBlobStorageService();
  } else {
    return new GridFSStorageService();
  }
}

export { VercelBlobStorageService, GridFSStorageService };
