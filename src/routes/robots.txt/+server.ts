/**
 * Dynamic robots.txt Generator
 *
 * Best practices implemented:
 * - Allows all major search engines (Google, Bing, etc.)
 * - Allows AI search bots (ChatGPT Search, Perplexity) for visibility
 * - Blocks AI training bots to prevent content scraping for model training
 * - Excludes private/admin areas from crawling
 * - Includes sitemap and RSS feed references
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/intro
 */

const SITE_URL = 'https://trykaiwa.com';

export const GET = async () => {
	const robots = `# robots.txt for Kaiwa
# ${SITE_URL}

# ============================================
# DEFAULT RULES - All Crawlers
# ============================================
User-agent: *
Allow: /

# Disallow private/admin areas
Disallow: /admin
Disallow: /api/
Disallow: /auth/
Disallow: /dev/
Disallow: /e2e/
Disallow: /test-*
Disallow: /profile
Disallow: /dashboard
Disallow: /user/
Disallow: /unsubscribe

# Allow important public pages explicitly
Allow: /privacy
Allow: /terms
Allow: /docs
Allow: /blog
Allow: /about
Allow: /pricing
Allow: /faq
Allow: /changelog
Allow: /philosophy
Allow: /scenarios
Allow: /research
Allow: /get-your-guide

# Crawl-delay for respectful crawling
Crawl-delay: 1

# ============================================
# SITEMAP & RSS FEEDS
# ============================================
Sitemap: ${SITE_URL}/sitemap.xml

# RSS Feed for blog syndication
# Feed URL: ${SITE_URL}/blog/rss.xml

# ============================================
# SEARCH ENGINE BOTS - ALLOW FOR INDEXING
# ============================================

# Google - Primary search engine
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Google Images
User-agent: Googlebot-Image
Allow: /

# Google Mobile
User-agent: Googlebot-Mobile
Allow: /

# Bing - Powers ChatGPT Search
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Bing Preview - For rich snippets
User-agent: BingPreview
Allow: /

# Yahoo/Slurp
User-agent: Slurp
Allow: /

# DuckDuckGo
User-agent: DuckDuckBot
Allow: /

# Yandex
User-agent: Yandex
Allow: /

# Baidu
User-agent: Baiduspider
Allow: /

# ============================================
# AI SEARCH BOTS - ALLOW FOR SEARCH VISIBILITY
# ============================================
# These bots power AI-assisted search features

# OpenAI SearchBot - Required for ChatGPT Search visibility
User-agent: OAI-SearchBot
Allow: /

# ChatGPT-User - Processes real-time user queries in ChatGPT
User-agent: ChatGPT-User
Allow: /

# Perplexity AI Bot - For Perplexity search indexing
User-agent: PerplexityBot
Allow: /

# You.com AI search
User-agent: YouBot
Allow: /

# ============================================
# AI TRAINING BOTS - BLOCK TO PREVENT TRAINING
# ============================================
# Note: Blocking these does NOT affect search visibility
# These bots collect data for AI model training only

# OpenAI GPTBot - AI training data collection
User-agent: GPTBot
Disallow: /

# Common Crawl - Used by many AI training datasets
User-agent: CCBot
Disallow: /

# Anthropic AI - AI training data collection
User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: ClaudeBot
Disallow: /

# Google AI training bots
User-agent: Google-Extended
Disallow: /

# Cohere AI training
User-agent: cohere-ai
Disallow: /

# Meta/Facebook AI training
User-agent: FacebookBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: Meta-ExternalFetcher
Disallow: /

# ByteDance/TikTok AI training
User-agent: Bytespider
Disallow: /

# Apple AI training
User-agent: Applebot-Extended
Disallow: /

# Amazon AI training
User-agent: Amazonbot
Disallow: /

# Other AI scrapers
User-agent: AI2Bot
Disallow: /

User-agent: Ai2Bot-Dolma
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: ImagesiftBot
Disallow: /

User-agent: Omgilibot
Disallow: /

User-agent: Omgili
Disallow: /

User-agent: Scrapy
Disallow: /
`;

	return new Response(robots, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'max-age=86400' // Cache for 24 hours
		}
	});
};
