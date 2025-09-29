<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
	<div class="container mx-auto max-w-6xl">
		<h1 class="text-center text-2xl font-bold text-white">Kaiwa - Migration</h1>
		<h2 class="mb-8 text-center text-lg text-white">
			A comprehensive guide for migrating Kaiwa to feature-based architecture
		</h2>

		<!-- Current Architecture Overview -->
		<div class="mb-12 rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">Current Architecture Analysis</h2>

			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-4 text-lg font-semibold text-green-400">✅ What's Working</h3>
					<ul class="space-y-2 text-gray-300">
						<li>• Services are independent and pure</li>
						<li>• Stores orchestrate business logic</li>
						<li>• Clean 3-layer separation</li>
						<li>• Svelte 5 runes for reactivity</li>
					</ul>
				</div>
				<div>
					<h3 class="mb-4 text-lg font-semibold text-red-400">⚠️ Cross-Cutting Challenges</h3>
					<ul class="space-y-2 text-gray-300">
						<li>• User/Auth logic scattered across features</li>
						<li>• Payment tiers affect multiple features</li>
						<li>• Scenarios used by conversation + analysis</li>
						<li>• Settings/preferences needed everywhere</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Implicit Sharing Architecture -->
		<div class="mb-12 rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">🎯 Proposed: Implicit Sharing + Features</h2>

			<div class="mb-6">
				<pre class="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400"><code
						>src/lib/
