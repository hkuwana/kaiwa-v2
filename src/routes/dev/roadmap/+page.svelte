<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';

	type Status = 'todo' | 'in-progress' | 'done';

	interface RoadmapItem {
		id: string;
		title: string;
		detail?: string;
		status: Status;
		owner?: string;
		due?: string;
	}

	interface ShareGoalState {
		target: number;
		current: number;
		deadlineISO: string;
		context: string;
	}

	const STORAGE_KEY = 'kaiwa_dev_roadmap_v2';

	const statusCycle: Status[] = ['todo', 'in-progress', 'done'];

	let activeView: 'month' | 'week' | 'day' = $state('week');

	let shareGoal = $state<ShareGoalState>({
		target: 5,
		current: 1,
		deadlineISO: (() => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			return date.toISOString();
		})(),
		context: 'Turn Growth Playbook wins into 5 share stories in the next 10 days.'
	});

	let monthlyMilestones = $state<RoadmapItem[]>([
		{
			id: 'growth-playbook-launch',
			title: 'Launch Growth Playbook loop',
			detail:
				'Link analysis runs to persona-aware celebrations and next-scenario CTA for relationship navigators first.',
			status: 'in-progress',
			owner: 'Product',
			due: 'June — Week 1'
		},
		{
			id: 'retention-flywheel',
			title: 'Automate 5-minute reminder flywheel',
			detail:
				'Pair analysis usage with reminder preferences to trigger Resend nudges and scenario deep links.',
			status: 'todo',
			owner: 'Lifecycle',
			due: 'June — Week 1'
		},
		{
			id: 'scenario-mastery-system',
			title: 'Ship scenario mastery telemetry',
			detail:
				'Blend attempts, outcomes, and comfort ratings into mastery scores powering share prompts.',
			status: 'todo',
			owner: 'Data',
			due: 'June — Week 2'
		}
	]);

	let weeklySprint = $state<RoadmapItem[]>([
		{
			id: 'growth-playbook-service',
			title: 'Wire Growth Playbook service',
			detail:
				'Expose celebration copy + next scenario CTA from analysis store using persona-aware templates.',
			status: 'in-progress',
			owner: 'Dev',
			due: 'Mon'
		},
		{
			id: 'reminder-scheduler',
			title: 'Design reminder cadence + Resend template',
			detail:
				'Model cadence from usage data and segment by challenge preference for 5-minute nudges.',
			status: 'todo',
			owner: 'Lifecycle',
			due: 'Tue'
		},
		{
			id: 'mastery-score',
			title: 'Draft scenario mastery scoring',
			detail:
				'Blend attempts, outcomes, and comfort ratings, persist to userPreferences + PostHog.',
			status: 'todo',
			owner: 'Data',
			due: 'Wed'
		},
		{
			id: 'share-template-experiment',
			title: 'Ship post-analysis share strip',
			detail: 'Attach share CTA with Growth Playbook insight and track launches vs shares.',
			status: 'todo',
			owner: 'Growth',
			due: 'Thu'
		},
		{
			id: 'posthog-dashboard',
			title: 'Build retention & share dashboard',
			detail: 'Chart conversations/week, reminder sends, CTA clicks to monitor new loops.',
			status: 'todo',
			owner: 'Analytics',
			due: 'Fri'
		}
	]);

	let dailyFocus = $state<RoadmapItem[]>([
		{
			id: 'persona-copy-review',
			title: '09:30 Growth Playbook voice check',
			detail: 'Review relationship navigator tone for celebration snippets and CTA language.',
			status: 'todo',
			owner: 'Product Marketing',
			due: 'Morning'
		},
		{
			id: 'reminder-qa',
			title: 'QA reminder deep links',
			detail: 'Validate scenario pre-selection + login path for upcoming Resend flow.',
			status: 'todo',
			owner: 'Dev',
			due: 'Focus block'
		},
		{
			id: 'mastery-data-review',
			title: 'Inspect mastery telemetry',
			detail: 'Spot-check scenario attempt/outcome data and align with analytics events.',
			status: 'todo',
			owner: 'Data',
			due: 'Afternoon'
		},
		{
			id: 'share-metrics-sync',
			title: '17:00 Share loop pulse',
			detail: 'Review CTA clicks vs launches, capture learnings, prep notes for tomorrow.',
			status: 'todo',
			owner: 'Hiro',
			due: 'EOD'
		}
	]);

	function sectionKeyToState(section: 'month' | 'week' | 'day') {
		switch (section) {
			case 'month':
				return monthlyMilestones;
			case 'week':
				return weeklySprint;
			default:
				return dailyFocus;
		}
	}

	function cycleItem(section: 'month' | 'week' | 'day', id: string) {
		const list = sectionKeyToState(section);
		const updated = list.map((item) => {
			if (item.id !== id) return item;
			const nextIndex = (statusCycle.indexOf(item.status) + 1) % statusCycle.length;
			return { ...item, status: statusCycle[nextIndex] };
		});
		if (section === 'month') {
			monthlyMilestones = updated;
		} else if (section === 'week') {
			weeklySprint = updated;
		} else {
			dailyFocus = updated;
		}
		persist();
	}

	function updateShareGoal(delta: number) {
		shareGoal = {
			...shareGoal,
			current: Math.max(0, Math.min(shareGoal.target, shareGoal.current + delta))
		};
		persist();
	}

	function updateDeadline(event: Event) {
		const input = event.target as HTMLInputElement;
		shareGoal = { ...shareGoal, deadlineISO: input.value };
		persist();
	}

	function persist() {
		if (!browser) return;
		try {
			const payload = {
				shareGoal,
				monthlyMilestones,
				weeklySprint,
				dailyFocus
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch (error) {
			console.warn('Unable to persist roadmap state', error);
		}
	}

	onMount(() => {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (parsed.shareGoal) shareGoal = parsed.shareGoal;
			if (Array.isArray(parsed.monthlyMilestones)) monthlyMilestones = parsed.monthlyMilestones;
			if (Array.isArray(parsed.weeklySprint)) weeklySprint = parsed.weeklySprint;
			if (Array.isArray(parsed.dailyFocus)) dailyFocus = parsed.dailyFocus;
		} catch (error) {
			console.warn('Unable to load roadmap state', error);
		}
	});

	function statusBadgeClass(status: Status) {
		switch (status) {
			case 'done':
				return 'badge badge-success badge-sm';
			case 'in-progress':
				return 'badge badge-warning badge-sm';
			default:
				return 'badge badge-neutral badge-sm';
		}
	}

	function statusLabel(status: Status) {
		switch (status) {
			case 'done':
				return 'Done';
			case 'in-progress':
				return 'In Progress';
			default:
				return 'To Do';
		}
	}

	function goalProgress() {
		return shareGoal.target === 0 ? 0 : Math.round((shareGoal.current / shareGoal.target) * 100);
	}

	function daysRemaining() {
		if (!shareGoal.deadlineISO) return null;
		const now = new Date();
		const deadline = new Date(shareGoal.deadlineISO);
		const diff = deadline.getTime() - now.getTime();
		return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
	}

	function goDevMarketing() {
		goto(resolve('/dev/marketing'));
	}
	function goHome() {
		goto(resolve('/'));
	}
</script>

<svelte:head>
	<title>Dev — Roadmap</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200 pb-16">
	<div class="container mx-auto max-w-5xl space-y-8 px-4 py-10">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-3xl font-bold">Dev — Roadmap Control Center</h1>
				<p class="text-base-content/70">
					Monday plan → weekly sprint → daily check-ins. Regenerate weekly, review monthly, update
					daily.
				</p>
			</div>
			<div class="flex gap-2">
				<button class="btn btn-sm" onclick={goHome}>Home</button>
				<button class="btn btn-sm" onclick={goDevMarketing}>Marketing Hub</button>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title">Primary Growth Goal</h2>
					<p class="text-sm text-base-content/70">{shareGoal.context}</p>
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-4">
							<div
								class="radial-progress text-primary"
								style={`--value:${goalProgress()}; --size:5rem; --thickness:0.6rem;`}
							>
								{goalProgress()}%
							</div>
							<div>
								<p class="text-sm font-semibold">
									{shareGoal.current} / {shareGoal.target} sharers
								</p>
								<p class="text-xs text-base-content/60">
									{#if daysRemaining() !== null}
										{daysRemaining()} days left
									{:else}
										Set a deadline to track pace
									{/if}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<button class="btn btn-xs" onclick={() => updateShareGoal(-1)}>-1</button>
							<button class="btn btn-xs" onclick={() => updateShareGoal(1)}>+1</button>
						</div>
					</div>
					<label class="form-control w-full">
						<div class="label"><span class="label-text">Deadline</span></div>
						<input
							type="date"
							class="input-bordered input"
							value={shareGoal.deadlineISO ? shareGoal.deadlineISO.slice(0, 10) : ''}
							onchange={updateDeadline}
						/>
					</label>
				</div>
			</div>

			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title">Operating Cadence</h2>
					<ul class="timeline timeline-vertical timeline-compact">
						<li>
							<div class="timeline-start">Monday</div>
							<div class="timeline-middle">
								<span class="badge badge-sm badge-primary">Week Kickoff</span>
							</div>
							<div class="timeline-end timeline-box">
								Regenerate weekly roadmap, align owners, set sprint goal tied to share target.
							</div>
						</li>
						<li>
							<hr />
						</li>
						<li>
							<div class="timeline-start">Daily</div>
							<div class="timeline-middle">
								<span class="badge badge-sm badge-warning">Noon Check</span>
							</div>
							<div class="timeline-end timeline-box">
								Update status, note blockers, ensure outreach touches for share goal.
							</div>
						</li>
						<li>
							<hr />
						</li>
						<li>
							<div class="timeline-start">Friday</div>
							<div class="timeline-middle">
								<span class="badge badge-sm badge-secondary">Retro</span>
							</div>
							<div class="timeline-end timeline-box">
								Mark DONE, archive learnings, roll unfinished items into next Monday plan.
							</div>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="tabs-lifted tabs" role="tablist" aria-label="Roadmap view selection">
			<button
				type="button"
				class={`tab ${activeView === 'month' ? 'tab-active' : ''}`}
				role="tab"
				aria-selected={activeView === 'month'}
				id="roadmap-month-tab"
				onclick={() => (activeView = 'month')}
				aria-controls="roadmap-month-panel"
			>
				Monthly
			</button>
			<button
				type="button"
				class={`tab ${activeView === 'week' ? 'tab-active' : ''}`}
				role="tab"
				aria-selected={activeView === 'week'}
				id="roadmap-week-tab"
				onclick={() => (activeView = 'week')}
				aria-controls="roadmap-week-panel"
			>
				Weekly
			</button>
			<button
				type="button"
				class={`tab ${activeView === 'day' ? 'tab-active' : ''}`}
				role="tab"
				aria-selected={activeView === 'day'}
				id="roadmap-day-tab"
				onclick={() => (activeView = 'day')}
				aria-controls="roadmap-day-panel"
			>
				Daily
			</button>
		</div>

		{#if activeView === 'month'}
			<div
				class="overflow-x-auto"
				id="roadmap-month-panel"
				role="tabpanel"
				aria-labelledby="roadmap-month-tab"
			>
				<table class="table-pin-rows table table-sm">
					<thead>
						<tr>
							<th>#</th>
							<th>Milestone</th>
							<th>Owner</th>
							<th>Due</th>
							<th>Status</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each monthlyMilestones as item, index}
							<tr>
								<th>{index + 1}</th>
								<td>
									<div class="font-semibold">{item.title}</div>
									{#if item.detail}
										<div class="text-xs text-base-content/70">{item.detail}</div>
									{/if}
								</td>
								<td>{item.owner ?? '—'}</td>
								<td>{item.due ?? '—'}</td>
								<td>
									<span class={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
								</td>
								<td>
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => cycleItem('month', item.id)}
									>
										Next
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if activeView === 'week'}
			<div
				class="overflow-x-auto"
				id="roadmap-week-panel"
				role="tabpanel"
				aria-labelledby="roadmap-week-tab"
			>
				<table class="table table-zebra table-sm">
					<thead>
						<tr>
							<th>#</th>
							<th>Sprint Item</th>
							<th>Owner</th>
							<th>Due</th>
							<th>Status</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each weeklySprint as item, index}
							<tr>
								<th>{index + 1}</th>
								<td>
									<div class="font-semibold">{item.title}</div>
									{#if item.detail}
										<div class="text-xs text-base-content/70">{item.detail}</div>
									{/if}
								</td>
								<td>{item.owner ?? '—'}</td>
								<td>{item.due ?? '—'}</td>
								<td>
									<span class={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
								</td>
								<td>
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => cycleItem('week', item.id)}
									>
										Next
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div
				class="overflow-x-auto"
				id="roadmap-day-panel"
				role="tabpanel"
				aria-labelledby="roadmap-day-tab"
			>
				<table class="table table-sm">
					<thead>
						<tr>
							<th>#</th>
							<th>Focus</th>
							<th>Owner</th>
							<th>Due</th>
							<th>Status</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each dailyFocus as item, index}
							<tr>
								<th>{index + 1}</th>
								<td>
									<div class="font-semibold">{item.title}</div>
									{#if item.detail}
										<div class="text-xs text-base-content/70">{item.detail}</div>
									{/if}
								</td>
								<td>{item.owner ?? '—'}</td>
								<td>{item.due ?? '—'}</td>
								<td>
									<span class={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
								</td>
								<td>
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => cycleItem('day', item.id)}
									>
										Next
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<div class="alert alert-info">
			<span>
				<strong>Tip:</strong> Snapshot finished weeks by exporting this state (copy localStorage) before
				regenerating next Monday.
			</span>
		</div>
	</div>
</div>
