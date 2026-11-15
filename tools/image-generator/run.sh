#!/usr/bin/env bash
# Quick Launcher for Scripture Image Studio
# Can be run with either Python 3 or Node.js

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/../.."

echo "========================================================="
echo "🕉️  Starting Scripture Image Studio..."
echo "========================================================="

# Gracefully terminate any previous server process on port 8085
OLD_PID=$(lsof -ti :8085 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    echo "Stopping existing instance on port 8085 (PID: $OLD_PID)..."
    kill -9 $OLD_PID 2>/dev/null || true
    sleep 1
fi

# Try python3 first
if command -v python3 &>/dev/null; then
    echo "Starting with Python 3 on http://localhost:8085 ..."
    (sleep 1 && open "http://localhost:8085/tools/image-generator/") &
    python3 "$DIR/server.py"
elif command -v node &>/dev/null; then
    echo "Starting with Node.js on http://localhost:8085 ..."
    (sleep 1 && open "http://localhost:8085/tools/image-generator/") &
    node "$DIR/server.js"
else
    echo "Neither python3 nor node found. Opening HTML file directly in browser..."
    open "$DIR/index.html"
fi

