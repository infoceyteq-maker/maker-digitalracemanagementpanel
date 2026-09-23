'use client';

// ==============================================================================
// CEYTEQ DIGITAL RACE - AUTONOMOUS AI AGENT FLOATING INTERFACE
// Framework: Next.js App Router (Client Component)
// SDK: Vercel AI SDK (ai/react - useChat)
// Engine: Google Gemini 1.5 Flash (@ai-sdk/google)
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  ChevronDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Utensils,
  Palette,
  BarChart3,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Flame,
  Coffee,
  Check,
} from 'lucide-react';

interface AiAgentChatProps {
  tenantId?: string;
  tenantName?: string;
  primaryColor?: string;
  userRole?: string;
  onThemeColorChange?: (newHex: string) => void;
  onMenuItemAdded?: (item: any) => void;
}

export function AiAgentChat({
  tenantId = 'd0000000-0000-0000-0000-000000000001',
  tenantName = 'The Ceyteq Grand Bistro',
  primaryColor = '#00C8FF',
  userRole = 'RESTAURANT_ADMIN',
  onThemeColorChange,
  onMenuItemAdded,
}: AiAgentChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Vercel AI SDK useChat Hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    setMessages,
    append,
  } = useChat({
    api: '/api/chat',
    body: {
      targetTenantId: tenantId,
    },
    onFinish: (message) => {
      // Trigger callback side effects if tool invocations completed
      if (message.toolInvocations) {
        for (const tool of message.toolInvocations) {
          if (tool.state === 'result') {
            if (tool.toolName === 'changeThemeColor' && onThemeColorChange) {
              onThemeColorChange((tool.result as any)?.hexColor);
            }
            if (tool.toolName === 'addMenuItem' && onMenuItemAdded) {
              onMenuItemAdded(tool.result);
            }
          }
        }
      }
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    onError: (err) => {
      console.error('[AI_AGENT_CHAT_ERROR]', err);
    },
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Reset unread badge upon opening
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // Quick Action Prompt Chips
  const quickPrompts = [
    {
      label: 'Add Spicy Chicken Kottu',
      icon: Flame,
      prompt: 'Add a new menu item: "Spicy Chicken Cheese Kottu" under "Mains" for LKR 1,850 with spicy flag enabled.',
    },
    {
      label: 'Change Theme to Emerald',
      icon: Palette,
      prompt: 'Change the restaurant theme color to Emerald Jade (#10B981).',
    },
    {
      label: 'Add Passion Fruit Mojito',
      icon: Coffee,
      prompt: 'Add a new beverage: "Passion Fruit Mint Mojito" under "Beverages" for LKR 950.',
    },
    {
      label: 'Query Restaurant Overview',
      icon: BarChart3,
      prompt: 'Show me the current operational overview and active table metrics.',
    },
  ];

  const handleQuickPrompt = (promptText: string) => {
    append({
      role: 'user',
      content: promptText,
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* ========================================================================= */}
      {/* 1. COLLAPSIBLE CHAT MODAL WINDOW */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          className={`pointer-events-auto bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out mb-4 ${
            isExpanded
              ? 'w-[92vw] sm:w-[600px] h-[82vh] max-h-[750px]'
              : 'w-[92vw] sm:w-[420px] h-[580px]'
          }`}
          style={{
            boxShadow: '0 20px 50px -10px rgba(0, 200, 255, 0.2), 0 0 20px 2px rgba(15, 23, 42, 0.8)',
          }}
        >
          {/* Top Header Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 p-4 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white text-sm tracking-wide">
                    Digital Race AI Agent
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded">
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[260px]">
                  {tenantName} • <span className="text-cyan-400">{userRole}</span>
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore window size' : 'Expand window'}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleOpen}
                title="Minimize chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 custom-scrollbar">
            {/* Welcome Greeting when no messages exist */}
            {messages.length === 0 && (
              <div className="text-center py-6 px-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Bot className="w-7 h-7" />
                </div>
                <h4 className="text-white font-semibold text-sm">
                  Autonomous System Co-Pilot
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  I can execute system commands directly on your restaurant
                  catalog, adjust brand themes, or query live analytics using
                  Google Gemini tool calling.
                </p>

                {/* Quick Action Suggestion Chips */}
                <div className="pt-2 text-left space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Suggested Actions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickPrompts.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickPrompt(item.prompt)}
                          className="flex items-center space-x-2 text-left p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-xs group"
                        >
                          <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-end space-x-2 max-w-[85%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isUser
                          ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-xs shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs shadow-md'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>

                  {/* Render Agentic Tool Invocations (Calls & Results) */}
                  {message.toolInvocations?.map((toolInvocation) => {
                    const toolName = toolInvocation.toolName;
                    const state = toolInvocation.state;
                    const args = (toolInvocation as any).args;

                    return (
                      <div
                        key={toolInvocation.toolCallId}
                        className="w-full max-w-[90%] my-1.5 ml-8 rounded-xl border p-3 bg-slate-900/90 text-xs transition-all"
                        style={{
                          borderColor:
                            state === 'result' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 200, 255, 0.4)',
                        }}
                      >
                        {/* Tool Header Status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {state === 'result' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            )}
                            <span className="font-semibold text-white tracking-wide">
                              {toolName === 'addMenuItem' && 'Action: Adding Menu Item'}
                              {toolName === 'changeThemeColor' && 'Action: Updating Theme Color'}
                              {toolName === 'queryRestaurantData' && 'Action: Querying Database'}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              state === 'result'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30 animate-pulse'
                            }`}
                          >
                            {state === 'result' ? 'Executed' : 'Processing...'}
                          </span>
                        </div>

                        {/* Tool In-Progress Skeleton */}
                        {state === 'call' && (
                          <div className="text-slate-400 flex items-center space-x-2 py-1">
                            <span className="text-[11px]">
                              Invoking server-side tool with parameters:
                            </span>
                            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] text-cyan-300 font-mono">
                              {JSON.stringify(args).slice(0, 45)}...
                            </code>
                          </div>
                        )}

                        {/* Tool Execution Result View */}
                        {state === 'result' && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                            {toolName === 'addMenuItem' && (
                              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                                <div className="flex items-center space-x-2">
                                  <Utensils className="w-4 h-4 text-amber-400" />
                                  <span className="text-white font-medium">
                                    {(toolInvocation.result as any)?.name}
                                  </span>
                                  <span className="text-slate-400 text-[11px]">
                                    ({(toolInvocation.result as any)?.category})
                                  </span>
                                </div>
                                <span className="font-bold text-emerald-400 font-mono">
                                  {(toolInvocation.result as any)?.formattedPrice}
                                </span>
                              </div>
                            )}

                            {toolName === 'changeThemeColor' && (
                              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                    style={{
                                      backgroundColor: (toolInvocation.result as any)?.hexColor,
                                    }}
                                  />
                                  <span className="text-white font-medium">
                                    {(toolInvocation.result as any)?.colorName}
                                  </span>
                                </div>
                                <code className="text-cyan-400 font-mono text-[11px]">
                                  {(toolInvocation.result as any)?.hexColor}
                                </code>
                              </div>
                            )}

                            {toolName === 'queryRestaurantData' && (
                              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify((toolInvocation.result as any)?.data, null, 2)}
                                </pre>
                              </div>
                            )}

                            <p className="text-[11px] text-emerald-400/90 pt-0.5">
                              {(toolInvocation.result as any)?.message}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Typing / Reasoning Spinner */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                </div>
                <span>Agent is reasoning and executing tools...</span>
              </div>
            )}

            {/* Visible Error State (prevents the chat from appearing "frozen") */}
            {error && !isLoading && (
              <div className="flex flex-col items-start space-y-2 my-1 ml-8 p-3 rounded-xl border border-rose-500/40 bg-rose-950/30">
                <div className="flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-200 leading-relaxed break-words">
                    {error.message || 'The agent could not complete the request.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reload()}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-[11px] font-semibold transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Tell agent to add a dish, switch theme, or query..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FLOATING TRIGGER BUTTON (FAB) */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={toggleOpen}
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 text-white border border-cyan-500/40 shadow-xl shadow-cyan-900/30 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 blur-sm group-hover:bg-cyan-400/20 transition-colors" />
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <ChevronDown className="w-6 h-6 text-cyan-400 transition-transform" />
          ) : (
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
          )}
        </div>

        {/* Unread Counter Badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 text-slate-950 text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
export default AiAgentChat;
