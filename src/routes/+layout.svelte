<script lang="ts">
	import '../app.css';
	import { favicon, appleTouchIcon } from '$lib/assets';
	import { page } from '$app/state';
	import { RealtimeService } from '$lib/services/realtime.service';
	import { ConversationStore } from '$lib/stores/conversation.store.svelte';
	import { setContext, onMount, onDestroy } from 'svelte';

	const realtimeService = new RealtimeService();
	const conversationStore = new ConversationStore();

	let { children, data } = $props();

	// Use Svelte's context to make this single instance available to all child components.
	setContext('conversation', conversationStore);
	setContext('realtime', realtimeService);

	onMount(() => {
		console.log('🔄 ConversationStore mounted');
		return () => {
			console.log('🔄 ConversationStore unmounting, cleaning up...');
			conversationStore.reset();
			realtimeService.disconnect();
		};
	});

	onDestroy(() => {
		console.log('🔄 ConversationStore destroyed');
		conversationStore.reset();
		realtimeService.disconnect();
	});

	// Get current page data for dynamic SEO
	const currentPage = $derived(page);
	const seo = $derived(data.seo);
</script>

<svelte:head>
	<!-- Favicon -->
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={appleTouchIcon} />

	<!-- PWA Manifest -->
	<link rel="manifest" href="/manifest.json" />

	<!-- Basic Meta Tags -->
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="keywords" content={seo.keywords} />
	<meta name="author" content={seo.author} />
	<meta name="robots" content={seo.robots} />

	<!-- Canonical URL -->
	<link rel="canonical" href={seo.canonical} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={seo.ogType} />
	<meta property="og:url" content={seo.url} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:site_name" content="Kaiwa" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:image" content="https://kaiwa.app/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta name="twitter:card" content={seo.twitterCard} />
	<meta name="twitter:url" content={seo.url} />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:site" content="@kaiwa_app" />
	<meta name="twitter:image" content="https://kaiwa.app/twitter-image.png" />

	<!-- Additional Meta Tags -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content="#3B82F6" />
	<meta name="msapplication-TileColor" content="#3B82F6" />

	<!-- PWA Meta Tags -->
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Kaiwa" />

	<!-- Language and Region -->
	<meta name="content-language" content="en" />
	<meta name="geo.region" content="US" />

	<!-- Security -->
	<meta name="X-Content-Type-Options" content="nosniff" />
	<meta name="X-Frame-Options" content="DENY" />
	<meta name="X-XSS-Protection" content="1; mode=block" />

	<!-- Preconnect to external domains for performance -->
	<link rel="preconnect" href="https://us.i.posthog.com" />
	<link rel="dns-prefetch" href="https://us.i.posthog.com" />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "Kaiwa",
			"description": "AI-powered language learning through natural conversation",
			"url": "https://kaiwa.app",
			"applicationCategory": "EducationalApplication",
			"operatingSystem": "Web Browser",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD"
			},
			"creator": {
				"@type": "Organization",
				"name": "Kaiwa Team"
			},
			"featureList": [
				"AI Language Tutor",
				"Natural Conversation Practice",
				"Multiple Languages",
				"Real-time Speech Recognition",
				"Personalized Learning"
			]
		}
	</script>
</svelte:head>

{@render children?.()}
