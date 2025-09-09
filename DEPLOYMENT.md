# PDF Review Dashboard - Production Deployment Guide

This guide will walk you through deploying the PDF Review Dashboard to production using Vercel for both frontend and backend.

## Prerequisites

- Vercel account
- MongoDB Atlas account
- Gemini API key or Groq API key (or both)
- Node.js ≥18
- Git repository

## Project Structure

```
PDF VIEWER/
├── apps/
│   ├── api/          # Backend API (Node.js + TypeScript)
│   └── web/          # Frontend (Next.js + TypeScript)
├── package.json      # Root package.json (monorepo)
├── turbo.json        # Turborepo configuration
└── DEPLOYMENT.md     # This file
```

## Step 1: Environment Setup

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://cloud.mongodb.com/
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace `<username>` and `<password>` in the connection string

### AI API Keys

**Option A: Google Gemini**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key for later use

**Option B: Groq (Alternative)**
1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy the key for later use

### Vercel Blob Storage (Optional)
1. Go to your Vercel dashboard
2. Navigate to Storage tab
3. Create a new Blob store
4. Copy the read-write token

## Step 2: Deploy Backend API

1. **Deploy to Vercel**
   ```bash
   cd apps/api
   vercel --prod
   ```

2. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings in Vercel
   - Navigate to Environment Variables
   - Add the following variables:

   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   MAX_FILE_SIZE=26214400
   VERCEL_BLOB_READ_WRITE_TOKEN=your_blob_token (optional)
   ```

3. **Note your API URL** (e.g., `https://your-api-domain.vercel.app`)

## Step 3: Deploy Frontend

1. **Update Environment Variables**
   - Copy `apps/web/.env.example` to `apps/web/.env.local`
   - Update `NEXT_PUBLIC_API_URL` to your deployed API URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app/api
   ```

2. **Deploy to Vercel**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app/api
   ```

## Step 4: Update CORS Settings

After frontend deployment:

1. Go to your API project in Vercel
2. Update the `CORS_ORIGIN` environment variable to your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```
3. Redeploy the API

## Step 5: Test the Deployment

1. **Visit your frontend URL**
2. **Test file upload** with a sample PDF
3. **Test AI extraction** with both Gemini and Groq (if configured)
4. **Test CRUD operations** - create, read, update, delete invoices
5. **Check error handling** - try uploading invalid files

## Development vs Production Differences

### Development
- Uses MongoDB GridFS for file storage
- CORS allows localhost:3000
- Detailed error messages
- Development logging

### Production
- Can use Vercel Blob for file storage
- CORS restricted to your domain
- Sanitized error messages
- Production logging

## Environment Variables Reference

### Backend (apps/api)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Optional* | Google Gemini API key |
| `GROQ_API_KEY` | Optional* | Groq API key |
| `CORS_ORIGIN` | Yes | Frontend domain for CORS |
| `MAX_FILE_SIZE` | No | Max file size (default: 25MB) |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | No | For Vercel Blob storage |

*At least one AI API key is required

### Frontend (apps/web)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |

## Monitoring and Maintenance

### Vercel Analytics
- Enable Vercel Analytics in your project settings
- Monitor function invocations and errors
- Set up alerts for high error rates

### Database Monitoring
- Monitor MongoDB Atlas metrics
- Set up alerts for connection issues
- Regular backup verification

### API Rate Limits
- Monitor Gemini/Groq API usage
- Set up billing alerts
- Implement rate limiting if needed

## Scaling Considerations

### Performance Optimization
- Enable Next.js Image Optimization
- Implement caching strategies
- Use CDN for static assets

### Database Scaling
- Monitor database performance
- Consider read replicas for high traffic
- Implement database connection pooling

### File Storage
- For high volume, consider dedicated file storage
- Implement file cleanup policies
- Monitor storage costs

## Security Checklist

- [x] Environment variables secured in Vercel
- [x] CORS properly configured
- [x] API endpoints validated
- [x] File upload restrictions in place
- [x] Error messages sanitized
- [x] MongoDB connection secured

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify `CORS_ORIGIN` matches your frontend domain exactly
- Check for trailing slashes
- Ensure both http/https protocols match

**2. Database Connection Issues**
- Verify MongoDB connection string
- Check network access settings in Atlas
- Ensure database user has proper permissions

**3. File Upload Failures**
- Check `MAX_FILE_SIZE` setting
- Verify file type validation
- Monitor Vercel function timeout limits

**4. AI Extraction Errors**
- Verify API keys are correct
- Check API quotas and billing
- Monitor function execution time

### Logs and Debugging

**Vercel Logs**
```bash
vercel logs your-project-name --follow
```

**Function Logs**
- Check Vercel dashboard Functions tab
- Monitor execution time and memory usage
- Review error traces

## Support

For issues and questions:

1. Check the GitHub repository issues
2. Review Vercel documentation
3. Check MongoDB Atlas support
4. Review AI provider documentation (Gemini/Groq)

## Updates and Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Update API keys as needed
- Backup database regularly

### Feature Updates
- Test in development environment first
- Use Vercel preview deployments
- Monitor performance after updates
- Have rollback plan ready
