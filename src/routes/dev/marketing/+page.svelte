<script lang="ts">
	import { onMount } from 'svelte';
	import TemplateCard from './TemplateCard.svelte';

	type ChecklistItem = {
		id: string;
		label: string;
		done: boolean;
		link?: string;
		note?: string;
	};

	type DayPlan = {
		id: string;
		label: string;
		suggestedTime?: string;
		items: ChecklistItem[];
	};

	const DOCS = [
		{ label: 'Marketing Strategy', path: 'src/lib/docs/strategy-marketing.md' },
		{ label: '4-Week Plan', path: 'src/lib/docs/feedback-growth-4-week-plan.md' },
		{ label: 'Founder Email Strategy', path: 'src/lib/docs/strategy-founder-email.md' },
		{ label: 'Friend Outreach Playbook', path: 'src/lib/docs/friend-outreach-playbook.md' },
		{ label: 'Daily Content Guide', path: 'src/lib/docs/daily-content-creation-guide.md' },
		{ label: 'Content Calendar 2025', path: 'src/lib/docs/content-calendar-2025.md' },
		{ label: 'Interview Blog Template', path: 'src/lib/docs/blog-template-interview.md' },
		{
			label: 'Speech Speed Devlog (Design)',
			path: 'feedback_os/universal-speech-speed-solution.md'
		},
		// Video outlines (new)
		{
			label: 'Outline: Meet the Parents (Video)',
			path: 'marketing/video-outlines/meet-the-parents-scenario.md'
		},
		{
			label: 'Outline: Clinic Triage Case File',
			path: 'marketing/video-outlines/clinic-triage-case-file.md'
		},
		{
			label: 'Outline: Devlog – Speech Speed',
			path: 'marketing/video-outlines/devlog-universal-speech-speed.md'
		},
		{
			label: 'Pinned Comment Templates',
			path: 'marketing/video-outlines/pinned-comment-templates.md'
		}
	];

	// Weekly schedule combining Growth/Distribution and Feedback Ops cadence
	const DEFAULT_WEEK: DayPlan[] = [
		{
			id: 'mon',
			label: 'Monday — Research Ops + Reddit value',
			suggestedTime: '2h block',
			items: [
				{
					id: 'mon-ops-refresh',
					label: 'Refresh tracker; triage Kanban (ship/test/story)',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'mon-queue-outreach',
					label: 'Queue outreach (friend invites, email follow-ups)',
					done: false,
					link: 'src/lib/docs/friend-outreach-playbook.md'
				},
				{
					id: 'mon-reddit-threads',
					label: 'Answer 5–8 Reddit threads with pasteable scripts',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				},
				{
					id: 'mon-wins-fixes',
					label: 'Draft Wins & Fixes notes for Friday',
					done: false,
					link: 'WEEKLY_UPDATES_SYSTEM.md'
				}
			]
		},
		{
			id: 'tue',
			label: 'Tuesday — Live calls + Case File',
			suggestedTime: '2h block',
			items: [
				{
					id: 'tue-run-sessions',
					label: 'Run 1–2 Kaiwa sessions (screen share + notes)',
					done: false,
					link: 'src/lib/docs/friend-outreach-playbook.md'
				},
				{
					id: 'tue-log-notes',
					label: 'Log tagged notes; push action items to Kanban',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'tue-publish-casefile',
					label: 'Publish 1 Case File + crosspost; pin comment (tailor scripts)',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				}
			]
		},
		{
			id: 'wed',
			label: 'Wednesday — Founder emails',
			suggestedTime: '2h block',
			items: [
				{
					id: 'wed-sequence',
					label: 'Enroll new signups in Day 1/2/3 sequence',
					done: false,
					link: 'src/lib/docs/strategy-founder-email.md'
				},
				{
					id: 'wed-replies',
					label: 'Reply same-day; tag objections (#objection:time etc.)',
					done: false,
					link: 'src/lib/docs/strategy-founder-email.md'
				},
				{
					id: 'wed-snippet',
					label: 'Draft one Before/After insight snippet',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				}
			]
		},
		{
			id: 'thu',
			label: 'Thursday — Narrative + Short',
			suggestedTime: '2h block',
			items: [
				{
					id: 'thu-build-public',
					label: 'Publish build-in-public “what we fixed” post',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'thu-reel',
					label: 'Publish 1 Reel/Short (30–45s, bilingual lines + CTA)',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				},
				{
					id: 'thu-schedule',
					label: 'Schedule cross-posts (LinkedIn, X, Reddit)',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				}
			]
		},
		{
			id: 'fri',
			label: 'Friday — Follow-through',
			suggestedTime: '2h block',
			items: [
				{
					id: 'fri-patterns',
					label: 'Update Pattern Tracker counts; pick 1 shipped fix to highlight',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'fri-vip-update',
					label: 'Send VIP two-bullet update; queue weekend reminders',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'fri-lab-prep',
					label: 'Prep Saturday Practice Lab agenda + promo post',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				}
			]
		},
		{
			id: 'sat',
			label: 'Saturday — Practice Lab / Outreach',
			suggestedTime: '2h block',
			items: [
				{
					id: 'sat-host-lab',
					label: 'Host Practice Lab or AMA (record highlight moments)',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				},
				{
					id: 'sat-capture-quotes',
					label: 'Capture 2 anonymized quotes + 2 short clips',
					done: false,
					link: 'src/lib/docs/strategy-marketing.md'
				},
				{
					id: 'sat-followup',
					label: 'DM thank-you + invite to 1:1 sessions',
					done: false,
					link: 'src/lib/docs/friend-outreach-playbook.md'
				}
			]
		},
		{
			id: 'sun',
			label: 'Sunday — Reset + Changelog',
			suggestedTime: '2h block',
			items: [
				{
					id: 'sun-metrics',
					label: 'Review sessions, bookings, email metrics, content performance',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'sun-hooks',
					label: 'Draft next week’s hooks + Practice Lab theme',
					done: false,
					link: 'src/lib/docs/feedback-growth-4-week-plan.md'
				},
				{
					id: 'sun-changelog',
					label: 'Publish mini changelog (Wins & Fixes)',
					done: false,
					link: 'WEEKLY_UPDATES_SYSTEM.md'
				}
			]
		}
	];

	// Backlog items persisted locally for planning
	type BacklogItem = {
		id: string;
		title: string;
		category: 'Scenario' | 'Case File' | 'Short' | 'Devlog' | 'Interview';
		note?: string;
		done: boolean;
	};

	let week: DayPlan[] = $state([]);
	let backlog: BacklogItem[] = $state([]);
	let newBacklogTitle = $state('');
	let newBacklogCategory: BacklogItem['category'] = $state('Scenario');
	let newBacklogNote = $state('');

	const WEEK_KEY = 'dev-marketing-week-v1';
	const BACKLOG_KEY = 'dev-marketing-backlog-v1';

	function loadState() {
		try {
			const w = localStorage.getItem(WEEK_KEY);
			week = w ? JSON.parse(w) : DEFAULT_WEEK;
		} catch {
			week = DEFAULT_WEEK;
		}
		try {
			const b = localStorage.getItem(BACKLOG_KEY);
			backlog = b ? JSON.parse(b) : getSeedBacklog();
		} catch {
			backlog = getSeedBacklog();
		}
	}

	function saveState() {
		localStorage.setItem(WEEK_KEY, JSON.stringify(week));
		localStorage.setItem(BACKLOG_KEY, JSON.stringify(backlog));
	}

	function resetWeek() {
		const confirmed = window.confirm('Reset all weekly checkboxes?');
		if (!confirmed) return;
		week = DEFAULT_WEEK.map((d) => ({
			...d,
			items: d.items.map((i) => ({ ...i, done: false }))
		}));
		saveState();
	}

	function addBacklog() {
		if (!newBacklogTitle.trim()) return;
		backlog = [
			...backlog,
			{
				id: crypto.randomUUID(),
				title: newBacklogTitle.trim(),
				category: newBacklogCategory,
				note: newBacklogNote.trim() || undefined,
				done: false
			}
		];
		newBacklogTitle = '';
		newBacklogNote = '';
		saveState();
	}

	function removeBacklog(id: string) {
		backlog = backlog.filter((b) => b.id !== id);
		saveState();
	}

	function toggleItem(dayId: string, itemId: string) {
		week = week.map((d) =>
			d.id === dayId
				? { ...d, items: d.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
				: d
		);
		saveState();
	}

	function copyScheduleToClipboard() {
		const lines: string[] = [];
		lines.push('Kaiwa – Weekly Marketing & Feedback Schedule');
		for (const d of week) {
			lines.push(`\n${d.label} ${d.suggestedTime ? `(${d.suggestedTime})` : ''}`);
			for (const i of d.items) {
				lines.push(`- [${i.done ? 'x' : ' '}] ${i.label}${i.link ? ` — ${i.link}` : ''}`);
			}
		}
		navigator.clipboard.writeText(lines.join('\n'));
		console.log('Schedule copied to clipboard');
	}

	function getSeedBacklog(): BacklogItem[] {
		return [
			{
				id: crypto.randomUUID(),
				title: 'Scenario: Meet the Parents (JP) – 5–8 min',
				category: 'Scenario',
				done: false
			},
			{
				id: crypto.randomUUID(),
				title: 'Case File: Clinic Triage (JP) – 60–120s',
				category: 'Case File',
				done: false
			},
			{
				id: crypto.randomUUID(),
				title: 'Short: 3 lines to copy (Parents Dinner)',
				category: 'Short',
				done: false
			},
			{
				id: crypto.randomUUID(),
				title: 'Devlog: Universal Speech Speed (dual-layer)',
				category: 'Devlog',
				done: false
			},
			{
				id: crypto.randomUUID(),
				title: 'Interview highlight: ICP stakes + script',
				category: 'Interview',
				done: false
			}
		];
	}

	onMount(loadState);
</script>

<div class="container mx-auto max-w-6xl p-6 lg:p-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Dev: Marketing Planner</h1>
		<p class="mt-2 text-base-content/70">
			Organize weekly marketing tasks, schedule production, and jump to templates. Checkboxes
			persist locally.
		</p>
	</div>

	<!-- Quick Docs Links -->
	<div class="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
		{#each DOCS as d (d.path)}
			<a class="btn justify-start btn-outline btn-sm" href={d.path}>
				📄 {d.label}
			</a>
		{/each}
	</div>

	<!-- Weekly Schedule -->
	<div class="mb-10 rounded-xl border border-base-300 bg-base-200">
		<div class="flex items-center justify-between border-b border-base-300 p-4">
			<div>
				<h2 class="text-xl font-semibold">Weekly Schedule</h2>
				<p class="text-sm opacity-70">Based on strategy + 4-week operating plan</p>
			</div>
			<div class="flex gap-2">
				<button class="btn btn-ghost btn-sm" onclick={copyScheduleToClipboard}>Copy</button>
				<button class="btn btn-sm btn-error" onclick={resetWeek}>Reset</button>
			</div>
		</div>
		<div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
			{#each week as day (day.id)}
				<div class="card bg-base-100">
					<div class="card-body">
						<div class="flex items-center justify-between">
							<h3 class="card-title text-base">{day.label}</h3>
							{#if day.suggestedTime}
								<span class="badge badge-outline">{day.suggestedTime}</span>
							{/if}
						</div>
						<ul class="mt-2 space-y-2">
							{#each day.items as item (item.id)}
								<li class="flex items-start gap-3">
									<input
										class="checkbox mt-1 checkbox-sm"
										type="checkbox"
										checked={item.done}
										onchange={() => toggleItem(day.id, item.id)}
									/>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class={item.done ? 'line-through opacity-60' : ''}>{item.label}</span>
											{#if item.link}
												<a class="link text-xs link-primary" href={item.link}>ref</a>
											{/if}
										</div>
										{#if item.note}
											<div class="text-xs opacity-70">{item.note}</div>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Backlog / Pipeline -->
	<div class="mb-10 rounded-xl border border-base-300 bg-base-200">
		<div class="border-b border-base-300 p-4">
			<h2 class="text-xl font-semibold">Content Backlog</h2>
			<p class="text-sm opacity-70">
				Plan and track upcoming scenarios, case files, shorts, devlogs, and interviews.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<div class="space-y-2">
					{#each backlog as b (b.id)}
						<div
							class="flex items-start justify-between gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
						>
							<div class="flex items-start gap-3">
								<input
									class="checkbox mt-1 checkbox-sm"
									type="checkbox"
									bind:checked={b.done}
									onchange={saveState}
								/>
								<div>
									<div class="flex items-center gap-2">
										<span class={b.done ? 'line-through opacity-60' : ''}>{b.title}</span>
										<span class="badge badge-outline badge-sm">{b.category}</span>
									</div>
									{#if b.note}
										<div class="text-xs opacity-70">{b.note}</div>
									{/if}
								</div>
							</div>
							<button class="btn btn-ghost btn-xs" onclick={() => removeBacklog(b.id)}
								>Remove</button
							>
						</div>
					{/each}
				</div>
			</div>
			<div>
				<div class="card bg-base-100">
					<div class="card-body space-y-2">
						<h3 class="card-title text-base">Add Backlog Item</h3>
						<input
							class="input-bordered input input-sm"
							placeholder="Title"
							bind:value={newBacklogTitle}
						/>
						<select class="select-bordered select select-sm" bind:value={newBacklogCategory}>
							<option>Scenario</option>
							<option>Case File</option>
							<option>Short</option>
							<option>Devlog</option>
							<option>Interview</option>
						</select>
						<textarea
							class="textarea-bordered textarea textarea-sm"
							rows="3"
							placeholder="Notes (optional)"
							bind:value={newBacklogNote}
						></textarea>
						<button class="btn btn-sm btn-primary" onclick={addBacklog}>Add</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Templates & Snippets -->
	<div class="mb-12 rounded-xl border border-base-300 bg-base-200">
		<div class="border-b border-base-300 p-4">
			<h2 class="text-xl font-semibold">Templates</h2>
			<p class="text-sm opacity-70">
				Copy-ready outlines for Shorts, Scenario videos, Devlogs, and Pinned Comments.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
			<TemplateCard
				title="Short – Try This Line (30–45s)"
				content="Hook: Meeting parents in 7 days?\nLine 1 (JP+EN)\nLine 2 (JP+EN)\nRepair phrase (JP+EN)\nCTA: Comment your situation; I'll tailor a script."
			/>
			<TemplateCard
				title="Scenario Breakdown (5–8 min)"
				content="Cold open stakes + 2-line demo\nWhen to use\n3 lines + repair phrase (bilingual)\nShort-serve demo (short turns)\nCTA: Try the rehearsal now + reply if stuck."
			/>
			<TemplateCard
				title="Case File (60–120s)"
				content="Situation → Friction → Script → Outcome\nCTA: Get the template + Practice Lab invite."
			/>
			<TemplateCard
				title="Devlog – Universal Speech Speed"
				content="We heard: 'Speech too fast.'\nWe shipped: Dual-layer (AI pacing + playback slider).\nDemo: Toggle + immediate effect.\nHow to try: Advanced Audio → Speech Speed."
			/>
			<TemplateCard
				title="Pinned Comment"
				content="Get the exact script (Google Doc) + free Practice Lab on Saturday.\nTell me your situation; I'll tailor a one-pager for you."
			/>
			<TemplateCard
				title="Moderator Outreach"
				content="Founder here—offering a weekly free Practice Lab (no links in OP). I post scripts in-thread and answer every question. Happy to use flair and follow cadence you prefer."
			/>
		</div>
	</div>
</div>
