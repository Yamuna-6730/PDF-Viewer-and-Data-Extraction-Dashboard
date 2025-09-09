"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadPdf, extractInvoice, createInvoice } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Brain, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { IExtractResponse } from "../../lib/types";

type UploadStep = 'select' | 'uploading' | 'extracting' | 'saving' | 'complete';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [aiModel, setAiModel] = useState<'gemini' | 'groq'>('gemini');
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<IExtractResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast.error('Please drop a PDF file');
      }
    }
  }, []);

  const validateFile = (selectedFile: File): boolean => {
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error("File exceeds 25MB limit");
      return false;
    }
    if (selectedFile.type !== 'application/pdf') {
      toast.error("Please select a PDF file");
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    try {
      // Step 1: Upload PDF
      setStep('uploading');
      const uploadResult = await uploadPdf(file);
      setUploadedFileId(uploadResult.fileId);
      toast.success("File uploaded successfully!");

      // Step 2: Extract data with AI
      setStep('extracting');
      const extractResult = await extractInvoice(uploadResult.fileId, aiModel);
      setExtractedData(extractResult);
      toast.success(`Data extracted using ${aiModel.toUpperCase()} AI!`);

      // Step 3: Save to database
      setStep('saving');
      await createInvoice(extractResult.extractedData);
      toast.success("Invoice saved successfully!");
      
      setStep('complete');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/`);
      }, 2000);
    } catch (error) {
      console.error('Upload/Extract error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      setStep('select');
    }
  };

  const resetProcess = () => {
    setFile(null);
    setStep('select');
    setUploadedFileId(null);
    setExtractedData(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStepIcon = (currentStep: UploadStep) => {
    switch (currentStep) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'extracting':
        return <Brain className="h-5 w-5 text-blue-500" />;
      case 'saving':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const getStepDescription = (currentStep: UploadStep) => {
    switch (currentStep) {
      case 'uploading':
        return 'Uploading your PDF file...';
      case 'extracting':
        return `Extracting invoice data using ${aiModel.toUpperCase()} AI...`;
      case 'saving':
        return 'Saving invoice to database...';
      case 'complete':
        return 'Process completed successfully! Redirecting...';
      default:
        return 'Select a PDF file to upload and extract invoice data';
    }
  };

  const isProcessing = ['uploading', 'extracting', 'saving'].includes(step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Upload Invoice PDF</h1>
        <p className="text-muted-foreground mt-2">
          Upload your PDF invoice and let AI extract the data automatically
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            {getStepIcon(step)}
            <div className="flex-1">
              <div className="font-medium">{getStepDescription(step)}</div>
              {step === 'extracting' && extractedData && (
                <div className="text-sm text-muted-foreground mt-1">
                  Processing time: {extractedData.processingTime}ms
                </div>
              )}
            </div>
          </div>
          
          {step === 'complete' && extractedData && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">Data Extracted Successfully!</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Vendor: {extractedData.extractedData.vendor.name} • 
                    Invoice: {extractedData.extractedData.invoice.number} • 
                    Total: {extractedData.extractedData.invoice.total ? 
                      new Intl.NumberFormat('en-US', { style: 'currency', currency: extractedData.extractedData.invoice.currency || 'USD' })
                        .format(extractedData.extractedData.invoice.total) 
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Upload Card */}
      {step === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>Select PDF File</CardTitle>
            <CardDescription>
              Choose a PDF invoice file to upload and extract data from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Extraction Model</Label>
              <Select value={aiModel} onValueChange={(value: 'gemini' | 'groq') => setAiModel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini (Recommended)</SelectItem>
                  <SelectItem value="groq">Groq (Fast)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {aiModel === 'gemini' 
                  ? 'Google\'s powerful multimodal AI with excellent document understanding'
                  : 'Ultra-fast inference with Groq\'s specialized hardware'
                }
              </p>
            </div>

            {/* File Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : file 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your PDF here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Maximum file size: 25MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                onClick={handleUploadAndExtract} 
                disabled={!file || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Upload & Extract Data
                  </>
                )}
              </Button>
              
              {file && (
                <Button variant="outline" onClick={resetProcess} disabled={isProcessing}>
                  Clear
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">How it works</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <li>• Upload your PDF invoice file</li>
                    <li>• AI extracts vendor info, line items, and totals</li>
                    <li>• Data is automatically saved to your dashboard</li>
                    <li>• You can review and edit the extracted data anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
