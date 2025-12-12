import { PROVIDERS, ModelProvider } from '@/lib/api-config';

export async function POST(req: Request) {
  try {
    const { provider, apiKey, model, baseUrl, token } = await req.json();
    
    const providerConfig = PROVIDERS[provider as ModelProvider];
    const url = baseUrl || providerConfig.baseUrl;

    if (provider === 'custom') {
      // Custom SSE API
      if (!baseUrl || !token) {
        return Response.json({ error: 'Base URL and Token are required' }, { status: 400 });
      }
      
      const response = await fetch(`${baseUrl}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Custom SSE API error:', error);
        return Response.json({ error: 'Connection failed' }, { status: 400 });
      }
      
      return Response.json({ success: true });
    } else if (provider === 'anthropic') {
      // Anthropic uses a different API format
      const response = await fetch(`${url}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Anthropic API error:', error);
        return Response.json({ error: 'Connection failed' }, { status: 400 });
      }
      
      return Response.json({ success: true });
    } else {
      // OpenAI compatible API (OpenAI, OpenRouter, DeepSeek, Moonshot)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      
      // OpenRouter requires additional headers
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://chat-helper.app';
        headers['X-Title'] = 'AI Chat Helper';
      }

      const response = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('API error:', error);
        return Response.json({ error: 'Connection failed' }, { status: 400 });
      }
      
      return Response.json({ success: true });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return Response.json({ error: 'Connection failed' }, { status: 500 });
  }
}

