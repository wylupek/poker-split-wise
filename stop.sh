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
echo "STOP - $(date)" >> "$CONTROL_LOG"
echo "================================================" >> "$CONTROL_LOG"

log "🛑 Stopping Poker Split-Wise..."
kill_tree() {
    local pid=$1
    local sig=${2:-TERM}

    if ! ps -p $pid > /dev/null 2>&1; then
        return
    fi

    local children=$(pgrep -P $pid 2>/dev/null)

    if [ -n "$children" ]; then
        for child in $children; do
            kill_tree $child $sig
        done
    fi

    kill -$sig $pid 2>/dev/null
}
kill_port_processes() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)

    if [ -z "$pids" ]; then
        return
    fi

    for pid in $pids; do
        local cmd=$(ps -p $pid -o comm= 2>/dev/null)

        if [[ "$cmd" =~ ^(node|npm|vite)$ ]]; then
            log "  Killing $cmd process (PID: $pid) on port $port"
            kill -TERM $pid 2>/dev/null
            sleep 1

            if ps -p $pid > /dev/null 2>&1; then
                kill -KILL $pid 2>/dev/null
            fi
        else
            log "⚠️  WARNING: Skipping non-node process '$cmd' (PID: $pid) on port $port"
            log "   This might be your browser or another app. NOT killing it!"
        fi
    done
}
if [ ! -f "$PID_FILE" ]; then
    log "⚠️  No PID file found. Checking for orphaned processes..."

    backend_pids=$(lsof -ti :3001 2>/dev/null)
    frontend_pids=$(lsof -ti :5173 2>/dev/null)

    if [ -n "$backend_pids" ] || [ -n "$frontend_pids" ]; then
        log "Found processes on poker app ports. Cleaning up..."
        kill_port_processes 3001
        kill_port_processes 5173
        log "✅ Cleaned up orphaned processes"

        if command -v notify-send &> /dev/null; then
            notify-send "Poker Split-Wise" "Cleaned up orphaned processes" --icon=dialog-information
        fi
    else
        log "❌ App is not running"

        if command -v notify-send &> /dev/null; then
            notify-send "Poker Split-Wise" "App is not running" --icon=dialog-information
        fi
    fi

    exit 0
fi

BACKEND_PID=$(head -n1 "$PID_FILE")
FRONTEND_PID=$(tail -n1 "$PID_FILE")

STOPPED=0
if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    log "📡 Stopping backend server (PID: $BACKEND_PID)..."
    kill_tree $BACKEND_PID TERM

    for i in {1..5}; do
        if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
            log "✓ Backend stopped"
            STOPPED=$((STOPPED + 1))
            break
        fi
        sleep 1
    done

    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log "⚠️  Force killing backend..."
        kill_tree $BACKEND_PID KILL
        STOPPED=$((STOPPED + 1))
    fi
else
    log "⚠️  Backend not running"
fi

if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
    log "🎨 Stopping frontend server (PID: $FRONTEND_PID)..."
    kill_tree $FRONTEND_PID TERM

    for i in {1..5}; do
        if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log "✓ Frontend stopped"
            STOPPED=$((STOPPED + 1))
            break
        fi
        sleep 1
    done

    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log "⚠️  Force killing frontend..."
        kill_tree $FRONTEND_PID KILL
        STOPPED=$((STOPPED + 1))
    fi
else
    log "⚠️  Frontend not running"
fi

kill_port_processes 3001
kill_port_processes 5173

rm "$PID_FILE"
log ""
if [ $STOPPED -gt 0 ]; then
    log "✅ App stopped successfully!"

    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise" "App stopped" --icon=application-exit
    fi
else
    log "✓ App was not running"

    if command -v notify-send &> /dev/null; then
        notify-send "Poker Split-Wise" "App is not running" --icon=dialog-information
    fi
fi
