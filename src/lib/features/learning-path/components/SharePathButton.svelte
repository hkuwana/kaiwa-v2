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
		<span class="icon-[mdi--share-variant] h-4 w-4"></span>
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
							<span class="icon-[mdi--check] h-5 w-5"></span>
						{:else}
							<span class="icon-[mdi--content-copy] h-5 w-5"></span>
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
					<span class="icon-[mdi--twitter] h-5 w-5"></span>
				</a>
				<a
					href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(shareUrl || '')}"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-circle btn-outline"
				>
					<span class="icon-[mdi--linkedin] h-5 w-5"></span>
				</a>
				<a
					href="mailto:?subject=Check%20out%20this%20learning%20path&body=I%20thought%20you%27d%20be%20interested%20in%20this%20learning%20path%3A%20{encodeURIComponent(shareUrl || '')}"
					class="btn btn-circle btn-outline"
				>
					<span class="icon-[mdi--email-outline] h-5 w-5"></span>
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
