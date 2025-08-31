# Stripe Integration Setup Guide

This guide explains how to set up Stripe payment integration for Kaiwa's subscription system.

## Overview

The Stripe integration handles:
- Subscription creation and management
- Payment processing
- Webhook handling for subscription lifecycle events
- Customer portal access
- Tier upgrades and downgrades

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Stripe CLI**: Install for webhook testing (optional but recommended)
3. **Environment Variables**: Configure your Stripe keys and price IDs

## Environment Configuration

Copy `env.example` to `.env` and configure the following variables:

### Required Variables

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs for Plus Tier
STRIPE_PLUS_MONTHLY_PRICE_ID=price_plus_monthly_actual_id
STRIPE_PLUS_ANNUAL_PRICE_ID=price_plus_annual_actual_id

# Stripe Price IDs for Premium Tier
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_premium_monthly_actual_id
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_premium_annual_actual_id
```

### Optional Variables

```bash
# Legacy Price IDs (for backward compatibility)
STRIPE_PRO_PRICE_ID=price_pro_monthly_actual_id

# Public Price IDs (if needed for client-side)
PUBLIC_STRIPE_PRICE_ID=price_plus_monthly_actual_id
PUBLIC_STRIPE_PRICE_ID_DEV=price_plus_annual_actual_id
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe Dashboard:

1. **Go to Products** → **Add Product**
2. **Create Plus Tier Product**:
   - Name: "Kaiwa Plus"
   - Description: "For serious language learners"
   - Create two prices:
     - Monthly: $15.00/month
     - Annual: $144.00/year (20% discount)

3. **Create Premium Tier Product**:
   - Name: "Kaiwa Premium"
   - Description: "For power users who want more practice time"
   - Create two prices:
     - Monthly: $25.00/month
     - Annual: $240.00/year (20% discount)

### 2. Configure Webhooks

1. **Go to Developers** → **Webhooks**
2. **Add Endpoint**:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`

3. **Copy the webhook secret** to your `.env` file

### 3. Get Price IDs

1. **Go to Products** → Select your product
2. **Copy the Price ID** for each pricing option
3. **Update your `.env` file** with these IDs

## Testing

### Development Testing

Use the `/dev-payment` route for testing:

1. **Navigate to** `/dev-payment` (only available in development)
2. **Test Stripe Checkout** with different tiers and billing cycles
3. **Monitor test results** in the UI
4. **Check Stripe Dashboard** for test events

### Test Card Numbers

Use these Stripe test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Webhook Testing

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## Architecture

### Services

- **`stripeService.ts`**: Main Stripe integration service
- **`paymentRepository.ts`**: Payment data management
- **`subscriptionRepository.ts`**: Subscription data management

### API Endpoints

- **`/api/stripe/checkout`**: Create checkout sessions
- **`/api/stripe/webhook`**: Handle Stripe webhooks
- **`/api/stripe/test-customer`**: Development testing endpoint

### Data Flow

1. **User clicks subscribe** → Pricing page calls checkout API
2. **Checkout API** → Creates Stripe checkout session
3. **User completes payment** → Stripe redirects to success URL
4. **Webhook received** → Updates subscription and user tier
5. **User tier updated** → Access to new features

## Troubleshooting

### Common Issues

1. **"Invalid price ID" error**:
   - Check that price IDs in `.env` match Stripe Dashboard
   - Ensure price IDs are active and not archived

2. **Webhook not receiving events**:
   - Verify webhook endpoint URL is correct
   - Check webhook secret in `.env`
   - Ensure webhook is active in Stripe Dashboard

3. **Subscription not updating**:
   - Check webhook logs in Stripe Dashboard
   - Verify webhook endpoint is accessible
   - Check server logs for errors

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=stripe:*
```

### Monitoring

- **Stripe Dashboard**: Monitor payments, subscriptions, and webhooks
- **Application Logs**: Check server logs for errors
- **PostHog**: Track subscription events and conversions

## Production Deployment

### Security Considerations

1. **Never expose secret keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Enable webhook signature verification**
4. **Use HTTPS** for all webhook endpoints

### Environment Variables

Ensure these are set in production:

```bash
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### Webhook Endpoint

Update your webhook endpoint URL in Stripe Dashboard to point to your production domain.

## Support

For issues with:

- **Stripe Integration**: Check this guide and Stripe documentation
- **Application Logic**: Review the service implementations
- **Database Issues**: Check migration files and schema

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
