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

	const STORAGE_KEY = 'kaiwa_dev_roadmap_v1';

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
		context: 'Have 5 people actively sharing Kaiwa within the next 1.5 weeks.'
	});

	let monthlyMilestones = $state<RoadmapItem[]>([
		{
			id: 'mkt-funnel-upgrade',
			title: 'Upgrade top-of-funnel storytelling',
			detail:
				'Refresh home/about pages with clarified positioning and emotional narrative to highlight Kaiwa vs. chatGPT Realtime.',
			status: 'in-progress',
			owner: 'Product',
			due: 'May — Week 4'
		},
		{
			id: 'analysis-ux-polish',
			title: 'Ship coached analysis loop',
			detail:
				'Reframe quick analysis into a “growth playbook” with coach verdict, confidence trend, and next drill teasers.',
			status: 'todo',
			owner: 'Design',
			due: 'June — Week 1'
		},
		{
			id: 'sharing-experiment',
			title: 'Sharing flywheel experiment',
			detail: 'Instrument share prompts and capture what compels users to invite 5 friends each.',
			status: 'todo',
			owner: 'Growth',
			due: 'June — Week 2'
		}
	]);

	let weeklySprint = $state<RoadmapItem[]>([
		{
			id: 'roadmap-live',
			title: 'Publish dev roadmap hub',
			detail:
				'Create dev/roadmap with DaisyUI timeline, goal tracker, and weekly operating cadence.',
			status: 'in-progress',
			owner: 'Dev',
			due: 'Mon'
		},
		{
			id: 'analysis-copy',
			title: 'Draft analysis “Coach Verdict” copy',
			detail: 'Write tone/voice for quick analysis sections and preview CTA for full report.',
			status: 'todo',
			owner: 'Product Marketing',
			due: 'Wed'
		},
		{
			id: 'share-loop',
			title: 'Instrument share goal tracking',
			detail: 'Connect ShareKaiwa events to PostHog dashboards and daily alert.',
			status: 'todo',
			owner: 'Growth',
			due: 'Thu'
		},
		{
			id: 'weekly-retro',
			title: 'Friday retro + next sprint brief',
			detail: 'Review weekly roadmap outcomes, mark DONE, draft following week on call.',
			status: 'todo',
			owner: 'Team',
			due: 'Fri'
		}
	]);

	let dailyFocus = $state<RoadmapItem[]>([
		{
			id: 'daily-standup',
			title: '09:30 Update dev roadmap',
			detail: 'Toggle daily items, adjust blockers, log quick notes.',
			status: 'todo',
			owner: 'Hiro',
			due: 'Morning'
		},
		{
			id: 'feature-polish',
			title: 'Polish quick analysis headers',
			detail: 'Implement status badges + highlight for scenario vs onboarding variants.',
			status: 'todo',
			owner: 'Dev',
			due: 'Focus block'
		},
		{
			id: 'outreach-touch',
			title: 'Ping 2 potential sharers',
			detail: 'Personal outreach or request for share stories to hit 5 goal.',
			status: 'todo',
			owner: 'Hiro',
			due: 'Afternoon'
		},
		{
			id: 'end-of-day',
			title: '17:00 Snapshot & notes',
			detail: 'Mark items DONE, capture learnings, prep for tomorrow.',
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

		<div class="tabs-lifted tabs">
			<a
				class={`tab ${activeView === 'month' ? 'tab-active' : ''}`}
				onclick={() => (activeView = 'month')}
			>
				Monthly
			</a>
			<a
				class={`tab ${activeView === 'week' ? 'tab-active' : ''}`}
				onclick={() => (activeView = 'week')}
			>
				Weekly
			</a>
			<a
				class={`tab ${activeView === 'day' ? 'tab-active' : ''}`}
				onclick={() => (activeView = 'day')}
			>
				Daily
			</a>
		</div>

		{#if activeView === 'month'}
			<div class="space-y-4">
				{#each monthlyMilestones as item}
					<div class="card bg-base-100 shadow">
						<div class="card-body">
							<div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<div>
									<h3 class="card-title">{item.title}</h3>
									<p class="text-sm text-base-content/70">{item.detail}</p>
								</div>
								<div class="flex flex-col items-end gap-2 text-sm">
									{#if item.owner}
										<span class="badge badge-outline">{item.owner}</span>
									{/if}
									{#if item.due}
										<span class="text-xs text-base-content/60">{item.due}</span>
									{/if}
									<span class={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
									<button class="btn btn-xs" onclick={() => cycleItem('month', item.id)}
										>Cycle Status</button
									>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if activeView === 'week'}
			<div class="grid gap-4 md:grid-cols-2">
				{#each weeklySprint as item}
					<div class="card bg-base-100 shadow">
						<div class="card-body">
							<div class="flex items-start justify-between gap-4">
								<div>
									<h3 class="card-title">{item.title}</h3>
									<p class="text-sm text-base-content/70">{item.detail}</p>
								</div>
								<div class="flex flex-col items-end gap-2 text-sm">
									{#if item.due}
										<span class="badge badge-ghost badge-sm">Due {item.due}</span>
									{/if}
									{#if item.owner}
										<span class="badge badge-outline badge-sm">{item.owner}</span>
									{/if}
									<span class={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
									<button class="btn btn-xs" onclick={() => cycleItem('week', item.id)}
										>Cycle Status</button
									>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="card bg-base-100 shadow">
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>Task</th>
									<th>Owner</th>
									<th>When</th>
									<th>Status</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each dailyFocus as item}
									<tr>
										<td>
											<div class="font-semibold">{item.title}</div>
											<div class="text-xs text-base-content/70">{item.detail}</div>
										</td>
										<td class="text-sm">{item.owner}</td>
										<td class="text-sm">{item.due}</td>
										<td>
											<span class={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
										</td>
										<td>
											<button class="btn btn-ghost btn-xs" onclick={() => cycleItem('day', item.id)}
												>Cycle</button
											>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
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
