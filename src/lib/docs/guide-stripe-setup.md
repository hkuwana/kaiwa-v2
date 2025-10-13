# Stripe Test Price IDs Setup Guide

This guide will help you create the necessary Stripe test price IDs for your premium tier and ensure all price IDs are properly configured for development testing.

## Current Status

✅ **Plus Tier Price IDs** - Already configured:

- Monthly: `price_1QkXgaJdpLyF8Hr4VNiD2JZp` ($15.00/month)
- Annual: `price_1R14ScJdpLyF8Hr465lm9MA8` ($144.00/year)

❌ **Premium Tier Price IDs** - Need to be created:

- Monthly: $25.00/month
- Annual: $240.00/year (20% discount)

## Step 1: Create Premium Tier Products in Stripe Dashboard

1. **Login to Stripe Dashboard** (Test Mode)
   - Go to https://dashboard.stripe.com/test
   - Ensure you're in **Test Mode** (toggle in top-left)

2. **Create Premium Monthly Product**
   - Navigate to **Products** → **Add Product**
   - **Name**: `Kaiwa Premium Monthly`
   - **Description**: `Premium tier for power users - 600 minutes/month`
   - **Pricing Model**: `Standard pricing`
   - **Price**: `$25.00`
   - **Billing Period**: `Monthly`
   - **Currency**: `USD`
   - Click **Add Product**
   - **Copy the Price ID** (starts with `price_`)

3. **Create Premium Annual Product**
   - Navigate to **Products** → **Add Product**
   - **Name**: `Kaiwa Premium Annual`
   - **Description**: `Premium tier for power users - 600 minutes/month (Annual)`
   - **Pricing Model**: `Standard pricing`
   - **Price**: `$240.00`
   - **Billing Period**: `Yearly`
   - **Currency**: `USD`
   - Click **Add Product**
   - **Copy the Price ID** (starts with `price_`)

## Step 2: Update Environment Variables

Add the new Premium price IDs to your environment files:

### `.env.development`

```bash
# Premium tier price IDs (test)
STRIPE_PREMIUM_MONTHLY_DEV_PRICE_ID='price_YOUR_PREMIUM_MONTHLY_ID_HERE'
STRIPE_PREMIUM_ANNUAL_DEV_PRICE_ID='price_YOUR_PREMIUM_ANNUAL_ID_HERE'
```

### `.env` (for production, when ready)

```bash
# Premium tier price IDs (production)
STRIPE_PREMIUM_MONTHLY_PRICE_ID='price_YOUR_PROD_PREMIUM_MONTHLY_ID_HERE'
STRIPE_PREMIUM_ANNUAL_PRICE_ID='price_YOUR_PROD_PREMIUM_ANNUAL_ID_HERE'
```

## Step 3: Configure Webhook Endpoint

Ensure your webhook endpoint is properly configured:

1. **Go to Webhooks** in Stripe Dashboard
2. **Add Endpoint** or edit existing one:
   - **URL**: `https://your-dev-domain.com/api/stripe/webhook`
   - **Events**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. **Copy the Webhook Secret** to your `.env.development`:
   ```bash
   STRIPE_WEBHOOK_SECRET='whsec_your_webhook_secret_here'
   ```

## Step 4: Verify Configuration

After updating the price IDs, restart your development server and test:

1. **Test Environment Info**:

   ```bash
   pnpm dev
   # Visit: http://localhost:5173/dev-payment
   ```

2. **Check Configuration**:
   The dev-payment page should show your new Premium price IDs in the Environment Information section.

## Step 5: Test Premium Subscriptions

1. **Navigate to dev-payment page**
2. **Test Premium Monthly checkout**
3. **Test Premium Annual checkout**
4. **Use Stripe test card**: `4242 4242 4242 4242`

## Stripe Test Cards for Different Scenarios

- **Successful payment**: `4242 4242 4242 4242`
- **Declined card**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Expired card**: `4000 0000 0000 0069`
- **Processing error**: `4000 0000 0000 0119`

## Environment Configuration Summary

Your final environment should have:

```bash
# Development Mode Control
STRIPE_DEV_MODE='true'  # In .env.development
STRIPE_DEV_MODE='false' # In .env (production)

# Stripe Keys
STRIPE_SECRET_KEY='sk_test_...' # Test key for dev
PUBLIC_STRIPE_KEY='pk_test_...' # Test publishable key for dev
STRIPE_WEBHOOK_SECRET='whsec_...' # Webhook secret

# Plus Tier (already configured)
STRIPE_PLUS_MONTHLY_PRICE_ID='price_1QkXgaJdpLyF8Hr4VNiD2JZp'
STRIPE_PLUS_ANNUAL_PRICE_ID='price_1R14ScJdpLyF8Hr465lm9MA8'

# Premium Tier (to be added)
STRIPE_PREMIUM_MONTHLY_DEV_PRICE_ID='price_YOUR_PREMIUM_MONTHLY_ID'
STRIPE_PREMIUM_ANNUAL_DEV_PRICE_ID='price_YOUR_PREMIUM_ANNUAL_ID'
```

## Troubleshooting

### Common Issues:

1. **Invalid Price ID Error**:
   - Verify the price ID is correct
   - Ensure you're using test mode price IDs in development

2. **Webhook Not Receiving Events**:
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Check Stripe webhook logs for errors

3. **STRIPE_DEV_MODE Not Working**:
   - Restart development server after changing environment variables
   - Check that the environment variable is set correctly

### Verification Commands:

Test your configuration with these API calls:

```bash
# Check if price exists (replace with your price ID)
curl https://api.stripe.com/v1/prices/price_YOUR_PREMIUM_MONTHLY_ID \
  -u sk_test_your_secret_key:
```

## Next Steps

After completing this setup:

1. ✅ Premium tier price IDs created and configured
2. ⏳ Test all subscription flows in dev-payment page
3. ⏳ Verify webhook events are processed correctly
4. ⏳ Test subscription management operations
5. ⏳ Set up production price IDs when ready to deploy

---

💡 **Pro Tip**: Always test subscription scenarios in the Stripe Dashboard **Test Mode** before switching to production. Use the webhook logs to debug any issues with event processing.
