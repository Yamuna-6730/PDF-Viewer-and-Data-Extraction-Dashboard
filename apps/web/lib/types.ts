// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Core types
export interface IVendor {
  name: string;
  address?: string;
  taxId?: string;
}

export interface ILineItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface IInvoiceData {
  number: string;
  date: string;
  currency?: string;
  subtotal?: number;
  taxPercent?: number;
  total?: number;
  poNumber?: string;
  poDate?: string;
  lineItems: ILineItem[];
}

export interface IInvoice {
  _id?: string;
  fileId: string;
  fileName: string;
  vendor: IVendor;
  invoice: IInvoiceData;
  createdAt: string;
  updatedAt?: string;
}

// Upload response
export interface IUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

// Extract request and response
export interface IExtractRequest {
  fileId: string;
  model: 'gemini' | 'groq';
}

export interface IExtractResponse {
  extractedData: Omit<IInvoice, '_id' | 'createdAt' | 'updatedAt'>;
  processingTime: number;
  model: string;
}

// Search query
export interface ISearchQuery {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'vendor.name' | 'invoice.number';
  sortOrder?: 'asc' | 'desc';
}

// Legacy aliases for backward compatibility
export type Invoice = IInvoice;
export type UploadResponse = IUploadResponse;
export type ExtractResponse = IExtractResponse;
