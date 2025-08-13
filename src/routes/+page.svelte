<script lang="ts">
	import LanguageCard from '$lib/components/LanguageCard.svelte';
	import PricingModal from '$lib/components/PricingModal.svelte';
	import { languages } from '$lib/data/languages.js';

	// 🎯 Page data from server
	const { data } = $props();

	// 🎨 UI state
	let showPricingModal = $state(false);
	let pricingModalSource = $state<'limit_modal' | 'navbar' | 'settings' | 'onboarding'>('navbar');

	// 🎯 Handle language selection
	function selectLanguage(languageCode: string) {
		// Navigate to conversation page with selected language
		window.location.href = `/conversation?lang=${languageCode}&mode=traditional&voice=alloy`;
	}
</script>

<svelte:head>
	<!-- Page-specific SEO -->
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />

	<!-- Open Graph -->
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />
	<meta property="og:url" content={data.seo.canonical} />

	<!-- Twitter -->
	<meta name="twitter:title" content={data.seo.title} />
	<meta name="twitter:description" content={data.seo.description} />

	<!-- Canonical -->
	<link rel="canonical" href={data.seo.canonical} />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{JSON.stringify(data.seo.structuredData)}
	</script>
</svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Header -->
	<header class="navbar bg-base-200/50 backdrop-blur-sm">
		<div class="navbar-start">
			<!-- Mobile menu button -->
			<div class="dropdown">
				<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</div>
				<ul
					tabindex="0"
					class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a href="/">Home</a></li>
					{#if data.user}
						<li><a href="/conversation">Conversations</a></li>
						<li>
							<form action="/logout" method="post">
								<button type="submit" class="w-full text-left">Sign out</button>
							</form>
						</li>
					{:else}
						<li><a href="/login">Sign in</a></li>
					{/if}
				</ul>
			</div>
		</div>

		<div class="navbar-center">
			<h1 class="text-3xl font-bold text-primary">Kaiwa</h1>
		</div>

		<div class="navbar-end">
			{#if data.user}
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn avatar btn-circle btn-ghost">
						<div class="w-10 rounded-full">
							{#if data.user.avatarUrl}
								<img src={data.user.avatarUrl} alt="Profile" />
							{:else}
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-content"
								>
									{data.user.displayName?.[0] || 'U'}
								</div>
							{/if}
						</div>
					</div>
					<ul
						tabindex="0"
						class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
					>
						<li class="menu-title">
							<span class="text-sm opacity-70">{data.user.displayName || 'User'}</span>
						</li>
						<div class="divider my-1"></div>
						<li>
							<form action="/logout" method="post">
								<button type="submit" class="w-full text-left">Sign out</button>
							</form>
						</li>
					</ul>
				</div>
			{:else}
				<a href="/login" class="btn btn-sm btn-primary">Sign in</a>
			{/if}
		</div>
	</header>

	<!-- Main content -->
	<main class="container mx-auto px-4 py-8">
		<!-- Hero section -->
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-4xl font-bold">Choose a language to practice speaking</h2>
			<p class="mx-auto max-w-2xl text-lg opacity-70">
				Immerse yourself in natural conversation with AI. No complex setup, just pure language
				learning.
			</p>
		</div>

		<!-- Language selection grid -->
		<div
			class="mx-auto mb-12 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
		>
			{#each languages as language}
				<LanguageCard {language} onSelect={selectLanguage} />
			{/each}
		</div>

		<!-- Call to action -->
		<div class="text-center">
			<div class="mx-auto alert max-w-md alert-info">
				<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span>Select a language above to start practicing with AI</span>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="footer-center footer bg-base-200 p-10 text-base-content">
		<div>
			<p class="mb-2">Speak naturally • AI will respond • Keep practicing</p>
			<button
				class="btn btn-link btn-sm"
				onclick={() => {
					showPricingModal = true;
					pricingModalSource = 'navbar';
				}}
			>
				Upgrade for unlimited conversations
			</button>
		</div>
	</footer>

	<!-- Pricing Modal -->
	<PricingModal bind:isOpen={showPricingModal} currentTier="free" source={pricingModalSource} />
</div>
