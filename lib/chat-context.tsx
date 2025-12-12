"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, ContactInfo, ChatSettings, Message, Role } from './types';
import { loadChats, saveChats } from './storage';

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
  setSuggestions: (chatId: string, suggestions: string[], analysis?: string, referenceCases?: string) => void;
  clearSuggestions: (chatId: string) => void;
} | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage (AndroidFileStorage or localStorage)
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedChats = await loadChats();
        if (savedChats) {
          // Migrate old data: convert string style to array
          const migratedChats = savedChats.map((chat: Chat) => {
            if (chat.settings && typeof chat.settings.style === 'string') {
              return {
                ...chat,
                settings: {
                  ...chat.settings,
                  style: [chat.settings.style]
                }
              };
            }
            return chat;
          });
          setChats(migratedChats);
        }
      } catch (e) {
        console.error("Failed to load chats", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save to storage (AndroidFileStorage or localStorage)
  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        try {
          const result = await saveChats(chats);
          if (!result.success && result.error) {
            console.warn('Failed to save chats:', result.error);
            // 可以在这里显示错误提示给用户
          }
        } catch (e) {
          console.error("Failed to save chats", e);
        }
      };
      saveData();
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

  const setSuggestions = (chatId: string, suggestions: string[], analysis?: string, referenceCases?: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          suggestions,
          ...(analysis && { analysis }),
          ...(referenceCases && { referenceCases })
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
          suggestions: [],
          analysis: undefined,
          referenceCases: undefined
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

