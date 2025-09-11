@echo off
echo 🚀 Starting PDF Viewer Development Environment...
echo.

echo 📡 Starting API server on port 4000...
start "API Server" cmd /k "cd /d "D:\PDF VIEWER\apps\api" && npm run dev"

echo.
echo ⏳ Waiting 3 seconds for API to initialize...
timeout /t 3 /nobreak > nul

echo 🌐 Starting Web server on port 3001...
start "Web Server" cmd /k "cd /d "D:\PDF VIEWER\apps\web" && npm run dev"

echo.
echo ✅ Development servers are starting...
echo 📡 API: http://localhost:4000
echo 🌐 Web: http://localhost:3001
echo.
echo Press any key to exit...
pause > nul