├── stores/                    # SHARED by default (Cross-cutting concerns)
│   ├── user.store.svelte.ts              # User auth + profile
│   ├── payments.store.svelte.ts          # Tier + subscription
│   ├── settings.store.svelte.ts          # Global preferences
│   └── scenarios.store.svelte.ts         # Scenario management
├── services/                  # SHARED by default (Business logic)
│   ├── auth.service.ts
│   ├── payments.service.ts
│   ├── scenarios.service.ts
│   └── permissions.service.ts            # Tier-based access control
├── types/                     # SHARED by default (Type definitions)
│   ├── user.types.ts
│   ├── payments.types.ts
│   └── scenarios.types.ts
├── utils/                     # SHARED by default (Helper functions)
│   ├── permissions.ts                    # Permission utilities 
├── components/                # SHARED by default (Truly shared UI)
│   ├── Navigation.svelte
│   ├── LoadingScreen.svelte
│   └── ThemeSwitcher.svelte
└── features/                  # Feature-specific implementations
    ├── realtime-conversation/            # Primary conversation feature
    │   ├── components/                   # Feature-only components
    │   ├── stores/                       # Feature-only stores
    │   │   └── conversation-session.store.svelte.ts
    │   ├── services/                     # Feature-only services
    │   │   └── conversation-flow.service.ts
    │   └── stores/                       # Feature-only stores
    ├── analysis/                        # Post-conversation analysis
    │   ├── components/                   # Analysis UI components
    │   ├── services/                     # Analysis business logic
    │   └── stores/                       # Analysis reactive state
    ├── cultural-dna/                    # Viral sharing feature
    └── onboarding/                      # User onboarding flow</code
					></pre>
			</div>

			<div class="mb-6">
				<h4 class="mb-3 text-lg font-semibold text-orange-400">📁 Core Feature Folders</h4>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="rounded-lg bg-gray-800/50 p-4">
						<h5 class="mb-2 text-sm font-medium text-yellow-400">components/</h5>
						<p class="mb-2 text-xs text-gray-400">Svelte components specific to this feature</p>
						<code class="text-xs text-green-300">QuickAnalysis.svelte</code>
					</div>
					<div class="rounded-lg bg-gray-800/50 p-4">
						<h5 class="mb-2 text-sm font-medium text-yellow-400">services/</h5>
						<p class="mb-2 text-xs text-gray-400">Business logic, processors, config</p>
						<code class="text-xs text-green-300">analysis.service.ts</code>
					</div>
					<div class="rounded-lg bg-gray-800/50 p-4">
						<h5 class="mb-2 text-sm font-medium text-yellow-400">stores/</h5>
						<p class="mb-2 text-xs text-gray-400">Feature-specific reactive state</p>
						<code class="text-xs text-green-300">analysis.store.svelte.ts</code>
					</div>
				</div>
				<div class="mt-4 rounded-lg bg-blue-900/20 p-3">
					<p class="text-xs text-blue-300">
						💡 <strong>Growth pattern:</strong> As features get complex, you can add subfolders (services/processors/,
						services/config/) or additional folders as needed.
					</p>
				</div>
			</div>

			<div class="grid gap-6 md:grid-cols-2">
				<div class="rounded-lg bg-purple-900/20 p-4">
					<h4 class="mb-3 font-semibold text-purple-400">Implicit Sharing Benefits</h4>
					<ul class="space-y-1 text-sm text-gray-300">
						<li>• Matches your existing structure</li>
						<li>• No "shared/" folder confusion</li>
						<li>• Clear separation: lib/ vs features/</li>
						<li>• Easier imports and navigation</li>
					</ul>
				</div>
				<div class="rounded-lg bg-blue-900/20 p-4">
					<h4 class="mb-3 font-semibold text-blue-400">Feature Boundaries</h4>
					<ul class="space-y-1 text-sm text-gray-300">
						<li>• Features import from $lib/* freely</li>
						<li>• Features NEVER import from each other</li>
						<li>• Cross-feature comm via bridges only</li>
						<li>• Feature-specific code stays in features/</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- When to Add Complexity -->
		<div class="mb-12 rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-8">
			<h2 class="mb-6 text-2xl font-bold text-white">🤔 When to Break Out of Simple Structure?</h2>

			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-green-400">
					✅ Start Simple: services/stores/components
				</h3>
				<div class="rounded-lg bg-green-900/20 p-4">
					<pre class="text-sm text-green-300">{`// features/payments/services/payments.service.ts
export class PaymentsService {
  // All payment logic in one place
  async createCheckout() { /* ... */ }
  async handleWebhook() { /* ... */ }
  async cancelSubscription() { /* ... */ }

  // Config as simple constants
  static readonly PLANS = [
    { id: 'free', price: 0 },
    { id: 'pro', price: 9.99 }
  ];
}`}</pre>
				</div>
			</div>

			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-orange-400">⚠️ When Complexity Emerges</h3>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="rounded-lg bg-gray-800/50 p-4">
						<h4 class="mb-2 text-sm font-medium text-orange-400">Processors Needed</h4>
						<p class="text-xs text-gray-400">
							When you have 5+ data processing functions that could be separate files
						</p>
					</div>
					<div class="rounded-lg bg-gray-800/50 p-4">
						<h4 class="mb-2 text-sm font-medium text-orange-400">Config Gets Large</h4>
						<p class="text-xs text-gray-400">
							When configuration is 100+ lines or used by multiple files
						</p>
					</div>
					<div class="rounded-lg bg-gray-800/50 p-4">
						<h4 class="mb-2 text-sm font-medium text-orange-400">Orchestration Needed</h4>
						<p class="text-xs text-gray-400">
							When you need to coordinate 3+ processors with complex logic
						</p>
					</div>
				</div>
			</div>

			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-blue-400">
					🔧 Analysis Feature Example (Why It's Complex)
				</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-400">Why Break It Out:</h4>
						<ul class="space-y-2 text-sm text-gray-400">
							<li>
								• <strong>5+ different analysis types:</strong> grammar, vocabulary, fluency, pronunciation,
								cultural
							</li>
							<li>
								• <strong>Each analysis = 100+ lines:</strong> Complex algorithms for each type
							</li>
							<li>
								• <strong>Complex configuration:</strong> What analysis runs when, for which languages
							</li>
							<li>
								• <strong>Needs orchestration:</strong> Run multiple analyses, combine results, handle
								errors
							</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-400">Solution:</h4>
						<pre class="rounded bg-gray-900/50 p-3 text-sm text-gray-300">{`services/
