# PDF Review Dashboard API

A robust REST API for the PDF Review Dashboard that handles PDF file uploads, AI-powered data extraction, and invoice management.

## Features

- **File Upload**: Upload PDF files up to 25MB with validation
- **AI Extraction**: Extract invoice data using Gemini AI or Groq
- **CRUD Operations**: Full invoice management with search and pagination
- **Multiple Storage Options**: Vercel Blob or MongoDB GridFS
- **Input Validation**: Comprehensive request validation using Joi
- **Error Handling**: Structured error responses and logging
- **Security**: Helmet for security headers, CORS configuration
- **Health Monitoring**: Health check endpoints

## Quick Start

### Prerequisites

- Node.js ≥18
- MongoDB Atlas account (or local MongoDB)
- Gemini API key or Groq API key
- Optional: Vercel Blob token for production storage

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables

```env
# Server Configuration
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pdf_dashboard

# AI Services
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here

# File Storage (Production)
VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# File Upload Limits
MAX_FILE_SIZE=26214400  # 25MB in bytes
```

## API Endpoints

### Health Check

#### `GET /`
Basic API status check.

**Response:**
```json
{
  "success": true,
  "message": "PDF Review Dashboard API is running 🚀",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

#### `GET /health`
Detailed health information.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connected": true,
    "state": "connected"
  },
  "uptime": 3600,
  "memory": { "rss": 123456789, "heapTotal": 987654321 }
}
```

### File Upload

#### `POST /api/upload`
Upload a PDF file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `pdf`
- Max file size: 25MB
- Allowed types: PDF only

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid-string",
    "fileName": "invoice.pdf",
    "fileSize": 1024576,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

#### `GET /api/upload/:fileId`
Get file information.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid-string",
    "fileName": "invoice.pdf",
    "fileSize": 1024576,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `GET /api/upload/:fileId/download`
Download a file.

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="invoice.pdf"`
- Binary PDF data

#### `DELETE /api/upload/:fileId`
Delete a file.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### AI Extraction

#### `POST /api/extract`
Extract invoice data using AI.

**Request:**
```json
{
  "fileId": "uuid-string",
  "model": "gemini"  // or "groq"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedData": {
      "fileId": "uuid-string",
      "fileName": "invoice.pdf",
      "vendor": {
        "name": "ABC Company",
        "address": "123 Main St",
        "taxId": "123456789"
      },
      "invoice": {
        "number": "INV-001",
        "date": "2024-01-15",
        "currency": "USD",
        "subtotal": 1000.00,
        "taxPercent": 8.5,
        "total": 1085.00,
        "lineItems": [
          {
            "description": "Professional Services",
            "unitPrice": 100.00,
            "quantity": 10,
            "total": 1000.00
          }
        ]
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "processingTime": 2500,
    "model": "gemini"
  },
  "message": "Extraction successful"
}
```

### Invoice Management

#### `GET /api/invoices`
Get all invoices with optional search and pagination.

**Query Parameters:**
- `q` (optional): Search term (searches vendor name and invoice number)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page (max: 100)
- `sortBy` (optional, default: "createdAt"): Sort field
- `sortOrder` (optional, default: "desc"): Sort order ("asc" or "desc")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "mongodb-objectid",
      "fileId": "uuid-string",
      "fileName": "invoice.pdf",
      "vendor": { /* vendor data */ },
      "invoice": { /* invoice data */ },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Found 1 invoice(s)",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### `GET /api/invoices/:id`
Get a specific invoice.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "mongodb-objectid",
    "fileId": "uuid-string",
    "fileName": "invoice.pdf",
    "vendor": { /* vendor data */ },
    "invoice": { /* invoice data */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Invoice retrieved successfully"
}
```

#### `POST /api/invoices`
Create a new invoice.

**Request:**
```json
{
  "fileId": "uuid-string",
  "fileName": "invoice.pdf",
  "vendor": {
    "name": "ABC Company",
    "address": "123 Main St",
    "taxId": "123456789"
  },
  "invoice": {
    "number": "INV-001",
    "date": "2024-01-15",
    "currency": "USD",
    "subtotal": 1000.00,
    "taxPercent": 8.5,
    "total": 1085.00,
    "lineItems": [
      {
        "description": "Professional Services",
        "unitPrice": 100.00,
        "quantity": 10,
        "total": 1000.00
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created invoice */ },
  "message": "Invoice created successfully"
}
```

#### `PUT /api/invoices/:id`
Update an existing invoice.

**Request:** Same structure as POST, but all fields are optional.

**Response:**
```json
{
  "success": true,
  "data": { /* updated invoice */ },
  "message": "Invoice updated successfully"
}
```

#### `DELETE /api/invoices/:id`
Delete an invoice.

**Response:**
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

## Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

### Validation Errors

Validation errors include additional details:

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    "\"vendor.name\" is required",
    "\"invoice.number\" must be a string"
  ]
}
```

## Data Structures

### Vendor
```typescript
interface IVendor {
  name: string;          // Required, max 200 chars
  address?: string;      // Optional, max 500 chars
  taxId?: string;        // Optional, max 50 chars
}
```

### Line Item
```typescript
interface ILineItem {
  description: string;   // Required, max 500 chars
  unitPrice: number;     // Required, >= 0
  quantity: number;      // Required, >= 0
  total: number;         // Required, >= 0
}
```

### Invoice Data
```typescript
interface IInvoiceData {
  number: string;        // Required, max 100 chars
  date: string;          // Required, ISO date string
  currency?: string;     // Optional, max 10 chars, default "USD"
  subtotal?: number;     // Optional, >= 0
  taxPercent?: number;   // Optional, 0-100
  total?: number;        // Optional, >= 0
  poNumber?: string;     // Optional, max 100 chars
  poDate?: string;       // Optional, ISO date string
  lineItems: ILineItem[]; // Array of line items
}
```

### Complete Invoice
```typescript
interface IInvoice {
  _id?: string;          // MongoDB ObjectId
  fileId: string;        // File storage ID
  fileName: string;      // Original filename
  vendor: IVendor;       // Vendor information
  invoice: IInvoiceData; // Invoice data
  createdAt: string;     // ISO timestamp
  updatedAt?: string;    // ISO timestamp
}
```

## Development

### Project Structure

```
src/
├── middleware/        # Express middleware
├── models/           # Mongoose models
├── routes/           # API route handlers
├── services/         # Business logic services
├── types/            # TypeScript interfaces
├── utils/            # Utility functions
└── index.ts          # Main server file
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Check code style
npm run lint

# Fix linting issues
npm run lint:fix
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm install -g vercel`
2. Configure environment variables in Vercel dashboard
3. Deploy: `vercel --prod`

### Environment Variables (Production)

Make sure to set these in your deployment environment:

- `MONGODB_URI`
- `GEMINI_API_KEY` or `GROQ_API_KEY`
- `VERCEL_BLOB_READ_WRITE_TOKEN` (for Vercel Blob storage)
- `CORS_ORIGIN` (comma-separated list of allowed origins)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Ensure linting passes
5. Submit a pull request

## License

MIT License
