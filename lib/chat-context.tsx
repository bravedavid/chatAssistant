"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, ContactInfo, ChatSettings, Message, Role } from './types';

const ChatContext = createContext<{
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | undefined;
  createChat: (contactInfo: ContactInfo, settings: ChatSettings) => void;
  selectChat: (id: string | null) => void;
  updateChatConfig: (id: string, contactInfo: ContactInfo, settings: ChatSettings) => void;
  addMessage: (chatId: string, role: Role, content: string) => void;
  deleteChat: (id: string) => void;
  clearHistory: (chatId: string) => void;
  setSuggestions: (chatId: string, suggestions: string[]) => void;
  clearSuggestions: (chatId: string) => void;
} | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedChats = localStorage.getItem('chat_ai_chats');
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (e) {
        console.error("Failed to parse chats", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('chat_ai_chats', JSON.stringify(chats));
    }
  }, [chats, isLoaded]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const createChat = (contactInfo: ContactInfo, settings: ChatSettings) => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: contactInfo.name || 'New Chat',
      contactInfo,
      settings,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const selectChat = (id: string | null) => {
    setActiveChatId(id);
  };

  const updateChatConfig = (id: string, contactInfo: ContactInfo, settings: ChatSettings) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return {
          ...chat,
          contactInfo,
          settings,
          title: contactInfo.name || chat.title,
          updatedAt: Date.now()
        };
      }
      return chat;
    }));
  };

  const addMessage = (chatId: string, role: Role, content: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          role,
          content,
          timestamp: Date.now()
        };
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          updatedAt: Date.now()
        };
      }
      return chat;
    }));
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const clearHistory = (chatId: string) => {
      setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
              return {
                  ...chat,
                  messages: [],
                  suggestions: [],
                  updatedAt: Date.now()
              };
          }
          return chat;
      }));
  }

  const setSuggestions = (chatId: string, suggestions: string[]) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          suggestions
        };
      }
      return chat;
    }));
  };

  const clearSuggestions = (chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          suggestions: []
        };
      }
      return chat;
    }));
  };

  return (
    <ChatContext.Provider value={{
      chats,
      activeChatId,
      activeChat,
      createChat,
      selectChat,
      updateChatConfig,
      addMessage,
      deleteChat,
      clearHistory,
      setSuggestions,
      clearSuggestions
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

