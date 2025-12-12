"use client";

import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertCircle, ExternalLink, Database, HardDrive } from 'lucide-react';
import { 
  APIConfig, 
  ModelProvider, 
  PROVIDERS, 
  getAPIConfig, 
  saveAPIConfig 
} from '@/lib/api-config';
import { storage, StorageInfo } from '@/lib/storage';

interface APISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function APISettings({ isOpen, onClose }: APISettingsProps) {
  const [config, setConfig] = useState<APIConfig>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getAPIConfig();
      if (saved) {
        setConfig(saved);
      }
      setIsSaved(false);
      setTestResult(null);
      
      // 加载存储信息
      const loadStorageInfo = async () => {
        const info = await storage.getStorageInfo();
        setStorageInfo(info);
      };
      loadStorageInfo();
    }
  }, [isOpen]);

  const handleProviderChange = (provider: ModelProvider) => {
    const defaultModel = PROVIDERS[provider].models[0]?.id || '';
    setConfig({
      ...config,
      provider,
      model: defaultModel,
    });
    setTestResult(null);
  };

  const handleSave = () => {
    if (config.provider === 'custom') {
      if (!config.baseUrl?.trim()) {
        alert('请输入 Base URL');
        return;
      }
      if (!config.token?.trim()) {
        alert('请输入 Token');
        return;
      }
    } else {
      if (!config.apiKey.trim()) {
        alert('请输入 API Key');
        return;
      }
    }
    saveAPIConfig(config);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      alert('请先输入 API Key');
      return;
    }
    
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const providerInfo = PROVIDERS[config.provider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">API 设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择服务商
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(PROVIDERS) as ModelProvider[]).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => handleProviderChange(provider)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    config.provider === provider
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {PROVIDERS[provider].name}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          {config.provider !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => {
                  setConfig({ ...config, apiKey: e.target.value });
                  setTestResult(null);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                placeholder={`输入你的 ${providerInfo.name} API Key`}
              />
            
            {/* Provider specific hints */}
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <span>获取 API Key：</span>
              {config.provider === 'openai' && (
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline flex items-center gap-0.5">
                  OpenAI Platform <ExternalLink size={12} />
                </a>
              )}
              {config.provider === 'openrouter' && (
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:underline flex items-center gap-0.5">
                  OpenRouter <ExternalLink size={12} />
                </a>
              )}
              {config.provider === 'anthropic' && (
                <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:underline flex items-center gap-0.5">
                  Anthropic Console <ExternalLink size={12} />
                </a>
              )}
              {config.provider === 'deepseek' && (
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:underline flex items-center gap-0.5">
                  DeepSeek Platform <ExternalLink size={12} />
                </a>
              )}
              {config.provider === 'moonshot' && (
                <a href="https://platform.moonshot.cn/console/api-keys" target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:underline flex items-center gap-0.5">
                  Moonshot Console <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          )}

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择模型
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
            >
              {providerInfo.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.provider === 'custom' ? 'Base URL' : '自定义 Base URL'} 
              <span className="text-gray-400 font-normal">{config.provider === 'custom' ? '（必填）' : '（可选，用于代理）'}</span>
            </label>
            <input
              type="text"
              value={config.baseUrl || ''}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value || undefined })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              placeholder={config.provider === 'custom' ? 'https://your-api.com' : providerInfo.baseUrl}
              required={config.provider === 'custom'}
            />
          </div>

          {/* Token for custom SSE provider */}
          {config.provider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token <span className="text-gray-400 font-normal">（必填）</span>
              </label>
              <input
                type="password"
                value={config.token || ''}
                onChange={(e) => setConfig({ ...config, token: e.target.value || undefined })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                placeholder="输入您的 Token"
                required
              />
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              testResult === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult === 'success' ? (
                <>
                  <Check size={18} />
                  <span>连接成功！</span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} />
                  <span>连接失败，请检查 API Key 是否正确</span>
                </>
              )}
            </div>
          )}

          {/* Saved indicator */}
          {isSaved && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-2">
              <Check size={18} />
              <span>设置已保存</span>
            </div>
          )}

          {/* Storage Info */}
          {storageInfo && (
            <div className={`p-4 rounded-lg border ${
              storageInfo.type === 'android' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {storageInfo.type === 'android' ? (
                  <HardDrive size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Database size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      storageInfo.type === 'android' ? 'text-green-800' : 'text-amber-800'
                    }`}>
                      {storageInfo.type === 'android' ? 'Android 文件存储' : '浏览器本地存储'}
                    </span>
                    {storageInfo.type === 'android' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        无限制
                      </span>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className={`${storageInfo.type === 'android' ? 'text-green-700' : 'text-amber-700'}`}>
                      <span className="font-medium">已使用：</span>
                      {(storageInfo.totalSize / 1024).toFixed(2)} KB
                      {storageInfo.type === 'localStorage' && storageInfo.limitSize && (
                        <span> / {(storageInfo.limitSize / 1024 / 1024).toFixed(0)} MB</span>
                      )}
                    </div>
                    <div className={`${storageInfo.type === 'android' ? 'text-green-600' : 'text-amber-600'}`}>
                      <span className="font-medium">文件数：</span>
                      {storageInfo.fileCount}
                    </div>
                    {storageInfo.type === 'localStorage' && (
                      <div className="text-amber-700 mt-2 pt-2 border-t border-amber-200">
                        <AlertCircle size={14} className="inline mr-1" />
                        <span className="font-medium">注意：</span>
                        <span>localStorage 有约 5MB 的大小限制，建议在 Android 应用中查看以获得无限制存储</span>
                      </div>
                    )}
                    {storageInfo.type === 'android' && storageInfo.directory && (
                      <div className="text-green-600 mt-1 text-[10px] font-mono break-all">
                        存储路径：{storageInfo.directory}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={handleTest}
            disabled={isLoading || (config.provider === 'custom' ? (!config.baseUrl?.trim() || !config.token?.trim()) : !config.apiKey.trim())}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? '测试中...' : '测试连接'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={config.provider === 'custom' ? (!config.baseUrl?.trim() || !config.token?.trim()) : !config.apiKey.trim()}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}

