<script lang="ts">
	import { conversationStore } from '$lib/stores/conversation.store.svelte';

	let isOpen = $state(false);
	let selectedUpdate = $state<number | null>(null);

	const updates = $derived(conversationStore.sessionConfigHistory);
	const latestUpdate = $derived(updates[updates.length - 1]);
</script>

<button
	onclick={() => (isOpen = !isOpen)}
	style={{
		position: 'fixed',
		bottom: '20px',
		right: '20px',
		padding: '8px 12px',
		backgroundColor: '#333',
		color: '#0f0',
		border: '2px solid #0f0',
		borderRadius: '4px',
		fontSize: '12px',
		fontFamily: 'monospace',
		cursor: 'pointer',
		zIndex: 10000
	}}
>
	{isOpen ? ' Dev Panel' : ' Dev Panel'}
</button>

{#if isOpen}
	<div
		style={{
			position: 'fixed',
			bottom: '70px',
			right: '20px',
			width: '500px',
			maxHeight: '600px',
			backgroundColor: '#1a1a1a',
			border: '2px solid #0f0',
			borderRadius: '4px',
			color: '#0f0',
			fontFamily: 'monospace',
			fontSize: '11px',
			zIndex: 10000,
			overflow: 'auto',
			padding: '12px'
		}}
	>
		<div style={{ marginBottom: '12px', borderBottom: '1px solid #0f0', paddingBottom: '8px' }}>
			<strong>=Ê Session Config History ({updates.length})</strong>
		</div>

		{#if latestUpdate}
			<div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '2px' }}>
				<div style={{ color: '#00ff00', marginBottom: '4px' }}>
					<strong>Latest Update:</strong>
				</div>
				<div style={{ color: '#ffff00', marginBottom: '8px' }}>
					[{latestUpdate.type}] {latestUpdate.timestamp.toLocaleTimeString()}
				</div>
				<pre
					style={{
						margin: 0,
						overflow: 'auto',
						maxHeight: '200px',
						backgroundColor: '#000',
						padding: '8px',
						borderRadius: '2px'
					}}
>{JSON.stringify(latestUpdate.config, null, 2)}</pre>
			</div>
		{/if}

		<div style={{ marginBottom: '8px', borderTop: '1px solid #0f0', paddingTop: '8px' }}>
			<strong>All Updates:</strong>
		</div>
		<div style={{ maxHeight: '300px', overflow: 'auto' }}>
			{#each updates as update, idx}
				<button
					onclick={() => (selectedUpdate = selectedUpdate === idx ? null : idx)}
					style={{
						display: 'block',
						width: '100%',
						padding: '4px 8px',
						marginBottom: '2px',
						backgroundColor: selectedUpdate === idx ? '#0f0' : '#2a2a2a',
						color: selectedUpdate === idx ? '#000' : '#0f0',
						border: '1px solid #0f0',
						borderRadius: '2px',
						cursor: 'pointer',
						textAlign: 'left',
						fontSize: '10px'
					}}
				>
					[{update.type}] {update.timestamp.toLocaleTimeString()}
				</button>
				{#if selectedUpdate === idx}
					<pre
						style={{
							margin: '4px 0 8px 0',
							overflow: 'auto',
							maxHeight: '150px',
							backgroundColor: '#000',
							padding: '4px',
							borderRadius: '2px',
							fontSize: '9px'
						}}
					>{JSON.stringify(update.config, null, 2)}</pre>
				{/if}
			{/each}
		</div>
	</div>
{/if}
