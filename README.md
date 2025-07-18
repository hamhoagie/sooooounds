# soooounds 🎵🎨

An audio-reactive logo morphing web application that transforms visual elements based on sound input.

## Overview

soooounds analyzes audio in real-time and transforms logos/vector art based on various audio features:
- Frequency spectrum
- Amplitude/volume
- Tempo/rhythm
- Pitch detection
- Timbre characteristics

## Features

- 🎤 Real-time microphone input
- 📁 Audio file upload support
- 🎨 SVG logo morphing
- 🌊 Particle effects based on audio
- 🎭 Multiple visualization modes
- 🤖 ML-powered audio analysis
- 💾 Export animated results

## Tech Stack

### Frontend
- React 18
- Three.js / React Three Fiber (3D graphics)
- P5.js (2D creative coding)
- Web Audio API
- TensorFlow.js

### Backend (Optional for advanced features)
- FastAPI (Python)
- PyTorch/TensorFlow
- Librosa (audio analysis)
- NumPy/SciPy

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

## Project Structure

```
soooounds/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── audio/       # Audio processing
│   │   ├── graphics/    # Visual rendering
│   │   └── ml/          # ML models
├── server/              # Python backend (optional)
│   ├── api/             # FastAPI endpoints
│   ├── audio/           # Audio analysis
│   └── models/          # ML models
└── assets/              # Logos, fonts, etc.
```

## License

MIT