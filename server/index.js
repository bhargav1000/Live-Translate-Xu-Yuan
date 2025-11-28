const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;

// Ollama configuration
const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

// Frontend URL for CORS (can be set for Amplify deployment)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// For demo purposes - using a mock speech-to-text and translation
// In production, you'd use Google Cloud APIs or similar services

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

/**
 * Transcribe audio endpoint
 * Expects base64 encoded audio data
 */
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // For demo: simulate transcription
    // In production, integrate with Google Cloud Speech-to-Text or other APIs
    const mockTranscriptions = [
      'Hello',
      'How are you?',
      'Nice to meet you',
      'What is your name?',
      'Good morning',
      'Thank you',
      'Have a great day'
    ];
    
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const text = mockTranscriptions[randomIndex];

    res.json({ 
      text,
      confidence: 0.95
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

/**
 * Translate text endpoint using Ollama LLM
 * Translates from English to target language
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'zh' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Map language codes to language names
    const languageMap = {
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese'
    };

    const targetLangName = languageMap[targetLanguage] || 'Chinese';

    // Create prompt for LLM translation
    const prompt = `Translate the following English text to ${targetLangName}. Only provide the translation, nothing else.

English: "${text}"
${targetLangName}:`;

    try {
      // Call Ollama API for translation
      const response = await axios.post(`${OLLAMA_API}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.3 // Low temperature for consistent translations
      }, { timeout: 30000 });

      const translated = response.data.response.trim();

      res.json({ 
        originalText: text,
        translatedText: translated,
        targetLanguage,
        model: OLLAMA_MODEL
      });
    } catch (ollamaError) {
      console.error('Ollama error:', ollamaError.message);
      
      // Fallback to mock translations if Ollama is not available
      const mockTranslations = {
        'hello': { zh: '你好', es: 'Hola', fr: 'Bonjour', de: 'Hallo', ja: 'こんにちは' },
        'how are you?': { zh: '你好吗？', es: '¿Cómo estás?', fr: 'Comment allez-vous?', de: 'Wie geht es dir?', ja: 'お元気ですか？' },
        'nice to meet you': { zh: '很高兴认识你', es: 'Encantado de conocerte', fr: 'Enchanté de te rencontrer', de: 'Schön dich kennenzulernen', ja: '会えてうれしいです' },
        'what is your name?': { zh: '你叫什么名字？', es: '¿Cuál es tu nombre?', fr: 'Quel est ton nom?', de: 'Wie heißt du?', ja: 'あなたの名前は何ですか？' },
        'good morning': { zh: '早上好', es: 'Buenos días', fr: 'Bonjour', de: 'Guten Morgen', ja: 'おはよう' },
        'thank you': { zh: '谢谢', es: 'Gracias', fr: 'Merci', de: 'Danke', ja: 'ありがとう' },
        'have a great day': { zh: '祝你今天愉快', es: 'Que tengas un gran día', fr: 'Passe une bonne journée', de: 'Hab einen schönen Tag', ja: '素晴らしい一日を' }
      };

      const lowerText = text.toLowerCase();
      const fallbackTranslated = mockTranslations[lowerText]?.[targetLanguage] || `[${targetLangName}] ${text}`;

      res.json({ 
        originalText: text,
        translatedText: fallbackTranslated,
        targetLanguage,
        fallback: true,
        note: 'Ollama not available, using fallback translations. Start Ollama with: ollama serve'
      });
    }
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed: ' + error.message });
  }
});

/**
 * Combined endpoint: audio -> text -> translation
 */
app.post('/api/translate-audio', async (req, res) => {
  try {
    const { audio, targetLanguage = 'zh' } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Step 1: Transcribe (using mock data for demo)
    const mockTranscriptions = [
      'Hello',
      'How are you?',
      'Nice to meet you',
      'What is your name?',
      'Good morning',
      'Thank you',
      'Have a great day'
    ];
    
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const text = mockTranscriptions[randomIndex];

    // Step 2: Translate using Ollama
    const languageMap = {
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese'
    };

    const targetLangName = languageMap[targetLanguage] || 'Chinese';
    const prompt = `Translate the following English text to ${targetLangName}. Only provide the translation, nothing else.

English: "${text}"
${targetLangName}:`;

    try {
      const response = await axios.post(`${OLLAMA_API}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.3
      }, { timeout: 30000 });

      const translated = response.data.response.trim();

      res.json({ 
        originalText: text,
        translatedText: translated,
        targetLanguage,
        confidence: 0.95,
        model: OLLAMA_MODEL
      });
    } catch (ollamaError) {
      console.error('Ollama error:', ollamaError.message);
      
      // Fallback
      const mockTranslations = {
        'hello': { zh: '你好', es: 'Hola', fr: 'Bonjour', de: 'Hallo', ja: 'こんにちは' },
        'how are you?': { zh: '你好吗？', es: '¿Cómo estás?', fr: 'Comment allez-vous?', de: 'Wie geht es dir?', ja: 'お元気ですか？' },
        'nice to meet you': { zh: '很高兴认识你', es: 'Encantado de conocerte', fr: 'Enchanté de te rencontrer', de: 'Schön dich kennenzulernen', ja: '会えてうれしいです' },
        'what is your name?': { zh: '你叫什么名字？', es: '¿Cuál es tu nombre?', fr: 'Quel est ton nom?', de: 'Wie heißt du?', ja: 'あなたの名前は何ですか？' },
        'good morning': { zh: '早上好', es: 'Buenos días', fr: 'Bonjour', de: 'Guten Morgen', ja: 'おはよう' },
        'thank you': { zh: '谢谢', es: 'Gracias', fr: 'Merci', de: 'Danke', ja: 'ありがとう' },
        'have a great day': { zh: '祝你今天愉快', es: 'Que tengas un gran día', fr: 'Passe une bonne journée', de: 'Hab einen schönen Tag', ja: '素晴らしい一日を' }
      };

      const lowerText = text.toLowerCase();
      const fallbackTranslated = mockTranslations[lowerText]?.[targetLanguage] || `[${targetLangName}] ${text}`;

      res.json({ 
        originalText: text,
        translatedText: fallbackTranslated,
        targetLanguage,
        confidence: 0.95,
        fallback: true,
        note: 'Ollama not available'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
