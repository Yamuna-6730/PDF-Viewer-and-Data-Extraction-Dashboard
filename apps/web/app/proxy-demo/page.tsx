"use client";

import { useState } from 'react';
import ProxiedPdfViewer from '../../components/ProxiedPdfViewer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { FileText, Copy, Check } from 'lucide-react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { toast } from 'sonner';

export default function ProxyDemoPage() {
  const [fileId, setFileId] = useState('2aaf1589-118a-4100-94f3-952e10bf3ee7');
  const [fileName, setFileName] = useState('sample-invoice.pdf');
  const [showViewer, setShowViewer] = useState(false);
  const [copied, setCopied] = useState(false);

  const proxyUrl = `/api/proxy/${fileId}`;

  const handleShowViewer = () => {
    if (!fileId.trim()) {
      toast.error('Please enter a file ID');
      return;
    }
    setShowViewer(true);
    toast.success('Loading PDF via proxy...');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${proxyUrl}`);
      setCopied(true);
      toast.success('Proxy URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Proxy Demo
            </h1>
            <p className="text-gray-600">
              Demonstrating iframe PDF display using Next.js API proxy to bypass X-Frame-Options
            </p>
          </div>

          {/* Configuration Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Configuration
              </CardTitle>
              <CardDescription>
                Enter a file ID to load and display the PDF via the proxy route
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fileId">File ID</Label>
                  <Input
                    id="fileId"
                    value={fileId}
                    onChange={(e) => setFileId(e.target.value)}
                    placeholder="Enter file ID (e.g., 2aaf1589-118a-4100-94f3-952e10bf3ee7)"
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="fileName">File Name (Optional)</Label>
                  <Input
                    id="fileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name for display"
                  />
                </div>
              </div>

              {/* Proxy URL Display */}
              <div className="space-y-2">
                <Label>Generated Proxy URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={proxyUrl}
                    readOnly
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button
                    onClick={handleCopyUrl}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* How it works */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">How the Proxy Works:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Frontend requests <code className="bg-blue-100 px-1 rounded">/api/proxy/[fileId]</code></li>
                  <li>Next.js API route fetches PDF from backend: <code className="bg-blue-100 px-1 rounded">http://localhost:4000/api/upload/[fileId]/view</code></li>
                  <li>API route returns PDF with <code className="bg-blue-100 px-1 rounded">Content-Type: application/pdf</code></li>
                  <li>No X-Frame-Options header is set, allowing iframe embedding</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button onClick={handleShowViewer}>
                  Load PDF in Viewer
                </Button>
                {showViewer && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Viewer Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PDF Viewer */}
          {showViewer && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">PDF Viewer (via Proxy)</h2>
              <ProxiedPdfViewer 
                fileId={fileId}
                fileName={fileName}
                showControls={true}
              />
            </div>
          )}

          {/* Technical Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Technical Implementation</CardTitle>
              <CardDescription>
                Understanding the proxy architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">API Route Location:</h4>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /app/api/proxy/[fileId]/route.ts
                  </code>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Backend Integration:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Fetches from: <code className="bg-gray-100 px-1 rounded">http://localhost:4000/api/upload/{"{fileId}"}/view</code></div>
                    <div>• Sets Content-Type: <code className="bg-gray-100 px-1 rounded">application/pdf</code></div>
                    <div>• Removes X-Frame-Options to allow embedding</div>
                    <div>• Streams the PDF content back to the client</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Bypasses CORS and X-Frame-Options restrictions</li>
                    <li>Allows seamless iframe PDF embedding</li>
                    <li>Maintains security by proxying through your own API</li>
                    <li>Provides consistent headers regardless of backend changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
