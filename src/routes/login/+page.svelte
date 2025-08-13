<!-- 🔐 Login Page - Simple Google OAuth -->
<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<!-- Page-specific SEO -->
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />
	<meta name="robots" content={data.seo.robots} />

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

<div class="flex min-h-screen items-center justify-center bg-base-100 p-6">
	<div class="w-full max-w-md">
		<!-- Logo/Header -->
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-primary">Kaiwa</h1>
			<p class="opacity-70">Practice speaking with AI</p>
		</div>

		<!-- Login Card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-6 text-center">
					<h2 class="mb-2 card-title justify-center text-2xl">Welcome!</h2>
					<p class="opacity-70">
						Sign in to save your conversation progress and continue learning.
					</p>
				</div>

				{#if data.isGoogleOAuthEnabled}
					<!-- Google Sign In Button -->
					<a href="/login/google" class="btn w-full btn-outline">
						<svg class="mr-3 h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</a>
				{:else}
					<!-- OAuth Disabled Message -->
					<div class="alert alert-warning">
						<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
							></path>
						</svg>
						<div>
							<p class="text-sm">
								Google OAuth is not configured. Please set up your Google credentials to enable
								authentication.
							</p>
						</div>
					</div>
				{/if}

				<!-- Divider -->
				<div class="divider">or</div>

				<!-- Continue as Guest -->
				<a href="/" class="btn w-full btn-ghost"> Continue as Guest </a>

				<p class="mt-4 text-center text-xs opacity-50">
					As a guest, your conversations won't be saved between sessions.
				</p>
			</div>
		</div>
	</div>
</div>
