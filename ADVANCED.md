# Advanced Configuration & Development

This document contains advanced setup, configuration, and development information. **Most users don't need this—start with [README.md](README.md) instead.**

---

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Customization](#customization)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Development](#development)
- [Browser Compatibility](#browser-compatibility)

---

## Architecture

### Why Node.js instead of Python?

For real-time conversational translation, **Node.js is significantly faster** than Python:

- **Non-blocking I/O**: Handles multiple requests concurrently without blocking
- **Lower latency**: JavaScript execution is faster for web operations
- **Better web integration**: Native JavaScript runtime in browsers and servers
- **Scalability**: Handles more concurrent users with same resources
- **Memory efficient**: Lower overhead per connection

Python works for batch processing but introduces latency in real-time scenarios.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Browser (localhost:3000)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Frontend                                        │ │
│  │  • Web Speech API for audio capture                    │ │
│  │  • Draggable UI windows                                │ │
│  │  • Translation history display                         │ │
│  └────────────────┬─────────────────────────────────────┘ │
└─────────────────┼──────────────────────────────────────────┘
                  │ HTTP/Axios
┌─────────────────▼──────────────────────────────────────────┐
│         Node.js Express Backend (port 5001)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  API Endpoints:                                      │ │
│  │  • POST /api/translate - Text translation           │ │
│  │  • POST /api/transcribe - Audio transcription       │ │
│  │  • POST /api/translate-audio - Combined endpoint    │ │
│  │  • GET /health - Health check                       │ │
│  └──────────────┬───────────────────────────────────────┘ │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────────┐ │
│  │  Ollama Integration (localhost:11434)               │ │
│  │  • Calls Ollama API for LLM inference               │ │
│  │  • Fallback to mock translations if unavailable     │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                  │ HTTP
┌──────────────────▼──────────────────────────────────────┐
│     Ollama Server (port 11434)                         │
│                                                        │
│  ┌────────────────────────────────────────────────────┐│
│  │ Large Language Model (Phi / Mistral / etc.)       ││
│  │ • Runs locally on your machine                    ││
│  │ • ~100-300ms per inference                        ││
│  │ • Completely private (no network requests)        ││
│  └────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User speaks** → Web Speech API captures audio
2. **Frontend processes** → Converts speech to text (browser-native)
3. **Sends to backend** → REST API call with text + target language
4. **Backend translates** → Calls Ollama LLM
5. **Returns result** → JSON response with translation
6. **Displays in UI** → Real-time update with glow effect

Total latency: **~100-200ms** (mostly LLM inference time)

---

## Project Structure

```
Live-Translate-Xu-Yuan/
├── README.md                    # Quick start guide
├── QUICKSTART.md                # Setup instructions
├── ADVANCED.md                  # This file (advanced config)
├── DEPLOYMENT.md                # Production deployment
├── CLOUD_DEPLOYMENT.md          # AWS architecture
├── OLLAMA_SETUP.md              # LLM setup guide
├── dev-start.sh                 # Auto-start script
│
├── server/                      # Express backend
│   ├── index.js                 # Main server & API endpoints
│   ├── package.json             # Dependencies
│   ├── .env                     # Environment variables
│   └── Dockerfile               # Docker image for ECS
│
└── client/                      # React frontend
    ├── public/
    │   └── index.html           # HTML entry point
    ├── src/
    │   ├── App.js               # Main React component
    │   ├── App.css              # Styling & animations
    │   ├── index.js             # React entry point
    │   └── index.css            # Global styles
    ├── package.json             # React dependencies
    ├── .env.development         # Dev config
    └── .env.production          # Production config
```

---

## Configuration

### Backend Configuration (server/.env)

```env
# Server
PORT=5001
NODE_ENV=development

# Ollama LLM
OLLAMA_API=http://localhost:11434
OLLAMA_MODEL=phi

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5001 | Express server port |
| `NODE_ENV` | development | Environment mode |
| `OLLAMA_API` | localhost:11434 | Ollama server URL |
| `OLLAMA_MODEL` | phi | LLM model to use |
| `FRONTEND_URL` | localhost:3000 | Frontend URL (CORS) |

### Frontend Configuration (client/.env.development)

```env
REACT_APP_API_URL=http://localhost:5001
```

### Frontend Configuration (client/.env.production)

```env
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## Customization

### Change Translation Language Support

Edit `client/src/App.js` - search for language options:

```javascript
<select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
  <option value="zh">Chinese (中文)</option>
  <option value="es">Spanish (Español)</option>
  <option value="fr">French (Français)</option>
  <option value="de">German (Deutsch)</option>
  <option value="ja">Japanese (日本語)</option>
  <option value="it">Italian (Italiano)</option>  {/* Add new */}
  <option value="pt">Portuguese (Português)</option>  {/* Add new */}
</select>
```

The backend automatically handles new language codes.

### Change Translation Model

Edit `server/.env`:

```env
OLLAMA_MODEL=mistral
```

Then pull the model:

```bash
ollama pull mistral
```

Available models: `phi`, `mistral`, `neural-chat`, `llama2`, `vicuna`

### Customize Translation Prompt

Edit `server/index.js` - find the translation endpoint:

```javascript
const prompt = `You are a translation expert. Translate the following English text to ${langMap[targetLanguage]}. 
Only respond with the translation, nothing else.
Text: ${text}`;
```

Customize the prompt to change translation style or behavior.

### Modify UI Colors

Edit `client/src/App.css`:

```css
/* Change primary gradient */
.window-header {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

/* Change background */
body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f4c75 100%);
}

/* Change neon hover color */
.draggable-window:hover .window-title {
  color: #YOUR_NEON_COLOR;
}
```

---

## Performance Tuning

### Optimize Ollama Response Time

**In server/index.js**, adjust Ollama parameters:

```javascript
const response = await axios.post(`${OLLAMA_API}/api/generate`, {
  model: OLLAMA_MODEL,
  prompt: prompt,
  stream: false,
  temperature: 0.1,      // Lower = more deterministic
  top_p: 0.5,            // Lower = faster but less varied
  num_predict: 100,      // Max tokens to generate
  top_k: 40,             // Reduce candidates for speed
});
```

**For fastest results:**
- Use `phi` model (2.6GB, ~100ms per translation)
- Set `temperature: 0.1` (focused, not creative)
- Set `top_p: 0.3` (very fast, deterministic)

**For best quality:**
- Use `neural-chat` (4GB, best quality)
- Set `temperature: 0.7` (creative, good variety)
- Set `top_p: 0.9` (consider more options)

### Monitor Backend Performance

Check endpoint health:

```bash
# Health check
curl http://localhost:5001/health

# Translation speed test
curl -X POST http://localhost:5001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","targetLanguage":"zh"}'
```

### Frontend Performance

**Browser DevTools:**
1. Open DevTools (F12)
2. Network tab → see API latency
3. Performance tab → record interactions
4. Lighthouse → generate performance report

---

## Troubleshooting

### Backend Issues

**"Cannot find module 'express'"**
```bash
cd server
npm install
```

**"Port 5001 already in use"**
```bash
lsof -i :5001
kill -9 <PID>
# Or just run ./dev-start.sh (auto-kills processes)
```

**"Cannot connect to Ollama"**
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve

# Test connection
curl http://localhost:11434/api/tags
```

**CORS errors in browser console**
- Check `FRONTEND_URL` in `server/.env` matches your domain
- Restart backend: `npm start` (in server directory)

### Frontend Issues

**"Microphone not working"**
- Check browser permissions
- Try different browser (Chrome has best support)
- Check microphone isn't in use by another app

**"Translation not appearing"**
1. Open DevTools (F12)
2. Console tab → look for errors
3. Network tab → check API calls
4. Backend logs → check for errors

**"Blank screen"**
```bash
cd client
npm install
npm start
```

### Ollama Issues

**"Model not found"**
```bash
# List installed models
ollama list

# Pull a model
ollama pull phi
```

**"Out of memory"**
- Reduce model size: `ollama pull phi` instead of `neural-chat`
- Close other applications
- Use smaller Ollama model

**"Slow translations"**
- Check system CPU/RAM usage
- Try smaller model: `ollama pull phi`
- Restart Ollama: `ollama serve`

---

## API Reference

### POST /api/translate

Translate text to a target language.

**Request:**
```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "zh"
}
```

**Response:**
```json
{
  "originalText": "Hello, how are you?",
  "translatedText": "你好，你好吗？",
  "targetLanguage": "zh"
}
```

**Language codes:**
- `zh` - Chinese (Simplified)
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ko` - Korean

**Error responses:**

```json
{
  "error": "Translation service unavailable. Using fallback."
}
```

### POST /api/transcribe

Transcribe audio data to text (currently not used - Web Speech API used instead).

**Request:**
```json
{
  "audio": "base64_encoded_audio_data"
}
```

**Response:**
```json
{
  "text": "Hello world",
  "confidence": 0.95
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "Server is running"
}
```

---

## Development

### Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### Run in Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

**Terminal 3 - Ollama (optional):**
```bash
ollama serve
```

### Build for Production

**Frontend:**
```bash
cd client
npm run build
```

This creates optimized bundle in `client/build/`

**Backend:**
```bash
cd server
npm run build  # or just use npm start
```

### Project Dependencies

**Backend (server/package.json):**
- `express` - Web framework
- `cors` - CORS middleware
- `axios` - HTTP client for Ollama
- `dotenv` - Environment variables

**Frontend (client/package.json):**
- `react` - UI framework
- `react-dom` - React rendering
- `axios` - HTTP client
- No complex build tools - just Create React App

---

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Web Speech API | ✅ | ⚠️ | ❌ | ✅ |
| Drag & Drop | ✅ | ✅ | ✅ | ✅ |
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| Fetch API | ✅ | ✅ | ✅ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |

**Best Support:** Chrome/Chromium (Brave, Edge, Opera)

---

## Future Enhancements

- [ ] Multi-language speech recognition
- [ ] Speaker diarization (identify speakers)
- [ ] Real-time audio streaming
- [ ] Multi-user conversation support
- [ ] Audio recording/playback
- [ ] Custom fine-tuned models
- [ ] Accent feedback
- [ ] Pronunciation scoring
- [ ] Integration with Google Translate API
- [ ] WebSocket for real-time updates

---

## Contributing

Found a bug or have a feature request? Feel free to open an issue on GitHub!

---

## License

MIT - Free to use and modify
