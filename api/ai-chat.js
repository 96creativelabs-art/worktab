// API route for AI Assistant Chat
// POST /api/ai-chat
// Body: { message: string, context: object, history: array }

// Rate Limiting Configuration (NOT ENFORCED YET - Ready for implementation)
const RATE_LIMITS = {
  FREE: {
    daily: 10,        // 10 messages per day
    hourly: 3,        // 3 messages per hour
    concurrent: 1,    // 1 request at a time
    maxTokens: 500,   // 500 tokens per message
  },
  PRO: {
    daily: 200,       // 200 messages per day
    hourly: 20,       // 20 messages per hour
    concurrent: 3,    // 3 concurrent requests
    maxTokens: 2000,  // 2,000 tokens per message
    monthly: 5000,    // 5,000 messages per month (soft limit)
  }
};

// Rate limiting is currently DISABLED
// Set to true when ready to enforce limits
const RATE_LIMITING_ENABLED = false;

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

    // Get user identifier (license key or extension ID)
    // TODO: Extract from request headers or body when implementing
    const userIdentifier = req.headers['x-user-id'] || req.body.userId || 'anonymous';
    const isPro = req.headers['x-is-pro'] === 'true' || req.body.isPro === true;

    // Rate limiting check (DISABLED - ready for implementation)
    if (RATE_LIMITING_ENABLED) {
      const rateLimitCheck = await checkRateLimit(userIdentifier, isPro);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message,
          retryAfter: rateLimitCheck.retryAfter,
          limits: rateLimitCheck.limits,
          usage: rateLimitCheck.usage
        });
      }
    }

    // Get Anthropic API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Note: Health data should be fetched by the extension and included in context
    // The extension will call GET_TAB_HEALTH and include it in the context object
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

    // Parse action commands from AI response
    const actions = parseActions(aiResponse);
    const cleanedResponse = removeActionMarkers(aiResponse);

    // Track usage (DISABLED - ready for implementation)
    if (RATE_LIMITING_ENABLED) {
      await trackUsage(userIdentifier, isPro, data.usage || {}).catch(err => {
        console.error('Failed to track usage:', err);
        // Don't fail the request if tracking fails
      });
    }

    return res.status(200).json({
      response: cleanedResponse,
      actions: actions.length > 0 ? actions : undefined,
      usage: data.usage || {},
      // Include rate limit info in response (when enabled)
      ...(RATE_LIMITING_ENABLED ? {
        rateLimit: {
          remaining: 0, // TODO: Calculate from tracking
          resetAt: new Date(Date.now() + 3600000).toISOString() // TODO: Calculate from tracking
        }
      } : {})
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
 * Parse action commands from AI response
 * Format: <action:type:params> or <action:close_workspace_tabs:workspaceId>
 */
function parseActions(response) {
  const actions = [];
  const actionRegex = /<action:([^:]+):([^>]+)>/g;
  let match;

  while ((match = actionRegex.exec(response)) !== null) {
    const [, type, params] = match;
    try {
      const parsedParams = JSON.parse(params);
      actions.push({ type, params: parsedParams });
    } catch (e) {
      // If params is not JSON, treat as string
      actions.push({ type, params: { value: params } });
    }
  }

  return actions;
}

/**
 * Remove action markers from response text
 */
function removeActionMarkers(response) {
  return response.replace(/<action:[^>]+>/g, '').trim();
}

/**
 * Build system prompt with WorkTab context
 */
function buildSystemPrompt(context = {}) {
  const { workspaces = [], openTabs = [], workspaceCount = 0, tabCount = 0, settings = {}, healthData = null } = context;

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
    prompt += `\nCurrent workspaces (use workspaceId in actions):\n`;
    workspaces.slice(0, 10).forEach((ws, i) => {
      prompt += `  ${i + 1}. "${ws.name}" (ID: ${ws.id}, ${ws.tabCount} tabs, color: ${ws.color})\n`;
    });
    if (workspaces.length > 10) {
      prompt += `  ... and ${workspaces.length - 10} more workspaces\n`;
    }
    prompt += `\nIMPORTANT: When executing actions on workspaces, use the workspaceId from the list above.\n`;
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

  // Add health dashboard data if available
  if (healthData) {
    prompt += `\n\nTab Health Dashboard Data (use this to provide performance tips):`;
    if (healthData.summary) {
      prompt += `\n- Total Memory: ${healthData.summary.totalMemory || 'N/A'} MB`;
      prompt += `\n- Average Health Score: ${healthData.summary.averageHealth || 'N/A'}/100`;
      prompt += `\n- Warnings: ${healthData.warnings?.length || 0}`;
    }
    if (healthData.warnings && healthData.warnings.length > 0) {
      prompt += `\nPerformance Warnings:`;
      healthData.warnings.slice(0, 5).forEach((warning, i) => {
        prompt += `\n  ${i + 1}. ${warning.message}`;
      });
      prompt += `\n\nWhen users ask about performance or browser slowdown, reference these warnings and suggest:`;
      prompt += `\n- Closing unused tabs`;
      prompt += `\n- Suspending inactive tabs`;
      prompt += `\n- Using workspaces to organize tabs`;
      prompt += `\n- Checking the Health Dashboard for specific issues`;
    }
    if (healthData.tabs && healthData.tabs.length > 0) {
      prompt += `\n\nHigh Memory Tabs (top 5):`;
      healthData.tabs
        .sort((a, b) => (b.memory || 0) - (a.memory || 0))
        .slice(0, 5)
        .forEach((tab, i) => {
          prompt += `\n  ${i + 1}. ${tab.title || tab.url} - ${tab.memory || 0} MB`;
        });
    }
  }

  prompt += `\n\nAVAILABLE ACTIONS (use these when user requests actions):
You can execute actions by including action markers in your response. Format: <action:TYPE:PARAMS>

Available action types:
1. close_workspace_tabs - Close all tabs in a workspace
   Format: <action:close_workspace_tabs:{"workspaceId":"ws_123"}>
   Note: Use the workspaceId from the workspaces list above
   
2. delete_workspace - Delete a workspace
   Format: <action:delete_workspace:{"workspaceId":"ws_123"}>
   Note: Use the workspaceId from the workspaces list above
   
3. create_workspace - Create a new workspace
   Format: <action:create_workspace:{"name":"Workspace Name","color":"blue-500","tabs":[]}>
   Colors: blue-500, green-500, red-500, yellow-500, purple-500, pink-500, indigo-500, sky-500
   
4. close_tabs - Close specific tabs by URL
   Format: <action:close_tabs:{"urls":["https://example.com"]}>
   
5. get_health_dashboard - Get health dashboard data (already included if available)

When user requests an action:
- Confirm the action in your response text
- Include the action marker at the end
- Be specific about what will happen

Example response:
"I'll close all tabs in the 'Research' workspace for you. <action:close_workspace_tabs:{\"workspaceId\":\"ws_123\"}>"

Be concise, helpful, and action-oriented. When suggesting actions, be specific. 
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

/**
 * Check rate limits for a user (READY BUT NOT ENFORCED)
 * TODO: Implement with Vercel KV or Redis
 */
async function checkRateLimit(userIdentifier, isPro) {
  // This is a placeholder - implement with actual storage
  // Recommended: Use Vercel KV or Redis for tracking
  
  const limits = isPro ? RATE_LIMITS.PRO : RATE_LIMITS.FREE;
  
  // TODO: Implement actual rate limit checking
  // 1. Get current usage from KV/Redis
  // 2. Check daily limit
  // 3. Check hourly limit
  // 4. Check concurrent requests
  // 5. Return result
  
  return {
    allowed: true, // Currently always allowed
    message: '',
    retryAfter: null,
    limits: limits,
    usage: {
      daily: 0,
      hourly: 0,
      monthly: isPro ? 0 : null
    }
  };
}

/**
 * Track usage for a user (READY BUT NOT ENFORCED)
 * TODO: Implement with Vercel KV or Redis
 */
async function trackUsage(userIdentifier, isPro, apiUsage) {
  // This is a placeholder - implement with actual storage
  // Recommended: Use Vercel KV or Redis for tracking
  
  // TODO: Implement actual usage tracking
  // 1. Increment daily counter
  // 2. Increment hourly counter
  // 3. Track token usage
  // 4. Store in KV/Redis with TTL
  // 5. Set expiration for daily/hourly windows
  
  // Example structure:
  // Key: `ai-usage:${userIdentifier}:daily:${date}`
  // Value: { count: 5, tokens: 5000 }
  // TTL: 24 hours
  
  return true;
}

