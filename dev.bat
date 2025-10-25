@echo off
REM Development script for Windows
REM This script installs dependencies and runs both frontend and backend

echo Setting up Alcohol Label Verification App...
echo.

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    exit /b 1
)

node -v
npm -v
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist "node_modules\" (
    call npm install
) else (
    echo Backend dependencies already installed
)
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules\" (
    call npm install
) else (
    echo Frontend dependencies already installed
)
echo.

REM Return to root directory
cd ..

echo Dependencies installed!
echo.
echo Starting development servers...
echo Backend will run on http://localhost:3000
echo Frontend will run on http://localhost:4200
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in new window
start "Frontend Server" cmd /k "cd frontend && npm start"

echo Both servers started in separate windows
echo Close the terminal windows to stop the servers