import { 
  IInvoice, 
  IUploadResponse, 
  IExtractRequest,
  IExtractResponse, 
  ApiResponse,
  ISearchQuery 
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Error handler for API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  
  if (!response.ok) {
    // Log detailed error for debugging
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    
    // Handle authentication errors
    if (response.status === 401) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    
    // Include validation details if available
    const errorMessage = data.details ? 
      `${data.error}: ${data.details.join(', ')}` : 
      (data.error || `HTTP error! status: ${response.status}`);
    throw new Error(errorMessage);
  }
  
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data.data;
};

// Upload PDF
export async function uploadPdf(file: File): Promise<IUploadResponse> {
  const formData = new FormData();
  formData.append("pdf", file); // Backend expects 'pdf' field name

  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    credentials: 'include',
    body: formData
  });

  return handleResponse<IUploadResponse>(response);
}

// Extract Invoice Data
export async function extractInvoice(
  fileId: string, 
  model: "gemini" | "groq"
): Promise<IExtractResponse> {
  const response = await fetch(`${API_URL}/api/extract`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, model } as IExtractRequest),
  });

  return handleResponse<IExtractResponse>(response);
}

// Get all invoices with search and pagination
export async function fetchInvoices(
  searchParams?: ISearchQuery
): Promise<{ invoices: IInvoice[]; pagination?: ApiResponse['pagination'] }> {
  const params = new URLSearchParams();
  
  if (searchParams?.q) params.append('q', searchParams.q);
  if (searchParams?.page) params.append('page', searchParams.page.toString());
  if (searchParams?.limit) params.append('limit', searchParams.limit.toString());
  if (searchParams?.sortBy) params.append('sortBy', searchParams.sortBy);
  if (searchParams?.sortOrder) params.append('sortOrder', searchParams.sortOrder);

  const queryString = params.toString();
  const url = `${API_URL}/api/invoices${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    credentials: 'include'
  });
  const result: ApiResponse<IInvoice[]> = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch invoices');
  }
  
  return {
    invoices: result.data || [],
    pagination: result.pagination
  };
}

// Get single invoice
export async function fetchInvoice(id: string): Promise<IInvoice> {
  const response = await fetch(`${API_URL}/invoices/${id}`);
  return handleResponse<IInvoice>(response);
}

// Create new invoice
export async function createInvoice(invoice: Omit<IInvoice, '_id' | 'createdAt' | 'updatedAt'>): Promise<IInvoice> {
  const response = await fetch(`${API_URL}/api/invoices`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
  });
  
  return handleResponse<IInvoice>(response);
}

// Update existing invoice
export async function updateInvoice(
  id: string, 
  invoice: Partial<Omit<IInvoice, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<IInvoice> {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, {
    method: "PUT",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
  });
  
  return handleResponse<IInvoice>(response);
}

// Delete invoice
export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/invoices/${id}`, {
    method: "DELETE"
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete invoice');
  }
}

// Get file info
export async function getFileInfo(fileId: string): Promise<any> {
  const response = await fetch(`${API_URL}/upload/${fileId}`);
  return handleResponse(response);
}

// View file inline via proxy (for iframe embedding without X-Frame-Options issues)
export function getFileViewUrl(fileId: string): string {
  return `/api/proxy/${fileId}`;
}

// Direct backend view URL (may have X-Frame-Options issues)
export function getDirectFileViewUrl(fileId: string): string {
  return `${API_URL}/api/upload/${fileId}/view`;
}

// Download file
export function getFileDownloadUrl(fileId: string): string {
  return `${API_URL}/api/upload/${fileId}/download`;
}

// Health check
export async function checkApiHealth(): Promise<any> {
  const response = await fetch(`${API_URL.replace('/api', '')}/health`);
  const data = await response.json();
  return data;
}

// Legacy compatibility exports
export const saveInvoice = updateInvoice;
