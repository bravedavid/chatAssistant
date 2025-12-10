"use client";

import React, { useState } from 'react';
import { ContactInfo, ChatSettings } from '@/lib/types';

interface ChatConfigProps {
  initialInfo?: ContactInfo;
  initialSettings?: ChatSettings;
  onSubmit: (info: ContactInfo, settings: ChatSettings) => void;
  onCancel?: () => void;
  isNew?: boolean;
}

export function ChatConfig({ initialInfo, initialSettings, onSubmit, onCancel, isNew = true }: ChatConfigProps) {
  const [info, setInfo] = useState<ContactInfo>(initialInfo || {
    name: '',
    age: '',
    job: '',
    background: '',
    relationship: ''
  });

  const [settings, setSettings] = useState<ChatSettings>(() => {
    if (initialSettings) {
      // Handle backward compatibility: convert string to array if needed
      return {
        ...initialSettings,
        style: Array.isArray(initialSettings.style) 
          ? initialSettings.style 
          : (initialSettings.style ? [initialSettings.style] : ['幽默'])
      };
    }
    return {
      style: ['幽默'],
      customPrompt: ''
    };
  });

  const styles = ['幽默', '成熟', '调皮', '温柔', '专业', '高冷', '直接', '委婉'];

  // Handle backward compatibility: convert string to array if needed
  const currentStyles = Array.isArray(settings.style) ? settings.style : (settings.style ? [settings.style] : ['幽默']);

  const toggleStyle = (style: string) => {
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    
    // Ensure at least one style is selected
    if (newStyles.length > 0) {
      setSettings({ ...settings, style: newStyles });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.name.trim()) {
      alert('请输入对方名称');
      return;
    }
    // Ensure style is an array before submitting
    const normalizedSettings = {
      ...settings,
      style: Array.isArray(settings.style) ? settings.style : (settings.style ? [settings.style] : ['幽默'])
    };
    onSubmit(info, normalizedSettings);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header - hidden on mobile as we have page header */}
        <div className="hidden md:block p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? '新建对话' : '编辑设置'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isNew ? '设置对方信息，让 AI 更好地帮你回复' : '修改对话设置'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* Contact Info Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">对方信息</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                称呼 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-base"
                placeholder="如：小红、张老师"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">年龄</label>
                <input
                  type="text"
                  value={info.age}
                  onChange={(e) => setInfo({ ...info, age: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-base"
                  placeholder="如：25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">职业</label>
                <input
                  type="text"
                  value={info.job}
                  onChange={(e) => setInfo({ ...info, job: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-base"
                  placeholder="如：设计师"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关系</label>
              <input
                type="text"
                value={info.relationship}
                onChange={(e) => setInfo({ ...info, relationship: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-base"
                placeholder="如：相亲对象、同事、朋友"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">背景信息</label>
              <textarea
                value={info.background}
                onChange={(e) => setInfo({ ...info, background: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-base resize-none"
                rows={3}
                placeholder="其他需要 AI 知道的信息，如：咖啡店认识、喜欢猫..."
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">回复风格</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择风格（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {styles.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      currentStyles.includes(s)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {currentStyles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">请至少选择一个风格</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                额外要求 <span className="text-gray-400 font-normal">（可选）</span>
              </label>
              <input
                type="text"
                value={settings.customPrompt}
                onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-base"
                placeholder="如：回复简短一些、多用表情..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-sm"
            >
              {isNew ? '开始对话' : '保存设置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
