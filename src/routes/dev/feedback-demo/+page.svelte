<script lang="ts">
	import { notificationStore } from '$lib/stores/notification.store.svelte';

	let selectedType: 'success' | 'error' | 'warning' | 'info' = 'success';
	let customMessage = 'This is a notification!';

	function showNotification() {
		switch (selectedType) {
			case 'success':
				notificationStore.success(customMessage);
				break;
			case 'error':
				notificationStore.error(customMessage);
				break;
			case 'warning':
				notificationStore.warning(customMessage);
				break;
			case 'info':
				notificationStore.info(customMessage);
				break;
		}
	}

	function showMultiple() {
		notificationStore.success('First notification ✓');
		setTimeout(() => notificationStore.info('Second notification ℹ'), 500);
		setTimeout(() => notificationStore.warning('Third notification ⚠'), 1000);
	}

	function showWithAction() {
		notificationStore.addToast({
			message: 'Want to undo this action?',
			type: 'info',
			duration: 10000,
			action: {
				label: 'Undo',
				callback: () => {
					console.log('Undo clicked!');
					notificationStore.success('Action undone!');
				}
			}
		});
	}

	function showToolbar() {
		notificationStore.toolbar('This is feedback! What do you think?', [
			{
				label: 'Love it',
				callback: () => {
					notificationStore.success('Thanks for the positive feedback! 💚');
				}
			},
			{
				label: 'Good',
				callback: () => {
					notificationStore.success('Thanks for the feedback! 👍');
				}
			},
			{
				label: 'Needs work',
				callback: () => {
					notificationStore.warning('We appreciate your honest feedback! 🙏');
				}
			}
		]);
	}

	function showLongDuration() {
		notificationStore.error('This error will stay for 10 seconds', 10000);
	}

	function clearAll() {
		notificationStore.clearAll();
	}
</script>

<svelte:head>
	<title>Feedback & Notification Demo - Kaiwa Dev</title>
</svelte:head>

