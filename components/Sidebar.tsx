"use client";

import React, { useState, useEffect } from 'react';
import { useChat } from '@/lib/chat-context';
import { Plus, MessageSquare, Trash2, X, Key, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAPIConfig, PROVIDERS } from '@/lib/api-config';

interface SidebarProps {
  onNewChat: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenAPISettings: () => void;
}

export function Sidebar({ onNewChat, isOpen, onClose, onOpenAPISettings }: SidebarProps) {
  const { chats, activeChatId, selectChat, deleteChat } = useChat();
  const [apiConfigured, setApiConfigured] = useState(false);
  const [providerName, setProviderName] = useState('');

  useEffect(() => {
    const config = getAPIConfig();
    if (config?.apiKey) {
      setApiConfigured(true);
      setProviderName(PROVIDERS[config.provider]?.name || config.provider);
    } else {
      setApiConfigured(false);
      setProviderName('');
    }
  }, [isOpen]); // Re-check when sidebar opens

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Desktop: static, Mobile: fixed overlay */}
      <div className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 w-72 flex-shrink-0",
        // Desktop: always visible, static position
        "md:relative md:translate-x-0",
        // Mobile: fixed position, slide in/out
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-900">💬 Chat Helper</h1>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            新建对话
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">
              暂无对话，开始新建吧！
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                    activeChatId === chat.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                  onClick={() => {
                    selectChat(chat.id);
                    onClose?.();
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={18} className="shrink-0" />
                    <div className="overflow-hidden">
                      <div className="truncate font-medium">{chat.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {chat.contactInfo.relationship || chat.settings.style}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Settings Button - Fixed at bottom */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => {
              onOpenAPISettings();
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              apiConfigured
                ? "bg-green-50 hover:bg-green-100 border border-green-200"
                : "bg-amber-50 hover:bg-amber-100 border border-amber-200"
            )}
          >
            <div className={cn(
              "p-2 rounded-full",
              apiConfigured ? "bg-green-100" : "bg-amber-100"
            )}>
              {apiConfigured ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Key size={16} className="text-amber-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-sm font-medium",
                apiConfigured ? "text-green-800" : "text-amber-800"
              )}>
                {apiConfigured ? 'API 已配置' : '配置 API'}
              </div>
              <div className={cn(
                "text-xs truncate",
                apiConfigured ? "text-green-600" : "text-amber-600"
              )}>
                {apiConfigured ? providerName : '点击设置 API Key'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
