# Live Translator - Quick Start

## ⚡ One Command to Start Everything

```bash
cd /Users/bhargav/Desktop/Live-Translate-Xu-Yuan
./dev-start.sh
```

Done! Open **http://localhost:3000** in your browser.

---

## 🎤 How to Use

1. **Click "🎤 Start Recording"** - Browser will ask for microphone permission
2. **Speak in English** - Your speech appears in the "Original Text" window
3. **Select target language** - Chinese, Spanish, French, German, or Japanese
4. **Translations appear instantly** - In the "Translation" window
5. **View history** - All translations saved in the "Translation History" window
6. **Drag windows** - Click and drag any window header to reposition

---

## ⚙️ What Gets Started Automatically

- **Backend Server** - Express API on port 5001
- **Frontend** - React app on port 3000
- **Ollama LLM** - Local AI model on port 11434 (if installed)

All services start with a single command!

---

## 📦 First Time Setup

If Ollama is not installed:

```bash
# Install Ollama (macOS)
brew install ollama

# Then download a fast model
ollama pull phi
```

Once Ollama is installed, `./dev-start.sh` will automatically start it every time.

---

## 🛑 To Stop

Press `Ctrl+C` in the terminal. All services will shut down cleanly.

---

## 🚀 Architecture

```
Browser (localhost:3000)
    ↓
React Frontend (Web Speech API)
    ↓
Express Backend (localhost:5001)
    ↓
Ollama LLM (localhost:11434)
    ↓
Translation Results
```

---

## 🔍 Troubleshooting

**"Ollama not found"**
- Install: `brew install ollama`
- Pull model: `ollama pull phi`

**Port already in use?**
- `dev-start.sh` auto-kills processes on ports 3000 & 5001
- Ollama uses port 11434

**Slow translations?**
- Make sure you have the `phi` model: `ollama pull phi`
- Phi is 3x faster than Mistral (~100ms vs ~300ms)

**No browser microphone access?**
- Click the lock icon in address bar → allow microphone
- Some browsers need HTTPS (localhost is OK)

---

## 📚 Next Steps

- Customize languages in `client/src/App.js`
- Deploy to AWS: See `DEPLOYMENT.md`
- Modify translation prompts in `server/index.js`

Happy translating! 🌍
