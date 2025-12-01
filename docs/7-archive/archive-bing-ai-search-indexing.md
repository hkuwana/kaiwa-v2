# Google, Bing, ChatGPT & Perplexity Search Indexing

This guide covers how to get Kaiwa properly indexed by Google, Bing (which powers ChatGPT Search), and Perplexity AI.

## Quick Start Checklist

After deploying, complete these steps in order:

### Google (Primary)

1. [ ] **Verify Google Search Console** - https://search.google.com/search-console
2. [ ] **Submit sitemap to Google** - Add `https://trykaiwa.com/sitemap.xml`
3. [ ] **Test structured data** - Use Rich Results Test tool
4. [ ] **Check Core Web Vitals** - Review performance metrics

### Bing & AI Search

5. [ ] **Verify Bing Webmaster Tools** - https://www.bing.com/webmasters
6. [ ] **Submit sitemap to Bing** - https://trykaiwa.com/sitemap.xml
7. [ ] **Test IndexNow** - Run `POST /api/seo/indexnow` with `{"siteUpdate": true}`
8. [ ] **Verify robots.txt** - Confirm bots are allowed

---

## Google Search Console Setup

### 1. Create Account & Verify Site

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with Google account
3. Click **Add Property**
4. Choose **URL prefix** method: `https://trykaiwa.com`
5. Verify ownership via one of these methods:
   - **Recommended**: HTML file upload (add to `/static/`)
   - Alternative: DNS TXT record
   - Alternative: Meta tag in `<head>` (already set up in `app.html`)
   - Alternative: Google Analytics (if using GA4)

### 2. Submit Sitemap

After verification:

1. Go to **Sitemaps** in the left menu
2. Enter: `sitemap.xml`
3. Click **Submit**
4. Google will crawl and report status within 24-48 hours

### 3. Monitor Performance

Key reports to check weekly:

- **Performance**: Clicks, impressions, CTR, position
- **Coverage**: Indexed pages, errors, warnings
- **Core Web Vitals**: LCP, FID, CLS scores
- **Mobile Usability**: Mobile-friendly issues

### 4. Request Indexing

For new or updated pages:

1. Go to **URL Inspection**
2. Enter the URL (e.g., `https://trykaiwa.com/blog/new-post`)
3. Click **Request Indexing**
4. Google will prioritize crawling this URL

### 5. Rich Results Testing

Validate your structured data:

1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter your URL
3. Check for:
   - FAQ schema (FAQ pages)
   - Article schema (blog posts)
   - Course schema (learning paths)
   - Organization schema (homepage)

---

## How AI Search Engines Work

### ChatGPT Search

- Uses **Bing's index** as its primary data source
- Crawls via `OAI-SearchBot` and `ChatGPT-User` bots
- If your site isn't in Bing, it won't appear in ChatGPT Search

### Perplexity AI

- Has its own crawler: `PerplexityBot`
- Updates its index daily
- Prioritizes authoritative, well-structured content

### Key Insight

**Optimizing for Bing = Optimizing for ChatGPT Search**

---

## Bing Webmaster Tools Setup

### 1. Create Account & Verify Site

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sign in with Microsoft account
3. Add site: `https://trykaiwa.com`
4. Choose verification method:
   - **Recommended**: XML file upload (add to `/static/`)
   - Alternative: DNS TXT record
   - Alternative: Meta tag in `<head>`

### 2. Submit Sitemap

After verification:

1. Go to **Sitemaps** in the left menu
2. Click **Submit sitemap**
3. Enter: `https://trykaiwa.com/sitemap.xml`
4. Click **Submit**

### 3. Enable IndexNow

IndexNow instantly notifies Bing about content changes:

1. Key file already exists: `/static/f8e7d6c5b4a3f2e1d0c9b8a7.txt`
2. Verify it's accessible: `https://trykaiwa.com/f8e7d6c5b4a3f2e1d0c9b8a7.txt`
3. In Bing Webmaster Tools, go to **IndexNow** section
4. Verify your key is recognized

### 4. Request URL Indexing

For faster indexing of specific pages:

1. Go to **URL Submission** in Bing Webmaster Tools
2. Paste URLs you want indexed immediately
3. Click **Submit** (up to 10,000 URLs/day)

---

## robots.txt Configuration

Our robots.txt (`/static/robots.txt`) is configured to:

### Allow (Search Bots)

```
User-agent: Bingbot          # Bing search
User-agent: OAI-SearchBot    # ChatGPT Search
User-agent: ChatGPT-User     # ChatGPT real-time queries
User-agent: PerplexityBot    # Perplexity AI
User-agent: BingPreview      # Bing rich snippets
```

