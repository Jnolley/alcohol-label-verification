#!/bin/bash

# Development script for Mac/Linux
# This script installs dependencies and runs both frontend and backend

echo "Setting up Alcohol Label Verification App..."

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Backend dependencies already installed"
fi
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Frontend dependencies already installed"
fi
echo ""

# Return to root directory
cd ..

echo "Dependencies installed!"
echo ""
echo "Starting development servers..."
echo "Backend will run on http://localhost:3000"
echo "Frontend will run on http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend in background
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait