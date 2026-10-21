import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  sendMessage,
  listConversations,
  getConversationMessages,
  deleteConversation,
  listDocuments,
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Source {
  document_id: string;
  filename: string;
  page: number;
  snippet: string;
  score: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[] | null;
  created_at: string;
  intent?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface DocItem {
  id: string;
  filename: string;
  page_count: number;
  chunk_count: number;
  status: string;
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId || null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [lastIntent, setLastIntent] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages]);

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await listDocuments();
      if (data?.documents) {
        setDocuments(data.documents);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await listConversations();
      setConversations(data.conversations);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        // Check if server is waking up
        if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setWakingUp(true);
          setTimeout(() => {
            setWakingUp(false);
            fetchConversations();
          }, 5000);
        }
      }
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const { data } = await getConversationMessages(convId);
      setMessages(data.messages);
    } catch {
      addToast('Failed to load messages', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchConversations();
    fetchDocs();
  }, [fetchConversations, fetchDocs]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, fetchMessages]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    // Optimistic add user message
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const wakingTimeout = setTimeout(() => setWakingUp(true), 5000);

    try {
      const { data } = await sendMessage(
        text,
        activeConvId || undefined,
        selectedDocId ? [selectedDocId] : undefined
      );
      clearTimeout(wakingTimeout);
      setWakingUp(false);

      // If new conversation, update state
      if (!activeConvId) {
        setActiveConvId(data.conversation_id);
        navigate(`/chat/${data.conversation_id}`, { replace: true });
        fetchConversations();
      }

      const assistantMsg: Message = {
        id: 'resp-' + Date.now(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        created_at: new Date().toISOString(),
        intent: data.intent,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLastIntent(data.intent);
    } catch (err: any) {
      clearTimeout(wakingTimeout);
      setWakingUp(false);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to send message';
      addToast(msg, 'error');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setLastIntent('');
    navigate('/chat');
    inputRef.current?.focus();
  };

  const handleDeleteConv = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
      addToast('Conversation deleted', 'success');
    } catch {
      addToast('Failed to delete conversation', 'error');
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const intentBadge = (intent: string | undefined) => {
    if (!intent) return null;
    const colors: Record<string, string> = {
      rag: 'var(--accent)',
      summarize: 'var(--warning)',
      general: 'var(--success)',
    };
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: `${colors[intent] || 'var(--accent)'}22`, color: colors[intent] || 'var(--accent)' }}
      >
        {intent.toUpperCase()}
      </span>
    );
  };

  const samplePrompts = [
    'Summarize this document',
    'What are the key takeaways?',
    'Explain the main topics and concepts',
    'Find specific numbers, codes and data',
  ];

  return (
    <div className="h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300"
        style={{
          width: sidebarOpen ? '280px' : '0',
          minWidth: sidebarOpen ? '280px' : '0',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Conversations</h2>
          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
              No conversations yet. Start a new chat!
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className="group rounded-lg p-3 mb-1 cursor-pointer transition-all duration-200"
                style={{
                  background: activeConvId === conv.id ? 'var(--bg-hover)' : 'transparent',
                  border: activeConvId === conv.id ? '1px solid var(--border-light)' : '1px solid transparent',
                }}
                onClick={() => {
                  setActiveConvId(conv.id);
                  navigate(`/chat/${conv.id}`);
                }}
              >
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{conv.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConv(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity cursor-pointer"
                    style={{ color: 'var(--danger)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => navigate('/documents')}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            📁 Manage Documents ({documents.length})
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-2 py-1 rounded text-sm transition-all hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            >
              ☰
            </button>
            <h1
              onClick={() => navigate('/documents')}
              className="text-lg font-bold cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              DocMind AI
            </h1>
            {lastIntent && intentBadge(lastIntent)}
          </div>

          <div className="flex items-center gap-3">
            {/* Document scope selector */}
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Scope:</span>
              <select
                value={selectedDocId || ''}
                onChange={(e) => setSelectedDocId(e.target.value || null)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <option value="">📚 All Indexed Documents ({documents.filter(d => d.status === 'indexed').length})</option>
                {documents.filter(d => d.status === 'indexed').map((d) => (
                  <option key={d.id} value={d.id}>
                    📄 {d.filename} ({d.chunk_count} chunks)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => navigate('/documents')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              + Upload PDF
            </button>
          </div>
        </header>

        {/* Waking Up Banner */}
        {wakingUp && (
          <div className="px-4 py-2 text-center text-sm" style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--accent-light)' }}>
            ⏳ Processing your question...
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-6xl mb-4 animate-bounce">🧠</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Direct Document RAG Assistant
              </h2>
              <p className="max-w-md text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Ask any question about your uploaded PDF documents. The AI searches chunks with vector similarity and provides precise answers with exact page citations.
              </p>

              {/* Sample Prompts */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent-light)',
                    }}
                  >
                    ✨ {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-3 shadow-lg"
                    style={{
                      background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Intent badge for assistant messages */}
                    {msg.role === 'assistant' && msg.intent && (
                      <div className="mt-2">{intentBadge(msg.intent)}</div>
                    )}

                    {/* Sources */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="text-xs font-medium flex items-center gap-1 transition-all hover:opacity-80 cursor-pointer"
                          style={{ color: 'var(--accent-light)' }}
                        >
                          {expandedSources.has(msg.id) ? '▾' : '▸'} Verified Citations ({msg.sources.length})
                        </button>

                        {expandedSources.has(msg.id) && (
                          <div className="mt-2 flex flex-col gap-2">
                            {msg.sources.map((src, i) => (
                              <div
                                key={i}
                                className="rounded-lg p-3 text-xs"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold" style={{ color: 'var(--accent-light)' }}>
                                    📄 {src.filename}, page {src.page}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.5 rounded text-xs"
                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                                  >
                                    {(src.score * 100).toFixed(0)}% match
                                  </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>{src.snippet}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-1.5 items-center">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents (e.g. 'What is the quantum key?')..."
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                maxHeight: '120px',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', color: '#fff' }}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
