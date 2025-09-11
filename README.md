# PDF Review Dashboard

A comprehensive full-stack PDF review dashboard with AI-powered invoice data extraction, built with modern technologies and best practices.

**Demo-Links:**
[Demo API](https://invoice-api-pied.vercel.app/) 
[Demo Web](https://invoice-web-six.vercel.app/)  

----
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)](https://www.typescriptlang.org/)

--- 

## 🚀 Features

### Core Features
- **PDF Upload & Storage** - Upload PDFs up to 25MB with validation
- **AI-Powered Extraction** - Extract invoice data using Google Gemini or Groq AI
- **Smart Data Processing** - Automatically parse vendor info, line items, and totals
- **Full CRUD Operations** - Create, read, update, and delete invoice records
- **Advanced Search** - Search by vendor name and invoice number with pagination
- **Modern UI/UX** - Responsive design with dark/light theme support

### Technical Features
- **Monorepo Architecture** - Turborepo for efficient development and builds
- **Type Safety** - Full TypeScript coverage across frontend and backend
- **Production Ready** - Comprehensive error handling, validation, and security
- **Scalable Storage** - MongoDB GridFS or Vercel Blob for file storage
- **RESTful API** - Well-documented JSON API with consistent responses
- **Modern Stack** - Next.js 15, Node.js, MongoDB, shadcn/ui components

## 🛠 Tech Stack

### Frontend (apps/web)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components  
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **State**: Zustand for client state
- **Notifications**: Sonner for toast notifications

### Backend (apps/api)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: MongoDB GridFS / Vercel Blob
- **AI Services**: Google Gemini API, Groq SDK
- **Validation**: Joi for request validation
- **Security**: Helmet, CORS, input sanitization
- **File Processing**: Multer for uploads, pdf-parse for text extraction

### Infrastructure
- **Monorepo**: Turborepo
- **Deployment**: Vercel (both frontend and backend)
- **Database**: MongoDB Atlas
- **Storage**: Vercel Blob (production) / GridFS (development)
- **CI/CD**: GitHub Actions (optional)

## 📋 Prerequisites

- Node.js ≥18
- npm or yarn
- MongoDB (local or Atlas)
- AI API key (Gemini or Groq)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd "PDF VIEWER"
npm install
```

### 2. Environment Setup

**Backend Configuration:**
```bash
cp apps/api/.env.example apps/api/.env
```

Update `apps/api/.env`:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pdf_dashboard
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=26214400
```

**Frontend Configuration:**
```bash
cp apps/web/.env.example apps/web/.env.local
```

Update `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev --workspace=api
npm run dev --workspace=web
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health: http://localhost:4000/health

## 📖 Usage

### Upload PDF Invoice
1. Navigate to the upload page
2. Select AI model (Gemini or Groq)
3. Drag & drop or select PDF file
4. Click "Upload & Extract Data"
5. Review extracted data in dashboard

### Manage Invoices
- **View**: Browse invoices in the main dashboard
- **Search**: Use the search bar to find specific invoices
- **Edit**: Click "View" to open the invoice editor
- **Delete**: Remove invoices with confirmation
- **Download**: Get original PDF files

## 🏗 Architecture

### Project Structure
```
PDF VIEWER/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── models/      # Mongoose models
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── utils/       # Utilities
│   │   │   └── index.ts     # Server entry
│   │   ├── package.json
│   │   └── vercel.json      # API deployment config
│   └── web/                 # Frontend Next.js app
│       ├── app/             # Next.js 15 App Router
│       ├── components/      # React components
│       ├── lib/             # Utilities and API client
│       ├── package.json
│       └── vercel.json      # Frontend deployment config
├── package.json             # Root monorepo config
├── turbo.json              # Turborepo configuration
├── DEPLOYMENT.md           # Production deployment guide
└── README.md               # This file
```

### Data Flow
1. User uploads PDF via frontend
2. File stored in MongoDB GridFS/Vercel Blob
3. AI service extracts text and structured data
4. Extracted data saved to MongoDB
5. User can view/edit data in dashboard

## 🔐 Security Features

- **File Validation**: Strict PDF-only uploads with size limits
- **Input Sanitization**: All inputs validated and sanitized
- **CORS Protection**: Configurable cross-origin policies
- **Environment Isolation**: Secure environment variable handling
- **Error Sanitization**: No sensitive data in error responses
- **Database Security**: MongoDB connection with authentication

## 📚 API Documentation

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload PDF file |
| POST | `/api/extract` | Extract data with AI |
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id` | Get invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/health` | Health check |

For detailed API documentation, see [apps/api/README.md](apps/api/README.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run API tests
npm run test --workspace=api

# Run with coverage
npm run test:coverage --workspace=api
```

## 🚀 Production Deployment

For comprehensive deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Quick Deploy to Vercel

1. **Deploy Backend:**
   ```bash
   cd apps/api
   vercel --prod
   ```

2. **Deploy Frontend:**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel dashboard

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development servers
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run check-types  # Type check all packages
npm run format       # Format code with Prettier
```

### Code Quality
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Full type safety
- **Git Hooks**: Pre-commit validation (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run check-types`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](../../issues)
- **Documentation**: Check `/apps/api/README.md` and `/DEPLOYMENT.md`
- **Discussions**: [GitHub Discussions](../../discussions)

## Acknowledgments

- **shadcn/ui** for the beautiful UI components
- **Vercel** for excellent deployment platform
- **MongoDB** for robust database solution
- **Google Gemini** and **Groq** for AI capabilities
- **Next.js** and **Express** teams for great frameworks

---

**Yamuna Latchipatruni - Author**
