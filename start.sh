#!/usr/bin/env bash
set -e

echo ""
echo " ======================================"
echo "  Byters Lead Finder — Quick Start"
echo " ======================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo " [!] .env file not found!"
  echo " [!] Please copy .env.example to .env and fill in your API keys first."
  echo ""
  echo "     cp .env.example .env"
  echo ""
  exit 1
fi

echo " [1/3] Installing frontend dependencies..."
npm install

echo ""
echo " [2/3] Installing backend engine dependencies..."
cd engine && npm install && cd ..

echo ""
echo " [3/3] All dependencies installed!"
echo ""
echo " ──────────────────────────────────────────"
echo "  Open TWO terminal windows and run:"
echo ""
echo "   Terminal 1 (Backend):  npm run start:backend"
echo "   Terminal 2 (Frontend): npm run start:frontend"
echo ""
echo "  Backend  → http://localhost:3000"
echo "  Frontend → http://localhost:5173"
echo " ──────────────────────────────────────────"
echo ""
