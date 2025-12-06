#!/bin/bash

# Poker Split-Wise - Start Script
# Starts both frontend and backend servers in the background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.app.pid"

# Change to script directory to ensure relative paths work
cd "$SCRIPT_DIR"

# Source nvm if it exists (for double-click execution)
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Poker Split-Wise...${NC}"

# Check if already running
if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  App might already be running. Checking...${NC}"
    if ps -p $(cat "$PID_FILE" 2>/dev/null | head -n1) > /dev/null 2>&1; then
        echo -e "${RED}❌ App is already running!${NC}"
        echo -e "${YELLOW}Run ./stop.sh first to stop it.${NC}"
        exit 1
    else
        echo -e "${YELLOW}Stale PID file found. Cleaning up...${NC}"
        rm "$PID_FILE"
    fi
fi

# Check if ports are available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Port 3001 is already in use!${NC}"
    echo -e "${YELLOW}Another app is using the backend port.${NC}"
    exit 1
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Port 5173 is already in use!${NC}"
    echo -e "${YELLOW}Another app is using the frontend port.${NC}"
    exit 1
fi

# Start backend server
cd "$SCRIPT_DIR/server"
echo -e "${GREEN}📡 Starting backend server...${NC}"
nohup npm run dev > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend server
cd "$SCRIPT_DIR"
echo -e "${GREEN}🎨 Starting frontend server...${NC}"
nohup npm run dev:client > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Save PIDs
echo "$BACKEND_PID" > "$PID_FILE"
echo "$FRONTEND_PID" >> "$PID_FILE"

# Wait a moment for servers to start
sleep 3

# Check if processes are still running
if ps -p $BACKEND_PID > /dev/null && ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ App started successfully!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Frontend: ${NC}http://localhost:5173"
    echo -e "${GREEN}📡 Backend:  ${NC}http://localhost:3001/api"
    echo -e "${GREEN}💾 Database: ${NC}$SCRIPT_DIR/data/poker-splitwise.db"
    echo ""
    echo -e "${YELLOW}📋 Logs:${NC}"
    echo -e "   Backend:  tail -f $SCRIPT_DIR/backend.log"
    echo -e "   Frontend: tail -f $SCRIPT_DIR/frontend.log"
    echo ""
    echo -e "${YELLOW}🛑 To stop: ${NC}./stop.sh"

    # Send desktop notification if available
    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise Started" "App running at http://localhost:5173" --icon=applications-games
    fi
else
    echo -e "${RED}❌ Failed to start. Check logs:${NC}"
    echo -e "   Backend:  tail $SCRIPT_DIR/backend.log"
    echo -e "   Frontend: tail $SCRIPT_DIR/frontend.log"
    rm "$PID_FILE"

    # Send desktop notification if available
    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise Failed" "Check logs: backend.log and frontend.log" --icon=dialog-error --urgency=critical
    fi

    exit 1
fi
