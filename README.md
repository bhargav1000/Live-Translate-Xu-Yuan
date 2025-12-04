# 🌍 Live Translator

Real-time speech translation with local AI. Speak in English, get instant translations in Chinese, Spanish, French, German, or Japanese.

## ⚡ Quick Start (60 seconds)

### Step 1: Install Dependencies
First time only:
```bash
brew install ollama
ollama pull phi
```

### Step 2: Start Everything
```bash
cd /Users/bhargav/Desktop/Live-Translate-Xu-Yuan
./dev-start.sh
```

### Step 3: Open & Use
Visit **http://localhost:3000** in your browser.

That's it! 🎉

---

## 🎤 How to Use

1. Click **"🎤 Start Recording"**
2. **Speak in English** (your speech appears instantly)
3. **Select target language** from dropdown
4. **See translation** in real-time
5. **Drag windows** around to organize your workspace

---

## ✨ What You Get

- 🎙️ **Real-time speech capture** using your browser's microphone
- 🤖 **AI translations** powered by local Ollama (no cloud APIs)
- 📝 **Translation history** for every session
- 💨 **Fast** - translations in ~100ms locally on your machine
- 🏠 **Private** - everything runs on your computer
- 🎨 **Beautiful UI** with draggable windows

---

## 🛠️ System Requirements

- Node.js (v14+)
- macOS / Linux / Windows
- 4GB+ RAM
- Ollama installed (`brew install ollama`)

---

## 📚 Need More?

- **Setup & Installation**: [QUICKSTART.md](QUICKSTART.md)
- **Advanced Config**: [ADVANCED.md](ADVANCED.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Ollama Guide**: [OLLAMA_SETUP.md](OLLAMA_SETUP.md)

---

## ❓ Troubleshooting

**"Ollama not found"**
```bash
brew install ollama
ollama pull phi
```

**"Port 3000 in use"**
- `dev-start.sh` auto-kills the process, try again

**"No microphone?"**
- Check browser permissions (click lock 🔒 in address bar)
- Ensure microphone isn't in use by another app

**Still stuck?** Check [ADVANCED.md](ADVANCED.md#troubleshooting)

---

## 📦 What's Running

When you run `./dev-start.sh`:

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React app in your browser |
| Backend | 5001 | Express API server |
| Ollama | 11434 | AI translation engine |

All auto-start with one command!

---

## 🚀 What's Next?

- Try different languages in the dropdown
- Drag windows to customize your layout
- Run it on your own server: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📄 License

MIT - Use freely!
