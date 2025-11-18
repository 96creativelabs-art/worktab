# Lemon Squeezy API Setup Guide

This guide explains how to set up Lemon Squeezy integration with your WorkTab extension using your existing Vercel site.

## Architecture

```
Chrome Extension → Your Vercel Site (/api/validate-license) → Lemon Squeezy API
```

## Setup Steps

### 1. Get Lemon Squeezy API Keys

1. Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Go to **Settings** → **API**
3. Create a new API key
4. Copy the **API Key** (starts with `ls_`)
5. Go to **Settings** → **Webhooks**
6. Copy the **Webhook Secret** (for webhook verification)

### 2. Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
LEMON_SQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIzZTJjOTg2ZDRmOWRhNDU1YjAyYWVmZDE1Nzc5MjEzODY1NmY3OWJhZmFkNmUzODhkMTUwMWFjMGU2YzhhZDUyMjU1NTA3MjUwNTA4ZDRmOCIsImlhdCI6MTc2MzQ3ODM1Mi40NzM2NTQsIm5iZiI6MTc2MzQ3ODM1Mi40NzM2NTcsImV4cCI6MjA3OTAxMTE1Mi40NTQxNDMsInN1YiI6IjU5NjQ1NzMiLCJzY29wZXMiOltdfQ.CnRwBt_0rwnGZF2E0kXETc9DkKKdkeY-DrvnTpvIcIYZtjkD8Q-TL_kYA3YAkuAB5Pz74y5UA3GGV-ysUBDAGK2dlB7X781QquA_A968SYmVfz5C0do33e6oMEnjQPus13Rr1JwEX71RqivoZ0Fi35eRTivVFB39pgHDNdPPGYJcgIGUTljbd6V1dIIkL26WUeLs6bqXYWOw-24Q_rrfAJBQQjKHomZlwviCGP6upRdfGWipb6UTZ5vV9271qljc3_kkPHbXjtx9QekOXqx_q3yjZPPGGMYPLrVLWDpk9PIQ8eHKi3kiv8wBCcE0q8rPKdCJzZ2fnm0_FPQGZ-glAXlJV2Nvew_O1SUtNFATIFl8L8VK2ECPhhjzxkdc70JdC--PzCLyovmQ6KajmFWk-2eekd53yeBHvZei733oZJ279lrA4hoEnc-NUofCWSCR2luFRjP6yzRtY3Gbf8eN31CpLWwSfDe1jYwLnJSXPvMuB_oxISxkRQoctreL55OjaoirEp5DzhlSOaOs7pfa6Dj2t6W4bq58oxReoocyMx6CLgYg2AYXJKiiKHASQ9VPrsseaRMDD19E4-YvLDXnnhw4dlvBvtFr5mD6GYF0IO2MbgVjKE2Tx-1R9B7kAK3-fVKJOj7JqImg2rRm6KonPuvvJJVWUwM_gCK57H2J064
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Click **Save**

**⚠️ IMPORTANT:** Never commit your API key to GitHub! Always use environment variables.

### 3. Configure Webhook in Lemon Squeezy

1. Go to **Settings** → **Webhooks** in Lemon Squeezy
2. Click **Create Webhook**
3. Set the webhook URL to: `https://your-vercel-site.vercel.app/api/webhook` (replace with your actual Vercel URL)
4. Your store URL: `https://worktab.lemonsqueezy.com`
4. Select these events:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_payment_success`
   - `subscription_payment_failed`
5. Save the webhook

### 4. Create Product in Lemon Squeezy

1. Go to **Products** in Lemon Squeezy
2. Click **Create Product**
3. Name it "WorkTab Premium"
4. Create a variant:
   - **Price**: Set your price (e.g., $9.99)
   - **Billing**: Choose one-time or subscription
   - **License Key**: Enable "Generate license keys"
5. Save the product
6. Copy the **Variant ID** (you'll need this for checkout links)

### 5. Deploy to Vercel

1. Push your changes to GitHub (if using Git)
2. Vercel will automatically deploy
3. Or manually deploy: `vercel --prod`

## API Endpoints

### POST /api/validate-license

Validates a license key with Lemon Squeezy.

**Request:**
```json
{
  "licenseKey": "abc123-def456-ghi789"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "message": "License is valid"
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "message": "License is invalid or expired"
}
```

### POST /api/webhook

Receives webhook events from Lemon Squeezy. Handles:
- Order creation
- Subscription events
- Payment events

## Testing

### Test License Validation

```bash
curl -X POST https://your-site.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"test-key"}'
```

### Test Webhook (using Lemon Squeezy test mode)

Lemon Squeezy will send test webhooks when you create test orders.

## Extension Integration

In your Chrome extension, call the API like this:

```javascript
async function validateLicense(licenseKey) {
  const response = await fetch('https://your-site.vercel.app/api/validate-license', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ licenseKey })
  });
  
  const data = await response.json();
  return data.valid;
}
```

## Troubleshooting

### API returns 500 error
- Check that `LEMON_SQUEEZY_API_KEY` is set in Vercel
- Check Vercel function logs: **Deployments** → **Functions** → **View Logs**

### Webhook not receiving events
- Verify webhook URL is correct in Lemon Squeezy
- Check webhook secret matches in Vercel environment variables
- Check Vercel function logs for errors

### License validation always returns false
- Verify API key is correct
- Check license key format
- Test with a known valid license key from Lemon Squeezy dashboard

## Next Steps

1. Update your Chrome extension to call `/api/validate-license`
2. Add license key input UI in your extension
3. Store validated license keys in `chrome.storage.local`
4. Check license on extension startup

