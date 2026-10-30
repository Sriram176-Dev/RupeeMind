import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  sendCopilotMessageApi,
  getCopilotSessionApi,
  clearCopilotSessionApi,
} from '../../services/copilotService';
import type { CopilotMessage, CopilotContextSummary } from '../../types';
import { formatCompactINR } from '../../lib/utils';
import {
  Bot,
  User,
  Sparkles,
  Send,
  X,
  Trash2,
  Minimize2,
  Maximize2,
  ChevronDown,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Lightweight, safe parser for formatted AI assistant markdown
 */
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm text-[#0B1220] leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Heading 3 / 4
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={idx} className="font-bold text-emerald-700 mt-2 mb-1 text-xs uppercase tracking-wide">
              {trimmed.replace('#### ', '')}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-[#0B1220] mt-3 mb-1 text-sm flex items-center gap-1.5">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="text-emerald-600 text-xs mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content) }} />
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)/);
          if (match) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
                <span className="font-bold text-emerald-600 text-xs shrink-0">{match[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(match[2]) }} />
              </div>
            );
          }
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Standard paragraph
        return (
          <p key={idx} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(trimmed) }} />
        );
      })}
    </div>
  );
};

function renderInlineMarkdown(str: string): string {
  // Replace **bold**
  let out = str.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0B1220] font-semibold">$1</strong>');
  // Replace *italic*
  out = out.replace(/\*(.*?)\*/g, '<em class="text-[#5B6572] italic">$1</em>');
  // Replace `code`
  out = out.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#F1F3F5] text-emerald-700 font-mono text-xs border border-[#E7E5DF]">$1</code>');
  return out;
}

export const CopilotDrawer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [contextSummary, setContextSummary] = useState<CopilotContextSummary | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([
    'Audit my portfolio risk & concentration',
    'How can I save tax under Section 80C with ELSS?',
    'Review my active paper trading positions',
    'What would happen to my portfolio if RBI hikes rates?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Load chat session on open
  useEffect(() => {
    if (isAuthenticated && isOpen && messages.length === 0) {
      loadSession();
    }
  }, [isAuthenticated, isOpen]);

  // Global Ctrl + J / ⌘ + J shortcut to toggle Copilot & custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleCustomToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-copilot', handleCustomToggle);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-copilot', handleCustomToggle);
    };
  }, []);

  const loadSession = async () => {
    try {
      const session = await getCopilotSessionApi();
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
        const lastMsg = session.messages[session.messages.length - 1];
        if (lastMsg.suggestions && lastMsg.suggestions.length > 0) {
          setActiveSuggestions(lastMsg.suggestions);
        }
      }
      if (session.contextSummary) {
        setContextSummary(session.contextSummary);
      }
    } catch (err) {
      console.warn('[CopilotDrawer] Session load failed:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || inputText).trim();
    if (!msgText || loading) return;

    setInputText('');

    const userMsg: CopilotMessage = {
      role: 'user',
      content: msgText,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const response = await sendCopilotMessageApi(msgText, newHistory);
      const assistantMsg: CopilotMessage = {
        role: 'assistant',
        content: response.content,
        suggestions: response.suggestions,
        createdAt: response.timestamp,
      };

      setMessages([...newHistory, assistantMsg]);
      if (response.suggestions && response.suggestions.length > 0) {
        setActiveSuggestions(response.suggestions);
      }
      if (response.contextSummary) {
        setContextSummary(response.contextSummary);
      }
    } catch (err: any) {
      toast.error('RupeeBot response error: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearCopilotSessionApi();
      setMessages([]);
      toast.success('Conversation reset.');
      loadSession();
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold shadow-2xl shadow-emerald-900/40 hover:scale-105 transition-all duration-300 border border-emerald-400/30"
          title="Open RupeeBot AI Copilot (Ctrl + J)"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold tracking-wide">
            RupeeBot Copilot
          </span>
          <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono text-emerald-200 border border-white/10">
            Ctrl+J
          </span>
        </button>
      )}

      {/* Floating Copilot Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col ${
            isExpanded
              ? 'inset-3 sm:inset-6 max-w-4xl mx-auto rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[480px] h-[640px] max-h-[88vh] rounded-3xl'
          } bg-white/95 border border-[#E7E5DF] shadow-2xl backdrop-blur-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#FAFAF7] via-white to-[#FAFAF7] border-b border-[#E7E5DF] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#0B1220] text-sm">RupeeBot Copilot</h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Quant AI
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#5B6572] font-mono mt-0.5">
                  {contextSummary ? (
                    <span>
                      {contextSummary.holdingsCount} Assets • {formatCompactINR(contextSummary.totalHoldingsValue)} • {contextSummary.riskTolerance}
                    </span>
                  ) : (
                    <span>Context-aware Indian Financial Analyst</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-[#5B6572] hover:text-rose-600 hover:bg-[#FAFAF7] transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-[#5B6572] hover:text-[#0B1220] hover:bg-[#FAFAF7] transition-colors hidden sm:block"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#5B6572] hover:text-[#0B1220] hover:bg-[#FAFAF7] transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg._id || index}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-[#0F766E] to-teal-700 text-white rounded-tr-none'
                        : 'bg-[#FAFAF7] border border-[#E7E5DF] text-[#0B1220] rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <FormattedMessage text={msg.content} />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start items-center text-xs text-[#5B6572]">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs font-medium text-[#5B6572]">
                    Synthesizing quantitative portfolio insight...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Bar */}
          {activeSuggestions.length > 0 && !loading && (
            <div className="px-4 py-2 border-t border-[#E7E5DF] bg-[#FAFAF7] overflow-x-auto shrink-0 flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] font-bold text-[#5B6572] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Suggestions:
              </span>
              {activeSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  className="px-2.5 py-1 text-xs rounded-full bg-white hover:bg-emerald-50 text-[#0B1220] hover:text-emerald-700 border border-[#E7E5DF] hover:border-emerald-300 whitespace-nowrap transition-all shrink-0 shadow-xs"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3.5 bg-white border-t border-[#E7E5DF] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask RupeeBot anything about your portfolio, risk, or Indian taxes..."
                disabled={loading}
                className="flex-1 bg-[#FAFAF7] border border-[#E7E5DF] focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#0B1220] placeholder:text-[#5B6572]/60 focus:outline-none transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-900/10"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-[#5B6572] mt-1.5 px-1 font-mono">
              <span>SEBI-aligned educational AI model</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
