import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Database,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  User as UserIcon,
  Bot
} from 'lucide-react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatMessage, ChatSession, SourceReference } from '../types/index.ts';

interface AssistantViewProps {
  onSelectDoc: (id: string) => void;
}

export default function AssistantView({ onSelectDoc }: AssistantViewProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'How many projects are completed?',
    'What is the PTO policy and remote work guidelines?',
    'Project Titan architecture and tech stack overview',
    'What is the secret recipe for Martian chocolate cookies?'
  ];

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    try {
      const res = await api.getChatSessions();
      setSessions(res.sessions || []);
      if (res.sessions && res.sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(res.sessions[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadMessages = async (sid: string) => {
    try {
      const res = await api.getSessionMessages(sid);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewChat = async () => {
    try {
      const res = await api.createChatSession('New Conversation', user?.id || 'usr-admin');
      setSessions([res.session, ...sessions]);
      setCurrentSessionId(res.session.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    try {
      await api.deleteChatSession(sid);
      const remaining = sessions.filter(s => s.id !== sid);
      setSessions(remaining);
      if (currentSessionId === sid) {
        setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    let targetSessionId = currentSessionId;

    if (!targetSessionId) {
      try {
        const title = text.length > 35 ? text.substring(0, 35) + '...' : text;
        const newSes = await api.createChatSession(title, user?.id || 'usr-admin');
        setSessions([newSes.session, ...sessions]);
        setCurrentSessionId(newSes.session.id);
        targetSessionId = newSes.session.id;
      } catch (err) {
        console.error('Failed to auto-create session:', err);
        return;
      }
    }

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      session_id: targetSessionId,
      sender: 'user',
      content: text,
      sources: [],
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.sendChatMessage(targetSessionId, text, user?.role || 'admin');
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), res.userMessage, res.assistantMessage]);
      loadSessions(); // update titles & counts
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        session_id: targetSessionId,
        sender: 'assistant',
        content: `Error retrieving grounded answer: ${err.message}`,
        sources: [],
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const toggleSourceExpand = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="chat-layout">
      {/* Left Column: Chat History Sessions */}
      <div className="chat-sessions-sidebar">
        <div className="chat-sessions-header">
          <span className="font-bold text-slate-800 text-xs">Chat History</span>
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus size={13} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="chat-sessions-list">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No conversations yet.
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className={`chat-session-item group ${isActive ? 'active' : ''}`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="truncate text-xs font-medium">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {s.message_count || 0} messages
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded transition-opacity"
                    title="Delete Conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Grounded Answers Notice */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-600 mb-0.5">
            <ShieldCheck size={13} />
            <span>Grounded Answers Only</span>
          </div>
          <div>Assistant retrieves only records permitted by your <strong className="text-slate-700 capitalize">{user?.role || 'admin'}</strong> role.</div>
        </div>
      </div>

      {/* Right Column: Active Chat Area */}
      <div className="chat-main-area">
        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="my-auto text-center py-12 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                EnterpriseIQ Knowledge Assistant
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Ask questions regarding enterprise policy documents, architecture specs, vendor contracts, or dynamic SQLite project portfolio metrics.
              </p>

              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Suggested Prompts:
                </span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="block w-full text-left text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 p-2.5 rounded-xl transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              const isExpanded = expandedSources[m.id] ?? true;

              return (
                <div key={m.id} className={`chat-bubble-row ${m.sender}`}>
                  <div className={`chat-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
                    {isUser ? <UserIcon size={18} /> : <Bot size={18} />}
                  </div>

                  <div className="flex-1 max-w-[85%]">
                    <div className="chat-bubble">
                      <div className="whitespace-pre-wrap leading-relaxed text-xs md:text-sm">
                        {m.content}
                      </div>

                      {/* Verified Source References */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="sources-container">
                          <button
                            onClick={() => toggleSourceExpand(m.id)}
                            className="sources-header hover:text-indigo-600 w-full flex items-center justify-between py-1 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileText size={12} className="text-indigo-600" />
                              <span>VERIFIED SOURCE REFERENCES ({m.sources.length})</span>
                            </span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {m.sources.map((src, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-white border border-slate-200/90 rounded-xl text-xs shadow-sm"
                                >
                                  <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                                    <div className="flex items-center gap-1.5">
                                      {src.type === 'database' ? (
                                        <Database size={13} className="text-emerald-600" />
                                      ) : (
                                        <FileText size={13} className="text-indigo-600" />
                                      )}
                                      <span className="text-xs">{src.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      {src.detail}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-mono leading-relaxed border border-slate-100">
                                    {src.reference}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="chat-bubble-row assistant">
              <div className="chat-avatar ai-avatar">
                <Bot size={18} />
              </div>
              <div className="chat-bubble">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles size={14} className="text-indigo-600 animate-spin" />
                  <span>Retrieving verified records & synthesizing grounded response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Form */}
        <div className="chat-input-bar">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a question about business records, policies, budgets, or projects... (Press Enter to send)"
            disabled={sending}
            className="flex-1 bg-white border border-slate-200 rounded-full px-5 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
