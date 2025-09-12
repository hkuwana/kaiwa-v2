<script lang="ts">
	import '../app.css';
	import { favicon, appleTouchIcon } from '$lib/assets';
	import { ConversationStore } from '$lib/stores/conversation.store.svelte';
	import { setContext, onMount, onDestroy } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import { initializePostHog, trackPageView, posthog, track } from '$lib/analytics/posthog';

	const conversationStore = new ConversationStore();

	const { children, data } = $props();

	// Get conversation status to determine if we should hide navigation
	const status = $derived(conversationStore.status);
	const messages = $derived(conversationStore.messages);

	// Hide navigation when in active conversation states
	const shouldHideNavigation = $derived(
		(status === 'connected' || status === 'streaming') && messages.length > 0
	);

	// Use Svelte's context to make this single instance available to all child components.
	setContext('conversation', conversationStore);

	onMount(() => {
		initializePostHog();
		// Capture UTM params and shareId/ref for attribution
		try {
			const params = new URLSearchParams(window.location.search);
			const utm: Record<string, string> = {};
			['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
				const v = params.get(k);
				if (v) utm[k] = v;
			});
			const shareId = params.get('shareId') || params.get('ref');

			// Persist locally for future sessions
			const existing = localStorage.getItem('kaiwa_attribution');
			const payload = {
				utm,
				shareId: shareId || (existing ? JSON.parse(existing).shareId : null),
				ts: Date.now()
			};
			localStorage.setItem('kaiwa_attribution', JSON.stringify(payload));

			// Also persist shareId to cookie for cross-path navigation before signup
			if (payload.shareId) {
				document.cookie = `kaiwa_share_id=${encodeURIComponent(payload.shareId)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
			}

			// Register as PostHog super properties if available
			if (posthog) {
				posthog.register({ ...utm, share_id: payload.shareId });
				if (payload.shareId) {
					track('share_referred_visit', { share_id: payload.shareId });
				}
			}
		} catch (e) {
			console.warn('Attribution capture failed', e);
		}

		trackPageView();
		console.log('🔄 ConversationStore mounted');
		return () => {
			console.log('🔄 ConversationStore unmounting, cleaning up...');
			conversationStore.reset();
		};
	});

	onDestroy(() => {
		console.log('🔄 ConversationStore destroyed');
		conversationStore.reset();
	});

	// Get current page data for dynamic SEO
	const seo = $derived(data.seo);

	// Sync user data with userManager store - directly reactive
	const user = $derived(data.user);
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

{#if !shouldHideNavigation}
	<Navigation {user} />
{/if}

{@render children?.()}