### Block (AI Training Bots)

```
User-agent: GPTBot           # OpenAI training (NOT search)
User-agent: CCBot            # Common Crawl
User-agent: anthropic-ai     # Anthropic training
User-agent: Google-Extended  # Google AI training
```

**Important**: `GPTBot` is for AI training, NOT search. Blocking it doesn't affect ChatGPT Search visibility.

---

## IndexNow Integration

### What is IndexNow?

A protocol that instantly notifies search engines about content changes. Reduces indexing time from days to minutes.

### Supported Search Engines

- Microsoft Bing
- Yandex
- Seznam.cz
- Naver

### API Usage

**Notify about a single URL:**

```bash
curl -X POST https://trykaiwa.com/api/seo/indexnow \
  -H "Content-Type: application/json" \
  -d '{"url": "https://trykaiwa.com/blog/new-post"}'
```

**Notify about multiple URLs:**

```bash
curl -X POST https://trykaiwa.com/api/seo/indexnow \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://trykaiwa.com/blog/post-1", "https://trykaiwa.com/blog/post-2"]}'
```

**Notify about all important pages (after deployment):**

```bash
curl -X POST https://trykaiwa.com/api/seo/indexnow \
  -H "Content-Type: application/json" \
  -d '{"siteUpdate": true}'
```

### Programmatic Usage

```typescript
import { notifyIndexNow, notifyIndexNowBatch } from '$lib/server/services/indexnow.service';

// After publishing a blog post
await notifyIndexNow('https://trykaiwa.com/blog/new-post');

// After bulk content update
await notifyIndexNowBatch([
	'https://trykaiwa.com/blog/post-1',
	'https://trykaiwa.com/blog/post-2',
	'https://trykaiwa.com/docs/new-guide'
]);
```

---

## Content Optimization for AI Search

### 1. Structured Content

- Use clear H2/H3 headers
- Include bullet points and numbered lists
- Add FAQ sections with schema markup

### 2. Conversational Tone

- Write naturally, as if explaining to a person
- Answer questions directly in the first paragraph
- Use semantic keywords (related terms)

### 3. Freshness

- Update content regularly
- Use current dates in lastmod
- Remove outdated information

### 4. Multimedia

- Include relevant images with alt text
- Add charts/diagrams where helpful
- Consider video content (YouTube)

### 5. Schema Markup

Our JSON-LD implementation (`/src/lib/seo/jsonld.ts`) includes:

- WebSite schema
- Article schema for blog posts
- Course schema for learning paths
- FAQ schema where applicable

---

## Monitoring & Verification

### Check Bot Access

In your server logs, look for:

```
OAI-SearchBot    # ChatGPT Search is crawling
PerplexityBot    # Perplexity is crawling
Bingbot          # Bing is crawling
```

### Bing Webmaster Tools Reports

- **Search Performance**: Impressions and clicks from Bing
- **URL Inspection**: Check if specific URLs are indexed
- **Crawl Errors**: Find and fix crawling issues

### Test in ChatGPT

Ask ChatGPT with web search enabled:

- "What is Kaiwa language learning app?"
- "Kaiwa AI conversation practice"

If your site doesn't appear, check:

1. Is the page in Bing's index?
2. Is `OAI-SearchBot` allowed in robots.txt?
3. Does the content directly answer the query?

---

## Troubleshooting

### Page Not Appearing in ChatGPT Search

1. Check Bing index: Search `site:trykaiwa.com` on Bing
2. Submit URL via Bing Webmaster Tools
3. Trigger IndexNow: `POST /api/seo/indexnow`
4. Wait 24-48 hours for propagation

### IndexNow Not Working

1. Verify key file is accessible: `https://trykaiwa.com/f8e7d6c5b4a3f2e1d0c9b8a7.txt`
2. Check key matches in service and file
3. Ensure URLs start with `https://trykaiwa.com`

### Bing Not Crawling

1. Check robots.txt allows Bingbot
2. Verify no server-side blocking
3. Check for crawl errors in Webmaster Tools

---

## Resources

### Google

- [Google Search Console](https://search.google.com/search-console)
- [Google Search Central Docs](https://developers.google.com/search/docs)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Sitemap Best Practices](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

### Bing & AI Search

- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [IndexNow Documentation](https://www.indexnow.org/documentation)
- [OpenAI Crawlers](https://platform.openai.com/docs/bots)
- [Perplexity AI Guidelines](https://docs.perplexity.ai)

### Schema & Structured Data

- [Schema.org](https://schema.org/)
- [FAQ Schema](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- [Article Schema](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Course Schema](https://developers.google.com/search/docs/appearance/structured-data/course)
