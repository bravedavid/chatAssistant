"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/chat-context';
import { Send, Sparkles, Settings, Menu, ArrowDown, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAPIConfig } from '@/lib/api-config';

interface ChatInterfaceProps {
  onEditConfig: () => void;
  onOpenSidebar: () => void;
  onOpenAPISettings: () => void;
}

export function ChatInterface({ onEditConfig, onOpenSidebar, onOpenAPISettings }: ChatInterfaceProps) {
  const { activeChat, addMessage, activeChatId, setSuggestions, clearSuggestions } = useChat();
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAPIKey, setHasAPIKey] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get suggestions from activeChat
  const suggestions = activeChat?.suggestions || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, suggestions]);

  // Check API config
  useEffect(() => {
    const config = getAPIConfig();
    setHasAPIKey(!!config?.apiKey);
  }, []);

  // Clear input when chat changes
  useEffect(() => {
    setInputText('');
    setCopiedIndex(null);
  }, [activeChatId]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleIncoming = async () => {
    if (!inputText.trim() || !activeChatId) return;
    
    // Add incoming message
    addMessage(activeChatId, 'contact', inputText);
    const contextText = inputText;
    setInputText('');
    
    // Trigger AI
    await generateSuggestions(contextText);
  };

  const handleSendSelf = () => {
    if (!inputText.trim() || !activeChatId) return;
    addMessage(activeChatId, 'user', inputText);
    setInputText('');
    clearSuggestions(activeChatId); // Clear suggestions after sending
  };

  const generateSuggestions = async (lastMessage: string) => {
    if (!activeChatId) return;
    
    setIsGenerating(true);
    clearSuggestions(activeChatId);

    try {
      const apiConfig = getAPIConfig();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          lastMessage,
          history: activeChat?.messages || [],
          contactInfo: activeChat?.contactInfo,
          settings: activeChat?.settings,
          apiConfig: apiConfig
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(activeChatId, data.suggestions);
      }
    } catch (error) {
      console.error(error);
      alert('生成建议失败，请检查 API 设置');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshSuggestions = async () => {
    if (!activeChatId || !activeChat) return;
    
    // 找到最后一条来自 contact 的消息
    const lastContactMessage = [...activeChat.messages]
      .reverse()
      .find(msg => msg.role === 'contact');
    
    if (lastContactMessage) {
      await generateSuggestions(lastContactMessage.content);
    } else {
      alert('没有找到对方的消息，无法刷新建议');
    }
  };

  if (!activeChat) {
     return <div className="flex-1 flex items-center justify-center text-gray-500">请选择一个对话</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
        {/* Mobile menu button */}
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-gray-900 truncate">{activeChat.contactInfo.name}</h2>
          <div className="text-xs text-gray-600 truncate">
            {[activeChat.contactInfo.age, activeChat.contactInfo.job, Array.isArray(activeChat.settings.style) ? activeChat.settings.style.join('、') : activeChat.settings.style].filter(Boolean).join(' · ')}
          </div>
        </div>
        
        <button 
          onClick={onEditConfig} 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 flex-shrink-0"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {/* API Warning */}
        {!hasAPIKey && (
          <div 
            onClick={onOpenAPISettings}
            className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">未配置 API</p>
              <p className="text-xs text-amber-600">点击配置 API Key 以启用 AI 回复建议</p>
            </div>
          </div>
        )}

        {activeChat.messages.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-sm">还没有消息</p>
            <p className="text-xs mt-1">粘贴对方发来的消息开始对话</p>
          </div>
        )}
        
        {activeChat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={cn(
                "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5",
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
              )}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 text-gray-600 text-sm">
              <Sparkles size={16} className="text-purple-500 animate-pulse" />
              正在分析并生成回复建议...
            </div>
          </div>
        )}

        {/* Suggestions Area */}
        {!isGenerating && suggestions.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <div className="text-xs font-semibold text-purple-700 flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} />
                AI 推荐回复（点击使用，或复制到其他应用）
              </div>
              <button
                onClick={handleRefreshSuggestions}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="刷新建议"
              >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                <span>刷新</span>
              </button>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-white border border-purple-100 rounded-lg overflow-hidden hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  <button
                    onClick={() => setInputText(suggestion)}
                    className="flex-1 text-left p-3 text-sm text-gray-900 hover:bg-purple-50 transition-colors active:scale-[0.99]"
                  >
                    {suggestion}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(suggestion, idx);
                    }}
                    className={cn(
                      "p-3 border-l border-purple-100 transition-colors flex-shrink-0",
                      copiedIndex === idx
                        ? "bg-green-50 text-green-600"
                        : "hover:bg-purple-50 text-gray-500 hover:text-purple-600"
                    )}
                    title="复制到剪贴板"
                  >
                    {copiedIndex === idx ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-gray-200">
        <div className="flex flex-col gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none min-h-[80px] text-gray-900 text-base"
            placeholder="粘贴对方的消息，或输入您的回复..."
          />
          
          {/* Action Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={handleIncoming}
              disabled={!inputText.trim() || isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium text-sm order-2 sm:order-1"
            >
              <ArrowDown size={16} />
              <span>对方发来的</span>
            </button>
            <button
              onClick={handleSendSelf}
              disabled={!inputText.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm order-1 sm:order-2"
            >
              <Send size={16} />
              <span>我发送的</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
