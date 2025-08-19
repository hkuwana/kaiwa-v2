<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Get user data from page data
	const user = $page.data.user;

	function startConversation() {
		goto('/conversation');
	}
</script>

<svelte:head>
	<title>Kaiwa - Language Learning Platform</title>
	<meta name="description" content="Practice conversation with AI tutor" />
</svelte:head>

<div class="home-container">
	<header class="hero">
		<h1>🎯 Kaiwa</h1>
		<p class="subtitle">Master languages through real-time AI conversations</p>

		{#if user}
			<p class="welcome">Welcome back, {user.displayName || 'User'}!</p>
		{:else}
			<p class="guest-info">Guest mode available - try it out!</p>
		{/if}
	</header>

	<main class="main-content">
		<div class="features">
			<div class="feature-card">
				<h3>🚀 3-Day MVP Architecture</h3>
				<p>Clean, simple, and maintainable codebase with three clear layers:</p>
				<ul>
					<li><strong>Services:</strong> Business logic (WebRTC, Audio, Conversation)</li>
					<li><strong>Stores:</strong> State management with Svelte 5 runes</li>
					<li><strong>Components:</strong> UI that displays data and calls actions</li>
				</ul>
			</div>

			<div class="feature-card">
				<h3>🎤 Real-time Audio</h3>
				<p>Practice speaking with instant AI responses using WebRTC technology.</p>
			</div>

			<div class="feature-card">
				<h3>🌍 Multiple Languages</h3>
				<p>Learn English, Japanese, Spanish, German, and more with native-like pronunciation.</p>
			</div>
		</div>

		<div class="cta-section">
			<button on:click={startConversation} class="cta-button"> 🎯 Start Learning Now </button>
			<p class="cta-subtitle">Experience the new simplified architecture</p>
		</div>

		<div class="architecture-info">
			<h3>🏗️ Architecture Benefits</h3>
			<div class="benefits">
				<div class="benefit">
					<h4>🧠 Simple Mental Model</h4>
					<p>Three clear layers: Services → Stores → Components</p>
				</div>
				<div class="benefit">
					<h4>🔧 Easy to Change</h4>
					<p>Modify one layer without breaking others</p>
				</div>
				<div class="benefit">
					<h4>🐛 Easy to Debug</h4>
					<p>Clear data flow and separation of concerns</p>
				</div>
				<div class="benefit">
					<h4>⚡ Fast Development</h4>
					<p>No complex event buses or orchestrators</p>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	.home-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.hero {
		text-align: center;
		padding: 4rem 2rem 2rem;
	}

	.hero h1 {
		font-size: 4rem;
		font-weight: bold;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.subtitle {
		font-size: 1.5rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.welcome,
	.guest-info {
		font-size: 1.2rem;
		padding: 1rem 2rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		display: inline-block;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.1);
		padding: 2rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.feature-card h3 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: #fbbf24;
	}

	.feature-card ul {
		list-style: none;
		padding: 0;
		margin-top: 1rem;
	}

	.feature-card li {
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.cta-section {
		text-align: center;
		margin: 3rem 0;
	}

	.cta-button {
		background: #fbbf24;
		color: #1f2937;
		padding: 1rem 2rem;
		font-size: 1.2rem;
		font-weight: bold;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.cta-button:hover {
		background: #f59e0b;
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.cta-subtitle {
		margin-top: 1rem;
		opacity: 0.8;
		font-size: 1rem;
	}

	.architecture-info {
		background: rgba(255, 255, 255, 0.1);
		padding: 2rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.architecture-info h3 {
		text-align: center;
		font-size: 2rem;
		margin-bottom: 2rem;
		color: #fbbf24;
	}

	.benefits {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.benefit {
		text-align: center;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.benefit h4 {
		color: #fbbf24;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
	}

	.benefit p {
		font-size: 0.9rem;
		opacity: 0.9;
		line-height: 1.4;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 3rem;
		}

		.features {
			grid-template-columns: 1fr;
		}

		.benefits {
			grid-template-columns: 1fr;
		}
	}
</style>
