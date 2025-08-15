<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		isRecording?: boolean;
		audioLevel?: number; // 0-100
	}

	let { isRecording = false, audioLevel = 0 }: Props = $props();

	let canvas: HTMLCanvasElement = $state();
	let ctx: CanvasRenderingContext2D | null = null;
	let animationId: number;

	onMount(() => {
		ctx = canvas.getContext('2d');
		if (ctx) {
			animate();
		}

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	});

	function animate() {
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		if (isRecording) {
			// Draw audio level visualization
			const centerX = width / 2;
			const centerY = height / 2;
			const baseRadius = 30;
			const maxRadius = 60;
			const radius = baseRadius + (audioLevel / 100) * (maxRadius - baseRadius);

			// Outer ring (pulsing)
			const pulseRadius = radius + Math.sin(Date.now() / 200) * 10;
			ctx.beginPath();
			ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
			ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + (audioLevel / 100) * 0.4})`;
			ctx.lineWidth = 3;
			ctx.stroke();

			// Inner circle (solid)
			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
			ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + (audioLevel / 100) * 0.4})`;
			ctx.fill();

			// Center dot
			ctx.beginPath();
			ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
			ctx.fillStyle = '#fff';
			ctx.fill();
		} else {
			// Draw idle state
			const centerX = width / 2;
			const centerY = height / 2;

			ctx.beginPath();
			ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
			ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
			ctx.lineWidth = 2;
			ctx.stroke();

			// Microphone icon (simplified)
			ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
			ctx.fillRect(centerX - 4, centerY - 15, 8, 20);
			ctx.fillRect(centerX - 8, centerY + 8, 16, 3);
			ctx.fillRect(centerX - 1, centerY + 11, 2, 8);
		}

		animationId = requestAnimationFrame(animate);
	}
</script>

<canvas
	bind:this={canvas}
	width="120"
	height="120"
	class="pointer-events-none absolute inset-0"
	aria-hidden="true"
></canvas>
