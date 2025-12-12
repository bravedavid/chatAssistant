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
  userFeedback?: string; // 用户建议或反馈
  apiConfig?: {
    provider: ModelProvider;
    apiKey: string;
    model: string;
    baseUrl?: string;
    token?: string; // For custom SSE provider
  };
}

export async function POST(req: Request) {
  try {
    const { contactInfo, settings, history, lastMessage, userFeedback, apiConfig }: ChatRequest = await req.json();

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
${userFeedback ? `用户特别建议：${userFeedback}` : ''}

请根据对话历史和对方最新消息，生成3个不同的回复建议：
1. 一个标准/安全的回复
2. 一个更有创意或大胆的回复（符合风格设定）
3. 一个简短精炼的回复

所有回复都要完美匹配"${Array.isArray(settings.style) ? settings.style.join('、') : settings.style}"的语气风格。
${userFeedback ? `特别注意：${userFeedback}` : ''}
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
    let analysis: string | undefined;
    let referenceCases: string | undefined;

    if (apiConfig.provider === 'custom') {
      // Custom SSE API - no system prompt, pass all info directly in request body
      if (!apiConfig.baseUrl || !apiConfig.token) {
        throw new Error('Base URL and Token are required for custom SSE provider');
      }

      // Convert history to messages format
      const historyMessages = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Pass all info directly in request body (no system prompt)
      const requestBody: any = {
        contactInfo,
        settings,
        history: historyMessages,
        lastMessage
      };

      // Add userFeedback only if provided
      if (userFeedback && userFeedback.trim()) {
        requestBody.userFeedback = userFeedback;
      }

      const response = await fetch(`${apiConfig.baseUrl}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Custom SSE API error:', errorText);
        
        // Handle 402 payment required error - still return suggestions
        if (response.status === 402) {
          let errorMessage = '金币不足，请充值';
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail) {
              errorMessage = errorJson.detail;
            }
          } catch {
            // If not JSON, use the text directly
            if (errorText) {
              errorMessage = errorText;
            }
          }
          
          // Return fallback suggestions with error info
          return Response.json({
            error: 'PAYMENT_REQUIRED',
            message: errorMessage,
            suggestions: [
              "金币不足，请充值",
            ]
          });
        }
        
        throw new Error(`Custom SSE API error: ${response.status}`);
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                // Handle different SSE formats
                if (parsed.content) {
                  fullContent += parsed.content;
                } else if (parsed.choices?.[0]?.delta?.content) {
                  fullContent += parsed.choices[0].delta.content;
                } else if (parsed.message?.content) {
                  fullContent += parsed.message.content;
                } else if (parsed.text) {
                  fullContent += parsed.text;
                } else if (typeof parsed === 'string') {
                  fullContent += parsed;
                }
              } catch (e) {
                // If not JSON, treat as plain text
                if (data && !data.startsWith('{')) {
                  fullContent += data;
                }
              }
            } else if (line.trim() && !line.startsWith(':')) {
              // Handle non-SSE format (plain text chunks)
              fullContent += line;
            }
          }
        }
        
        // Process remaining buffer
        if (buffer.trim()) {
          if (buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim();
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) fullContent += parsed.content;
                else if (parsed.text) fullContent += parsed.text;
                else if (typeof parsed === 'string') fullContent += parsed;
              } catch {
                fullContent += data;
              }
            }
          } else {
            fullContent += buffer;
          }
        }
      }

      // Debug: log the full content to see what we're parsing
      console.log('=== Full Content Debug ===');
      console.log('Full content length:', fullContent.length);
      console.log('Full content preview (first 500 chars):', fullContent.substring(0, 500));
      console.log('Full content ends with:', fullContent.substring(Math.max(0, fullContent.length - 200)));
      
      // Parse JSON from full content
      let llmResponse: string | null = null;
      
      try {
        const parsed = JSON.parse(fullContent.trim());
        console.log('Successfully parsed as JSON');
        console.log('Parsed keys:', Object.keys(parsed));
        
        // Check for custom SSE format with llm_response
        if (parsed.llm_response) {
          llmResponse = parsed.llm_response;
          console.log('Found llm_response in JSON');
        } else if (parsed.suggestions) {
          // Standard format
          suggestions = parsed.suggestions || [];
        }
      } catch (e) {
        // If not JSON, treat fullContent as llm_response directly
        console.log('Not JSON format, treating as plain text llm_response');
        llmResponse = fullContent.trim();
      }
      
      // Parse llm_response if we have it
      if (llmResponse) {
        // Extract analysis section (局势分析) - stop at next ### section or end
        const analysisMatch = llmResponse.match(/### 🧠 局势分析\n([\s\S]*?)(?=\n### |$)/);
        if (analysisMatch && analysisMatch[1]) {
          const extractedAnalysis = analysisMatch[1].trim();
          // Remove any trailing newlines and clean up
          analysis = extractedAnalysis.replace(/\n+$/, '').trim();
        }
        
        // Extract reference cases section (参考案例) - stop at next ### section or end
        const referenceCasesMatch = llmResponse.match(/### 📚 参考案例\n([\s\S]*?)(?=\n### |$)/);
        if (referenceCasesMatch && referenceCasesMatch[1]) {
          const extractedCases = referenceCasesMatch[1].trim();
          // Remove any trailing newlines and clean up
          referenceCases = extractedCases.replace(/\n+$/, '').trim();
        }
        
        // Extract suggestions from 推荐回复 section only
        const suggestionsMatch = llmResponse.match(/### 💬 推荐回复\n([\s\S]*?)(?=\n### |$)/);
        if (suggestionsMatch && suggestionsMatch[1]) {
          const suggestionsText = suggestionsMatch[1].trim();
          // Parse numbered list: "1. 你好呀\n2. 嘿，你好\n3. 嗨，很高兴认识你"
          const suggestionLines = suggestionsText.split('\n').filter((line: string) => {
            const trimmed = line.trim();
            // Only include lines that start with a number followed by a dot
            return trimmed && /^\d+\.\s+/.test(trimmed);
          });
          
          suggestions = suggestionLines.map((line: string) => {
            // Remove numbering like "1. ", "2. ", etc.
            return line.replace(/^\d+\.\s*/, '').trim();
          }).filter((s: string) => s.length > 0);
        }
        
        // Fallback: if no suggestions found in 推荐回复 section, try to find numbered list anywhere
        if (suggestions.length === 0) {
          // Try to find numbered list, but exclude lines that are part of analysis
          const numberedListMatch = llmResponse.match(/(?:^|\n)(\d+\.\s+[^\n]+(?:\n\d+\.\s+[^\n]+)*)/);
          if (numberedListMatch) {
            const listText = numberedListMatch[1];
            const lines = listText.split('\n').filter((line: string) => {
              const trimmed = line.trim();
              return trimmed && /^\d+\.\s+/.test(trimmed);
            });
            suggestions = lines.map((line: string) => {
              return line.replace(/^\d+\.\s*/, '').trim();
            }).filter((s: string) => s.length > 0);
          }
        }
        
        // Debug logging
        console.log('=== Custom SSE Parsing Debug ===');
        console.log('Full llm_response length:', llmResponse.length);
        console.log('Analysis found:', !!analysis);
        console.log('Analysis content:', analysis ? analysis.substring(0, 100) : 'none');
        console.log('Suggestions count:', suggestions.length);
        console.log('Suggestions:', suggestions);
        console.log('===============================');
      }
    } else if (apiConfig.provider === 'anthropic') {
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

    return Response.json({ 
      suggestions,
      ...(analysis && { analysis }),
      ...(referenceCases && { referenceCases })
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Check if it's a payment required error (already handled above)
    if (error instanceof Error && error.message.includes('402')) {
      // This shouldn't happen as we handle 402 before throwing, but just in case
      return Response.json({
        error: 'PAYMENT_REQUIRED',
        message: '金币不足，请充值'
      }, { status: 402 });
    }
    
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
