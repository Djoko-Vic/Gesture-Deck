#!/usr/bin/env bash
set -e

# ==============================================================================
# GestureDeck Unified Development Launcher
# Starts Python FastAPI backend and Next.js frontend concurrently with clean exit
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

echo "=========================================================="
echo "⚡ Starting GestureDeck (SonicHUD Controller)"
echo "=========================================================="

# Check Python environment
if [ ! -f "${BACKEND_DIR}/venv/bin/python" ]; then
    echo "❌ Error: Virtual environment not found at ${BACKEND_DIR}/venv"
    echo "Please initialize with: python3 -m venv backend/venv && backend/venv/bin/pip install -r backend/requirements.txt"
    exit 1
fi

# Cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down GestureDeck services..."
    if [ -n "${BACKEND_PID}" ]; then
        kill -SIGTERM "${BACKEND_PID}" 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID}" ]; then
        kill -SIGTERM "${FRONTEND_PID}" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "✓ All services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "📡 Launching Backend (FastAPI + OpenCV + MediaPipe on :8000)..."
cd "${BACKEND_DIR}"
./venv/bin/python run.py &
BACKEND_PID=$!
cd "${SCRIPT_DIR}"

# Start Frontend
echo "💻 Launching Frontend (Next.js App Router on :3000)..."
cd "${FRONTEND_DIR}"
npm run dev &
FRONTEND_PID=$!
cd "${SCRIPT_DIR}"

echo ""
echo "✅ GestureDeck is running:"
echo "   - Frontend UI: http://localhost:3000"
echo "   - App Dashboard: http://localhost:3000/app"
echo "   - Backend API: http://localhost:8000"
echo "   - WebSocket Stream: ws://localhost:8000/ws"
echo "Press Ctrl+C to stop all services."
echo ""

# Wait for both processes
wait
