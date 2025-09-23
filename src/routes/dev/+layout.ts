// Disable prerendering for all dev routes to prevent them from affecting build performance
export const prerender = false;

// Disable SSR to ensure dev routes are purely client-side and don't slow down the server
export const ssr = false;
