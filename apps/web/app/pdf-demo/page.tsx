"use client";

import PdfViewerWithUpload from '../../components/PdfViewerWithUpload';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export default function PdfDemoPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Viewer Demo
            </h1>
            <p className="text-gray-600">
              Complete PDF upload, viewing, and navigation component
            </p>
          </div>
          
          <PdfViewerWithUpload 
            apiBaseUrl="http://localhost:4000/api"
            maxFileSize={25}
            className="bg-white rounded-lg shadow-sm"
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
