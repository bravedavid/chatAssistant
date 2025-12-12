export type Role = 'contact' | 'user';

export interface ContactInfo {
  name: string;
  age: string;
  job: string;
  background: string;
  relationship: string;
}

export interface ChatSettings {
  style: string[]; // e.g., ["幽默", "成熟", "调皮"]
  customPrompt?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  contactInfo: ContactInfo;
  settings: ChatSettings;
  messages: Message[];
  suggestions?: string[]; // AI generated reply suggestions
  analysis?: string; // AI analysis of the situation
  referenceCases?: string; // 参考案例
  createdAt: number;
  updatedAt: number;
}

export interface AIResponse {
  suggestions: string[];
  analysis?: string; // 局势分析
  referenceCases?: string; // 参考案例
}

