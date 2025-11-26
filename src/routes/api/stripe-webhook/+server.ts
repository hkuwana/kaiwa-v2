// Legacy Stripe webhook endpoint (https://trykaiwa.com/api/stripe-webhook)
// Reuse the main billing webhook handler to avoid 404s
export { POST } from '../billing/webhook/+server';
