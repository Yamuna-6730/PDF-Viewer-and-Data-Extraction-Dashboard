"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getFileViewUrl, getFileDownloadUrl } from '../lib/api';
import { toast } from 'sonner';

interface ProxiedPdfViewerProps {
  fileId: string;
  fileName?: string;
  className?: string;
  showControls?: boolean;
}

const ProxiedPdfViewer: React.FC<ProxiedPdfViewerProps> = ({
  fileId,
  fileName = 'document.pdf',
  className = '',
  showControls = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [key, setKey] = useState(0); // For forcing iframe refresh

  const proxyUrl = getFileViewUrl(fileId);
  const downloadUrl = getFileDownloadUrl(fileId);

  useEffect(() => {
    // Reset states when fileId changes
    setIsLoading(true);
    setHasError(false);
    setKey(prev => prev + 1);
  }, [fileId]);

  const handleIframeLoad = () => {
    console.log('PDF loaded successfully via proxy');
    setIsLoading(false);
    setHasError(false);
    toast.success('PDF loaded successfully!');
  };

  const handleIframeError = () => {
    console.error('PDF loading failed via proxy');
    setIsLoading(false);
    setHasError(true);
    toast.error('Failed to load PDF');
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setKey(prev => prev + 1);
    toast.info('Refreshing PDF...');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const handleOpenInNewTab = () => {
    window.open(proxyUrl, '_blank');
    toast.info('Opening PDF in new tab...');
  };

  return (
    <Card className={`w-full ${className}`}>
      {showControls && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Viewer - {fileName}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="min-w-[50px]"
                >
                  {zoomLevel}%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Other Controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                title="Refresh PDF"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewTab}
                title="Open in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showControls ? '' : 'p-0'}>
        <div className="relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Loading PDF...</p>
                <p className="text-xs text-gray-500 mt-1">Via proxy: {proxyUrl}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
              <div className="text-center p-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load PDF</h3>
                <p className="text-gray-600 mb-4">
                  The PDF could not be displayed in the viewer.
                </p>
                <div className="space-x-2">
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button onClick={handleDownload} variant="default" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Proxy URL: {proxyUrl}
                </p>
              </div>
            </div>
          )}

          {/* PDF Iframe */}
          <div 
            className="relative overflow-hidden rounded-lg border border-gray-200"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              width: `${100 * (100 / zoomLevel)}%`,
              height: zoomLevel !== 100 ? `${100 * (100 / zoomLevel)}%` : 'auto',
            }}
          >
            <iframe
              key={key} // Force refresh when key changes
              src={proxyUrl}
              className="w-full h-[800px] border-0"
              title={`PDF Viewer - ${fileName}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                display: hasError ? 'none' : 'block',
              }}
            />
          </div>

          {/* Debug Info */}
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Proxy URL: <code className="bg-gray-200 px-1 rounded">{proxyUrl}</code></span>
              <span>File ID: <code className="bg-gray-200 px-1 rounded">{fileId}</code></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProxiedPdfViewer;
