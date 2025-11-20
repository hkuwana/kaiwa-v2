<script>
	import { scenariosData, sortScenariosByDifficulty } from '../../lib/data/scenarios';

	const sortedScenarios = sortScenariosByDifficulty(scenariosData);

	const getImagePath = (scenario) => {
		// Use the scenario's thumbnail URL if available, otherwise fallback to default
		return scenario.thumbnailUrl || '/src/lib/assets/scenarios/tutor-scenario.png';
	};

	const groupedByDifficulty = {
		beginner: sortedScenarios.filter(s => s.difficulty === 'beginner'),
		intermediate: sortedScenarios.filter(s => s.difficulty === 'intermediate'),
		advanced: sortedScenarios.filter(s => s.difficulty === 'advanced')
	};
</script>

<div class="scenarios-container">
	<h1>All Scenarios</h1>
	<p class="total-count">Total: {sortedScenarios.length} scenarios</p>

	{#each Object.entries(groupedByDifficulty) as [difficulty, scenarios]}
		{#if scenarios.length > 0}
			<section class="difficulty-section">
				<h2 class="difficulty-header">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} ({scenarios.length})</h2>

				<div class="scenarios-grid">
					{#each scenarios as scenario (scenario.id)}
						<div class="scenario-card">
							<div class="scenario-image-wrapper">
								<img
									src={getImagePath(scenario)}
									alt={scenario.title}
									class="scenario-image"
									onerror="this.src='/src/lib/assets/scenarios/tutor-scenario.png'"
								/>
								<div class="scenario-meta">
									<span class="role-badge">{scenario.role}</span>
									<span class="cerf-badge">{scenario.cefrLevel}</span>
								</div>
							</div>

							<div class="scenario-content">
								<h3>{scenario.title}</h3>
								<p class="description">{scenario.description}</p>

								<div class="scenario-details">
									{#if scenario.estimatedDurationSeconds}
										<span class="detail">⏱️ {Math.round(scenario.estimatedDurationSeconds / 60)} min</span>
									{/if}
									{#if scenario.primarySkill}
										<span class="detail">🎯 {scenario.primarySkill}</span>
									{/if}
								</div>

								<div class="tags">
									{#each scenario.tags.slice(0, 3) as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</div>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background-color: #f5f5f5;
		padding: 20px;
	}

	.scenarios-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		font-size: 2.5rem;
		margin: 0 0 10px 0;
		color: #1a1a1a;
	}

	.total-count {
		color: #666;
		margin: 0 0 30px 0;
		font-size: 1rem;
	}

	.difficulty-section {
		margin-bottom: 40px;
	}

	.difficulty-header {
		font-size: 1.5rem;
		color: #333;
		margin: 20px 0 15px 0;
		padding-bottom: 10px;
		border-bottom: 2px solid #ddd;
	}

	.scenarios-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.scenario-card {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		display: flex;
		flex-direction: column;
	}

	.scenario-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.scenario-image-wrapper {
		position: relative;
		width: 100%;
		height: 200px;
		background: #eee;
		overflow: hidden;
	}

	.scenario-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: #f0f0f0;
	}

	.scenario-meta {
		position: absolute;
		top: 10px;
		right: 10px;
		display: flex;
		gap: 8px;
	}

	.role-badge,
	.cerf-badge {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.cerf-badge {
		background: rgba(52, 152, 219, 0.85);
	}

	.scenario-content {
		padding: 16px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.scenario-content h3 {
		margin: 0 0 8px 0;
		font-size: 1.1rem;
		color: #1a1a1a;
	}

	.description {
		margin: 0 0 12px 0;
		color: #555;
		font-size: 0.9rem;
		line-height: 1.4;
		flex: 1;
	}

	.scenario-details {
		display: flex;
		gap: 12px;
		margin-bottom: 12px;
		font-size: 0.85rem;
	}

	.detail {
		color: #666;
	}

	.tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.tag {
		background: #f0f0f0;
		color: #555;
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 0.75rem;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 1.8rem;
		}

		.scenarios-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
