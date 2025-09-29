<script lang="ts">
	import { onMount } from 'svelte';

	interface MarketingMetric {
		name: string;
		value: number;
		change: number;
		changeType: 'increase' | 'decrease' | 'neutral';
		period: string;
		icon: string;
	}

	interface TrafficSource {
		source: string;
		visitors: number;
		conversions: number;
		conversionRate: number;
		revenue: number;
		trend: 'up' | 'down' | 'stable';
	}

	interface ContentPerformance {
		title: string;
		url: string;
		views: number;
		engagement: number;
		conversions: number;
		seoScore: number;
		lastUpdated: string;
	}

	interface CampaignData {
		name: string;
		platform: string;
		status: 'active' | 'paused' | 'completed';
		spend: number;
		impressions: number;
		clicks: number;
		conversions: number;
		roi: number;
		startDate: string;
	}

	let selectedPeriod = $state<'7d' | '30d' | '90d' | '1y'>('30d');
	let selectedMetric = $state<'overview' | 'traffic' | 'content' | 'campaigns'>('overview');

	// Mock data
	const mockMetrics: MarketingMetric[] = [
		{
			name: 'Total Visitors',
			value: 15420,
			change: 12.5,
			changeType: 'increase',
			period: 'vs last month',
			icon: '👥'
		},
		{
			name: 'Conversion Rate',
			value: 4.2,
			change: 8.3,
			changeType: 'increase',
			period: 'vs last month',
			icon: '📈'
		},
		{
			name: 'Email Subscribers',
			value: 2840,
			change: 15.7,
			changeType: 'increase',
			period: 'vs last month',
			icon: '📧'
		},
		{
			name: 'Social Engagement',
			value: 89.2,
			change: -2.1,
			changeType: 'decrease',
			period: 'vs last month',
			icon: '💬'
		},
		{
			name: 'SEO Traffic',
			value: 8920,
			change: 22.4,
			changeType: 'increase',
			period: 'vs last month',
			icon: '🔍'
		},
		{
			name: 'Cost Per Acquisition',
			value: 24.5,
			change: -5.2,
			changeType: 'decrease',
			period: 'vs last month',
			icon: '💰'
		}
	];

	const mockTrafficSources: TrafficSource[] = [
		{
			source: 'Organic Search',
			visitors: 8920,
			conversions: 420,
			conversionRate: 4.7,
			revenue: 10500,
			trend: 'up'
		},
		{
			source: 'Direct',
			visitors: 3200,
			conversions: 180,
			conversionRate: 5.6,
			revenue: 4500,
			trend: 'stable'
		},
		{
			source: 'Social Media',
			visitors: 2100,
			conversions: 95,
			conversionRate: 4.5,
			revenue: 2375,
			trend: 'up'
		},
		{
			source: 'Email',
			visitors: 1200,
			conversions: 78,
			conversionRate: 6.5,
			revenue: 1950,
			trend: 'up'
		},
		{
			source: 'Referral',
			visitors: 800,
			conversions: 35,
			conversionRate: 4.4,
			revenue: 875,
			trend: 'down'
		},
		{
			source: 'Paid Ads',
			visitors: 200,
			conversions: 12,
			conversionRate: 6.0,
			revenue: 300,
			trend: 'stable'
		}
	];

	const mockContentPerformance: ContentPerformance[] = [
		{
			title: 'How to Build Confidence Speaking Japanese',
			url: '/blog/confidence-speaking-japanese',
			views: 15420,
			engagement: 78.5,
			conversions: 420,
			seoScore: 92,
			lastUpdated: '2024-01-15'
		},
		{
			title: 'Japanese Family Conversation Practice',
			url: '/japanese-family-conversations',
			views: 8920,
			engagement: 85.2,
			conversions: 380,
			seoScore: 88,
			lastUpdated: '2024-01-10'
		},
		{
			title: 'Overcome Japanese Speaking Anxiety',
			url: '/blog/speaking-anxiety',
			views: 6540,
			engagement: 82.1,
			conversions: 290,
			seoScore: 85,
			lastUpdated: '2024-01-08'
		},
		{
			title: 'AI vs Human Japanese Tutors',
			url: '/blog/ai-vs-human-tutors',
			views: 4200,
			engagement: 76.3,
			conversions: 180,
			seoScore: 79,
			lastUpdated: '2024-01-05'
		}
	];

	const mockCampaigns: CampaignData[] = [
		{
			name: 'Japanese Family Focus',
			platform: 'Google Ads',
			status: 'active',
			spend: 1200,
			impressions: 45000,
			clicks: 1200,
			conversions: 48,
			roi: 320,
			startDate: '2024-01-01'
		},
		{
			name: 'Anxiety-Free Learning',
			platform: 'Facebook',
			status: 'active',
			spend: 800,
			impressions: 32000,
			clicks: 800,
			conversions: 32,
			roi: 280,
			startDate: '2024-01-05'
		},
		{
			name: 'Conversation Practice',
			platform: 'LinkedIn',
			status: 'paused',
			spend: 400,
			impressions: 15000,
			clicks: 300,
			conversions: 12,
			roi: 150,
			startDate: '2023-12-15'
		}
	];

	onMount(() => {
		// Initialize with mock data
	});

	function getChangeColor(changeType: string) {
		switch (changeType) {
			case 'increase':
				return 'text-green-600';
			case 'decrease':
				return 'text-red-600';
			case 'neutral':
				return 'text-gray-600';
			default:
				return 'text-gray-600';
		}
	}

	function getChangeIcon(changeType: string) {
		switch (changeType) {
			case 'increase':
				return '↗️';
			case 'decrease':
				return '↘️';
			case 'neutral':
				return '➡️';
			default:
				return '➡️';
		}
	}

	function getTrendIcon(trend: string) {
		switch (trend) {
			case 'up':
				return '📈';
			case 'down':
				return '📉';
			case 'stable':
				return '➡️';
			default:
				return '➡️';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'text-green-600 bg-green-100';
			case 'paused':
				return 'text-yellow-600 bg-yellow-100';
			case 'completed':
				return 'text-blue-600 bg-blue-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}

	function formatCurrency(num: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(num);
	}
</script>

<svelte:head>
	<title>Dev — Marketing Analytics</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-7xl px-4 py-10">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold">📊 Marketing Analytics Dashboard</h1>
			<p class="mt-2 text-base-content/70">
				Track marketing performance and optimize your campaigns
			</p>
		</div>

		<!-- Controls -->
		<div class="mb-6 flex flex-wrap gap-4">
			<div class="form-control">
				<label class="label" for="time-period">
					<span class="label-text">Time Period</span>
				</label>
				<select id="time-period" class="select-bordered select" bind:value={selectedPeriod}>
					<option value="7d">Last 7 days</option>
					<option value="30d">Last 30 days</option>
					<option value="90d">Last 90 days</option>
					<option value="1y">Last year</option>
				</select>
			</div>
			<div class="form-control">
				<label class="label" for="metric-view">
					<span class="label-text">View</span>
				</label>
				<select id="metric-view" class="select-bordered select" bind:value={selectedMetric}>
					<option value="overview">Overview</option>
					<option value="traffic">Traffic Sources</option>
					<option value="content">Content Performance</option>
					<option value="campaigns">Campaigns</option>
				</select>
			</div>
		</div>

		<!-- Overview Tab -->
		{#if selectedMetric === 'overview'}
			<div class="space-y-6">
				<!-- Key Metrics -->
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each mockMetrics as metric}
						<div class="card bg-base-100 shadow-lg">
							<div class="card-body p-4">
								<div class="flex items-center justify-between">
									<div>
										<div class="text-2xl font-bold">{formatNumber(metric.value)}</div>
										<div class="text-sm text-base-content/70">{metric.name}</div>
									</div>
									<div class="text-3xl">{metric.icon}</div>
								</div>
								<div class="mt-2 flex items-center gap-2 text-sm">
									<span class={getChangeColor(metric.changeType)}>
										{getChangeIcon(metric.changeType)}
										{Math.abs(metric.change)}%
									</span>
									<span class="text-base-content/60">{metric.period}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Traffic Overview Chart Placeholder -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Traffic Overview</h2>
						<div class="flex h-64 items-center justify-center rounded-lg bg-base-200">
							<div class="text-center">
								<div class="mb-2 text-4xl">📈</div>
								<p class="text-base-content/70">Traffic chart would be here</p>
								<p class="text-sm text-base-content/60">Integration with analytics API needed</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Traffic Sources Tab -->
		{#if selectedMetric === 'traffic'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Traffic Sources</h2>
						<div class="overflow-x-auto">
							<table class="table w-full table-zebra">
								<thead>
									<tr>
										<th>Source</th>
										<th>Visitors</th>
										<th>Conversions</th>
										<th>Conversion Rate</th>
										<th>Revenue</th>
										<th>Trend</th>
									</tr>
								</thead>
								<tbody>
									{#each mockTrafficSources as source}
										<tr>
											<td class="font-semibold">{source.source}</td>
											<td>{formatNumber(source.visitors)}</td>
											<td>{source.conversions}</td>
											<td>
												<span
													class={source.conversionRate >= 5 ? 'text-green-600' : 'text-yellow-600'}
												>
													{source.conversionRate}%
												</span>
											</td>
											<td>{formatCurrency(source.revenue)}</td>
											<td>
												<span class="flex items-center gap-1">
													{getTrendIcon(source.trend)}
													{source.trend}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Traffic Sources Chart -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Traffic Distribution</h2>
						<div class="flex h-64 items-center justify-center rounded-lg bg-base-200">
							<div class="text-center">
								<div class="mb-2 text-4xl">🥧</div>
								<p class="text-base-content/70">Pie chart would be here</p>
								<p class="text-sm text-base-content/60">Showing traffic source distribution</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Content Performance Tab -->
		{#if selectedMetric === 'content'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Content Performance</h2>
						<div class="overflow-x-auto">
							<table class="table w-full table-zebra">
								<thead>
									<tr>
										<th>Content</th>
										<th>Views</th>
										<th>Engagement</th>
										<th>Conversions</th>
										<th>SEO Score</th>
										<th>Last Updated</th>
									</tr>
								</thead>
								<tbody>
									{#each mockContentPerformance as content}
										<tr>
											<td>
												<div>
													<div class="font-semibold">{content.title}</div>
													<div class="text-sm text-base-content/60">{content.url}</div>
												</div>
											</td>
											<td>{formatNumber(content.views)}</td>
											<td>
												<span
													class={content.engagement >= 80 ? 'text-green-600' : 'text-yellow-600'}
												>
													{content.engagement}%
												</span>
											</td>
											<td>{content.conversions}</td>
											<td>
												<span class={content.seoScore >= 80 ? 'text-green-600' : 'text-yellow-600'}>
													{content.seoScore}/100
												</span>
											</td>
											<td>{new Date(content.lastUpdated).toLocaleDateString()}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Top Performing Content -->
				<div class="grid gap-4 md:grid-cols-2">
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title">Top Performing Content</h3>
							<div class="space-y-3">
								{#each mockContentPerformance.slice(0, 3) as content, index}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="text-lg font-bold text-primary">#{index + 1}</div>
											<div>
												<div class="text-sm font-semibold">{content.title}</div>
												<div class="text-xs text-base-content/60">
													{formatNumber(content.views)} views
												</div>
											</div>
										</div>
										<div class="text-right">
											<div class="text-sm font-semibold">{content.conversions} conversions</div>
											<div class="text-xs text-base-content/60">
												{content.engagement}% engagement
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title">Content Opportunities</h3>
							<div class="space-y-3">
								<div class="alert alert-info">
									<span class="text-sm"
										>"Japanese family conversation" has high search volume but low competition</span
									>
								</div>
								<div class="alert alert-warning">
									<span class="text-sm"
										>"Speaking anxiety" content needs more emotional keywords</span
									>
								</div>
								<div class="alert alert-success">
									<span class="text-sm">"AI conversation practice" trending up 25% this month</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Campaigns Tab -->
		{#if selectedMetric === 'campaigns'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Marketing Campaigns</h2>
						<div class="overflow-x-auto">
							<table class="table w-full table-zebra">
								<thead>
									<tr>
										<th>Campaign</th>
										<th>Platform</th>
										<th>Status</th>
										<th>Spend</th>
										<th>Impressions</th>
										<th>Clicks</th>
										<th>Conversions</th>
										<th>ROI</th>
									</tr>
								</thead>
								<tbody>
									{#each mockCampaigns as campaign}
										<tr>
											<td class="font-semibold">{campaign.name}</td>
											<td>{campaign.platform}</td>
											<td>
												<span class="badge {getStatusColor(campaign.status)}">
													{campaign.status}
												</span>
											</td>
											<td>{formatCurrency(campaign.spend)}</td>
											<td>{formatNumber(campaign.impressions)}</td>
											<td>{formatNumber(campaign.clicks)}</td>
											<td>{campaign.conversions}</td>
											<td>
												<span class={campaign.roi >= 200 ? 'text-green-600' : 'text-yellow-600'}>
													{campaign.roi}%
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Campaign Performance Summary -->
				<div class="grid gap-4 md:grid-cols-3">
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<div class="text-3xl font-bold text-primary">{formatCurrency(2400)}</div>
							<div class="text-sm text-base-content/70">Total Spend</div>
						</div>
					</div>
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<div class="text-3xl font-bold text-success">92</div>
							<div class="text-sm text-base-content/70">Total Conversions</div>
						</div>
					</div>
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<div class="text-3xl font-bold text-info">250%</div>
							<div class="text-sm text-base-content/70">Average ROI</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
