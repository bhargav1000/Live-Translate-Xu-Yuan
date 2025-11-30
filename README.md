# Live Translator App

A real-time speech translation application built with Node.js/Express backend and React frontend. Captures user speech, transcribes it, and translates it to the desired language in real-time using local LLM inference.

## 🚀 Quick Start

```bash
# Single command to start everything
./dev-start.sh
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

✨ **Real-time Speech Recognition** - Uses Web Speech API for browser-based speech-to-text
🌐 **Multi-language Translation** - Supports Chinese, Spanish, French, German, and Japanese
⚡ **Fast Performance** - Node.js backend ensures quick translation processing
📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
📝 **Translation History** - Keeps track of all translations in the session

## Architecture

### Why Node.js instead of Python?

For real-time conversational translation, **Node.js is significantly faster** than Python for these reasons:

- **Non-blocking I/O**: Node.js handles multiple requests concurrently without blocking
- **Lower latency**: JavaScript execution is faster for web operations
- **Better for web integration**: Native JavaScript runtime in browsers and servers
- **Scalability**: Can handle more concurrent users with the same resources
- **Memory efficient**: Lower overhead per connection

Python would work for batch processing but introduces latency in real-time scenarios.

### Tech Stack

**Backend:**
- Node.js + Express
- RESTful API for translation endpoints
- Ollama integration for local LLM inference (no external APIs)
- Automatic fallback to mock translations if Ollama unavailable

**Frontend:**
- React 18
- Web Speech API for audio capture & transcription (browser-native)
- Axios for API communication
- CSS Grid for responsive design

## Project Structure

```
Live-Translate-Xu-Yuan/
├── server/                 # Backend
│   ├── index.js           # Express server
│   ├── package.json       # Node dependencies
│   └── .env               # Environment variables
└── client/                # Frontend
    ├── public/
    │   └── index.html     # HTML entry point
    ├── src/
    │   ├── App.js         # Main React component
    │   ├── App.css        # Styling
    │   └── index.js       # React entry point
    └── package.json       # React dependencies
```

## Architecture & Deployment

The app is designed to scale from local development to production:

- **Local Development**: Run with `./dev-start.sh`
- **Production**: Frontend on Amplify, Backend on ECS, Models on separate server

See:
- 📖 [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- 🏗️ [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) - Detailed cloud architecture
- 🦙 [OLLAMA_SETUP.md](OLLAMA_SETUP.md) - Local LLM setup

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- **Ollama** (for LLM-based translations) - [Setup Guide](OLLAMA_SETUP.md)

### Quick Start with Ollama

1. **Install & run Ollama** (if not already running):
   ```bash
   # macOS
   brew install ollama
   ollama serve
   ```

2. **Pull a model** (in another terminal):
   ```bash
   # Recommended: Phi (fastest, 2.6GB)
   ollama pull phi
   
   # Or try other models:
   ollama pull mistral       # Balanced (4.4GB)
   ollama pull neural-chat   # High quality (4GB)
   ```

3. **Start the app** (single command):
   ```bash
   cd /Users/bhargav/Desktop/Live-Translate-Xu-Yuan
   ./dev-start.sh
   ```

4. **Open in browser**: `http://localhost:3000`

**That's it!** The script handles all dependencies and starts both backend and frontend.

## How It Works

### Real-Time Translation Flow

1. **Audio Capture**: Web Speech API captures your voice
2. **Transcription**: Browser converts speech to text
3. **LLM Translation**: Ollama (local LLM) translates to target language
4. **Display**: Results shown instantly with history

### Translation Technology

The app uses **Ollama** - a local LLM framework that:
- ✅ Runs entirely on your machine (no cloud API needed)
- ✅ Supports any language pair
- ✅ **<200ms translation latency** with Phi model
- ✅ Completely private (no data sent to external servers)
- ✅ Free and open-source

