import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  RefreshCw, 
  Copy, 
  Check, 
  MessageSquare, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { Tenant, ChatMessage } from '../types';

interface CeyteqAiChatbotProps {
  tenants: Tenant[];
  isOpen?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export const CeyteqAiChatbot: React.FC<CeyteqAiChatbotProps> = ({
  tenants,
  isOpen = true,
  onClose,
  isFloating = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello Jasmine! 👋 I'm **Jasmine AI**, your Ceyteq Agency Master Copilot. 

I can assist you with managing your "Digital Race" restaurant ecosystem, analyzing tenant tiers, configuring the new **AI WhatsApp Chatbot Messaging System** for clients, or drafting onboarding messages.

How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'internal_panel',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '📊 Analyze Client Tiers & MRR', prompt: 'Analyze our current tenant portfolio breakdown across Free, Plus, and Pro tiers and recommend upsell opportunities.' },
    { label: '🤖 AI WhatsApp Bot Overview', prompt: 'Explain how the AI Chatbot Messaging System works as an add-on for restaurant clients and how WhatsApp webhook integration is set up.' },
    { label: '💬 Draft WhatsApp Onboarding Message', prompt: 'Draft a professional WhatsApp welcome message to send to a new restaurant owner who just signed up for the Pro tier with AI Chatbot enabled.' },
    { label: '🌐 Edge DNS & Custom Domains', prompt: 'What are the CNAME instructions for clients who want to use their own custom domain on Digital Race?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'internal_panel',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn context
      const history = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Summarize tenant status to pass rich context to Gemini
      const tenantSummary = tenants.map(t => ({
        name: t.name,
        tier: t.tier,
        mrr: t.monthlyFee,
        hasAiChatbot: !!t.hasAiChatbot,
        domain: t.customDomain || `${t.subdomain}.ceyteq.com`
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history,
          mode: 'internal_admin',
          restaurantContext: {
            agencyName: 'Ceyteq Digital Agency',
            totalTenants: tenants.length,
            tenantSummary,
          },
        }),
      });

      const data = await res.json();

      const aiReply: ChatMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: data.reply || "I've processed your request. How else can I assist Ceyteq operations?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'internal_panel',
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorReply: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: "I apologize, but I encountered a network issue contacting the Gemini AI engine. Please ensure your dev server is active or try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'internal_panel',
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-fresh',
        role: 'assistant',
        content: `Chat history cleared. Jasmine AI is ready. How can I assist you with Ceyteq agency management or client AI chatbots?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'internal_panel',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${
        isFloating
          ? 'fixed bottom-5 right-5 z-50 w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border border-sky-200 transition-all'
          : 'w-full rounded-2xl border border-sky-100 bg-white/95 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col'
      } bg-white flex flex-col`}
      style={{ height: isFloating ? (isMinimized ? '64px' : '580px') : '620px' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#004B7A] to-[#008BB8] p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Bot className="w-5 h-5 text-[#00C8FF]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold tracking-tight text-white">Jasmine AI Copilot</h3>
              <span className="text-[9px] font-black uppercase tracking-wider bg-pink-500/90 text-white px-1.5 py-0.5 rounded-full shadow-2xs">
                Free Gemini NLP
              </span>
            </div>
            <p className="text-[11px] text-sky-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ceyteq Master Admin Assistant</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            title="Reset Conversation"
            className="p-1.5 rounded-lg hover:bg-white/10 text-sky-200 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {isFloating && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-sky-200 hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-sky-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-sky-50/40 via-white to-sky-50/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {msg.role === 'user' ? 'Jasmine (Agency Admin)' : 'Jasmine AI Copilot'}
                  </span>
                  <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                </div>

                <div
                  className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#008BB8] to-[#00A3D9] text-white rounded-tr-xs shadow-sm font-medium'
                      : 'bg-white border border-sky-100 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-sky-200 rounded-md p-1 text-[10px] text-slate-600 hover:text-slate-900 shadow-xs flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-white/80 rounded-xl border border-sky-100 max-w-[70%] shadow-2xs">
                <div className="w-4 h-4 border-2 border-[#00C8FF] border-t-transparent rounded-full animate-spin" />
                <span>Thinking via Gemini NLP...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-sky-50/50 border-t border-sky-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                className="shrink-0 text-[11px] font-medium bg-white hover:bg-sky-100/70 border border-sky-200 hover:border-sky-300 text-slate-700 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-sky-100 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Jasmine AI about clients, tiers, WhatsApp bots, or MRR..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-sky-50/60 border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#008BB8] focus:bg-white transition-all shadow-2xs disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#008BB8] to-[#00A3D9] hover:from-[#007A9E] hover:to-[#008BB8] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
