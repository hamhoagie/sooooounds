# soooounds 🎵🎨

A web application that transforms images based on real-time audio input using AI. Upload an image, play some music, and watch your image transform in real-time based on the audio characteristics.

## Features

- 🎤 **Real-time audio analysis** - Captures volume, pitch, energy, and spectral centroid from microphone input
- 🤖 **AI-powered image transformation** - Uses GPT-4o vision to analyze uploaded images and DALL-E 3 to create audio-reactive transformations
- 🎨 **Audio-reactive effects** - Different audio characteristics create different visual effects:
  - **Volume** → Brightness adjustments
  - **Energy** → Saturation and blur effects  
  - **Pitch** → Color tinting (high=blue, mid=purple, low=warm)
  - **Centroid** → Hue shifting and color palette
- 🇳🇴 **Norway-inspired design** - Clean, minimal UI with pixel art aesthetic
- 🌊 **Three.js visualization** - Interactive 3D audio visualization
- ⚡ **Live mode** - Continuous transformations every 8 seconds while audio is playing

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **Three.js + React Three Fiber** for 3D graphics
- **Web Audio API** for real-time audio analysis

### Backend
- **Node.js + Express** server
- **OpenAI API** integration (GPT-4o vision + DALL-E 3)
- **Sharp** for image processing
- **Canvas** for audio-reactive mask generation
- **Multer** for file uploads

## Setup

### Prerequisites
- Node.js (v18 or higher)
- OpenAI API key with GPT-4o and DALL-E 3 access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soooounds
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Environment setup**
   
   Create a `.env` file in the `server` directory:
   ```bash
   cd server
   touch .env
   ```
   
   Add your OpenAI API key to `server/.env`:
   ```
   OPENAI_API_KEY=sk-proj-your-openai-api-key-here
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open the application**
   - Navigate to `http://localhost:5173`
   - Allow microphone access when prompted
   - Upload an image and click "START AUDIO"
   - Click "START LIVE MODE" to begin real-time transformations

## Usage

1. **Upload an image** - Click "UPLOAD IMAGE" and select an image file
2. **Start audio** - Click "START AUDIO" to begin capturing microphone input
3. **Begin transformations** - Click "START LIVE MODE" to start audio-reactive transformations
4. **Make sound** - Play music, speak, or make sounds to trigger different visual effects
5. **Download results** - Use the "DOWNLOAD" button to save transformed images

## How It Works

1. **Audio Analysis**: The Web Audio API analyzes your microphone input in real-time, extracting:
   - Volume (overall loudness)
   - Pitch (fundamental frequency)
   - Energy (high-frequency content)
   - Spectral centroid (brightness/timbre)

2. **Image Analysis**: GPT-4o vision analyzes your uploaded image to understand:
   - Main subject/object
   - Style (photo, illustration, etc.)
   - Colors and visual elements
   - Overall composition

3. **Smart Prompt Generation**: Based on the image analysis and current audio features, the system generates contextual prompts that maintain the essence of your image while applying audio-reactive effects.

4. **AI Transformation**: DALL-E 3 creates new images based on the smart prompts, ensuring the transformed images relate to your original upload.

5. **Post-Processing**: Additional audio-reactive effects are applied using Sharp image processing for real-time visual feedback.

## API Costs

This application uses OpenAI's APIs:
- **GPT-4o Vision**: ~$0.01 per image analysis
- **DALL-E 3**: ~$0.04 per generated image (1024x1024)
- **Estimated cost**: ~$0.05 per transformation

## Project Structure

```
soooounds/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
├── server/          # Node.js backend
│   ├── index.js     # Main server file
│   ├── package.json
│   └── .env         # Environment variables
└── README.md
```

### Key Files
- `client/src/App.tsx` - Main React component
- `client/src/hooks/useAudioAnalyzer.ts` - Audio analysis logic
- `client/src/services/aiImageTransform.ts` - API communication
- `server/index.js` - Express server with OpenAI integration

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own experiments!

## Credits

Built with ❤️ using OpenAI's GPT-4o and DALL-E 3 APIs.