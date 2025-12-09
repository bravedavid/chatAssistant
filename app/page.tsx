"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatConfig } from '@/components/ChatConfig';
import { ChatInterface } from '@/components/ChatInterface';
import { APISettings } from '@/components/APISettings';
import { useChat } from '@/lib/chat-context';
import { MessageSquare, Menu, Plus, Key } from 'lucide-react';
import { ContactInfo, ChatSettings } from '@/lib/types';
import { getAPIConfig } from '@/lib/api-config';

export default function Home() {
  const { activeChatId, activeChat, createChat, updateChatConfig, selectChat } = useChat();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAPISettingsOpen, setIsAPISettingsOpen] = useState(false);
  const [hasAPIKey, setHasAPIKey] = useState(false);

  // Check API config on mount and when modal closes
  useEffect(() => {
    const config = getAPIConfig();
    setHasAPIKey(!!config?.apiKey);
  }, [isAPISettingsOpen]);

  // When a chat is selected, exit creation mode
  useEffect(() => {
    if (activeChatId) {
      setIsCreating(false);
      setIsEditing(false);
    }
  }, [activeChatId]);

  const handleNewChat = () => {
    selectChat(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleCreateChat = (info: ContactInfo, settings: ChatSettings) => {
    createChat(info, settings);
    setIsCreating(false);
  };

  const handleUpdateConfig = (info: ContactInfo, settings: ChatSettings) => {
    if (activeChatId) {
      updateChatConfig(activeChatId, info, settings);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar 
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenAPISettings={() => setIsAPISettingsOpen(true)}
      />
      
      {/* API Settings Modal */}
      <APISettings 
        isOpen={isAPISettingsOpen} 
        onClose={() => setIsAPISettingsOpen(false)} 
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {isCreating ? (
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-3 z-10">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <h1 className="font-semibold text-gray-900">新建对话</h1>
            </div>
            <div className="p-4 md:p-8">
              <ChatConfig 
                onSubmit={handleCreateChat} 
                onCancel={() => {
                  setIsCreating(false);
                }}
                isNew={true}
              />
            </div>
          </div>
        ) : isEditing && activeChat ? (
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-3 z-10">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <h1 className="font-semibold text-gray-900">编辑设置</h1>
            </div>
            <div className="p-4 md:p-8">
              <ChatConfig 
                initialInfo={activeChat.contactInfo}
                initialSettings={activeChat.settings}
                onSubmit={handleUpdateConfig} 
                onCancel={() => setIsEditing(false)}
                isNew={false}
              />
            </div>
          </div>
        ) : activeChatId ? (
          <ChatInterface 
            onEditConfig={() => setIsEditing(true)} 
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenAPISettings={() => setIsAPISettingsOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            {/* Mobile Header for empty state */}
            <div className="md:hidden absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <h1 className="font-semibold text-gray-900">AI 聊天助手</h1>
            </div>
            
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用 AI 聊天助手</h2>
            <p className="max-w-md text-gray-600 mb-6">
              帮助您与他人更好地沟通，AI 会根据对话上下文为您提供智能回复建议
            </p>
            
            {/* API Status */}
            {!hasAPIKey && (
              <button
                onClick={() => setIsAPISettingsOpen(true)}
                className="mb-4 flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Key size={18} />
                <span>请先配置 API Key</span>
              </button>
            )}
            
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-full hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              <Plus size={20} />
              开始新对话
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
