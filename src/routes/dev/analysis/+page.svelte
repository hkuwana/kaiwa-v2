<script lang="ts">
	import { onMount } from 'svelte';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { scenariosData } from '$lib/data/scenarios';
	import { analysisSuggestionService } from '$lib/features/analysis/services/analysis-suggestion.service';
	import UnifiedConversationBubble from '$lib/features/analysis/components/UnifiedConversationBubble.svelte';
	import type { AnalysisSuggestion } from '$lib/features/analysis/types/analysis-suggestion.types';
	import type { AnalysisFindingDraft } from '$lib/features/analysis/types/analysis-logbook.types';
	import ConversationReviewableState from '$lib/features/conversation/components/ConversationReviewableState.svelte';

	type ModuleMeta = {
		id: string;
		label: string;
		description: string;
		modality: 'text' | 'audio';
		tier?: 'free' | 'pro' | 'premium';
		requiresAudio: boolean;
	};

	type MessageWithErrors = {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		errors?: string[];
		expected?: string;
	};

	type ConversationSample = {
		title: string;
		messages: MessageWithErrors[];
	};

	let modules = $state<ModuleMeta[]>([]);
	let selectedModuleIds = $state<Set<string>>(new Set());
	let conversationId = $state('dev-conversation');
	let languageCode = $state('en');
	let selectedScenario = $state('spanish-restaurant');
	let showComparison = $state(false);
	let showModulesJson = $state(false);
	let showRawAnalysis = $state(false);
	let usageInfo = $state<any>(null);
	let showUsageDetails = $state(false);
	let showDebugInput = $state(false);
	let showReviewableDemo = $state(false);
	let findingDrafts = $state<AnalysisFindingDraft[]>([]);
	let showFindingsJson = $state(false);
	let findingsError = $state<string | null>(null);

	// Mock conversation samples with errors and expected corrections
	const conversationSamples: Record<string, ConversationSample> = {
		'spanish-restaurant': {
			title: '🇪🇸 Spanish Restaurant - Complex Grammar & Vocabulary',
			messages: [
				{ id: 'msg-1', role: 'assistant', content: '¡Buenas noches! Bienvenidos a El Sabor de Sevilla. ¿Tienen una reserva?', timestamp: new Date('2024-05-21T20:00:00') },
				{ id: 'msg-2', role: 'user', content: 'Buenas noches. Sí, somos dos. La reserva es para Alejandro.', timestamp: new Date('2024-05-21T20:00:15'), errors: ["es para Alejandro -> está a nombre de Alejandro"], expected: 'Buenas noches. Sí, somos dos. La reserva está a nombre de Alejandro.' },
				{ id: 'msg-3', role: 'assistant', content: 'Perfecto, por aquí por favor. Aquí tienen sus menús. ¿Quieren algo para beber para empezar?', timestamp: new Date('2024-05-21T20:01:00') },
				{ id: 'msg-4', role: 'user', content: 'Sí, para mí un vaso de vino tinto, por favor. Y para mi amiga, ella querrá agua.', timestamp: new Date('2024-05-21T20:01:45'), errors: ["querrá -> quiere"], expected: 'Sí, para mí un vaso de vino tinto, por favor. Y para mi amiga, ella quiere agua.' },
				{ id: 'msg-5', role: 'assistant', content: 'Muy bien. Un tinto y un agua con gas o sin gas?', timestamp: new Date('2024-05-21T20:02:15') },
				{ id: 'msg-6', role: 'user', content: 'Sin gas está bien. Estamos listos para ordenar la comida también. Yo soy muy hambriento.', timestamp: new Date('2024-05-21T20:03:00'), errors: ["soy muy hambriento -> tengo mucha hambre"], expected: 'Sin gas está bien. Estamos listos para ordenar la comida también. Yo tengo mucha hambre.' },
				{ id: 'msg-7', role: 'assistant', content: '¡Claro! ¿Qué les apetece hoy?', timestamp: new Date('2024-05-21T20:03:30') },
				{ id: 'msg-8', role: 'user', content: 'Me gustaría probar la paella. ¿Es para compartir, o es una porción para uno?', timestamp: new Date('2024-05-21T20:04:10'), errors: [], expected: 'Me gustaría probar la paella. ¿Es para compartir, o es una porción para uno?' },
				{ id: 'msg-9', role: 'assistant', content: 'Nuestra paella de mariscos es bastante grande, ideal para dos personas. La recomiendo mucho.', timestamp: new Date('2024-05-21T20:04:45') },
				{ id: 'msg-10', role: 'user', content: 'Perfecto, entonces pedimos la paella. Y también una porción de patatas bravas para empezar. ¿Las patatas son muy picantes?', timestamp: new Date('2024-05-21T20:05:30'), errors: ["son muy picantes -> están muy picantes"], expected: 'Perfecto, entonces pedimos la paella. Y también una porción de patatas bravas para empezar. ¿Las patatas están muy picantes?' },
				{ id: 'msg-11', role: 'assistant', content: 'Un poquito, pero no demasiado. Es un picante sabroso. ¿Algo más?', timestamp: new Date('2024-05-21T20:06:00') },
				{ id: 'msg-12', role: 'user', content: 'No, eso es todo por ahora. Gracias. Es posible que nosotros pedimos postre más tarde.', timestamp: new Date('2024-05-21T20:06:45'), errors: ["pedimos -> pidamos (subjunctive)"], expected: 'No, eso es todo por ahora. Gracias. Es posible que nosotros pidamos postre más tarde.' },
				{ id: 'msg-13', role: 'assistant', content: '¡Excelente elección! La paella tardará unos 20 minutos. Les traigo las bebidas y las bravas en un momento.', timestamp: new Date('2024-05-21T20:07:15') },
				{ id: 'msg-14', role: 'user', content: 'Disculpe, ¿el pan es con o sin gluten? Mi amiga es celíaca.', timestamp: new Date('2024-05-21T20:10:00'), errors: ["es celíaca -> es celíaca (ser is correct here, but good to check)"], expected: 'Disculpe, ¿el pan es con o sin gluten? Mi amiga es celíaca.' },
				{ id: 'msg-15', role: 'assistant', content: 'Tenemos pan sin gluten especial para celíacos. Se lo traigo en seguida.', timestamp: new Date('2024-05-21T20:10:30') }
			]
		},
		'french-market': {
			title: '🇫🇷 French Market - Negotiation & Cultural Nuances',
			messages: [
				{ id: 'msg-1', role: 'user', content: 'Bonjour. Ce vase, c\'est combien?', timestamp: new Date('2024-05-21T10:00:00'), errors: ["Ce vase, c'est combien? -> Bonjour, ce vase est à combien, s'il vous plaît?"], expected: "Bonjour, ce vase est à combien, s'il vous plaît?" },
				{ id: 'msg-2', role: 'assistant', content: 'Bonjour Madame. C\'est une belle pièce des années 30. Il est à 50 euros.', timestamp: new Date('2024-05-21T10:00:30') },
				{ id: 'msg-3', role: 'user', content: '50 euros... c\'est un peu cher pour moi. Tu peux faire un meilleur prix?', timestamp: new Date('2024-05-21T10:01:00'), errors: ["Tu peux -> Pourriez-vous (using 'vous' is more polite)"], expected: "50 euros... c'est un peu cher pour moi. Pourriez-vous faire un meilleur prix?" },
				{ id: 'msg-4', role: 'assistant', content: 'Hmm, il est en parfait état. Allez, pour vous, je peux le laisser à 45 euros.', timestamp: new Date('2024-05-21T10:01:45') },
				{ id: 'msg-5', role: 'user', content: 'Je te donne 30 euros. C\'est ma dernière offre.', timestamp: new Date('2024-05-21T10:02:15'), errors: ["Je te donne -> Je vous en propose 30 euros."], expected: "Je vous en propose 30 euros. C'est ma dernière offre." },
				{ id: 'msg-6', role: 'assistant', content: 'Ah non, 30 euros ce n\'est pas possible. Couper la poire en deux, 40 euros?', timestamp: new Date('2024-05-21T10:03:00') },
				{ id: 'msg-7', role: 'user', content: 'Ok, 35 euros et je le prends tout de suite.', timestamp: new Date('2024-05-21T10:03:30'), errors: [], expected: 'Ok, 35 euros et je le prends tout de suite.' },
				{ id: 'msg-8', role: 'assistant', content: 'Bon... d\'accord pour 35. C\'est parce que c\'est vous. Vous voulez un sac?', timestamp: new Date('2024-05-21T10:04:00'), errors: ["Vous voulez un sac? -> Je vous mets un sac?"], expected: "Bon... d'accord pour 35. C'est parce que c'est vous. Je vous mets un sac?" },
				{ id: 'msg-9', role: 'user', content: 'Oui, merci. J\'aime beaucoup les choses que vous avez. Je reviendrai.', timestamp: new Date('2024-05-21T10:04:30') },
				{ id: 'msg-10', role: 'assistant', content: 'Avec plaisir. Tenez, bien emballé. Ça fera 35 euros.', timestamp: new Date('2024-05-21T10:05:00') },
				{ id: 'msg-11', role: 'user', content: 'Est-ce que vous acceptez la carte de crédit?', timestamp: new Date('2024-05-21T10:05:20') },
				{ id: 'msg-12', role: 'assistant', content: 'Désolé, uniquement en espèces. Le distributeur est juste au coin de la rue.', timestamp: new Date('2024-05-21T10:05:40') },
				{ id: 'msg-13', role: 'user', content: 'Pas de problème. Voilà 40 euros.', timestamp: new Date('2024-05-21T10:06:10') },
				{ id: 'msg-14', role: 'assistant', content: 'Merci, et voilà votre monnaie de 5 euros. Bonne journée!', timestamp: new Date('2024-05-21T10:06:25') }
			]
		},
		'japanese-interview': {
			title: '🇯🇵 Japanese Interview - Formal Business Communication (Keigo)',
			messages: [
				{ id: 'msg-1', role: 'assistant', content: '本日は面接にお越しいただき、誠にありがとうございます。田中と申します。よろしくお願いいたします。', timestamp: new Date('2024-05-21T14:00:00') },
				{ id: 'msg-2', role: 'user', content: 'はい、スミスです。よろしく。', timestamp: new Date('2024-05-21T14:00:30'), errors: ["よろしく -> よろしくお願いいたします (more formal)"], expected: 'はい、スミスと申します。本日はよろしくお願いいたします。' },
				{ id: 'msg-3', role: 'assistant', content: 'では、スミスさん、まず自己紹介をお願いできますでしょうか。', timestamp: new Date('2024-05-21T14:01:00') },
				{ id: 'msg-4', role: 'user', content: 'はい。私はアメリカから来ました。大学でコンピュータサイエンスを勉強しました。日本で働くのが夢でした。', timestamp: new Date('2024-05-21T14:01:45'), errors: ["勉強しました -> 専攻しておりました (more humble/formal)"], expected: 'はい。私はアメリカから参りました。大学ではコンピュータサイエンスを専攻しておりました。日本で働くことが長年の夢でございました。' },
				{ id: 'msg-5', role: 'assistant', content: 'そうですか。素晴らしいですね。当社の求人はどこでお知りになりましたか。', timestamp: new Date('2024-05-21T14:03:00') },
				{ id: 'msg-6', role: 'user', content: 'インターネットで見ました。御社のウェブサイトです。', timestamp: new Date('2024-05-21T14:03:30'), errors: ["見ました -> 拝見しました (humble form)"], expected: 'はい、インターネットで拝見いたしました。御社のウェブサイトです。' },
				{ id: 'msg-7', role: 'assistant', content: 'ありがとうございます。当社のどのような点に興味を持たれましたか。', timestamp: new Date('2024-05-21T14:04:30') },
				{ id: 'msg-8', role: 'user', content: 'グローバルなチームで働けることと、AI技術を使っていることがいいと思います。', timestamp: new Date('2024-05-21T14:05:15'), errors: ["いいと思います -> に魅力を感じております (more formal/stronger interest)"], expected: 'グローバルなチームで働ける点と、最先端のAI技術を活用されている点に大変魅力を感じております。' },
				{ id: 'msg-9', role: 'assistant', content: 'なるほど。あなたの長所と短所を教えてください。', timestamp: new Date('2024-05-21T14:06:30') },
				{ id: 'msg-10', role: 'user', content: '私の長所は、新しいことを学ぶのが早いことです。短所は、時々仕事に集中しすぎることです。', timestamp: new Date('2024-05-21T14:07:15'), errors: [], expected: '私の長所は、新しい技術や知識を迅速に習得できる点です。短所としましては、時に一つの業務に集中しすぎてしまう傾向があるため、全体の進捗管理を意識するよう努めております。' },
				{ id: 'msg-11', role: 'assistant', content: '承知いたしました。最後に、何か質問はありますか。', timestamp: new Date('2024-05-21T14:10:00') },
				{ id: 'msg-12', role: 'user', content: 'はい、あります。チームの雰囲気はどんな感じですか。', timestamp: new Date('2024-05-21T14:10:45'), errors: ["どんな感じですか -> どのような雰囲気でいらっしゃいますでしょうか (more polite/formal)"], expected: 'はい、ございます。もし差し支えなければ、配属予定のチームの雰囲気についてお伺いしてもよろしいでしょうか。' },
				{ id: 'msg-13', role: 'assistant', content: '非常に協力的で、多国籍のメンバーが活発に意見交換をしています。風通しの良い職場ですよ。', timestamp: new Date('2024-05-21T14:11:30') },
				{ id: 'msg-14', role: 'user', content: 'わかりました。ありがとうございます。', timestamp: new Date('2024-05-21T14:12:00'), errors: ["わかりました -> かしこまりました or 承知いたしました"], expected: 'かしこまりました。よく分かりました、ありがとうございます。' },
				{ id: 'msg-15', role: 'assistant', content: '本日は以上となります。結果については、一週間以内にメールでご連絡いたします。', timestamp: new Date('2024-05-21T14:12:30') },
				{ id: 'msg-16', role: 'user', content: 'はい、ありがとうございました。', timestamp: new Date('2024-05-21T14:12:45'), errors: ["ありがとうございました -> 本日は貴重なお時間をいただき、誠にありがとうございました。"], expected: '本日は貴重なお時間をいただき、誠にありがとうございました。' }
			]
		}
	};

	let messages = $derived(conversationSamples[selectedScenario]?.messages || []);

	let isLoading = $state(false);
	let lastRun: any = $state(null);
	let errorMessage = $state<string | null>(null);
	let suggestions = $state<AnalysisSuggestion[]>([]);

	onMount(async () => {
		await loadModules();
	});

	async function loadModules() {
		try {
			const response = await fetch('/api/analysis/modules');
			if (!response.ok) throw new Error('Failed to load modules');

			const data = await response.json();
			modules = data.modules;

			selectedModuleIds = new Set(
				modules
					.filter((module: ModuleMeta) => module.modality === 'text')
					.map((module) => module.id)
			);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to load modules';
		}
	}

	async function runAnalysis() {
		isLoading = true;
		errorMessage = null;
		lastRun = null;
		suggestions = [];
		usageInfo = null;
		findingDrafts = [];
		findingsError = null;

		try {
			const response = await fetch('/api/analysis/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId,
					languageCode,
					moduleIds: Array.from(selectedModuleIds),
					messages
				})
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data?.error || 'Analysis failed');
			}

			lastRun = data.run;
			suggestions = data.suggestions ??
				analysisSuggestionService.extract(lastRun, {
					runId: lastRun.runId,
					messages
				});
			findingDrafts = data.findings ?? [];
			findingsError = data.findingsError ?? null;

			// Fetch updated usage info after running analysis
			try {
				const usageResponse = await fetch('/api/dev/usage-debug?action=current');
				if (usageResponse.ok) {
					const usageData = await usageResponse.json();
					usageInfo = usageData;
				}
			} catch (usageError) {
				console.warn('Could not fetch usage info:', usageError);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Analysis failed';
		} finally {
			isLoading = false;
		}
	}

	function toggleModule(id: string) {
		const next = new Set(selectedModuleIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedModuleIds = next;
	}
</script>

<div class="min-h-screen bg-base-200 py-10">
	<div class="mx-auto max-w-5xl space-y-8 px-4">
		<header class="rounded-lg bg-base-100 p-6 shadow">
			<h1 class="text-2xl font-semibold">Analysis Pipeline Sandbox</h1>
			<p class="mt-2 text-base-content">
				Run the new server-side analysis pipeline with synthetic conversation data. Select modules
				and see the raw output that would feed the UI.
			</p>
		</header>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="text-xl font-semibold">Conversation Samples</h2>
			<div class="mt-4 space-y-6">
				<div class="flex flex-wrap gap-4">
					<label class="form-control">
						<div class="label">Conversation ID</div>
						<input class="input-bordered input" bind:value={conversationId} />
					</label>
					<label class="form-control">
						<div class="label">Language Code</div>
						<input class="input-bordered input" bind:value={languageCode} />
					</label>
					<label class="form-control">
						<div class="label">Scenario</div>
						<select class="select-bordered select" bind:value={selectedScenario}>
							<option value="spanish-restaurant">🇪🇸 Spanish Restaurant</option>
							<option value="french-market">🇫🇷 French Market</option>
							<option value="japanese-interview">🇯🇵 Japanese Interview</option>
						</select>
					</label>
				</div>

				<div class="flex items-center gap-4">
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="toggle toggle-primary" bind:checked={showComparison} />
						<span>Show Error Analysis</span>
					</label>
				</div>

				<!-- Scenario Info -->
				{#if conversationSamples[selectedScenario]}
					{@const scenario = scenariosData.find((s) => s.id === selectedScenario)}
					<div class="rounded-lg bg-base-200 p-4">
						<h3 class="font-semibold text-base-content">
							{conversationSamples[selectedScenario].title}
						</h3>
						{#if scenario}
							<p class="mt-2 text-sm text-base-content">
								{scenario.description} - {scenario.context}
							</p>
							<div class="mt-3 flex flex-wrap gap-2">
								<span class="badge badge-outline">{scenario.category}</span>
								<span class="badge badge-outline">{scenario.difficulty}</span>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Messages Display -->
				<div class="space-y-4">
					{#each messages as message}
						<div class="space-y-2">
							<!-- Original message -->
							<MessageBubble
								message={{
									...message,
									conversationId: conversationId,
									sequenceId: null,
									translatedContent: null,
									sourceLanguage: null,
									targetLanguage: null,
									romanization: null,
									hiragana: null,
									otherScripts: null,
									audioUrl: null,
									isStreaming: null,
									hasCompleted: null,
									finishReason: null,
									toolCalls: null,
									toolCallResults: null,
									tokens: null,
									promptTokens: null,
									completionTokens: null,
									messageIntent: null
								} as any}
								clickToToggle={false}
							/>

							<!-- Error analysis -->
							{#if showComparison && message.role === 'user' && (message.errors || message.expected)}
								<div class="bg-base ml-14 rounded-lg border border-warning/20 p-4">
									<div
										class="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-content"
									>
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
												clip-rule="evenodd"
											></path>
										</svg>
										Grammar Analysis
									</div>

									{#if message.errors}
										<div class="mb-3">
											<div class="mb-1 text-sm font-medium text-base-content/80">Errors Found:</div>
											<ul class="list-inside list-disc space-y-1 text-sm text-base-content">
												{#each message.errors as error}
													<li>{error}</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if message.expected}
										<div class="rounded border border-success/20 bg-success p-3">
											<div
												class="mb-1 flex items-center gap-2 text-sm font-medium text-success-content"
											>
												<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
													<path
														fill-rule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
														clip-rule="evenodd"
													></path>
												</svg>
												Corrected Version:
											</div>
											<div class="text-sm text-base-content italic">"{message.expected}"</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Modules</h2>
				<label class="flex cursor-pointer items-center gap-2">
					<input type="checkbox" class="toggle toggle-sm" bind:checked={showModulesJson} />
					<span class="text-sm">Show JSON</span>
				</label>
			</div>

			{#if modules.length === 0}
				<p class="mt-2 text-base-content">Loading modules…</p>
			{:else}
				{#if showModulesJson}
					<!-- JSON Display -->
					<div class="mb-4 rounded-lg bg-base-200 p-4">
						<div class="mb-2 flex items-center gap-2">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
									clip-rule="evenodd"
								></path>
							</svg>
							<h4 class="font-medium">Modules JSON Data</h4>
						</div>
						<pre
							class="max-h-96 overflow-auto rounded bg-base-300 p-4 text-xs text-base-content/80">{JSON.stringify(
								modules,
								null,
								2
							)}</pre>
					</div>
				{/if}

				<div class="grid gap-4 md:grid-cols-2">
					{#each modules as module}
						<label class="flex cursor-pointer flex-col gap-2 rounded border border-base-300 p-4">
							<div class="flex items-center justify-between gap-3">
								<span class="font-medium">{module.label}</span>
								<input
									type="checkbox"
									class="toggle"
									checked={selectedModuleIds.has(module.id)}
									onchange={() => toggleModule(module.id)}
								/>
							</div>
							<p class="text-sm text-base-content">{module.description}</p>
							<div class="text-xs text-base-content/50">
								Modality: {module.modality}
								{module.tier ? `• Tier: ${module.tier}` : ''}
							</div>
						</label>
					{/each}
				</div>

				<!-- Selected Modules Summary -->
				{#if selectedModuleIds.size > 0}
					<div class="mt-4 rounded-lg border border-info/20 bg-info p-4">
						<div class="mb-2 flex items-center gap-2">
							<svg class="h-4 w-4 text-info" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								></path>
							</svg>
							<span class="font-medium text-info-content"
								>Selected Modules ({selectedModuleIds.size})</span
							>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each Array.from(selectedModuleIds) as moduleId}
								{@const module = modules.find((m) => m.id === moduleId)}
								{#if module}
									<span class="badge badge-sm badge-info">{module.label}</span>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</section>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Analysis Results</h2>
				<div class="flex gap-4">
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="toggle toggle-sm" bind:checked={showDebugInput} />
						<span class="text-sm">Show Debug Input</span>
					</label>
					{#if lastRun}
						<label class="flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="toggle toggle-sm" bind:checked={showRawAnalysis} />
							<span class="text-sm">Show Raw JSON</span>
						</label>
					{/if}
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-4">
				<button class="btn btn-primary" onclick={runAnalysis} disabled={isLoading}>
					{isLoading ? 'Running analysis…' : 'Run Analysis'}
				</button>
			</div>

			{#if errorMessage}
				<p class="mt-4 rounded bg-error/20 p-3 text-error">{errorMessage}</p>
			{/if}

			{#if showDebugInput}
				<!-- Debug Input Display -->
				<div class="mt-6 rounded-lg bg-base-200 p-4">
					<div class="mb-4 flex items-center gap-2">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							></path>
						</svg>
						<h4 class="font-semibold">Analysis Input Data</h4>
						<button
							class="btn ml-auto btn-outline btn-xs"
							onclick={() =>
								navigator.clipboard.writeText(
									JSON.stringify(
										{
											conversationId,
											languageCode,
											moduleIds: Array.from(selectedModuleIds),
											messages: messages.map((m) => ({
												id: m.id,
												role: m.role,
												content: m.content,
												timestamp: m.timestamp
											}))
										},
										null,
										2
									)
								)}>Copy Input JSON</button
						>
					</div>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h5 class="mb-2 font-medium text-base-content/80">Request Metadata</h5>
							<div class="rounded bg-base-300 p-3 text-xs">
								<div><strong>Conversation ID:</strong> {conversationId}</div>
								<div><strong>Language Code:</strong> {languageCode}</div>
								<div><strong>Selected Modules:</strong> {Array.from(selectedModuleIds).length}</div>
								<div><strong>Messages Count:</strong> {messages.length}</div>
								<div>
									<strong>User Messages:</strong>
									{messages.filter((m) => m.role === 'user').length}
								</div>
							</div>
						</div>
						<div>
							<h5 class="mb-2 font-medium text-base-content/80">Selected Module IDs</h5>
							<div class="rounded bg-base-300 p-3 text-xs">
								<pre>{JSON.stringify(Array.from(selectedModuleIds), null, 2)}</pre>
							</div>
						</div>
					</div>
					<div class="mt-4">
						<h5 class="mb-2 font-medium text-base-content/80">Messages for Analysis</h5>
						<pre
							class="max-h-64 overflow-auto rounded bg-base-300 p-3 text-xs text-base-content/80">{JSON.stringify(
								messages.map((m) => ({
									id: m.id,
									role: m.role,
									content: m.content,
									timestamp: m.timestamp
								})),
								null,
								2
							)}</pre>
					</div>
				</div>
			{/if}

			{#if lastRun}
				<div class="mt-6 space-y-6">
					<!-- Usage Impact Info -->
					<div class="rounded-lg border border-success/20 bg-success p-4">
						<div class="mb-2 flex items-center gap-2">
							<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
									clip-rule="evenodd"
								></path>
							</svg>
							<h3 class="font-semibold text-success-content">Analysis Complete</h3>
						</div>
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
							<div>
								<span class="text-success-content">Conversation ID:</span>
								<span class="font-mono text-success-content">{lastRun.conversationId}</span>
							</div>
							<div>
								<span class="text-success-content">Modules Run:</span>
								<span class="font-medium text-success-content"
									>{lastRun.moduleResults?.length || 0}</span
								>
							</div>
							<div>
								<span class="text-success-content">Messages Analyzed:</span>
								<span class="font-medium text-success-content">{messages.length}</span>
							</div>
						</div>
					</div>

					<!-- Usage Counter Display -->
					{#if usageInfo}
						<div class="rounded-lg border border-info/20 bg-info p-4">
							<div class="mb-3 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg class="h-5 w-5 text-info" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 6a1 1 0 100-2 1 1 0 000 2z"
											clip-rule="evenodd"
										></path>
									</svg>
									<h3 class="font-semibold text-info-content">Usage Impact</h3>
								</div>
								<label class="flex cursor-pointer items-center gap-2">
									<input type="checkbox" class="toggle toggle-sm" bind:checked={showUsageDetails} />
									<span class="text-xs text-info-content">Details</span>
								</label>
							</div>

							<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.analysesUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Total Analyses</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.basicAnalysesUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Basic Analyses</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.advancedGrammarUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Advanced Grammar</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.fluencyAnalysisUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Fluency Analysis</div>
								</div>
							</div>

							{#if showUsageDetails && usageInfo.current}
								<div class="mt-4 border-t border-info/20 pt-4">
									<h4 class="mb-2 font-medium text-info-content">Detailed Usage Breakdown</h4>
									<div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
										<div class="space-y-1">
											<div class="flex justify-between">
												<span>Quick Stats Used:</span><span class="font-mono"
													>{usageInfo.current.quickStatsUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Grammar Suggestions:</span><span class="font-mono"
													>{usageInfo.current.grammarSuggestionsUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Phrase Suggestions:</span><span class="font-mono"
													>{usageInfo.current.phraseSuggestionsUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Pronunciation Analysis:</span><span class="font-mono"
													>{usageInfo.current.pronunciationAnalysisUsed || 0}</span
												>
											</div>
										</div>
										<div class="space-y-1">
											<div class="flex justify-between">
												<span>Speech Rhythm:</span><span class="font-mono"
													>{usageInfo.current.speechRhythmUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Audio Suggestions:</span><span class="font-mono"
													>{usageInfo.current.audioSuggestionUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Onboarding Profile:</span><span class="font-mono"
													>{usageInfo.current.onboardingProfileUsed || 0}</span
												>
											</div>
											<div class="flex justify-between text-info-content/60">
												<span>Period:</span><span class="font-mono"
													>{usageInfo.current.period || 'N/A'}</span
												>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if suggestions.length > 0}
						<div class="rounded-lg border border-base-300 bg-base-100 p-4">
							<div class="mb-3 flex items-center justify-between">
								<div>
									<h4 class="text-lg font-semibold">Conversation Suggestions</h4>
									<p class="text-sm text-base-content/70">
										Keep the transcript visible while expanding targeted grammar and politeness nudges.
									</p>
								</div>
								<span class="badge badge-neutral badge-sm">{suggestions.length} suggestions</span>
							</div>
						<UnifiedConversationBubble {messages} {suggestions} />
						</div>
					{/if}

					{#if findingsError}
						<div class="alert alert-warning">
							<span class="icon-[mdi--alert] h-5 w-5"></span>
							<div>
								<h4 class="font-semibold">Logbook Drafts Unavailable</h4>
								<p class="text-sm">{findingsError}</p>
							</div>
						</div>
					{/if}

					{#if findingDrafts.length > 0}
						<div class="rounded-lg border border-base-300 bg-base-100 p-4">
							<div class="mb-3 flex items-center justify-between gap-4">
								<div>
									<h4 class="text-lg font-semibold">Logbook Draft Entries</h4>
									<p class="text-sm text-base-content/70">
										Objects mirror <code>analysis_findings</code> rows so we can inspect the
										analysis → logbook flow end-to-end.
									</p>
								</div>
								<label class="flex cursor-pointer items-center gap-2">
									<input type="checkbox" class="toggle toggle-sm" bind:checked={showFindingsJson} />
									<span class="text-sm">Show JSON</span>
								</label>
							</div>

							{#if showFindingsJson}
								<pre class="max-h-72 overflow-auto rounded bg-base-200 p-4 text-xs text-base-content/80">{JSON.stringify(
									findingDrafts,
									null,
									2
								)}</pre>
							{:else}
								<div class="overflow-auto">
									<table class="table table-sm">
										<thead>
											<tr>
												<th>Feature</th>
												<th>Original</th>
												<th>Suggested</th>
												<th>Severity</th>
												<th>Offsets</th>
											</tr>
										</thead>
										<tbody>
											{#each findingDrafts as finding}
												<tr>
													<td class="font-medium">{finding.featureLabel}</td>
													<td class="whitespace-pre-wrap">{finding.originalText}</td>
													<td class="whitespace-pre-wrap text-success">{finding.suggestedText}</td>
													<td>
														<span class="badge badge-outline badge-sm">{finding.severity}</span>
													</td>
													<td class="text-xs text-base-content/60">
														{finding.offsetStart ?? '—'} → {finding.offsetEnd ?? '—'}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}

					{#if showRawAnalysis}
						<!-- Raw JSON Display -->
						<div class="rounded-lg bg-base-200 p-4">
							<div class="mb-4 flex items-center gap-2">
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
										clip-rule="evenodd"
									></path>
								</svg>
								<h4 class="font-semibold">Raw Analysis JSON</h4>
								<button
									class="btn ml-auto btn-outline btn-xs"
									onclick={() => navigator.clipboard.writeText(JSON.stringify(lastRun, null, 2))}
									>Copy JSON</button
								>
							</div>
							<pre
								class="max-h-96 overflow-auto rounded bg-base-300 p-4 text-xs text-base-content/80">{JSON.stringify(
									lastRun,
									null,
									2
								)}</pre>
						</div>
					{/if}

					<!-- Formatted Results -->
					<div class="space-y-4">
						<h3 class="flex items-center gap-2 font-semibold">
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							Module Results
						</h3>
						{#each lastRun.moduleResults as moduleResult, index}
							<div class="bg-base-50 rounded-lg border border-base-300 p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="badge badge-sm badge-primary">{index + 1}</span>
										<span class="font-semibold text-base-content">{moduleResult.moduleId}</span>
									</div>
									{#if modules.find((m) => m.id === moduleResult.moduleId)}
										{@const module = modules.find((m) => m.id === moduleResult.moduleId)}
										{#if module}
											<div class="flex gap-1">
												<span class="badge badge-outline badge-xs">{module.modality}</span>
												{#if module.tier}
													<span class="badge badge-outline badge-xs">{module.tier}</span>
												{/if}
											</div>
										{/if}
									{/if}
								</div>

								{#if moduleResult.summary}
									<div class="mb-3">
										<h4 class="mb-1 text-sm font-medium text-base-content/80">Summary:</h4>
										<p class="rounded border-l-4 border-primary bg-base-100 p-3 text-base-content">
											{moduleResult.summary}
										</p>
									</div>
								{/if}

								{#if moduleResult.recommendations?.length}
									<div>
										<h4
											class="mb-2 flex items-center gap-1 text-sm font-medium text-base-content/80"
										>
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
												<path
													fill-rule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
													clip-rule="evenodd"
												></path>
											</svg>
											Recommendations ({moduleResult.recommendations.length}):
										</h4>
										<ul class="space-y-2">
											{#each moduleResult.recommendations as recommendation, recIndex}
												<li class="flex items-start gap-2 text-sm text-base-content/80">
													<span class="mt-0.5 badge badge-xs badge-info">{recIndex + 1}</span>
													<span>{recommendation}</span>
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if moduleResult.data && Object.keys(moduleResult.data).length > 0}
									<details class="mt-3">
										<summary
											class="flex cursor-pointer items-center gap-1 text-sm font-medium text-base-content/60 hover:text-base-content"
										>
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
												<path
													fill-rule="evenodd"
													d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z"
													clip-rule="evenodd"
												></path>
											</svg>
											Module Data (Click to expand)
										</summary>
										<pre
											class="mt-2 max-h-48 overflow-auto rounded bg-base-200 p-3 text-xs text-base-content">{JSON.stringify(
												moduleResult.data,
												null,
												2
											)}</pre>
									</details>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Language Level Assessment Demo -->
		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">🎯 Language Level Assessment (New!)</h2>
			<div class="grid gap-6 md:grid-cols-2">
				<div class="space-y-4">
					<h3 class="flex items-center gap-2 text-lg font-medium">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						CEFR-to-Practical Mapping
					</h3>
					<div class="space-y-2 text-sm">
						<div class="rounded border border-blue-200 bg-blue-50 p-3">
							<div class="font-medium text-blue-900">A1.1-A1.2: Basic Talk</div>
							<div class="text-blue-700">Greetings, simple phrases, everyday conversations</div>
						</div>
						<div class="rounded border border-green-200 bg-green-50 p-3">
							<div class="font-medium text-green-900">B1.1: Converse with Strangers</div>
							<div class="text-green-700">Comfortable conversations with new people</div>
						</div>
						<div class="rounded border border-purple-200 bg-purple-50 p-3">
							<div class="font-medium text-purple-900">B2.1: University Level</div>
							<div class="text-purple-700">Academic discussions, complex topics</div>
						</div>
						<div class="rounded border border-orange-200 bg-orange-50 p-3">
							<div class="font-medium text-orange-900">B2.2: Work Conversations</div>
							<div class="text-orange-700">Professional settings, meetings, presentations</div>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<h3 class="flex items-center gap-2 text-lg font-medium">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
							></path>
						</svg>
						Confidence-First Approach
					</h3>
					<div class="space-y-3 text-sm">
						<div class="rounded border border-success/20 bg-success p-3">
							<div class="font-medium text-success-content">🌟 High Confidence</div>
							<div class="text-success-content/80">
								Initiates conversations, recovers from mistakes gracefully
							</div>
						</div>
						<div class="rounded border border-warning/20 bg-warning p-3">
							<div class="font-medium text-warning-content">💪 Building Confidence</div>
							<div class="text-warning-content/80">
								Uses complex structures, self-corrects occasionally
							</div>
						</div>
						<div class="rounded border border-info/20 bg-info p-3">
							<div class="font-medium text-info-content">🌱 Growing Confidence</div>
							<div class="text-info-content/80">Taking brave first steps, building foundation</div>
						</div>
					</div>

					<div class="mt-4 rounded border border-primary/20 bg-primary p-4">
						<h4 class="mb-2 font-medium text-primary-content">💡 Why Confidence Matters</h4>
						<p class="text-sm text-primary-content/80">
							Research shows that confident learners progress faster, retain more, and are more
							likely to continue learning. Unlike Duolingo's focus on streaks, we measure real
							conversational confidence.
						</p>
					</div>
				</div>
			</div>

			<!-- Test Assessment Button -->
			<div class="mt-6 rounded-lg bg-base-200 p-4">
				<h4 class="mb-3 font-medium">🧪 Test the Assessment API</h4>
				<p class="mb-3 text-sm text-base-content">
					Click below to test the language level assessment with the current scenario messages:
				</p>
				<button
					class="btn btn-primary"
					onclick={async () => {
						try {
							const response = await fetch('/api/analysis/assess-level', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									languageCode,
									messages: messages
										.filter((m) => m.role === 'user')
										.map((m) => ({
											id: m.id,
											role: m.role,
											content: m.content,
											timestamp: m.timestamp?.toISOString()
										})),
									includeRecommendations: true
								})
							});
							const data = await response.json();
							console.log('Assessment Result:', data);
							alert(
								`Level: ${data.assessment?.currentLevel?.practicalLevel || 'Unknown'} (${data.assessment?.currentLevel?.cefrLevel || 'N/A'})\nConfidence: ${data.assessment?.confidenceLevel || 'Unknown'}`
							);
						} catch (error) {
							console.error('Assessment failed:', error);
							alert('Assessment failed - check console for details');
						}
					}}
				>
					🎯 Run Language Assessment
				</button>
				<div class="mt-2 text-xs text-base-content/60">
					Check browser console for detailed results
				</div>
			</div>
		</section>

		<!-- Reviewable State Demo -->
		<section class="rounded-lg bg-base-100 p-6 shadow">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">📋 Reviewable State Demo</h2>
				<label class="flex cursor-pointer items-center gap-2">
					<input type="checkbox" class="toggle toggle-primary" bind:checked={showReviewableDemo} />
					<span>Show Demo</span>
				</label>
			</div>

			{#if showReviewableDemo}
				<div class="rounded-lg border border-info/20 bg-info/10 p-4 mb-4">
					<h3 class="mb-2 font-medium text-info-content">🎭 Full Reviewable State Experience</h3>
					<p class="text-sm text-info-content/80">
						This demonstrates the complete conversation review experience with UnifiedConversationBubble integration,
						including hover highlighting for suggestions.
					</p>
				</div>

				<!-- Mock language object for the demo -->
				{@const mockLanguage = { code: 'en', name: 'English', emoji: '🇺🇸' }}
				{@const mockMessages = messages.map(msg => ({
					...msg,
					conversationId: conversationId,
					sequenceId: null,
					translatedContent: null,
					sourceLanguage: null,
					targetLanguage: null,
					userNativeLanguage: null,
					romanization: null,
					hiragana: null,
					otherScripts: null,
					speechTimings: null,
					translationConfidence: null,
					translationProvider: null,
					translationNotes: null,
					isTranslated: false,
					grammarAnalysis: null,
					vocabularyAnalysis: null,
					pronunciationScore: null,
					audioUrl: null,
					audioDuration: null,
					difficultyLevel: null,
					learningTags: null,
					conversationContext: null,
					messageIntent: null
				}))}

				<div class="rounded-lg border border-base-300 bg-base-50 p-4">
					<ConversationReviewableState
						messages={mockMessages}
						language={mockLanguage}
						onStartNewConversation={() => alert('Start new conversation clicked')}
						onAnalyzeConversation={() => alert('Analyze conversation clicked')}
						onGoHome={() => alert('Go home clicked')}
						analysisResults={null}
						showAnalysisResults={false}
					/>
				</div>
			{/if}
		</section>

		<!-- Server Console Logging -->
		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">🔍 Server Debug Console</h2>
			<div class="rounded-lg border border-info/20 bg-info p-4">
				<h3 class="mb-3 font-medium text-info-content">Real-time OpenAI Debugging</h3>
				<p class="text-sm text-info-content/80">
					The analysis modules now use real OpenAI processing. Check your server console to see:
				</p>
				<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-info-content/80">
					<li>
						<strong>🤖 Raw Request to OpenAI:</strong> Full request payload with prompts and settings
					</li>
					<li><strong>🤖 Raw Response from OpenAI:</strong> Complete API response with metadata</li>
					<li><strong>🚨 API Errors:</strong> Detailed error logging with request context</li>
				</ul>
				<div class="mt-4 rounded border border-info/10 bg-info/5 p-3">
					<div class="font-mono text-xs text-info-content">
						<div>📊 Request tracking includes:</div>
						<div class="ml-2">• Timestamp and payload</div>
						<div class="ml-2">• Message count and character counts</div>
						<div class="ml-2">• Model and parameters used</div>
						<br />
						<div>📈 Response tracking includes:</div>
						<div class="ml-2">• Full OpenAI response object</div>
						<div class="ml-2">• Token usage statistics</div>
						<div class="ml-2">• Finish reason and response length</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
