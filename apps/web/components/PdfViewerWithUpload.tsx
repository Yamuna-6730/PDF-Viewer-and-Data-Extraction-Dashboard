"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  FileText,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// TypeScript interfaces
interface UploadResponse {
  fileId: string;
  fileName: string;
}

interface PdfDocument {
  doc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
}

interface PdfViewerWithUploadProps {
  apiBaseUrl?: string;
  maxFileSize?: number; // in MB
  className?: string;
}

const PdfViewerWithUpload: React.FC<PdfViewerWithUploadProps> = ({
  apiBaseUrl = 'https://api.example.com',
  maxFileSize = 25,
  className = ''
}) => {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PDF state
  const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // File validation
  const validateFile = useCallback((selectedFile: File): boolean => {
    if (!selectedFile.type.includes('pdf')) {
      setError('Please select a valid PDF file');
      toast.error('Please select a valid PDF file');
      return false;
    }

    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSize}MB`);
      toast.error(`File size must be less than ${maxFileSize}MB`);
      return false;
    }

    return true;
  }, [maxFileSize]);

  // File upload handler
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    
    if (!validateFile(selectedFile)) {
      return;
    }

    setFile(selectedFile);
  }, [validateFile]);

  // Upload to backend
  const uploadFile = useCallback(async (fileToUpload: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await fetch(`${apiBaseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.fileId || !data.fileName) {
        throw new Error('Invalid response from server');
      }

      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [apiBaseUrl]);

  // Handle upload button click
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadFile(file);
      setUploadedFile(result);
      toast.success(`File uploaded successfully: ${result.fileName}`);
      
      // Load the PDF for viewing
      await loadPdf(result.fileId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [file, uploadFile]);

  // Load PDF document
  const loadPdf = useCallback(async (fileId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const pdfUrl = `${apiBaseUrl}/files/${fileId}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const doc = await loadingTask.promise;
      
      setPdfDocument({
        doc,
        totalPages: doc.numPages
      });
      
      setCurrentPage(1);
      toast.success(`PDF loaded successfully (${doc.numPages} pages)`);
    } catch (error) {
      console.error('PDF loading error:', error);
      const errorMessage = 'Failed to load PDF document';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  // Render PDF page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocument || !canvasRef.current || isRendering) return;

    setIsRendering(true);

    try {
      // Cancel any existing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await pdfDocument.doc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      const viewport = page.getViewport({ 
        scale, 
        rotation: rotation 
      });
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error('Page rendering error:', error);
        setError('Failed to render PDF page');
      }
    } finally {
      setIsRendering(false);
    }
  }, [pdfDocument, scale, rotation, isRendering]);

  // Effect to render page when dependencies change
  useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, scale, rotation, renderPage]);

  // Navigation handlers
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (pdfDocument && currentPage < pdfDocument.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pdfDocument]);

  // Zoom handlers
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.2);
  }, []);

  // Rotation handler
  const rotateClockwise = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Download handler
  const downloadPdf = useCallback(() => {
    if (uploadedFile) {
      const downloadUrl = `${apiBaseUrl}/files/${uploadedFile.fileId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = uploadedFile.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [uploadedFile, apiBaseUrl]);

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 space-y-4 ${className}`}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            PDF Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Input */}
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button 
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>

            {/* File Info */}
            {file && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            )}

            {/* Upload Status */}
            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Uploaded: {uploadedFile.fileName}
                </Badge>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Section */}
      {pdfDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Viewer
              </CardTitle>
              
              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetZoom}
                    title="Reset Zoom"
                    className="min-w-[60px]"
                  >
                    {Math.round(scale * 100)}%
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={zoomIn}
                    disabled={scale >= 3.0}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Rotation */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rotateClockwise}
                  title="Rotate"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                {/* Download */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadPdf}
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Page Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                    <span className="text-sm font-medium">
                      Page {currentPage} of {pdfDocument.totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage >= pdfDocument.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Loading indicator */}
                {isRendering && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Rendering...</span>
                  </div>
                )}
              </div>

              {/* PDF Canvas */}
              <div className="flex justify-center">
                <div className="border border-gray-300 shadow-lg rounded-lg overflow-hidden">
                  {isLoading ? (
                    <div className="flex items-center justify-center w-full h-96 bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-gray-600">Loading PDF...</p>
                      </div>
                    </div>
                  ) : (
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto"
                      style={{
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfViewerWithUpload;
