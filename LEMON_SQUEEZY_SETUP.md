# Lemon Squeezy API Key Setup

## Your API Key (Keep This Secure!)

Your Lemon Squeezy API key has been received. **DO NOT commit this to GitHub!**

## Quick Setup Steps

### 1. Add to Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your WorkTab project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add these variables:

**Variable 1:**
- **Name:** `LEMON_SQUEEZY_API_KEY`
- **Value:** `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIzZTJjOTg2ZDRmOWRhNDU1YjAyYWVmZDE1Nzc5MjEzODY1NmY3OWJhZmFkNmUzODhkMTUwMWFjMGU2YzhhZDUyMjU1NTA3MjUwNTA4ZDRmOCIsImlhdCI6MTc2MzQ3ODM1Mi40NzM2NTQsIm5iZiI6MTc2MzQ3ODM1Mi40NzM2NTcsImV4cCI6MjA3OTAxMTE1Mi40NTQxNDMsInN1YiI6IjU5NjQ1NzMiLCJzY29wZXMiOltdfQ.CnRwBt_0rwnGZF2E0kXETc9DkKKdkeY-DrvnTpvIcIYZtjkD8Q-TL_kYA3YAkuAB5Pz74y5UA3GGV-ysUBDAGK2dlB7X781QquA_A968SYmVfz5C0do33e6oMEnjQPus13Rr1JwEX71RqivoZ0Fi35eRTivVFB39pgHDNdPPGYJcgIGUTljbd6V1dIIkL26WUeLs6bqXYWOw-24Q_rrfAJBQQjKHomZlwviCGP6upRdfGWipb6UTZ5vV9271qljc3_kkPHbXjtx9QekOXqx_q3yjZPPGGMYPLrVLWDpk9PIQ8eHKi3kiv8wBCcE0q8rPKdCJzZ2fnm0_FPQGZ-glAXlJV2Nvew_O1SUtNFATIFl8L8VK2ECPhhjzxkdc70JdC--PzCLyovmQ6KajmFWk-2eekd53yeBHvZei733oZJ279lrA4hoEnc-NUofCWSCR2luFRjP6yzRtY3Gbf8eN31CpLWwSfDe1jYwLnJSXPvMuB_oxISxkRQoctreL55OjaoirEp5DzhlSOaOs7pfa6Dj2t6W4bq58oxReoocyMx6CLgYg2AYXJKiiKHASQ9VPrsseaRMDD19E4-YvLDXnnhw4dlvBvtFr5mD6GYF0IO2MbgVjKE2Tx-1R9B7kAK3-fVKJOj7JqImg2rRm6KonPuvvJJVWUwM_gCK57H2J064`
- **Environments:** Select all (Production, Preview, Development)

**Variable 2 (Get from Lemon Squeezy):**
- **Name:** `LEMON_SQUEEZY_WEBHOOK_SECRET`
- **Value:** (Get this from Lemon Squeezy → Settings → Webhooks)
- **Environments:** Select all

6. Click **Save**

### 2. Create Products in Lemon Squeezy

1. Go to Lemon Squeezy dashboard: https://app.lemonsqueezy.com
2. Go to **Products** → **Create Product**
3. Name: "WorkTab Pro"
4. Create two variants:

**Variant 1: Monthly**
- Name: "WorkTab Pro - Monthly"
- Price: $9.99
- Billing: Recurring (Monthly)
- Enable: "Generate license keys"

**Variant 2: Yearly**
- Name: "WorkTab Pro - Yearly"
- Price: $79.99
- Billing: Recurring (Yearly)
- Enable: "Generate license keys"

5. Copy the **Variant IDs** (you'll need these for the pricing page)

### 3. Update Pricing Page with Checkout URLs

Once you have the variant IDs, update `pricing.html`:

1. Open `public-site/pricing.html`
2. Find the JavaScript section at the bottom (around line 560)
3. Replace `MONTHLY_VARIANT_ID` and `YEARLY_VARIANT_ID` with your actual variant IDs:

```javascript
// Your store URL: https://worktab.lemonsqueezy.com
// Replace MONTHLY_VARIANT_ID and YEARLY_VARIANT_ID with your actual variant IDs
monthlyBtn.href = 'https://worktab.lemonsqueezy.com/checkout/buy/MONTHLY_VARIANT_ID';
yearlyBtn.href = 'https://worktab.lemonsqueezy.com/checkout/buy/YEARLY_VARIANT_ID';
```

**How to get Variant IDs:**
1. Go to Lemon Squeezy Dashboard
2. Products → Your Product → Click on the product
3. Scroll to "Variants" section
4. Click on each variant
5. Copy the Variant ID from the URL or variant details page

### 4. Set Up Webhook (Optional but Recommended)

1. In Lemon Squeezy, go to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. URL: `https://your-vercel-site.vercel.app/api/webhook` (replace with your actual Vercel URL)
4. Select events:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_payment_success`
   - `subscription_payment_failed`
5. Copy the webhook secret and add it to Vercel as `LEMON_SQUEEZY_WEBHOOK_SECRET`

### 5. Test the Integration

1. Deploy to Vercel (it will auto-deploy when you push to GitHub)
2. Test license validation:
   ```bash
   curl -X POST https://your-site.vercel.app/api/validate-license \
     -H "Content-Type: application/json" \
     -d '{"licenseKey":"test-key"}'
   ```

## Security Notes

- ✅ API key is stored in Vercel environment variables (secure)
- ✅ API key is NOT in your code (safe to commit to GitHub)
- ✅ Webhook secret protects webhook endpoints
- ⚠️ Never share your API key publicly
- ⚠️ Never commit API keys to Git

## Next Steps

1. Add environment variables to Vercel
2. Create products/variants in Lemon Squeezy
3. Get variant IDs and update pricing page
4. Set up webhook (optional)
5. Test the integration
6. Update extension to call `/api/validate-license`

