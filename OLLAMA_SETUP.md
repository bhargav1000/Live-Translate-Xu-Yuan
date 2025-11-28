# Ollama Setup Guide

## What is Ollama?

Ollama is a lightweight framework for running Large Language Models (LLMs) locally on your machine. It's perfect for real-time translation without needing cloud APIs.

## Installation

### macOS
```bash
# Install via Homebrew
brew install ollama

# Or download from: https://ollama.ai/download/mac
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download from: https://ollama.ai/download/windows

## Running Ollama

### Start the Ollama Service
```bash
ollama serve
```

This will start Ollama on `http://localhost:11434`

### Pull a Model

In a new terminal, download a lightweight model:

```bash
# Mistral (fast & good for translations - 4GB)
ollama pull mistral

# Or other options:
ollama pull neural-chat    # 4GB - good for conversations
ollama pull llama2          # 3.8GB - solid all-around
ollama pull phi             # 2.6GB - very fast, smaller
```

## Recommended Models for Translation

| Model | Size | Speed | Quality | Command |
|-------|------|-------|---------|---------|
| **mistral** | 4GB | Fast | Good | `ollama pull mistral` |
| phi | 2.6GB | Very Fast | Decent | `ollama pull phi` |
| neural-chat | 4GB | Fast | Very Good | `ollama pull neural-chat` |
| llama2 | 3.8GB | Moderate | Very Good | `ollama pull llama2` |

## How the App Uses Ollama

When you speak and the app translates:

1. **Frontend** captures your speech via Web Speech API
2. **Backend** receives the transcribed text
3. **Backend** sends to Ollama: "Translate this English text to Chinese"
4. **Ollama** runs the LLM locally to generate the translation
5. **Translation** is returned instantly to the frontend

## Configuration

The app uses these environment variables in `server/.env`:

```
OLLAMA_API=http://localhost:11434
OLLAMA_MODEL=mistral
```

Change `OLLAMA_MODEL` to use a different model after pulling it.

## Testing Ollama Manually

```bash
# Test if Ollama is running
curl http://localhost:11434/api/tags

# Test a translation
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "Translate to Chinese: Hello, how are you?",
    "stream": false
  }'
```

## Fallback Behavior

If Ollama is not running, the app automatically falls back to a small dictionary of pre-translated phrases. This keeps the demo functional even without Ollama.

## Performance Notes

- **First run**: Model loads into memory (~5-10 seconds)
- **Subsequent runs**: <500ms per translation
- **Memory**: ~4-8GB depending on model
- **GPU Support**: Ollama supports GPU acceleration if available

## Troubleshooting

**Port already in use?**
```bash
# Change Ollama port
OLLAMA_HOST=0.0.0.0:11435 ollama serve
# Update server/.env OLLAMA_API=http://localhost:11435
```

**Model not found?**
```bash
# List available models
ollama list

# Pull a model
ollama pull mistral
```

**App keeps using fallback translations?**
- Ensure `ollama serve` is running
- Check `curl http://localhost:11434/api/tags` returns models
- Check server logs for error messages