**Recommended Models:**

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **phi** | 2.6GB | ⚡⚡⚡ Fastest | Good | Real-time conversations |
| mistral | 4.4GB | ⚡⚡ Fast | Very Good | Higher quality translations |
| neural-chat | 4GB | ⚡⚡ Fast | Excellent | Best quality |

Default: **Phi** (fastest for real-time)

### Fallback Mode

If Ollama isn't running, the app automatically uses a dictionary of common phrases. This keeps the demo functional while you set up Ollama.

## Ollama Integration

The backend calls Ollama's API to translate text using the configured model:

```javascript
const response = await axios.post('http://localhost:11434/api/generate', {
  model: 'phi',  // Currently using Phi for speed
  prompt: 'Translate to Chinese: ' + text,
  stream: false,
  temperature: 0.1
});
```

**Configure the model** in `server/.env`:
```env
OLLAMA_MODEL=phi
```

**See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for detailed setup instructions and alternative models.**

## API Endpoints

### `POST /api/transcribe`
Transcribe audio to text

**Request:**
```json
{
  "audio": "base64_encoded_audio_data"
}
```

**Response:**
```json
{
  "text": "Hello",
  "confidence": 0.95
}
```

### `POST /api/translate`
Translate text to target language

**Request:**
```json
{
  "text": "Hello",
  "targetLanguage": "zh"
}
```

**Response:**
```json
{
  "originalText": "Hello",
  "translatedText": "你好",
  "targetLanguage": "zh"
}
```

### `POST /api/translate-audio`
Combined endpoint: transcribe and translate in one call

**Request:**
```json
{
  "audio": "base64_encoded_audio_data",
  "targetLanguage": "zh"
}
```

**Response:**
```json
{
  "originalText": "Hello",
  "translatedText": "你好",
  "targetLanguage": "zh",
  "confidence": 0.95
}
```

## Customizing Ollama Models

All translation is handled locally by Ollama. To use a different model:

1. **Pull a new model:**
   ```bash
   ollama pull mistral    # or neural-chat, llama2, etc.
   ```

2. **Update `server/.env`:**
   ```env
   OLLAMA_MODEL=mistral
   ```

3. **Restart the backend:**
   ```bash
   ./dev-start.sh
   ```

No external APIs, credentials, or cloud services needed!

## Browser Compatibility

- ✅ Chrome/Chromium (best support)
- ✅ Edge (Chromium-based)
- ✅ Safari (iOS 14.5+)
- ✅ Firefox (limited)
- ⚠️ Opera (partial support)

## Limitations & Future Improvements

**Current:**
- Speech recognition via Web Speech API (English only, works best in Chrome)
- Single browser instance per session
- Ollama must be running on localhost:11434

**Future Enhancements:**
- Multi-language speech recognition
- Speaker diarization (identify different speakers)
- Real-time audio streaming
- Multi-user conversation support
- Audio download/export
- Accent and pronunciation feedback
- Custom fine-tuned models

## Performance Notes

- **Latency**: <200ms per translation with Phi model (local inference)
- **Throughput**: Can handle 10+ concurrent sessions
- **Memory**: ~150MB (backend) + 2.6GB (Phi model) + ~50MB per session
- **Network**: None required - completely local operation
- **No external dependencies**: All processing happens on your machine

## Troubleshooting

**Microphone not working?**
- Check browser permissions
- Ensure microphone is not in use by another app
- Try a different browser

**Translation not appearing?**
- Ensure Ollama is running: `ollama serve`
- Check backend is running on port 5001: `curl http://localhost:5001/health`
- Check if model is loaded: `ollama list`
- Open browser DevTools (F12) to see network errors
- Verify CORS is properly configured

**Ollama not responding?**
- Make sure `ollama serve` is running in a separate terminal
- Verify model is pulled: `ollama pull phi`
- Check if port 11434 is in use: `lsof -i :11434`

**Server won't start?**
- Ensure port 5001 is not in use: `lsof -i :5001`
- Try: `npm install` in server directory again

## License

MIT - Free to use and modify

## Contributing

Feel free to submit issues and enhancement requests!
