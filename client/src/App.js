import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API configuration - works in development and production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcripts, setTranscripts] = useState([]);

  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const trimmedText = finalTranscript.trim();
          setOriginalText(trimmedText);
          // Call translate after state update via setTimeout
          setTimeout(() => handleTranslate(trimmedText), 0);
        } else if (interimTranscript) {
          setOriginalText(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech Recognition not supported in this browser');
    }
  }, []);

  const handleTranslate = async (text) => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/translate`, {
        text: text,
        targetLanguage: targetLanguage
      });

      setTranslatedText(response.data.translatedText);
      
      // Add to transcript history
      setTranscripts(prev => [{
        original: response.data.originalText,
        translated: response.data.translatedText,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);

      setError('');
    } catch (err) {
      setError('Translation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      audioChunksRef.current = [];
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleManualTranslate = () => {
    if (originalText.trim()) {
      handleTranslate(originalText.trim());
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🌍 Live Translator</h1>
        
        <div className="controls">
          <div className="button-group">
            <button
              className={`btn btn-record ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
            </button>
          </div>

          <div className="language-selector">
            <label htmlFor="language">Target Language:</label>
            <select
              id="language"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={isRecording}
            >
              <option value="zh">Chinese (中文)</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="ja">Japanese (日本語)</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="translation-display">
          <div className="text-box original">
            <h3>🗣️ Original Text</h3>
            <div className="text-content">
              {originalText || <span className="placeholder">Your speech will appear here...</span>}
            </div>
            <button
              className="btn btn-translate"
              onClick={handleManualTranslate}
              disabled={!originalText || loading}
            >
              {loading ? '⏳ Translating...' : '✨ Translate'}
            </button>
          </div>

          <div className="arrow">→</div>

          <div className="text-box translated">
            <h3>🌐 Translation</h3>
            <div className="text-content">
              {translatedText || <span className="placeholder">Translation will appear here...</span>}
            </div>
          </div>
        </div>

        <div className="history">
          <h3>📝 Translation History</h3>
          <div className="history-list">
            {transcripts.length === 0 ? (
              <p className="no-history">No translations yet. Start recording to begin!</p>
            ) : (
              transcripts.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-time">{item.timestamp}</div>
                  <div className="history-content">
                    <p><strong>Original:</strong> {item.original}</p>
                    <p><strong>Translation:</strong> {item.translated}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
