/**
 * SEO Routes Unit Tests
 *
 * Tests for robots.txt and sitemap.xml dynamic routes to ensure
 * they are correctly configured before deployment.
 *
 * Run with: pnpm test src/routes/seo.test.ts
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock environment variables
vi.mock('$env/dynamic/private', () => ({
	env: {
		NODE_ENV: 'test'
	}
}));

describe('robots.txt', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('should return valid robots.txt content', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('text/plain');

		const content = await response.text();

		// Check essential directives are present
		expect(content).toContain('User-agent: *');
		expect(content).toContain('Allow: /');
		expect(content).toContain('Sitemap: https://trykaiwa.com/sitemap.xml');
	});

	it('should block private areas', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();
		const content = await response.text();

		// Verify private areas are disallowed
		expect(content).toContain('Disallow: /admin');
		expect(content).toContain('Disallow: /api/');
		expect(content).toContain('Disallow: /auth/');
		expect(content).toContain('Disallow: /dev/');
		expect(content).toContain('Disallow: /profile');
		expect(content).toContain('Disallow: /dashboard');
	});

	it('should allow public pages', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();
		const content = await response.text();

		// Verify public pages are allowed
		expect(content).toContain('Allow: /privacy');
		expect(content).toContain('Allow: /terms');
		expect(content).toContain('Allow: /docs');
		expect(content).toContain('Allow: /blog');
		expect(content).toContain('Allow: /about');
		expect(content).toContain('Allow: /pricing');
	});

	it('should allow search engine bots', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();
		const content = await response.text();

		// Verify major search engines are allowed
		expect(content).toContain('User-agent: Googlebot');
		expect(content).toContain('User-agent: Bingbot');
		expect(content).toContain('User-agent: DuckDuckBot');
	});

	it('should allow AI search bots for visibility', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();
		const content = await response.text();

		// Verify AI search bots are allowed (these power ChatGPT Search, Perplexity, etc.)
		expect(content).toContain('User-agent: OAI-SearchBot');
		expect(content).toContain('User-agent: ChatGPT-User');
		expect(content).toContain('User-agent: PerplexityBot');
	});

	it('should block AI training bots', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();
		const content = await response.text();

		// Verify AI training bots are blocked
		expect(content).toMatch(/User-agent: GPTBot\s*\nDisallow: \//);
		expect(content).toMatch(/User-agent: CCBot\s*\nDisallow: \//);
		expect(content).toMatch(/User-agent: anthropic-ai\s*\nDisallow: \//);
		expect(content).toMatch(/User-agent: Google-Extended\s*\nDisallow: \//);
	});

	it('should have proper caching headers', async () => {
		const { GET } = await import('./robots.txt/+server');
		const response = await GET();

		// Should cache for 24 hours
		expect(response.headers.get('Cache-Control')).toBe('max-age=86400');
	});
});

describe('sitemap.xml', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('should return valid XML sitemap', { timeout: 10000 }, async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('application/xml');

		const content = await response.text();

		// Check XML structure
		expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
		expect(content).toContain('</urlset>');
	});

	it('should include core pages', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);
		const content = await response.text();

		// Check core pages are included
		expect(content).toContain('<loc>https://trykaiwa.com/</loc>');
		expect(content).toContain('<loc>https://trykaiwa.com/pricing</loc>');
		expect(content).toContain('<loc>https://trykaiwa.com/about</loc>');
		expect(content).toContain('<loc>https://trykaiwa.com/blog</loc>');
		expect(content).toContain('<loc>https://trykaiwa.com/docs</loc>');
	});

	it('should include language conversation pages', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);
		const content = await response.text();

		// Check language pages are included
		expect(content).toContain('lang=en');
		expect(content).toContain('lang=es');
		expect(content).toContain('lang=fr');
		expect(content).toContain('lang=ja');
		expect(content).toContain('lang=ko');
		expect(content).toContain('lang=zh');
	});

	it('should have valid priority values', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);
		const content = await response.text();

		// Extract all priority values and check they are valid (0.0 to 1.0)
		const priorityMatches = content.match(/<priority>([\d.]+)<\/priority>/g) || [];
		expect(priorityMatches.length).toBeGreaterThan(0);

		for (const match of priorityMatches) {
			const value = parseFloat(match.replace(/<\/?priority>/g, ''));
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
		}
	});

	it('should have valid changefreq values', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);
		const content = await response.text();

		const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
		const freqMatches = content.match(/<changefreq>(\w+)<\/changefreq>/g) || [];
		expect(freqMatches.length).toBeGreaterThan(0);

		for (const match of freqMatches) {
			const freq = match.replace(/<\/?changefreq>/g, '');
			expect(validFrequencies).toContain(freq);
		}
	});

	it('should have valid lastmod dates', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);
		const content = await response.text();

		// Extract all lastmod values and check they are valid dates (YYYY-MM-DD format)
		const dateMatches = content.match(/<lastmod>([\d-]+)<\/lastmod>/g) || [];
		expect(dateMatches.length).toBeGreaterThan(0);

		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		for (const match of dateMatches) {
			const date = match.replace(/<\/?lastmod>/g, '');
			expect(date).toMatch(dateRegex);
		}
	});

	it('should have proper caching headers', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);

		// Should cache for 1 hour
		expect(response.headers.get('Cache-Control')).toBe('max-age=3600');
	});

	it('should not include private pages', async () => {
		const { GET } = await import('./sitemap.xml/+server');
		const mockRequest = {} as Parameters<typeof GET>[0];
		const response = await GET(mockRequest);
		const content = await response.text();

		// Verify private pages are NOT in sitemap
		expect(content).not.toContain('/admin');
		expect(content).not.toContain('/api/');
		expect(content).not.toContain('/auth/');
		expect(content).not.toContain('/dev/');
		expect(content).not.toContain('/profile');
		expect(content).not.toContain('/dashboard');
	});
});
