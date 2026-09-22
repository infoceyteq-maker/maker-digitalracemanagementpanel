import React, { useState } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Sliders, 
  ExternalLink, 
  Zap, 
  PhoneCall, 
  AlertCircle,
  Clock,
  CheckCheck
} from 'lucide-react';
import { Tenant } from '../types';

interface WhatsAppBotManagerProps {
  tenant: Tenant;
  onUpdateTenant: (updated: Tenant) => void;
}

interface SimulatedMessage {
  id: string;
  sender: 'customer' | 'bot';
  text: string;
  time: string;
}

export const WhatsAppBotManager: React.FC<WhatsAppBotManagerProps> = ({
  tenant,
  onUpdateTenant,
}) => {
  const isFeatureEnabled = !!tenant.hasAiChatbot;
  const config = tenant.aiChatbotConfig || {
    enabled: true,
    whatsappPhoneNumberId: '109283746501928',
    whatsappBusinessAccountId: '984720193847291',
    whatsappVerifyToken: 'ceyteq_wa_verify_token',
    autoReplyEnabled: true,
    botTone: 'POLITE_CONCIERGE',
    welcomeMessage: `Hello! Welcome to ${tenant.name}! 🍽️ How can I assist you with our menu, table bookings, or orders?`,
    conversationsCount: 84,
  };

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [botTone, setBotTone] = useState<'POLITE_CONCIERGE' | 'CASUAL_FRIENDLY' | 'FAST_ORDER_ASSISTANT'>(
    config.botTone || 'POLITE_CONCIERGE'
  );
  const [phoneId, setPhoneId] = useState(config.whatsappPhoneNumberId || '');
  const [verifyToken, setVerifyToken] = useState(config.whatsappVerifyToken || 'ceyteq_wa_verify_token');
  const [welcomeMsg, setWelcomeMsg] = useState(config.welcomeMessage || '');
  const [customPrompt, setCustomPrompt] = useState(config.customInstructions || '');
  const [autoReply, setAutoReply] = useState(config.autoReplyEnabled ?? true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulator State
  const [simulatedMessages, setSimulatedMessages] = useState<SimulatedMessage[]>([
    {
      id: 'wa-1',
      sender: 'bot',
      text: welcomeMsg || `Welcome to ${tenant.name} on WhatsApp! 🍽️ How can I assist you today?`,
      time: '12:30 PM',
    },
  ]);
  const [simInput, setSimInput] = useState('');
  const [isSimLoading, setIsSimLoading] = useState(false);

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.ceyteq.com'}/api/whatsapp/webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...tenant,
      hasAiChatbot: true,
      aiChatbotConfig: {
        ...config,
        enabled: true,
        whatsappPhoneNumberId: phoneId,
        whatsappVerifyToken: verifyToken,
        autoReplyEnabled: autoReply,
        botTone,
        welcomeMessage: welcomeMsg,
        customInstructions: customPrompt,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendSimulatedMessage = async (customText?: string) => {
    const textToSend = (customText || simInput).trim();
    if (!textToSend || isSimLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: SimulatedMessage = {
      id: 'user-' + Date.now(),
      sender: 'customer',
      text: textToSend,
      time: timeStr,
    };

    setSimulatedMessages((prev) => [...prev, userMsg]);
    setSimInput('');
    setIsSimLoading(true);

    try {
      const history = simulatedMessages.slice(-6).map((m) => ({
        role: m.sender === 'customer' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          tenant,
          history,
        }),
      });

      const data = await res.json();

      const botReply: SimulatedMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.reply || `Thank you for your message! Our team at ${tenant.name} is here to assist you.`,
        time: data.timestamp || timeStr,
      };

      setSimulatedMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error('Simulator error:', err);
      const fallbackReply: SimulatedMessage = {
        id: 'bot-err-' + Date.now(),
        sender: 'bot',
        text: `Thanks for asking about "${textToSend}"! We have delicious dishes ready on our menu at ${tenant.currency} pricing. Would you like to reserve a table?`,
        time: timeStr,
      };
      setSimulatedMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsSimLoading(false);
    }
  };

  const quickQuestions = [
    'What are your top dishes?',
    'How much is the Chicken Kottu?',
    'Do you deliver to Colombo?',
    'Can I reserve a table for 4 tonight at 7pm?',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Feature Status */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-[#008BB8] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">WhatsApp AI Concierge & Messaging System</h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-700 px-2 py-0.5 rounded-full shadow-2xs">
                {isFeatureEnabled ? 'Active Package Add-on' : 'Package Upgrade Required'}
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              Automated 24/7 natural language customer service, menu inquiries, and order taking powered by Gemini AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isFeatureEnabled && (
            <button
              onClick={() => {
                onUpdateTenant({
                  ...tenant,
                  hasAiChatbot: true,
                  aiChatbotConfig: {
                    ...config,
                    enabled: true,
                  },
                });
              }}
              className="px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all shadow-sm"
            >
              Enable AI Chatbot Package
            </button>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-black/20 border border-white/20 text-xs font-mono text-white/90">
            <span>Conversations Handled: </span>
            <strong className="text-white font-bold">{config.conversationsCount || 84}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: WhatsApp Cloud API Settings & Bot Config */}
        <div className="lg:col-span-7 space-y-5">
          {/* Cloud API Webhook Integration Details */}
          <div className="bg-white/95 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Meta WhatsApp Cloud API Webhook</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Status: Live Ready
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect this restaurant's WhatsApp Business Account by pasting this Webhook Callback URL and Verify Token in your Meta Developer App Dashboard under <strong>WhatsApp &gt; Configuration</strong>.
            </p>

            {/* Webhook URL Field */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Webhook Callback URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-sky-50/60 border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs select-all"
                />
                <button
                  onClick={handleCopyWebhook}
                  className="px-3 py-2 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Verify Token Field */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Webhook Verify Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 shadow-2xs"
                />
                <button
                  onClick={handleCopyToken}
                  className="px-3 py-2 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bot Personality, Tone & Customization Form */}
          <form onSubmit={handleSaveConfig} className="bg-white/95 backdrop-blur-sm border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#008BB8]" />
                <h3 className="text-sm font-bold text-slate-900">Bot Behavior & System Configuration</h3>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReply}
                  onChange={(e) => setAutoReply(e.target.checked)}
                  className="rounded accent-emerald-600 w-4 h-4"
                />
                <span>Auto-Reply Active</span>
              </label>
            </div>

            {/* Phone Number ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 109283746501928"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 shadow-2xs focus:outline-none focus:border-[#008BB8]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Bot Persona / Tone
                </label>
                <select
                  value={botTone}
                  onChange={(e) => setBotTone(e.target.value as any)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-[#008BB8]"
                >
                  <option value="POLITE_CONCIERGE">Polite & Warm Concierge (High-end)</option>
                  <option value="CASUAL_FRIENDLY">Casual & Friendly (Modern Cafe)</option>
                  <option value="FAST_ORDER_ASSISTANT">Fast & Direct Order Assistant (Quick-Service)</option>
                </select>
              </div>
            </div>

            {/* Welcome Greeting */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Custom Welcome Greeting on WhatsApp
              </label>
              <input
                type="text"
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                placeholder="Welcome to our restaurant! How can I assist you today?"
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-[#008BB8]"
              />
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Special Bot Knowledge / Custom Instructions
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Daily special is Seafood Paella. Mention our live jazz nights on Fridays. Outdoor smoking terrace available on 2nd floor."
                className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-[#008BB8]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>WhatsApp Bot Settings Saved!</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Changes take effect immediately on live WhatsApp webhook calls.
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live WhatsApp Interactive Simulator */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-700 max-w-sm mx-auto">
            {/* Phone Bezel Top */}
            <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
              <div className="w-8 h-1.5 rounded-full bg-slate-900" />
            </div>

            {/* WhatsApp App Container */}
            <div className="bg-[#EFEAE2] rounded-3xl overflow-hidden flex flex-col h-[520px] shadow-inner text-slate-800">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#075E54] text-white p-3 flex items-center gap-2.5 shadow-md">
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="w-9 h-9 rounded-full object-cover border border-white/30"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">{tenant.name}</div>
                  <div className="text-[10px] text-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <span>AI Assistant (online)</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  SIMULATOR
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#E5DDD5]">
                <div className="text-center my-1">
                  <span className="bg-white/80 backdrop-blur-xs text-[9px] text-slate-500 font-semibold px-2 py-0.5 rounded-md shadow-2xs">
                    MESSAGES ARE END-TO-END ENCRYPTED
                  </span>
                </div>

                {simulatedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-2.5 text-[11px] leading-relaxed shadow-2xs relative ${
                        msg.sender === 'customer'
                          ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none'
                          : 'bg-white text-slate-900 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                        <span>{msg.time}</span>
                        {msg.sender === 'customer' && <CheckCheck className="w-3 h-3 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                ))}

                {isSimLoading && (
                  <div className="bg-white p-2 rounded-lg max-w-[65%] text-[10px] text-slate-500 flex items-center gap-1.5 shadow-2xs">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                    </div>
                    <span>AI typing...</span>
                  </div>
                )}
              </div>

              {/* Quick Customer Question Chips */}
              <div className="p-2 bg-white/70 border-t border-slate-300/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendSimulatedMessage(q)}
                    className="shrink-0 text-[10px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSimulatedMessage();
                }}
                className="p-2 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Test WhatsApp customer message..."
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  disabled={isSimLoading}
                  className="flex-1 bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!simInput.trim() || isSimLoading}
                  className="w-8 h-8 rounded-full bg-[#128C7E] hover:bg-[#075E54] text-white flex items-center justify-center shadow-xs disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