<div class="min-h-screen bg-base-100 p-8">
	<div class="container mx-auto max-w-2xl">
		<div class="mb-12">
			<h1 class="mb-2 text-4xl font-bold">Notification System Demo</h1>
			<p class="text-lg opacity-75">
				Test the toast notification system and feedback button. Click the 💬 button in the
				bottom-right corner.
			</p>
		</div>

		<!-- Basic Notification Tests -->
		<section class="mb-12">
			<h2 class="mb-6 text-2xl font-bold">Test Notifications</h2>

			<div class="card border border-base-300 bg-base-200 shadow-xl">
				<div class="card-body">
					<h3 class="mb-4 card-title text-lg">Notification Type</h3>

					<!-- Type Selector -->
					<div class="form-control mb-4">
						<label class="label">
							<span class="label-text font-semibold">Select notification type</span>
						</label>
						<select bind:value={selectedType} class="select-bordered select w-full max-w-xs">
							<option value="success">✓ Success</option>
							<option value="error">✕ Error</option>
							<option value="warning">⚠ Warning</option>
							<option value="info">ℹ Info</option>
						</select>
					</div>

					<!-- Message Input -->
					<div class="form-control mb-4">
						<label class="label">
							<span class="label-text font-semibold">Custom message</span>
						</label>
						<input
							type="text"
							bind:value={customMessage}
							class="input-bordered input w-full"
							placeholder="Enter custom message..."
						/>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-wrap gap-2">
						<button class="btn btn-primary" onclick={showNotification}> Show Notification </button>
						<button class="btn btn-info" onclick={showMultiple}> Show Multiple (Stacked) </button>
						<button class="btn btn-warning" onclick={showLongDuration}> Show Long Duration </button>
						<button class="btn btn-secondary" onclick={showWithAction}> Show with Action </button>
						<button class="btn btn-success" onclick={showToolbar}> Show Toolbar </button>
						<button class="btn btn-ghost" onclick={clearAll}> Clear All </button>
					</div>
				</div>
			</div>
		</section>

		<!-- Usage Examples -->
		<section class="mb-12">
			<h2 class="mb-6 text-2xl font-bold">Usage Examples</h2>

			<div class="grid gap-6 md:grid-cols-2">
				<!-- Success Example -->
				<div class="card border border-success/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Success</h3>
						<p class="mb-3 text-sm opacity-75">Quick feedback for completed actions</p>
						<pre class="overflow-x-auto rounded bg-base-300 p-3 text-xs"><code
								>{`notificationStore.success(
  'Changes saved!'
)`}</code
							></pre>
						<button
							class="btn mt-3 btn-sm btn-success"
							onclick={() => notificationStore.success('Changes saved! 🎉')}
						>
							Try it
						</button>
					</div>
				</div>

				<!-- Error Example -->
				<div class="card border border-error/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Error</h3>
						<p class="mb-3 text-sm opacity-75">Alert user to issues (stays longer)</p>
						<pre class="overflow-x-auto rounded bg-base-300 p-3 text-xs"><code
								>{`notificationStore.error(
  'Failed to save',
  5000
)`}</code
							></pre>
						<button
							class="btn mt-3 btn-sm btn-error"
							onclick={() => notificationStore.error('Failed to save changes')}
						>
							Try it
						</button>
					</div>
				</div>

				<!-- Warning Example -->
				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Warning</h3>
						<p class="mb-3 text-sm opacity-75">Caution messages (yellow)</p>
						<pre class="overflow-x-auto rounded bg-base-300 p-3 text-xs"><code
								>{`notificationStore.warning(
  'This action cannot be undone'
)`}</code
							></pre>
						<button
							class="btn mt-3 btn-sm btn-warning"
							onclick={() => notificationStore.warning('This action cannot be undone')}
						>
							Try it
						</button>
					</div>
				</div>

				<!-- Info Example -->
				<div class="card border border-info/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">Info</h3>
						<p class="mb-3 text-sm opacity-75">General information</p>
						<pre class="overflow-x-auto rounded bg-base-300 p-3 text-xs"><code
								>{`notificationStore.info(
  'New feature available'
)`}</code
							></pre>
						<button
							class="btn mt-3 btn-sm btn-info"
							onclick={() => notificationStore.info('New feature available! 🌟')}
						>
							Try it
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Overview -->
		<section class="mb-12">
			<h2 class="mb-6 text-2xl font-bold">Features</h2>

			<div class="card border border-base-300 bg-base-200 shadow-xl">
				<div class="card-body">
					<ul class="space-y-3">
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>Mobile & Desktop Friendly</strong>
								<p class="text-sm opacity-70">Positioned optimally for all screen sizes</p>
							</div>
						</li>
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>Auto-Dismiss</strong>
								<p class="text-sm opacity-70">Customizable duration per notification</p>
							</div>
						</li>
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>Stackable</strong>
								<p class="text-sm opacity-70">Multiple notifications display simultaneously</p>
							</div>
						</li>
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>Dismissible</strong>
								<p class="text-sm opacity-70">Users can close any notification manually</p>
							</div>
						</li>
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>Action Buttons</strong>
								<p class="text-sm opacity-70">Optional callback actions (like "Undo")</p>
							</div>
						</li>
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>DaisyUI Integration</strong>
								<p class="text-sm opacity-70">Uses native DaisyUI alert components</p>
							</div>
						</li>
						<li class="flex gap-3">
							<span class="font-bold text-success">✓</span>
							<div>
								<strong>Toolbar Style</strong>
								<p class="text-sm opacity-70">
									Multiple action buttons for feedback & quick responses
								</p>
							</div>
						</li>
					</ul>
				</div>
			</div>
		</section>

		<!-- Feedback Button Info -->
		<section>
			<h2 class="mb-6 text-2xl font-bold">Feedback System</h2>

			<div class="alert alert-info">
				<div>
					<p class="font-bold">💬 Feedback Button</p>
					<p class="mt-2 text-sm">
						A floating button (bottom-right corner) lets users quickly submit bug reports,
						suggestions, or debug requests. Perfect for early-stage feedback collection!
					</p>
					<div class="mt-3 space-y-2 text-sm">
						<p><strong>Features:</strong></p>
						<ul class="list-disc pl-5">
							<li>Three feedback types: Bug, Suggestion, Debug Request</li>
							<li>Mobile-responsive modal</li>
							<li>Character limit indicator</li>
							<li>Success/error feedback with toast notifications</li>
							<li>Can be customized or disabled per route</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
