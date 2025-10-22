#!/bin/bash

# Start both frontend and backend servers

echo "🚀 Starting Energy Oracle servers..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
    echo ""
fi

# Start backend server in background
echo "⚡ Starting backend server on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend server
echo "🎨 Starting frontend server on port 5173..."
echo ""
echo "=========================================="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

bun run dev

# When frontend stops, kill backend too
kill $BACKEND_PID 2>/dev/null
