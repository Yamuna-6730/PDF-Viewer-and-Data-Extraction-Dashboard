"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  FileText,
  Loader2,
  Upload,
  Save,
  Trash2,
  Plus,
  Sparkles,
  Calculator
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { 
  uploadPdf, 
  extractInvoice, 
  fetchInvoices, 
  fetchInvoice, 
  updateInvoice,
  deleteInvoice,
  getFileDownloadUrl,
  getFileViewUrl,
  checkApiHealth,
  createInvoice
} from "../lib/api";
import type { IInvoice, IExtractResponse, ILineItem } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ProxiedPdfViewer from "../components/ProxiedPdfViewer";

export default function DocumentReviewPage() {
  const { user } = useAuth();
  
  // State for the component
  const [currentInvoice, setCurrentInvoice] = useState<IInvoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'groq'>('gemini');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingLineItem, setEditingLineItem] = useState<string | null>(null);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.1));
  
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };


  // Handle file drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle file upload and extraction
  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Upload the file
      const uploadResponse = await uploadPdf(file);
      
      // 2. Create a basic invoice object in backend
      const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const invoiceData = {
        fileId: uploadResponse.fileId,
        fileName: file.name,
        vendor: {
          name: 'Unknown Vendor', // Required field with default value
          address: '',
          taxId: ''
        },
        invoice: {
          number: `INV-${Date.now()}`, // Required field with unique default value
          date: now, // Required field with current date
          currency: 'USD',
          subtotal: 0,
          taxPercent: 10,
          total: 0,
          poNumber: '',
          poDate: '',
          lineItems: []
        }
      };
      
      console.log('Sending invoice data:', invoiceData);
      const createdInvoice = await createInvoice(invoiceData);
      setCurrentInvoice(createdInvoice);
      toast.success('PDF uploaded successfully. Click "Extract with AI" to analyze the document.');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI extraction
  const handleExtractWithAI = async () => {
    if (!currentInvoice?.fileId) {
      toast.error('No file uploaded');
      return;
    }

    try {
      setIsExtracting(true);
      
      // Extract invoice data using AI
      const extractResponse: IExtractResponse = await extractInvoice(currentInvoice.fileId, selectedModel);
      
      // Update the current invoice with extracted data
      const updatedInvoice = {
        ...currentInvoice,
        ...extractResponse.extractedData,
        updatedAt: new Date().toISOString()
      };
      
      // Save to backend
      const savedInvoice = await updateInvoice(currentInvoice._id!, updatedInvoice);
      setCurrentInvoice(savedInvoice);
      toast.success('Invoice data extracted and saved successfully!');
    } catch (error) {
      console.error('Error extracting invoice data:', error);
      toast.error('Failed to extract invoice data. Please try again or fill the form manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle approve action
  const handleApprove = async () => {
    if (!currentInvoice?._id) return;
    
    try {
      setIsSubmitting(true);
      const updatedInvoice = {
        ...currentInvoice,
        status: 'approved' as const
      };
      await updateInvoice(currentInvoice._id, updatedInvoice);
      setCurrentInvoice(updatedInvoice);
      toast.success('Document approved successfully! Redirecting to invoices...');
      
      // Redirect to invoices page after 2 seconds
      setTimeout(() => {
        window.location.href = '/invoices';
      }, 2000);
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!currentInvoice?._id) return;
    
    try {
      setIsSubmitting(true);
      const updatedInvoice = {
        ...currentInvoice,
        status: 'rejected' as const
      };
      const savedInvoice = await updateInvoice(currentInvoice._id, updatedInvoice);
      setCurrentInvoice(savedInvoice);
      toast.success('Document rejected');
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!currentInvoice) return { subtotal: 0, total: 0 };
    
    const subtotal = currentInvoice.invoice.lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100));
    }, 0);
    
    const tax = subtotal * (currentInvoice.invoice.taxPercent || 0) / 100;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  // Add new line item
  const addLineItem = () => {
    if (!currentInvoice) return;
    
    const newLineItem: ILineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0
    };
    
    const updatedInvoice = {
      ...currentInvoice,
      invoice: {
        ...currentInvoice.invoice,
        lineItems: [...currentInvoice.invoice.lineItems, newLineItem]
      }
    };
    
    setCurrentInvoice(updatedInvoice);
    setEditingLineItem(newLineItem.id!);
  };

  // Delete line item
  const deleteLineItem = (itemIndex: number) => {
    if (!currentInvoice) return;
    
    const updatedInvoice = {
      ...currentInvoice,
      invoice: {
        ...currentInvoice.invoice,
        lineItems: currentInvoice.invoice.lineItems.filter((_, index) => index !== itemIndex)
      }
    };
    
    setCurrentInvoice(updatedInvoice);
  };

  // Update line item
  const updateLineItem = (itemId: string, field: string, value: any) => {
    if (!currentInvoice) return;
    
    const updatedLineItems = currentInvoice.invoice.lineItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate item total
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice * (1 - (updatedItem.discount || 0) / 100);
        return updatedItem;
      }
      return item;
    });
    
    const updatedInvoice = {
      ...currentInvoice,
      invoice: {
        ...currentInvoice.invoice,
        lineItems: updatedLineItems
      }
    };
    
    setCurrentInvoice(updatedInvoice);
  };

  // Save invoice
  const handleSaveInvoice = async () => {
    if (!currentInvoice?._id) return;
    
    try {
      setIsSubmitting(true);
      const savedInvoice = await updateInvoice(currentInvoice._id, currentInvoice);
      setCurrentInvoice(savedInvoice);
      toast.success('Invoice saved successfully');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await deleteInvoice(id);
      setCurrentInvoice(null);
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  // Load invoice data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check if we have an invoice ID in the URL
        const params = new URLSearchParams(window.location.search);
        const invoiceId = params.get('id');
        
        if (invoiceId) {
          setIsLoading(true);
          // Load specific invoice
          const invoice = await fetchInvoice(invoiceId);
          setCurrentInvoice(invoice);
        }
        // Don't load recent invoices automatically - let user upload/select
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast.error('Failed to load invoice data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotals();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <div className="flex flex-1 gap-6 p-6">
          {/* Left Panel - PDF Viewer */}
          <div className="w-1/2 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Document Viewer</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 2}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                {currentInvoice && (
                  <a
                    href={getFileDownloadUrl(currentInvoice.fileId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </a>
                )}
              </div>
            </div>
            
            <div className="h-[calc(100vh-200px)] overflow-auto bg-gray-100">
              {currentInvoice ? (
                <ProxiedPdfViewer 
                  fileId={currentInvoice.fileId}
                  fileName={currentInvoice.fileName}
                  className="h-full"
                  showControls={false}
                />
              ) : (
                <div 
                  className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-colors ${
                    isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Drag and drop a PDF file</h3>
                  <p className="text-sm text-gray-500 mb-4">or click to browse files (max 25MB)</p>
                  <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Invoice Management */}
          <div className="w-1/2 space-y-4 overflow-y-auto">
            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {!currentInvoice && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center text-blue-600 border-blue-200"
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload PDF
                    </Button>
                  )}
                  
                  {currentInvoice && (currentInvoice as any).status !== 'approved' && (
                    <>
                      <Select 
                        value={selectedModel} 
                        onValueChange={(value: 'gemini' | 'groq') => setSelectedModel(value)}
                        disabled={isExtracting}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Gemini</SelectItem>
                          <SelectItem value="groq">Groq</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleExtractWithAI}
                        disabled={!currentInvoice || isExtracting}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isExtracting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                        Extract with AI
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSaveInvoice}
                        disabled={!currentInvoice || isSubmitting}
                        className="text-green-600 border-green-200"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleApprove}
                        disabled={!currentInvoice || isSubmitting}
                        className="text-green-600 border-green-200"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleReject}
                        disabled={!currentInvoice || isSubmitting}
                        className="text-red-600 border-red-200"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {currentInvoice && (currentInvoice as any).status === 'approved' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Invoice Approved</span>
                    </div>
                  )}
                </div>
                
                {currentInvoice && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <strong>File:</strong> {currentInvoice.fileName} | 
                    <strong>Status:</strong> {(currentInvoice as any).status || 'Draft'}
                  </div>
                )}
              </CardContent>
            </Card>

            {currentInvoice ? (
              <div className="space-y-4">
                {/* Vendor Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Vendor Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="vendor-name" className="text-xs font-medium text-gray-600">Vendor Name</Label>
                      <Input 
                        id="vendor-name"
                        value={currentInvoice?.vendor?.name || ''}
                        onChange={(e) => {
                          if (currentInvoice) {
                            const updated = {
                              ...currentInvoice,
                              vendor: { ...currentInvoice.vendor, name: e.target.value }
                            };
                            setCurrentInvoice(updated);
                          }
                        }}
                        className="mt-1"
                        placeholder="Enter vendor name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendor-address" className="text-xs font-medium text-gray-600">Address</Label>
                      <Input 
                        id="vendor-address"
                        value={currentInvoice?.vendor?.address || ''}
                        onChange={(e) => {
                          if (currentInvoice) {
                            const updated = {
                              ...currentInvoice,
                              vendor: { ...currentInvoice.vendor, address: e.target.value }
                            };
                            setCurrentInvoice(updated);
                          }
                        }}
                        className="mt-1"
                        placeholder="Enter vendor address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax-id" className="text-xs font-medium text-gray-600">Tax ID</Label>
                      <Input 
                        id="tax-id"
                        value={currentInvoice?.vendor?.taxId || ''}
                        onChange={(e) => {
                          if (currentInvoice) {
                            const updated = {
                              ...currentInvoice,
                              vendor: { ...currentInvoice.vendor, taxId: e.target.value }
                            };
                            setCurrentInvoice(updated);
                          }
                        }}
                        className="mt-1"
                        placeholder="Enter tax ID"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="invoice-number" className="text-xs font-medium text-gray-600">Invoice Number</Label>
                        <Input 
                          id="invoice-number"
                          value={currentInvoice?.invoice?.number || ''}
                          onChange={(e) => {
                            if (currentInvoice) {
                              const updated = {
                                ...currentInvoice,
                                invoice: { ...currentInvoice.invoice, number: e.target.value }
                              };
                              setCurrentInvoice(updated);
                            }
                          }}
                          className="mt-1"
                          placeholder="INV-001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invoice-date" className="text-xs font-medium text-gray-600">Invoice Date</Label>
                        <Input 
                          id="invoice-date"
                          type="date"
                          value={currentInvoice?.invoice?.date || ''}
                          onChange={(e) => {
                            if (currentInvoice) {
                              const updated = {
                                ...currentInvoice,
                                invoice: { ...currentInvoice.invoice, date: e.target.value }
                              };
                              setCurrentInvoice(updated);
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency" className="text-xs font-medium text-gray-600">Currency</Label>
                        <Input 
                          id="currency"
                          value={currentInvoice?.invoice?.currency || 'USD'}
                          onChange={(e) => {
                            if (currentInvoice) {
                              const updated = {
                                ...currentInvoice,
                                invoice: { ...currentInvoice.invoice, currency: e.target.value }
                              };
                              setCurrentInvoice(updated);
                            }
                          }}
                          className="mt-1"
                          placeholder="USD"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax-percent" className="text-xs font-medium text-gray-600">Tax %</Label>
                        <Input 
                          id="tax-percent"
                          type="number"
                          value={currentInvoice?.invoice?.taxPercent || 0}
                          onChange={(e) => {
                            if (currentInvoice) {
                              const updated = {
                                ...currentInvoice,
                                invoice: { ...currentInvoice.invoice, taxPercent: parseFloat(e.target.value) || 0 }
                              };
                              setCurrentInvoice(updated);
                            }
                          }}
                          className="mt-1"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base flex items-center">
                        Line Items ({currentInvoice.invoice.lineItems.length})
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addLineItem}
                        className="text-blue-600 border-blue-200"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentInvoice.invoice.lineItems.map((item, index) => (
                        <div key={item.id || index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Item #{index + 1}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteLineItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Description</Label>
                            <Input 
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id!, 'description', e.target.value)}
                              className="mt-1"
                              placeholder="Item description"
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs font-medium text-gray-600">Quantity</Label>
                              <Input 
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id!, 'quantity', parseFloat(e.target.value) || 0)}
                                className="mt-1"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600">Unit Price</Label>
                              <Input 
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id!, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="mt-1"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600">Discount %</Label>
                              <Input 
                                type="number"
                                value={item.discount || 0}
                                onChange={(e) => updateLineItem(item.id!, 'discount', parseFloat(e.target.value) || 0)}
                                className="mt-1"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-700">
                              Total: {currentInvoice.invoice.currency} {item.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {currentInvoice.invoice.lineItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p>No line items added yet</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addLineItem}
                            className="mt-2 text-blue-600 border-blue-200"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add First Item
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Totals */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Calculator className="h-4 w-4 mr-2" />
                      Totals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{currentInvoice.invoice.currency} {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax ({currentInvoice.invoice.taxPercent}%):</span>
                        <span className="font-medium">{currentInvoice.invoice.currency} {tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>{currentInvoice.invoice.currency} {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No document selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a PDF to get started
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          className="hidden"
        />
      </div>
    </ProtectedRoute>
  );
}
