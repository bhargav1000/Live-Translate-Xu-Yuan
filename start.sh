#!/bin/bash

# Start backend server
echo "Starting backend server on port 5001..."
cd "$(dirname "$0")/server"
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd "$(dirname "$0")/client"
npm start &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
