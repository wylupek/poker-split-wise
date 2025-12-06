#!/bin/bash

# Poker Split-Wise - Stop Script
# Stops ONLY the poker app servers - NEVER kills browser or other apps

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.app.pid"

# Change to script directory
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Poker Split-Wise...${NC}"

# Function to kill process tree (parent + all children)
kill_tree() {
    local pid=$1
    local sig=${2:-TERM}

    # Find all child PIDs recursively
    local children=$(pgrep -P $pid 2>/dev/null)

    # Kill children first
    for child in $children; do
        kill_tree $child $sig
    done

    # Kill the parent
    if ps -p $pid > /dev/null 2>&1; then
        kill -$sig $pid 2>/dev/null
    fi
}

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${RED}❌ App is not running (no PID file found)${NC}"

    # Send notification
    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise" "App was not running" --icon=dialog-information
    fi

    exit 0
fi

# Read PIDs from file
BACKEND_PID=$(head -n1 "$PID_FILE")
FRONTEND_PID=$(tail -n1 "$PID_FILE")

STOPPED=0

# Stop backend server
if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}📡 Stopping backend server (PID: $BACKEND_PID)...${NC}"
    kill_tree $BACKEND_PID TERM

    # Wait up to 5 seconds for graceful shutdown
    for i in {1..5}; do
        if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend stopped${NC}"
            STOPPED=$((STOPPED + 1))
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Force killing backend...${NC}"
        kill_tree $BACKEND_PID KILL
        STOPPED=$((STOPPED + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Backend not running${NC}"
fi

# Stop frontend server
if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}🎨 Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
    kill_tree $FRONTEND_PID TERM

    # Wait up to 5 seconds for graceful shutdown
    for i in {1..5}; do
        if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend stopped${NC}"
            STOPPED=$((STOPPED + 1))
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Force killing frontend...${NC}"
        kill_tree $FRONTEND_PID KILL
        STOPPED=$((STOPPED + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Frontend not running${NC}"
fi

# Clean up PID file
rm "$PID_FILE"

# Final status
echo ""
if [ $STOPPED -gt 0 ]; then
    echo -e "${GREEN}✅ App stopped successfully!${NC}"

    # Send notification
    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise Stopped" "App has been shut down" --icon=application-exit
    fi
else
    echo -e "${YELLOW}✓ App was not running${NC}"

    # Send notification
    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise" "App was not running" --icon=dialog-information
    fi
fi
