#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.app.pid"
CONTROL_LOG="$SCRIPT_DIR/app-control.log"

cd "$SCRIPT_DIR"

log() {
    echo -e "$@" >> "$CONTROL_LOG"
}

echo "" >> "$CONTROL_LOG"
echo "================================================" >> "$CONTROL_LOG"
echo "START - $(date)" >> "$CONTROL_LOG"
echo "================================================" >> "$CONTROL_LOG"

if [ -f "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

log "🚀 Starting Poker Split-Wise..."

if [ -f "$PID_FILE" ]; then
    log "⚠️  App might already be running. Checking..."
    if ps -p $(cat "$PID_FILE" 2>/dev/null | head -n1) > /dev/null 2>&1; then
        log "❌ App is already running!"
        log "💡 Run ./stop.sh first to stop it."

        if command -v notify-send &> /dev/null; then
            notify-send "Poker Split-Wise" "App is already running" --icon=dialog-warning
        fi
        exit 1
    else
        log "Stale PID file found. Cleaning up..."
        rm "$PID_FILE"
    fi
fi
check_port() {
    local port=$1
    local port_name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -ti :$port 2>/dev/null | head -n1)
        local cmd=$(ps -p $pid -o comm= 2>/dev/null)

        log "❌ Port $port ($port_name) is already in use!"
        log "   Process: $cmd (PID: $pid)"

        if [[ "$cmd" =~ ^(node|npm|vite)$ ]]; then
            log "💡 This looks like the poker app. Run ./stop.sh to stop it."

            if command -v notify-send &> /dev/null; then
                notify-send "Poker Split-Wise" "Port $port already in use by poker app" --icon=dialog-error
            fi
        else
            log "💡 This is NOT the poker app. Close that app first or change the port."

            if command -v notify-send &> /dev/null; then
                notify-send "Poker Split-Wise" "Port $port in use by another app: $cmd" --icon=dialog-error
            fi
        fi

        return 1
    fi

    return 0
}

check_port 3001 "backend" || exit 1
check_port 5173 "frontend" || exit 1

cd "$SCRIPT_DIR/server"
log "📡 Starting backend server..."
nohup npm run dev > "$SCRIPT_DIR/backend.log" 2>&1 < /dev/null &
BACKEND_PID=$!

sleep 2

cd "$SCRIPT_DIR"
log "🎨 Starting frontend server..."
nohup npm run dev:client > "$SCRIPT_DIR/frontend.log" 2>&1 < /dev/null &
FRONTEND_PID=$!

echo "$BACKEND_PID" > "$PID_FILE"
echo "$FRONTEND_PID" >> "$PID_FILE"

sleep 3

if ps -p $BACKEND_PID > /dev/null && ps -p $FRONTEND_PID > /dev/null; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    log "✅ App started successfully!"
    log ""
    log "🌐 Frontend: http://localhost:5173"
    log "📡 Backend:  http://localhost:3001/api"
    log "🌐 Network:  http://$LOCAL_IP:5173"
    log "💾 Database: $SCRIPT_DIR/data/poker-splitwise.db"

    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise" "App is running at http://$LOCAL_IP:5173" --icon=applications-games
    fi
else
    log "❌ Failed to start. Check logs for details."
    rm "$PID_FILE"

    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise" "Failed to start. Check logs" --icon=dialog-error --urgency=critical
    fi

    exit 1
fi
