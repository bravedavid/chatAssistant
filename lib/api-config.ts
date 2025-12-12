export type ModelProvider = 'openai' | 'openrouter' | 'anthropic' | 'deepseek' | 'moonshot' | 'custom';

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
}

export interface APIConfig {
  provider: ModelProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  // For custom SSE provider
  token?: string; // TOKEN for custom SSE API
}

export const PROVIDERS: Record<ModelProvider, { name: string; baseUrl: string; models: ModelOption[] }> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'openrouter' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter' },
      { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'openrouter' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'openrouter' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'openrouter' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'openrouter' },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'openrouter' },
    ]
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' },
    ]
  },
  moonshot: {
    name: 'Moonshot (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', provider: 'moonshot' },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', provider: 'moonshot' },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', provider: 'moonshot' },
    ]
  },
  custom: {
    name: '自定义 SSE 接口',
    baseUrl: '', // 用户自定义
    models: [
      { id: 'custom-sse', name: '自定义 SSE', provider: 'custom' },
    ]
  }
};

const STORAGE_KEY = 'chat_ai_api_config';

export function getAPIConfig(): APIConfig | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveAPIConfig(config: APIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearAPIConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

