@echo off

REM PDF Review Dashboard - Production Build Script
echo 🚀 Building PDF Review Dashboard for Production...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build API
echo 🔧 Building API...
cd apps\api
npm run build
cd ..\..

REM Build Web App
echo 🌐 Building Web App...
cd apps\web
npm run build
cd ..\..

echo ✅ Production build completed!
echo.
echo 🚀 Next steps:
echo 1. Set up environment variables in your deployment platform
echo 2. Deploy the API: cd apps\api ^&^& vercel --prod
echo 3. Deploy the Web App: cd apps\web ^&^& vercel --prod
echo 4. Update CORS_ORIGIN in API to match your web app domain
echo.
echo 📖 For detailed deployment instructions, see DEPLOYMENT.md

pause
