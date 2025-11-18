// API route to validate Lemon Squeezy license keys
// POST /api/validate-license
// Body: { licenseKey: "abc123..." }

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
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'License key is required' });
    }

    // Get Lemon Squeezy API key from environment
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
      console.error('LEMON_SQUEEZY_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate license with Lemon Squeezy API
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.api+json'
      },
      body: JSON.stringify({
        license_key: licenseKey
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lemon Squeezy API error:', errorData);
      return res.status(response.status).json({ 
        error: 'License validation failed',
        valid: false 
      });
    }

    const data = await response.json();

    // Lemon Squeezy returns { valid: true/false }
    if (data.valid) {
      return res.status(200).json({
        valid: true,
        message: 'License is valid'
      });
    } else {
      return res.status(200).json({
        valid: false,
        message: 'License is invalid or expired'
      });
    }

  } catch (error) {
    console.error('Error validating license:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      valid: false 
    });
  }
}

