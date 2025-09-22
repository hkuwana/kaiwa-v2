<script>
	import { scenariosData } from '../../lib/data/scenarios';
</script>

<h1>Scenarios</h1>

<ul>
	{#each scenariosData as scenario}
		<li>
			<h2>{scenario.title}</h2>
			<p>{scenario.description}</p>
		</li>
	{/each}
</ul>
