// Webhook endpoint for Lemon Squeezy events
// POST /api/webhook
// Handles: order_created, subscription_created, subscription_cancelled, etc.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-signature'];
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    // Verify webhook signature (optional but recommended)
    if (webhookSecret && signature) {
      // You can add signature verification here
      // Lemon Squeezy provides signature in x-signature header
    }

    const event = req.body;
    const eventName = event.meta?.event_name;

    console.log('Lemon Squeezy webhook received:', eventName);

    // Handle different event types
    switch (eventName) {
      case 'order_created':
        // New order - license key generated
        await handleOrderCreated(event);
        break;

      case 'subscription_created':
        // New subscription
        await handleSubscriptionCreated(event);
        break;

      case 'subscription_updated':
        // Subscription updated (plan change, etc.)
        await handleSubscriptionUpdated(event);
        break;

      case 'subscription_cancelled':
        // Subscription cancelled
        await handleSubscriptionCancelled(event);
        break;

      case 'subscription_payment_success':
        // Subscription payment succeeded
        await handleSubscriptionPaymentSuccess(event);
        break;

      case 'subscription_payment_failed':
        // Subscription payment failed
        await handleSubscriptionPaymentFailed(event);
        break;

      default:
        console.log('Unhandled webhook event:', eventName);
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries for non-critical errors
    return res.status(200).json({ error: 'Webhook processed with errors' });
  }
}

// Handle order created event
async function handleOrderCreated(event) {
  try {
    const orderData = event.data;
    const licenseKey = orderData?.attributes?.first_order_item?.license_key;
    const customerEmail = orderData?.attributes?.user_email;
    const orderId = orderData?.id;

    console.log('Order created:', {
      orderId,
      customerEmail,
      hasLicenseKey: !!licenseKey
    });

    // Here you could:
    // - Store license key in database
    // - Send welcome email
    // - Update user status
    // - Log the order

    // For now, just log it
    if (licenseKey) {
      console.log('License key generated:', licenseKey);
    }

  } catch (error) {
    console.error('Error handling order_created:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(event) {
  try {
    const subscriptionData = event.data;
    const customerEmail = subscriptionData?.attributes?.user_email;
    const subscriptionId = subscriptionData?.id;

    console.log('Subscription created:', {
      subscriptionId,
      customerEmail
    });

    // Update user subscription status
    // Could store in database or update user account

  } catch (error) {
    console.error('Error handling subscription_created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(event) {
  try {
    const subscriptionData = event.data;
    console.log('Subscription updated:', subscriptionData?.id);
    // Update subscription details
  } catch (error) {
    console.error('Error handling subscription_updated:', error);
  }
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(event) {
  try {
    const subscriptionData = event.data;
    const customerEmail = subscriptionData?.attributes?.user_email;
    
    console.log('Subscription cancelled:', {
      subscriptionId: subscriptionData?.id,
      customerEmail
    });

    // Revoke access or mark subscription as inactive
    // Could update database or notify user

  } catch (error) {
    console.error('Error handling subscription_cancelled:', error);
  }
}

// Handle subscription payment success
async function handleSubscriptionPaymentSuccess(event) {
  try {
    const subscriptionData = event.data;
    console.log('Subscription payment succeeded:', subscriptionData?.id);
    // Ensure user has active access
  } catch (error) {
    console.error('Error handling subscription_payment_success:', error);
  }
}

// Handle subscription payment failed
async function handleSubscriptionPaymentFailed(event) {
  try {
    const subscriptionData = event.data;
    console.log('Subscription payment failed:', subscriptionData?.id);
    // Notify user or handle failed payment
  } catch (error) {
    console.error('Error handling subscription_payment_failed:', error);
  }
}

