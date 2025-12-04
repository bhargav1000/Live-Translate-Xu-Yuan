import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// API configuration - works in development and production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function DraggableWindow({ title, children, icon, className, initialX = 0, initialY = 0 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.window-header')) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.x,
        y: e.clientY - rect.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !windowRef.current) return;
      
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;
      
      // Constrain to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 50));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, offset]);

  return (
    <div
      ref={windowRef}
      className={`draggable-window ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header">
        <span className="window-icon">{icon}</span>
        <h3 className="window-title">{title}</h3>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
}

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

  // Memoized translation handler
  const handleTranslate = useCallback(async (text) => {
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
  }, [targetLanguage]);

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
  }, [handleTranslate]);

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
              <option value="ko">Korean (한국어)</option>
              <option value="vi">Vietnamese (Tiếng Việt)</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="workspace">
          <DraggableWindow title="Original Text" icon="🗣️" className="original-window" initialX={50} initialY={250}>
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
          </DraggableWindow>

          <DraggableWindow title="Translation" icon="🌐" className="translation-window" initialX={470} initialY={250}>
            <div className="text-content">
              {translatedText || <span className="placeholder">Translation will appear here...</span>}
            </div>
          </DraggableWindow>

          <DraggableWindow title="Translation History" icon="📝" className="history-window" initialX={120} initialY={550}>
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
          </DraggableWindow>
        </div>
      </div>
    </div>
  );
}

export default App;
