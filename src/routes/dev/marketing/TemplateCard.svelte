<script lang="ts">
	interface Props {
		title: string;
		content: string;
	}

	let { title, content }: Props = $props();

	async function copy() {
		await navigator.clipboard.writeText(content);
		alert('Template copied');
	}
</script>

<div class="card bg-base-100">
	<div class="card-body">
		<div class="flex items-center justify-between">
			<h3 class="card-title text-base">{title}</h3>
			<button class="btn btn-ghost btn-xs" onclick={copy}>Copy</button>
		</div>
		<pre class="mt-2 text-sm whitespace-pre-wrap opacity-80">{content}</pre>
	</div>
</div>