├── analysis-orchestrator.service.ts    # 50 lines
├── processors/                         # Each 100+ lines
│   ├── grammar.processor.ts
│   ├── vocabulary.processor.ts
│   ├── fluency.processor.ts
│   └── pronunciation.processor.ts
└── config/
    └── analysis-categories.config.ts   # 200+ lines`}</pre>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-red-500/30 bg-red-900/20 p-6">
				<h3 class="mb-4 text-lg font-semibold text-red-400">
					❌ Don't Over-Engineer Simple Features
				</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-400">
							Bad: Settings Feature (Too Complex)
						</h4>
						<pre class="rounded bg-red-900/30 p-3 text-sm text-red-300">{`settings/
├── services/
│   ├── settings-orchestrator.service.ts  # 20 lines
│   └── processors/
│       └── theme-processor.ts            # 10 lines
└── config/
    └── themes.config.ts                  # 5 lines`}</pre>
					</div>
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-400">Good: Keep It Simple</h4>
						<pre class="rounded bg-green-900/30 p-3 text-sm text-green-300">{`settings/
├── services/
│   └── settings.service.ts               # 35 lines total
├── stores/
│   └── settings.store.svelte.ts
└── components/
    └── SettingsPanel.svelte`}</pre>
					</div>
				</div>
			</div>

			<div class="mt-6 rounded-lg bg-blue-900/20 p-4">
				<h3 class="mb-3 text-lg font-semibold text-blue-400">📏 Rule of Thumb</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<p class="text-sm text-blue-300"><strong>Keep it simple if:</strong></p>
						<ul class="mt-2 space-y-1 text-sm text-gray-400">
							<li>• Service file under 200 lines</li>
							<li>• Less than 8 methods</li>
							<li>• Config under 50 lines</li>
							<li>• No complex coordination needed</li>
						</ul>
					</div>
					<div>
						<p class="text-sm text-blue-300"><strong>Break it out when:</strong></p>
						<ul class="mt-2 space-y-1 text-sm text-gray-400">
							<li>• Service file over 200 lines</li>
							<li>• 10+ methods doing very different things</li>
							<li>• Config over 100 lines or shared</li>
							<li>• Need to coordinate multiple processors</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Practical Examples -->
		<div class="mb-12 rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">🔧 Practical Implementation Examples</h2>

			<!-- User/Tier Example -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-yellow-400">
					Example 1: User + Payment Tier Logic
				</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-400">❌ Current (Scattered)</h4>
						<pre
							class="rounded bg-red-900/20 p-3 text-xs text-red-300">{`// In conversation.store.svelte.ts
const user = userManager.user;
const tier = user?.tier || 'free';
if (tier === 'free' && messages.length > 10) {
  // upgrade logic
}`}</pre>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-400">✅ Proposed (Centralized)</h4>
						<pre
							class="rounded bg-green-900/20 p-3 text-xs text-green-300">{`// $lib/utils/permissions.ts
export const canContinueConversation = (
  user: User,
  messageCount: number
) => {
  const limits = getTierLimits(user.tier);
  return messageCount < limits.maxMessages;
}`}</pre>
					</div>
				</div>
			</div>

			<!-- Scenario Cross-Feature Example -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-yellow-400">
					Example 2: Scenarios Across Features
				</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-400">Realtime Conversation Feature</h4>
						<pre
							class="rounded bg-blue-900/20 p-3 text-xs text-blue-300">{`// features/realtime-conversation/stores/
import { scenarioStore } from '$lib/stores';

export class ConversationStore {
  startConversation() {
    const scenario = scenarioStore.getSelected();
    const instructions = scenario.instructions;
    // Use scenario in conversation
  }
}`}</pre>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-400">Analysis Feature</h4>
						<pre
							class="rounded bg-purple-900/20 p-3 text-xs text-purple-300">{`// features/analysis/stores/
import { scenarioStore } from '$lib/stores';

export class AnalysisStore {
  analyzeConversation(messages: Message[]) {
    const scenario = scenarioStore.getSelected();
    // Analyze against scenario goals
  }
}`}</pre>
					</div>
				</div>
			</div>

			<!-- Analysis Feature Structure -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-yellow-400">
					Example 3: Analysis Feature Service Structure
				</h3>
				<pre
					class="rounded bg-gray-900 p-4 text-sm text-gray-300">{`// features/analysis/services/analysis.service.ts
export class AnalysisService {
  // Main orchestrator method
  static async runAnalysis(messages: Message[], language: Language) {
    const results = await Promise.all([
      this.runQuickStats(messages, language),
      this.runGrammarCheck(messages),
      this.runPhraseAnalysis(messages, language)
    ]);

    return this.combineResults(results);
  }

  // Individual processors as private methods
  private static async runQuickStats(messages: Message[], language: Language) {
    return {
      wordCount: this.countWords(messages),
      estimatedLevel: this.estimateLevel(messages, language)
    };
  }

  // Configuration as constants
  static readonly ANALYSIS_CATEGORIES = [
    { id: 'quick-stats', label: 'Quick Stats', enabled: true },
    { id: 'grammar', label: 'Grammar Check', enabled: true }
  ];
}`}</pre>
			</div>

			<!-- Cross-Feature Communication -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-yellow-400">
					Example 4: Feature-to-Feature Communication
				</h3>
				<pre class="rounded bg-gray-900 p-4 text-sm text-gray-300">{`// $lib/utils/feature-bridge.ts
export class FeatureBridge {
  static async passToAnalysis(conversationData: ConversationEndData) {
    const analysisFeature = await import('$lib/features/analysis');
    return analysisFeature.startAnalysis(conversationData);
  }

  static async checkSharingPotential(analysisResults: AnalysisResults) {
    const culturalDnaFeature = await import('$lib/features/cultural-dna');
    return culturalDnaFeature.evaluateForSharing(analysisResults);
  }
}`}</pre>
			</div>
		</div>

		<!-- Migration Steps -->
		<div class="mb-12 rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">📋 Step-by-Step Migration Plan</h2>

			<div class="space-y-6">
				<!-- Phase 1 -->
				<div class="rounded-lg border border-green-500/30 bg-green-900/10 p-4">
					<h3 class="mb-3 text-lg font-semibold text-green-400">
						Phase 1: Prepare Feature Structure (Week 1)
					</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h4 class="mb-2 text-sm font-medium text-gray-300">1. Create Directory Structure</h4>
							<pre
								class="rounded bg-gray-900 p-2 text-xs text-gray-300">mkdir -p src/lib/features</pre>
						</div>
						<div>
							<h4 class="mb-2 text-sm font-medium text-gray-300">2. Verify Shared Structure</h4>
							<ul class="space-y-1 text-xs text-gray-400">
								<li>• Stores already in $lib/stores/ (no move needed)</li>
								<li>• Services already in $lib/services/ (no move needed)</li>
								<li>• Utils already in $lib/utils/ (no move needed)</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Phase 2 -->
				<div class="rounded-lg border border-blue-500/30 bg-blue-900/10 p-4">
					<h3 class="mb-3 text-lg font-semibold text-blue-400">
						Phase 2: Extract Features (Week 2-3)
					</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h4 class="mb-2 text-sm font-medium text-gray-300">Priority Order</h4>
							<ol class="space-y-1 text-xs text-gray-400">
								<li>1. realtime-conversation (core feature)</li>
								<li>2. analysis (depends on conversation)</li>
								<li>3. onboarding (independent)</li>
								<li>4. scenarios (management UI)</li>
							</ol>
						</div>
						<div>
							<h4 class="mb-2 text-sm font-medium text-gray-300">Per Feature Steps</h4>
							<ul class="space-y-1 text-xs text-gray-400">
								<li>• Move feature-specific components</li>
								<li>• Extract feature stores</li>
								<li>• Migrate feature services</li>
								<li>• Update import paths</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Phase 3 -->
				<div class="rounded-lg border border-purple-500/30 bg-purple-900/10 p-4">
					<h3 class="mb-3 text-lg font-semibold text-purple-400">
						Phase 3: Feature Bridges (Week 4)
					</h3>
					<ul class="space-y-2 text-sm text-gray-300">
						<li>• Implement FeatureBridge utility</li>
						<li>• Set up cross-feature communication</li>
						<li>• Add permission utilities</li>
						<li>• Test feature independence</li>
					</ul>
				</div>

				<!-- Phase 4 -->
				<div class="rounded-lg border border-orange-500/30 bg-orange-900/10 p-4">
					<h3 class="mb-3 text-lg font-semibold text-orange-400">
						Phase 4: API Reorganization (Week 5-6)
					</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h4 class="mb-2 text-sm font-medium text-gray-300">Current Issues</h4>
							<ul class="space-y-1 text-xs text-gray-400">
								<li>• Mixed naming conventions</li>
								<li>• Inconsistent nesting structure</li>
								<li>• Unclear CRUD alignment</li>
								<li>• Hard to maintain as it grows</li>
							</ul>
						</div>
						<div>
							<h4 class="mb-2 text-sm font-medium text-gray-300">New Approach</h4>
							<ul class="space-y-1 text-xs text-gray-400">
								<li>• Resource-oriented endpoints</li>
								<li>• Clear CRUD operations</li>
								<li>• Repository pattern for data</li>
								<li>• RESTful principles</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Code Examples -->
		<div class="mb-12 rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">💻 Key Code Patterns</h2>

			<div class="space-y-8">
				<!-- Permission System -->
				<div>
					<h3 class="mb-4 text-lg font-semibold text-yellow-400">
						Permission-Based Feature Access
					</h3>
					<pre
						class="rounded bg-gray-900 p-4 text-sm text-gray-300">{`// shared/utils/permissions.ts
import type { User, UserTier } from '../types/user.types';

export interface TierLimits {
  maxConversationsPerDay: number;
  maxAnalysisPerMonth: number;
  canShareContent: boolean;
  canAccessPremiumScenarios: boolean;
}

export const getTierLimits = (tier: UserTier): TierLimits => {
  switch (tier) {
    case 'free':
      return {
        maxConversationsPerDay: 3,
        maxAnalysisPerMonth: 5,
        canShareContent: false,
        canAccessPremiumScenarios: false
      };
    case 'pro':
      return {
        maxConversationsPerDay: 20,
        maxAnalysisPerMonth: 50,
        canShareContent: true,
        canAccessPremiumScenarios: true
      };
    default:
      return getTierLimits('free');
  }
};

export const canUseFeature = (user: User, feature: string): boolean => {
  const limits = getTierLimits(user.tier);
  // Feature-specific permission logic
};`}</pre>
				</div>

				<!-- Shared Store Pattern -->
				<div>
					<h3 class="mb-4 text-lg font-semibold text-yellow-400">
						Shared Store with Feature Events
					</h3>
					<pre
						class="rounded bg-gray-900 p-4 text-sm text-gray-300">{`// $lib/stores/scenarios.store.svelte.ts
export class ScenariosStore {
  selectedScenario = $state<Scenario | null>(null);
  availableScenarios = $state<Scenario[]>([]);

  // Features can subscribe to changes
  private subscribers = new Set<(scenario: Scenario) => void>();

  setScenario(scenario: Scenario) {
    this.selectedScenario = scenario;
    // Notify all subscribing features
    this.subscribers.forEach(callback => callback(scenario));
  }

  subscribeToChanges(callback: (scenario: Scenario) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}`}</pre>
				</div>

				<!-- Feature Store Pattern -->
				<div>
					<h3 class="mb-4 text-lg font-semibold text-yellow-400">
						Feature Store Using Shared Kernel
					</h3>
					<pre
						class="rounded bg-gray-900 p-4 text-sm text-gray-300">{`// features/realtime-conversation/stores/conversation.store.svelte.ts
import { userStore, scenarioStore, settingsStore } from '$lib/stores';
import { canUseFeature, getTierLimits } from '$lib/utils/permissions';
 
export class ConversationStore {
  // Feature-specific state
  messages = $state<Message[]>([]);
  isActive = $state(false);

  // Access shared state
  get user() { return userStore.current; }
  get scenario() { return scenarioStore.selectedScenario; }
  get canContinue() {
    return canUseFeature(this.user, 'continue-conversation');
  }

  async endConversation() {
    // Feature logic...

    // Pass to other features via bridge
    const analysisResult = await FeatureBridge.passToAnalysis({
      messages: this.messages,
      scenario: this.scenario,
      userId: this.user.id
    });

    // Cultural DNA evaluation
    await FeatureBridge.evaluateForSharing(analysisResult);
  }
}`}</pre>
				</div>
			</div>
		</div>

		<!-- ... existing content ... -->

		<!-- API Reorganization (Phase 4) -->
		<div class="mb-12 rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">🔄 Phase 4: API Reorganization</h2>

			<p class="mb-6 text-gray-300">
				Transform the API from mixed conventions to a clean, resource-oriented structure following
				RESTful principles.
			</p>

			<!-- Current Issues -->
			<div class="mb-8 rounded-lg border border-red-500/30 bg-red-900/10 p-4">
				<h3 class="mb-3 text-lg font-semibold text-red-400">❌ Current API Issues</h3>
				<div class="grid gap-4 md:grid-cols-3">
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-300">Mixed Naming</h4>
						<p class="text-xs text-gray-400">
							Resource-based (users), action-based (checkout), feature-based (streaks) all mixed
							together
						</p>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-300">Inconsistent Structure</h4>
						<p class="text-xs text-gray-400">
							Some endpoints nested (api/user/language), others flat
						</p>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-300">CRUD Confusion</h4>
						<p class="text-xs text-gray-400">
							Not clear which endpoints handle Create, Read, Update, Delete
						</p>
					</div>
				</div>
			</div>

			<!-- Key Principles -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-green-400">✅ New API Principles</h3>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
					<div class="rounded-lg bg-green-900/20 p-3 text-center">
						<div class="mb-2 text-lg">🏗️</div>
						<h4 class="text-xs font-medium text-green-300">Resource-Oriented</h4>
					</div>
					<div class="rounded-lg bg-blue-900/20 p-3 text-center">
						<div class="mb-2 text-lg">📁</div>
						<h4 class="text-xs font-medium text-blue-300">SvelteKit Conventions</h4>
					</div>
					<div class="rounded-lg bg-purple-900/20 p-3 text-center">
						<div class="mb-2 text-lg">🔄</div>
						<h4 class="text-xs font-medium text-purple-300">Clear CRUD</h4>
					</div>
					<div class="rounded-lg bg-yellow-900/20 p-3 text-center">
						<div class="mb-2 text-lg">🪆</div>
						<h4 class="text-xs font-medium text-yellow-300">Nested Resources</h4>
					</div>
					<div class="rounded-lg bg-orange-900/20 p-3 text-center">
						<div class="mb-2 text-lg">🔧</div>
						<h4 class="text-xs font-medium text-orange-300">Repository Pattern</h4>
					</div>
				</div>
			</div>

			<!-- New Structure -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-blue-400">📂 New API Structure</h3>
				<pre class="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400"><code
						>src/routes/api/
