# Spoiler Blocker 🚫

A hackathon-winning, AI-powered spoiler detection system.

## Features
- **Real-time Detection**: Uses Regex and Pattern Matching to identify spoilers instantly.
- **Visuals**: Glassmorphism, specific animations, and a dark/neon aesthetic.
- **Tech Stack**:
  - **Backend**: Node.js, Express, MongoDB, WebSocket.
  - **Frontend**: API-driven Vanilla HTML/JS/CSS.

## Quick Start
### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
*Server starts on http://localhost:5000*

### 2. Frontend Setup
Simply open `frontend/index.html` in your browser.
OR
```bash
npx serve frontend
```

## Architecture
- `/backend`: REST API + WebSocket Server.
- `/frontend`: Static Client files.
- `spoilerEngine.js`: Core logic for confidence scoring.

## License
MIT
"# spoilerblocker2" 
