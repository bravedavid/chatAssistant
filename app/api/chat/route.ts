import { PROVIDERS, ModelProvider } from '@/lib/api-config';

interface ChatRequest {
  contactInfo: {
    name: string;
    age: string;
    job: string;
    background: string;
    relationship: string;
  };
  settings: {
    style: string | string[]; // Support both for backward compatibility
    customPrompt?: string;
  };
  history: Array<{ role: string; content: string }>;
  lastMessage: string;
  apiConfig?: {
    provider: ModelProvider;
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
}

export async function POST(req: Request) {
  try {
    const { contactInfo, settings, history, lastMessage, apiConfig }: ChatRequest = await req.json();

    // If no API config provided, return mock suggestions
    if (!apiConfig || !apiConfig.apiKey) {
      return Response.json({
        suggestions: [
          "这听起来很有趣！能跟我多说一些吗？",
          "哈哈，我完全理解你的意思~",
          "嗯嗯，然后呢？"
        ]
      });
    }

    const systemPrompt = `你是一个社交沟通助手，帮助用户回复聊天消息。

对方信息：
- 称呼：${contactInfo.name}
- 年龄：${contactInfo.age || '未知'}
- 职业：${contactInfo.job || '未知'}
- 背景：${contactInfo.background || '无'}
- 关系：${contactInfo.relationship || '未知'}

用户希望的回复风格：${Array.isArray(settings.style) ? settings.style.join('、') : settings.style}
${settings.customPrompt ? `额外要求：${settings.customPrompt}` : ''}

请根据对话历史和对方最新消息，生成3个不同的回复建议：
1. 一个标准/安全的回复
2. 一个更有创意或大胆的回复（符合风格设定）
3. 一个简短精炼的回复

所有回复都要完美匹配"${Array.isArray(settings.style) ? settings.style.join('、') : settings.style}"的语气风格。
只返回JSON格式：{"suggestions": ["回复1", "回复2", "回复3"]}`;

    const historyText = history.length > 0 
      ? history.slice(-10).map((m) => `${m.role === 'user' ? '我' : contactInfo.name}: ${m.content}`).join('\n')
      : '（暂无历史消息）';

    const userPrompt = `对方最新消息：${lastMessage}

最近对话记录：
${historyText}

请生成3个回复建议。`;

    const providerConfig = PROVIDERS[apiConfig.provider];
    const baseUrl = apiConfig.baseUrl || providerConfig.baseUrl;

    let suggestions: string[] = [];

    if (apiConfig.provider === 'anthropic') {
      // Anthropic Claude API
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiConfig.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: apiConfig.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text || '';
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions;
      }
    } else {
      // OpenAI compatible API
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      };

      if (apiConfig.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://chat-helper.app';
        headers['X-Title'] = 'AI Chat Helper';
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: apiConfig.model,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Parse JSON from response
      try {
        const parsed = JSON.parse(content);
        suggestions = parsed.suggestions || [];
      } catch {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestions = parsed.suggestions;
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions = [
        "这听起来很有趣！",
        "我理解你的意思~",
        "嗯嗯"
      ];
    }

    return Response.json({ suggestions });

  } catch (error) {
    console.error('Chat API Error:', error);
    // Return fallback suggestions on error
    return Response.json({
      suggestions: [
        "这听起来很有趣！能跟我多说一些吗？",
        "哈哈，我完全理解你的意思~",
        "嗯嗯，然后呢？"
      ]
    });
  }
}