├───users/                    # User resource
│   ├───[id]/
│   │   ├───subscription/     # User's subscription
│   │   ├───preferences/      # User preferences
│   │   ├───tutorial/         # Tutorial progress
│   │   └───+server.ts        # GET, PUT, DELETE user
│   └───+server.ts            # GET users list, POST create
├───conversations/            # Conversation resource
│   ├───[id]/
│   │   ├───messages/         # Messages in conversation
│   │   │   ├───[messageId]/  # Individual message
│   │   │   └───+server.ts    # GET list, POST create
│   │   ├───summary/          # Conversation analysis
│   │   └───+server.ts        # GET, PUT, DELETE conversation
│   └───+server.ts            # GET list, POST create
├───billing/                  # Payment operations
│   ├───checkout/             # Stripe checkout
│   ├───portal/               # Customer portal
│   └───webhook/              # Stripe webhooks
├───features/                 # Feature-specific endpoints
│   ├───transcribe/           # Audio transcription
│   ├───translate/            # Translation service
│   └───analyze/              # Analysis pipeline
└───admin/                    # Admin operations</code
					></pre>
			</div>

			<!-- Implementation Example -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-yellow-400">💻 Implementation Pattern</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-300">API Endpoint</h4>
						<pre
							class="rounded bg-gray-900/50 p-3 text-xs text-gray-300">{`// src/routes/api/users/+server.ts
import { json } from '@sveltejs/kit';
import * as userRepository from '$lib/server/repositories/user.repository';

// GET /api/users
export async function GET() {
  const users = await userRepository.getAllUsers();
  return json(users);
}

// POST /api/users
export async function POST({ request }) {
  const userData = await request.json();
  const user = await userRepository.createUser(userData);
  return json(user, { status: 201 });
}`}</pre>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-gray-300">Repository</h4>
						<pre
							class="rounded bg-gray-900/50 p-3 text-xs text-gray-300">{`// src/lib/server/repositories/user.repository.ts
import { db } from '$lib/server/db';

export async function getAllUsers() {
  return await db.select().from(users);
}

export async function createUser(userData: NewUser) {
  const [user] = await db.insert(users)
    .values(userData)
    .returning();
  return user;
}

export async function getUserById(id: string) {
  return await db.select()
    .from(users)
    .where(eq(users.id, id));
}`}</pre>
					</div>
				</div>
			</div>

			<!-- Migration Steps -->
			<div class="rounded-lg bg-gray-800/50 p-4">
				<h3 class="mb-3 text-lg font-semibold text-gray-200">🚀 Implementation Steps</h3>
				<div class="grid gap-4 md:grid-cols-3">
					<div>
						<h4 class="mb-2 text-sm font-medium text-blue-300">1. Structure</h4>
						<ul class="space-y-1 text-xs text-gray-400">
							<li>• Create new directory structure</li>
							<li>• Set up +server.ts files</li>
							<li>• Plan resource hierarchy</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-green-300">2. Repositories</h4>
						<ul class="space-y-1 text-xs text-gray-400">
							<li>• Create repository files</li>
							<li>• Move database logic</li>
							<li>• Implement CRUD operations</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium text-purple-300">3. Migration</h4>
						<ul class="space-y-1 text-xs text-gray-400">
							<li>• Move existing endpoints</li>
							<li>• Update client code</li>
							<li>• Remove old endpoints</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Testing Strategy -->
		<div class="rounded-xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
			<h2 class="mb-6 text-2xl font-bold text-white">🧪 Testing & Validation</h2>

			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-4 text-lg font-semibold text-green-400">Feature Independence Tests</h3>
					<ul class="space-y-2 text-sm text-gray-300">
						<li>• Each feature can be imported standalone</li>
						<li>• No circular dependencies</li>
						<li>• Shared kernel has stable API</li>
						<li>• Feature bridges work correctly</li>
					</ul>
				</div>
				<div>
					<h3 class="mb-4 text-lg font-semibold text-blue-400">Integration Tests</h3>
					<ul class="space-y-2 text-sm text-gray-300">
						<li>• Conversation → Analysis flow</li>
						<li>• User permissions across features</li>
						<li>• Scenario sharing between features</li>
						<li>• Cross-feature error handling</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
