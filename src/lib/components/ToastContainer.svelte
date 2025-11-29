<script lang="ts">
	import { notificationStore } from '$lib/stores/notification.store.svelte';
	import { slide } from 'svelte/transition';

	const toasts = $derived(notificationStore.toasts);

	// Map notification types to DaisyUI alert classes and icons
	const typeConfig = {
		success: {
			class: 'alert-success',
			icon: '✓'
		},
		error: {
			class: 'alert-error',
			icon: '✕'
		},
		warning: {
			class: 'alert-warning',
			icon: '⚠'
		},
		info: {
			class: 'alert-info',
			icon: 'ℹ'
		}
	};
</script>

<!-- Toast Container - Fixed position, responsive placement -->
<div
	class="pointer-events-none fixed inset-0 z-50 flex flex-col gap-3 p-4 md:top-4 md:right-4 md:w-96"
>
	{#each toasts as toast (toast.id)}
		<div transition:slide={{ duration: 200, axis: 'y' }} class="pointer-events-auto">
			<div class={`alert ${typeConfig[toast.type].class} rounded-lg shadow-lg`}>
				{#if toast.isToolbar && toast.actions}
					<!-- Toolbar style: multiple action buttons -->
					<div class="flex w-full items-center justify-between gap-3">
						<div class="flex items-center gap-2">
							<!-- Icon -->
							<span class="shrink-0 text-lg font-bold">
								{typeConfig[toast.type].icon}
							</span>

							<!-- Message -->
							<p class="text-sm">
								{toast.message}
							</p>
						</div>

						<!-- Action buttons (toolbar) -->
						<div class="flex shrink-0 gap-2">
							{#each toast.actions as action (action.label)}
								<button
									class="btn btn-outline btn-sm"
									onclick={() => {
										action.callback();
										notificationStore.removeToast(toast.id);
									}}
								>
									{action.label}
								</button>
							{/each}

							<!-- Close button -->
							<button
								class="btn btn-circle btn-ghost btn-xs"
								onclick={() => notificationStore.removeToast(toast.id)}
								aria-label="Close notification"
							>
								✕
							</button>
						</div>
					</div>
				{:else}
					<!-- Standard style: single action or message -->
					<div class="flex items-start gap-3">
						<!-- Icon -->
						<span class="mt-0.5 shrink-0 text-lg font-bold">
							{typeConfig[toast.type].icon}
						</span>

						<!-- Message -->
						<p class="flex-1 text-sm">
							{toast.message}
						</p>

						<!-- Action button (if provided) -->
						{#if toast.action}
							<button
								class="btn shrink-0 btn-ghost btn-sm"
								onclick={() => {
									toast.action?.callback();
									notificationStore.removeToast(toast.id);
								}}
							>
								{toast.action.label}
							</button>
						{/if}

						<!-- Close button -->
						<button
							class="btn btn-circle shrink-0 btn-ghost btn-xs"
							onclick={() => notificationStore.removeToast(toast.id)}
							aria-label="Close notification"
						>
							✕
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	/* Ensure toast container doesn't block interactions on empty */
	:global(.pointer-events-none > *:empty) {
		display: none;
	}
</style>
