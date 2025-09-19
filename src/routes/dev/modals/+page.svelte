<script lang="ts">
	import PricingModal from '$lib/components/PricingModal.svelte';
	import ScenarioOutcome from '$lib/components/ScenarioOutcome.svelte';
	import ScenarioProgress from '$lib/components/ScenarioProgress.svelte';
	import TierBadge from '$lib/components/TierBadge.svelte';
	import VoiceSelector from '$lib/components/VoiceSelector.svelte';

	import type { UsageStatus } from '$lib/server/tierService';
	import type {
		Scenario,
		ScenarioOutcome as ScenarioOutcomeType,
		ConversationState
	} from '$lib/types';
	import { RealtimeConversationStatus } from '$lib/types';

	// State for pricing modal
	let isPricingModalOpen = $state(false);
	let currentTier = $state('free');
	let modalSource = $state<'limit_modal' | 'navbar' | 'settings' | 'onboarding'>('navbar');

	// State for voice selector
	let selectedVoice = $state('alloy');

	// Mock data for components
	const mockUsageStatus: UsageStatus = {
		tier: {
			id: 'free',
			name: 'Free',
			description: 'Basic plan',
			monthlyConversations: 10,
			monthlySeconds: 1800,
			monthlyRealtimeSessions: 3,
			customizedPhrasesFrequency: 'weekly',
			conversationMemoryLevel: 'basic',
			ankiExportLimit: 50,
			dailyConversations: null,
			dailySeconds: null,
			dailyAnalyses: null,
			maxSessionLengthSeconds: 300,
			sessionBankingEnabled: false,
			maxBankedSeconds: 0,
			hasRealtimeAccess: true,
			hasAdvancedVoices: false,
			hasAnalytics: false,
			hasCustomPhrases: false,
			hasConversationMemory: false,
			hasAnkiExport: false,
			hasDeepAnalysis: false,
			monthlyPriceUsd: '0',
			annualPriceUsd: '0',
			stripeProductId: null,
			stripePriceIdMonthly: null,
			stripePriceIdAnnual: null,
			overagePricePerMinuteInCents: 0,
			conversationTimeoutSeconds: 300,
			warningThresholdSeconds: 240,
			canExtend: false,
			maxExtensions: 0,
			extensionDurationSeconds: 0,
			feedbackSessionsPerMonth: '0',
			maxMemories: 10,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		usage: {
			createdAt: new Date(),
			userId: 'test-user',
			updatedAt: new Date(),
			period: '2024-01',
			conversationsUsed: 7,
			secondsUsed: 1200,
			realtimeSessionsUsed: 2,
			bankedSeconds: 0,
			bankedSecondsUsed: 0,
			ankiExportsUsed: 0,
			sessionExtensionsUsed: 0,
			advancedVoiceSeconds: 0,
			analysesUsed: 0,
			completedSessions: 5,
			longestSessionSeconds: 900,
			averageSessionSeconds: 600,
			overageSeconds: 0,
			tierWhenUsed: 'free',
			lastConversationAt: new Date(),
			lastRealtimeAt: new Date(Date.now() - 86400000),
			firstActivityAt: new Date(Date.now() - 14 * 86400000)
		},
		canStartConversation: true,
		canUseRealtime: true,
		resetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
	};

	const mockScenario: Scenario = {
		id: 'test-scenario',
		title: 'Ordering Coffee in Tokyo',
		description: 'Practice ordering coffee in a bustling Tokyo cafe.',
		category: 'intermediate',
		difficulty: 'intermediate',
		instructions: 'Order a latte, ask about the Wi-Fi password, and find out what time they close.',
		context: 'You are in a busy coffee shop in Shibuya, Tokyo. The barista speaks limited English.',
		expectedOutcome:
			'Successfully order your drink, get connected to Wi-Fi, and know when to leave.',
		learningObjectives: ['注文', 'コーヒー', 'ラテ', 'WiFi', 'パスワード', '閉店時間'],
		comfortIndicators: {
			confidence: 3,
			engagement: 4,
			understanding: 3
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const mockScenarioOutcome: ScenarioOutcomeType = {
		scenarioId: mockScenario.id,
		vocabularyUsageScore: 0.85,
		grammarUsageScore: 0.78,
		goalCompletionScore: 0.92,
		pronunciationScore: 0.74,
		duration: 420, // 7 minutes
		completedAt: new Date()
	};

	const mockConversationState: ConversationState & {
		scenarioSession: {
			goalProgress: number;
			vocabularyProgress: number;
			grammarProgress: number;
			usedVocabulary: string[];
			hintsUsed: number;
			translationsUsed: number;
			exampleResponsesViewed: number;
		};
	} = {
		status: RealtimeConversationStatus.IDLE,
		messages: [],
		sessionId: 'demo-session',
		language: 'ja',
		voice: 'alloy',
		scenario: mockScenario,
		scenarioSession: {
			goalProgress: 0.65,
			vocabularyProgress: 0.73,
			grammarProgress: 0.58,
			usedVocabulary: ['注文', 'コーヒー', 'ラテ'],
			hintsUsed: 2,
			translationsUsed: 1,
			exampleResponsesViewed: 0
		}
	};

	// Component functions
	function openPricingModal(source: typeof modalSource, tier: string = 'free') {
		currentTier = tier;
		modalSource = source;
		isPricingModalOpen = true;
	}

	function handleVoiceChange(voice: string) {
		selectedVoice = voice;
		console.log('Voice selected:', voice);
	}

	function handleScenarioActions() {
		console.log('Scenario action triggered');
	}

	function handleScenarioHint(word: string) {
		console.log(`Scenario hint used: ${word}`);
	}

	function handleScenarioTranslation(word: string) {
		console.log(`Scenario translation used: ${word}`);
	}

	function handleScenarioExample() {
		console.log('Scenario example viewed');
	}
</script>

<svelte:head>
	<title>Component Showcase - Kaiwa Dev</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="mb-4 text-4xl font-bold">Component Showcase</h1>
		<p class="text-lg text-base-content/70">
			Interactive showcase of all modal and UI components in the Kaiwa application.
		</p>
	</div>

	<!-- Component Grid -->
	<div class="space-y-12">
		<!-- Pricing Modal Section -->
		<section id="pricing-modal" class="space-y-6">
			<div class="flex items-center space-x-4">
				<h2 class="text-2xl font-bold">💰 Pricing Modal</h2>
				<div class="badge badge-primary">Interactive</div>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title">Controls</h3>
						<p class="mb-4 text-sm text-base-content/70">
							Smart freemium pricing modal with usage tracking and Stripe integration.
						</p>
						<div class="space-y-3">
							<button
								class="btn btn-block btn-primary"
								onclick={() => openPricingModal('limit_modal', 'free')}
							>
								Open Limit Reached Modal
								<span class="badge badge-outline">Shows usage warnings</span>
							</button>
							<button
								class="btn btn-block btn-secondary"
								onclick={() => openPricingModal('navbar', 'plus')}
							>
								Open Navbar Modal
								<span class="badge badge-outline">Standard pricing</span>
							</button>
							<button
								class="btn btn-block btn-accent"
								onclick={() => openPricingModal('settings', 'free')}
							>
								Open Settings Modal
								<span class="badge badge-outline">Account context</span>
							</button>
						</div>
					</div>
				</div>

				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title">Features</h3>
						<div class="space-y-3 text-sm">
							<div>🏷️ <strong>Plans:</strong> Free, Plus ($9.99/mo), Premium ($19.99/mo)</div>
							<div>💳 <strong>Billing:</strong> Monthly/Yearly toggle with 17% yearly savings</div>
							<div>📊 <strong>Usage Tracking:</strong> Real-time usage indicators and warnings</div>
							<div>🔗 <strong>Integration:</strong> Stripe checkout with PostHog analytics</div>
							<div>📱 <strong>Responsive:</strong> Works on all device sizes</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Tier Badge Section -->
		<section id="tier-badge" class="space-y-6">
			<div class="flex items-center space-x-4">
				<h2 class="text-2xl font-bold">🏆 Tier Badge</h2>
				<div class="badge badge-info">Usage Display</div>
			</div>

			<div class="grid gap-6 lg:grid-cols-3">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-lg">Simple Badge</h3>
						<TierBadge tierStatus={mockUsageStatus} />
					</div>
				</div>

				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-lg">Detailed View</h3>
						<TierBadge tierStatus={mockUsageStatus} showDetails={true} />
					</div>
				</div>

				<div class="card bg-base-200">
					<div class="card-body">
						<h4 class="font-semibold">Features:</h4>
						<ul class="space-y-1 text-sm">
							<li>🎯 Tier indicators with icons</li>
							<li>📊 Usage progress bars</li>
							<li>⚠️ Limit warnings</li>
							<li>📅 Reset date display</li>
						</ul>
					</div>
				</div>
			</div>
		</section>

		<!-- Voice Selector Section -->
		<section id="voice-selector" class="space-y-6">
			<div class="flex items-center space-x-4">
				<h2 class="text-2xl font-bold">🎤 Voice Selector</h2>
				<div class="badge badge-accent">Audio</div>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-lg">Interactive Selector</h3>
						<p class="mb-4 text-sm text-base-content/70">
							Choose from 6 different OpenAI TTS voices with preview functionality.
						</p>
						<VoiceSelector {selectedVoice} onVoiceChange={handleVoiceChange} />
						<div class="mt-4 text-sm">
							<strong>Selected:</strong>
							{selectedVoice}
						</div>
					</div>
				</div>

				<div class="card bg-base-200">
					<div class="card-body">
						<h4 class="font-semibold">Available Voices:</h4>
						<div class="space-y-2 text-sm">
							<div>🤖 <strong>Alloy:</strong> Balanced and neutral (American)</div>
							<div>👨 <strong>Echo:</strong> Warm and friendly (Male, American)</div>
							<div>👩 <strong>Fable:</strong> Expressive and engaging (Female, British)</div>
							<div>👨 <strong>Onyx:</strong> Deep and authoritative (Male, American)</div>
							<div>👩 <strong>Nova:</strong> Clear and professional (Female, American)</div>
							<div>👩 <strong>Shimmer:</strong> Gentle and soothing (Female, American)</div>
						</div>
						<div class="mt-3 text-xs opacity-70">
							Click the play button to preview each voice using browser speech synthesis.
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Scenario Components Section -->
		<section id="scenario-components" class="space-y-6">
			<div class="flex items-center space-x-4">
				<h2 class="text-2xl font-bold">🎯 Scenario Components</h2>
				<div class="badge badge-success">Learning</div>
			</div>

			<!-- Scenario Progress -->
			<div class="space-y-4">
				<h3 class="text-xl font-semibold">Scenario Progress</h3>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<p class="mb-4 text-sm text-base-content/70">
							Shows learning progress and provides scaffolding during scenario practice.
						</p>
						<ScenarioProgress
							scenario={mockScenario}
							state={mockConversationState}
							onUseHint={handleScenarioHint}
							onUseTranslation={handleScenarioTranslation}
							onViewExample={handleScenarioExample}
						/>
					</div>
				</div>
			</div>

			<!-- Scenario Outcome -->
			<div class="space-y-4">
				<h3 class="text-xl font-semibold">Scenario Outcome</h3>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<p class="mb-4 text-sm text-base-content/70">
							Displays learning results and feedback after completing a scenario.
						</p>
						<ScenarioOutcome
							scenario={mockScenario}
							outcome={mockScenarioOutcome}
							onRetry={handleScenarioActions}
							onNextScenario={handleScenarioActions}
							onBackToScenarios={handleScenarioActions}
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- Component Status Overview -->
		<section id="overview" class="space-y-6">
			<h2 class="text-2xl font-bold">📋 Component Overview</h2>

			<div class="overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Component</th>
							<th>Purpose</th>
							<th>Status</th>
							<th>Integration</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="font-semibold">PricingModal</td>
							<td>Subscription management and upgrade flows</td>
							<td><span class="badge badge-success">Production Ready</span></td>
							<td>Stripe, PostHog, Tier System</td>
						</tr>
						<tr>
							<td class="font-semibold">NewsletterSignup</td>
							<td>Account-based newsletter subscriptions</td>
							<td><span class="badge badge-success">Production Ready</span></td>
							<td>User Preferences, Auth System</td>
						</tr>
						<tr>
							<td class="font-semibold">TierBadge</td>
							<td>Usage tracking and tier display</td>
							<td><span class="badge badge-success">Production Ready</span></td>
							<td>Tier Service, Usage Tracking</td>
						</tr>
						<tr>
							<td class="font-semibold">VoiceSelector</td>
							<td>AI voice selection for conversations</td>
							<td><span class="badge badge-success">Production Ready</span></td>
							<td>OpenAI TTS, User Preferences</td>
						</tr>
						<tr>
							<td class="font-semibold">ScenarioProgress</td>
							<td>Real-time learning progress tracking</td>
							<td><span class="badge badge-warning">In Development</span></td>
							<td>Scenario System, Learning Analytics</td>
						</tr>
						<tr>
							<td class="font-semibold">ScenarioOutcome</td>
							<td>Post-scenario results and feedback</td>
							<td><span class="badge badge-warning">In Development</span></td>
							<td>Scenario System, Learning Analytics</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</div>

<!-- Render Modals -->
<PricingModal
	bind:isOpen={isPricingModalOpen}
	{currentTier}
	usageStatus={modalSource === 'limit_modal' ? mockUsageStatus : null}
	source={modalSource}
/>
