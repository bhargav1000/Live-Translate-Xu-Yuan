#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🌍 Live Translator - Startup Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        echo -e "${YELLOW}⚠ Port $1 is in use. Killing process...${NC}"
        lsof -i :$1 -sTCP:LISTEN | grep -v COMMAND | awk '{print $2}' | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Check and free ports
echo -e "${BLUE}Checking ports...${NC}"
kill_port 5001
kill_port 3000

# Install dependencies if node_modules doesn't exist
echo -e "${BLUE}Setting up dependencies...${NC}"

if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    echo -e "${YELLOW}Installing server dependencies...${NC}"
    cd "$SCRIPT_DIR/server"
    npm install --silent
    echo -e "${GREEN}✓ Server dependencies installed${NC}"
fi

if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
    echo -e "${YELLOW}Installing client dependencies...${NC}"
    cd "$SCRIPT_DIR/client"
    npm install --silent
    echo -e "${GREEN}✓ Client dependencies installed${NC}"
fi

# Start servers
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start backend
cd "$SCRIPT_DIR/server"
echo -e "${YELLOW}Starting backend server...${NC}"
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check logs:${NC}"
        cat /tmp/backend.log
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start frontend
cd "$SCRIPT_DIR/client"
echo -e "${YELLOW}Starting frontend...${NC}"
BROWSER=none npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check logs:${NC}"
        cat /tmp/frontend.log
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ All services are running!${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║ Frontend:  ${GREEN}http://localhost:3000${BLUE}         ║${NC}"
echo -e "${BLUE}║ Backend:   ${GREEN}http://localhost:5001${BLUE}         ║${NC}"
echo -e "${BLUE}║ Ollama:    ${YELLOW}http://localhost:11434${BLUE}${NC} (if running)"
echo -e "${BLUE}╠════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}📝 To use real translations:${NC}"
echo -e "${YELLOW}   1. ollama serve${NC}"
echo -e "${YELLOW}   2. ollama pull mistral${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT TERM

# Wait for both processes
wait
