<script lang="ts">
	/**
	 * SharePathButton - Allows users to share their learning path as a public template
	 * Shows a modal with share options and copies link to clipboard
	 */

	import { learningPathStore } from '../stores/learning-path.store.svelte';

	interface Props {
		pathId: string;
		pathTitle: string;
		isTemplate?: boolean;
		shareSlug?: string | null;
		variant?: 'primary' | 'outline' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
	}

	const { pathId, pathTitle, isTemplate = false, shareSlug = null, variant = 'outline', size = 'sm' }: Props = $props();

	let isSharing = $state(false);
	let showModal = $state(false);
	let shareUrl = $state<string | null>(null);
	let copied = $state(false);
	let error = $state<string | null>(null);

	// If already a template with shareSlug, construct the URL directly
	const existingShareUrl = $derived(
		isTemplate && shareSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/program/${shareSlug}` : null
	);

	async function handleShare() {
		if (existingShareUrl) {
			// Already shared - just show the modal with existing URL
			shareUrl = existingShareUrl;
			showModal = true;
			return;
		}

		// Share as new template
		isSharing = true;
		error = null;

		const result = await learningPathStore.shareAsTemplate(pathId);

		if (result.success && result.shareUrl) {
			shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${result.shareUrl}`;
			showModal = true;
		} else {
			error = result.error || 'Failed to create shareable link';
		}

		isSharing = false;
	}

	async function copyToClipboard() {
		if (!shareUrl) return;

		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function closeModal() {
		showModal = false;
		copied = false;
	}

	// Button classes based on variant and size
	const buttonClasses = $derived(() => {
		const base = 'btn gap-2';
		const variants = {
			primary: 'btn-primary',
			outline: 'btn-outline',
			ghost: 'btn-ghost'
		};
		const sizes = {
			sm: 'btn-sm',
			md: '',
			lg: 'btn-lg'
		};
		return `${base} ${variants[variant]} ${sizes[size]}`;
	});
</script>

<!-- Share Button -->
<button class={buttonClasses()} onclick={handleShare} disabled={isSharing}>
	{#if isSharing}
		<span class="loading loading-spinner loading-xs"></span>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
		</svg>
	{/if}
	{existingShareUrl ? 'View Link' : 'Share'}
</button>

<!-- Error toast -->
{#if error}
	<div class="toast toast-end">
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-ghost btn-xs" onclick={() => error = null}>x</button>
		</div>
	</div>
{/if}

<!-- Share Modal -->
{#if showModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2" onclick={closeModal}>x</button>

			<h3 class="text-lg font-bold">Share Your Learning Path</h3>
			<p class="py-2 text-base-content/70">
				Share "{pathTitle}" with others! Anyone with this link can view the course outline.
			</p>

			<!-- Share URL input -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Shareable Link</span>
				</label>
				<div class="join w-full">
					<input
						type="text"
						readonly
						value={shareUrl}
						class="input join-item input-bordered w-full bg-base-200"
					/>
					<button class="btn join-item {copied ? 'btn-success' : 'btn-primary'}" onclick={copyToClipboard}>
						{#if copied}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Social sharing options -->
			<div class="divider">Share via</div>
			<div class="flex justify-center gap-2">
				<a
					href="https://twitter.com/intent/tweet?text=Check%20out%20this%20learning%20path%3A%20{encodeURIComponent(pathTitle)}&url={encodeURIComponent(shareUrl || '')}"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-circle btn-outline"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
					</svg>
				</a>
				<a
					href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(shareUrl || '')}"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-circle btn-outline"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
					</svg>
				</a>
				<a
					href="mailto:?subject=Check%20out%20this%20learning%20path&body=I%20thought%20you%27d%20be%20interested%20in%20this%20learning%20path%3A%20{encodeURIComponent(shareUrl || '')}"
					class="btn btn-circle btn-outline"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</a>
			</div>

			<div class="modal-action">
				<a href={shareUrl} target="_blank" rel="noopener noreferrer" class="btn btn-outline">
					Preview Page
				</a>
				<button class="btn btn-primary" onclick={closeModal}>Done</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeModal}>close</button>
		</form>
	</dialog>
{/if}
