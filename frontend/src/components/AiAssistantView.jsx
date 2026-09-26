import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Copy, Check, RefreshCw, Volume2, RotateCcw, User, AlertCircle, ArrowRight } from 'lucide-react';
import { askAiAssistant } from '../services/api';

const EXAMPLE_PROMPTS = [
  { title: "Explain artificial intelligence", desc: "Learn the core concepts of AI & neural synthesis" },
  { title: "Write a short story", desc: "Generate a creative narration script for voiceovers" },
  { title: "Summarize this topic", desc: "Create concise, voice-ready summaries" },
  { title: "Help me learn Python", desc: "Step-by-step programming & syntax guide" }
];

export default function AiAssistantView({ token, user, onGenerateVoiceForText }) {
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputPrompt;
    if (!textToSend || !textToSend.trim() || isThinking) return;

    const userMessageText = textToSend.trim();
    setInputPrompt('');
    setErrorMessage('');

    const newUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      // Format history for backend API
      const historyPayload = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await askAiAssistant(userMessageText, historyPayload, token);

      const aiAnswer = response?.answer || "Sorry, I couldn't generate a response. Please try again.";
      const newAiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newAiMsg]);
    } catch (err) {
      console.error('AI assistant error:', err);
      setErrorMessage("Sorry, I couldn't generate a response. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMessage('');
    setInputPrompt('');
  };

  return (
    <div className="ref-ai-assistant-container">
      {/* Header Bar */}
      <header className="ref-ai-header">
        <div className="ref-ai-title-group">
          <div className="ref-ai-badge-icon">
            <Sparkles size={22} color="#2F81F7" />
          </div>
          <div>
            <h1 className="ref-ai-main-title">AI Assistant</h1>
            <p className="ref-ai-subtitle">
              Ask questions, write scripts & convert directly into natural AI Voice
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button onClick={handleClearChat} className="ref-tcbtn" title="Clear Chat History">
            <RotateCcw size={14} color="#C9D1D9" />
            <span>Clear Chat</span>
          </button>
        )}
      </header>

      {/* Main Chat Conversation Body */}
      <div className="ref-ai-chat-body">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="ref-ai-empty-state">
            <div className="ref-ai-empty-icon">
              <Sparkles size={40} color="#2F81F7" />
            </div>
            <h2 className="ref-ai-empty-heading">How can I help you today?</h2>
            <p className="ref-ai-empty-sub">
              Ask any question, generate voiceover scripts, or choose an example prompt below:
            </p>

            <div className="ref-ai-prompts-grid">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.title)}
                  className="ref-ai-prompt-card"
                >
                  <div className="ref-ai-prompt-top">
                    <span className="ref-ai-prompt-title">{prompt.title}</span>
                    <ArrowRight size={15} color="#8B949E" className="ref-ai-prompt-arrow" />
                  </div>
                  <span className="ref-ai-prompt-desc">{prompt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages Feed */
          <div className="ref-ai-messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ref-ai-message-row ${msg.role === 'user' ? 'user-row' : 'ai-row'}`}
              >
                <div className={`ref-ai-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                  {msg.role === 'user' ? (
                    <User size={16} color="#F0F6FC" />
                  ) : (
                    <Sparkles size={16} color="#FFFFFF" />
                  )}
                </div>

                <div className="ref-ai-message-bubble-wrapper">
                  <div className="ref-ai-message-meta">
                    <span className="ref-ai-sender-name">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="ref-ai-timestamp">{msg.timestamp}</span>
                  </div>

                  <div className="ref-ai-message-card">
                    <div className="ref-ai-message-content">
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>

                    {/* AI Message Action Buttons */}
                    {msg.role === 'assistant' && (
                      <div className="ref-ai-action-bar">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="ref-ai-action-btn"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={14} color="#3fb950" />
                              <span style={{ color: '#3fb950' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} color="#8B949E" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleRegenerate}
                          className="ref-ai-action-btn"
                          title="Regenerate AI answer"
                        >
                          <RefreshCw size={14} color="#8B949E" />
                          <span>Regenerate</span>
                        </button>

                        {onGenerateVoiceForText && (
                          <button
                            onClick={() => onGenerateVoiceForText(msg.content)}
                            className="ref-ai-action-btn primary-voice-btn"
                            title="Send text to Voice Studio to generate speech"
                          >
                            <Volume2 size={14} color="#FFFFFF" />
                            <span>Generate Voice</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking / Loading State */}
            {isThinking && (
              <div className="ref-ai-message-row ai-row">
                <div className="ref-ai-avatar ai-avatar">
                  <Sparkles size={16} color="#FFFFFF" className="spin-animation" />
                </div>
                <div className="ref-ai-message-bubble-wrapper">
                  <div className="ref-ai-message-meta">
                    <span className="ref-ai-sender-name">AI Assistant</span>
                  </div>
                  <div className="ref-ai-message-card thinking-card">
                    <div className="ref-ai-thinking-indicator">
                      <Sparkles size={16} color="#2F81F7" className="spin-animation" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="ref-error-banner" style={{ marginTop: '12px' }}>
                <AlertCircle size={16} color="#f87171" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Question Input Section */}
      <div className="ref-ai-input-footer">
        <div className="ref-ai-input-card">
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
            rows={2}
            className="ref-ai-textarea"
            disabled={isThinking}
          />

          <div className="ref-ai-input-actions">
            <span className="ref-ai-input-hint">
              Press <strong>Enter</strong> to send
            </span>

            <button
              onClick={() => handleSend()}
              disabled={isThinking || !inputPrompt.trim()}
              className="ref-btn-generate-blue ref-ai-send-btn"
              title="Send question to AI"
            >
              <Send size={16} color="#FFFFFF" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
