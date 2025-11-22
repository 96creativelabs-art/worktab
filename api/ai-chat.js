// API route for AI Assistant Chat
// POST /api/ai-chat
// Body: { message: string, context: object, history: array }

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, context, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get Anthropic API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array
    const messages = buildMessages(history, message);

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({ 
        error: 'AI service error',
        details: response.status === 401 ? 'Invalid API key' : 'Failed to get AI response'
      });
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    const aiResponse = data.content[0].text;

    return res.status(200).json({
      response: aiResponse,
      usage: data.usage || {}
    });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Build system prompt with WorkTab context
 */
function buildSystemPrompt(context = {}) {
  const { workspaces = [], openTabs = [], workspaceCount = 0, tabCount = 0, settings = {} } = context;

  let prompt = `You are WorkTab AI Assistant, a helpful assistant for the WorkTab browser extension.

WorkTab helps users organize browser tabs into workspaces. You can help users:
- Organize their tabs into workspaces
- Suggest workspace names based on tabs
- Answer questions about WorkTab features
- Provide productivity tips for tab management
- Help with workspace organization

Current user context:
- User has ${workspaceCount} workspace${workspaceCount !== 1 ? 's' : ''}
- User has ${tabCount} open tab${tabCount !== 1 ? 's' : ''}
`;

  if (workspaces.length > 0) {
    prompt += `\nCurrent workspaces:\n`;
    workspaces.slice(0, 10).forEach((ws, i) => {
      prompt += `  ${i + 1}. "${ws.name}" (${ws.tabCount} tabs, color: ${ws.color})\n`;
    });
    if (workspaces.length > 10) {
      prompt += `  ... and ${workspaces.length - 10} more workspaces\n`;
    }
  }

  if (openTabs.length > 0) {
    prompt += `\nOpen tabs (sample):\n`;
    openTabs.slice(0, 10).forEach((tab, i) => {
      prompt += `  ${i + 1}. ${tab.title} (${tab.domain})\n`;
    });
    if (openTabs.length > 10) {
      prompt += `  ... and ${openTabs.length - 10} more tabs\n`;
    }
  }

  prompt += `\nBe concise, helpful, and action-oriented. When suggesting actions, be specific. 
If the user asks about organizing tabs, provide concrete suggestions based on their current tabs.
If they ask about WorkTab features, explain clearly and provide examples.
Keep responses under 300 words unless the user asks for detailed information.`;

  return prompt;
}

/**
 * Build messages array for Anthropic API
 * Anthropic uses: { role: 'user'|'assistant', content: string }
 */
function buildMessages(history, currentMessage) {
  const messages = [];

  // Convert history to Anthropic format (last 10 messages for context)
  const recentHistory = history.slice(-10);
  recentHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : String(msg.content)
      });
    }
  });

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage
  });

  return messages;
}

