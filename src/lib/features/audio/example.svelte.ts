// 🎵 Audio Feature Example Component
// Demonstrates how to use the new functional audio architecture

import { audioService } from './index';
import type { AudioState } from './types';

export class AudioExampleComponent {
	private state: AudioState;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		// Get initial state
		this.state = audioService.getState();

		// Set up state updates (in a real app, you'd use Svelte's reactive system)
		this.setupStateUpdates();
	}

	// 🎯 Start recording
	async startRecording(): Promise<void> {
		try {
			await audioService.startRecording();
			console.log('Recording started');
		} catch (error) {
			console.error('Failed to start recording:', error);
		}
	}

	// 🎯 Stop recording and transcribe
	async stopRecording(): Promise<string | null> {
		try {
			await audioService.stopRecording();

			// Wait a bit for processing to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get the recording session from state
			const session = audioService.getState().recordingSession;
			if (session) {
				// In a real app, you'd get the audio data from the session
				// For now, we'll simulate transcription
				return 'Hello, this is a test transcription';
			}

			return null;
		} catch (error) {
			console.error('Failed to stop recording:', error);
			return null;
		}
	}

	// 🎯 Play text as speech
	async speakText(text: string): Promise<void> {
		try {
			const audioData = await audioService.textToSpeech(text);
			await audioService.playAudio(audioData);
		} catch (error) {
			console.error('Failed to speak text:', error);
		}
	}

	// 🎯 Play audio from URL
	async playAudioUrl(url: string): Promise<void> {
		try {
			await audioService.playFromUrl(url);
		} catch (error) {
			console.error('Failed to play audio URL:', error);
		}
	}

	// 🎯 Set volume
	async setVolume(volume: number): Promise<void> {
		try {
			await audioService.setVolume(volume);
		} catch (error) {
			console.error('Failed to set volume:', error);
		}
	}

	// 🎯 Get current state
	getCurrentState(): AudioState {
		return audioService.getState();
	}

	// 🎯 Check if can record
	get canRecord(): boolean {
		return audioService.canRecord;
	}

	// 🎯 Check if can play
	get canPlay(): boolean {
		return audioService.canPlay;
	}

	// 🎯 Get current volume
	get volume(): number {
		return audioService.volume;
	}

	// 🎯 Get error if any
	get error(): string | null {
		return audioService.error;
	}

	// 🎯 Clear error
	async clearError(): Promise<void> {
		await audioService.clearError();
	}

	// 🎯 Setup state updates (simplified)
	private setupStateUpdates(): void {
		// In a real Svelte app, you'd use reactive statements
		// For now, we'll just log state changes
		const checkState = () => {
			const newState = audioService.getState();
			if (JSON.stringify(newState) !== JSON.stringify(this.state)) {
				console.log('Audio state changed:', newState);
				this.state = newState;
			}
		};

		// Check for state changes every 100ms
		const interval = setInterval(checkState, 100);

		this.unsubscribe = () => {
			clearInterval(interval);
		};
	}

	// 🎯 Cleanup
	dispose(): void {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		audioService.dispose();
	}
}

// 🎯 Example usage in a Svelte component:
/*
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { AudioExampleComponent } from './example.svelte';
	
	let audioComponent: AudioExampleComponent;
	
	onMount(() => {
		audioComponent = new AudioExampleComponent();
	});
	
	onDestroy(() => {
		audioComponent?.dispose();
	});
	
	async function handleStartRecording() {
		await audioComponent?.startRecording();
	}
	
	async function handleStopRecording() {
		const transcript = await audioComponent?.stopRecording();
		if (transcript) {
			console.log('Transcript:', transcript);
		}
	}
	
	async function handleSpeak() {
		await audioComponent?.speakText("Hello, this is a test!");
	}
</script>

<div class="audio-controls">
	<button 
		on:click={handleStartRecording}
		disabled={!audioComponent?.canRecord}
	>
		Start Recording
	</button>
	
	<button 
		on:click={handleStopRecording}
		disabled={audioComponent?.canRecord}
	>
		Stop Recording
	</button>
	
	<button on:click={handleSpeak}>
		Speak Text
	</button>
	
	{#if audioComponent?.error}
		<div class="error">
			{audioComponent.error}
			<button on:click={() => audioComponent?.clearError()}>
				Clear Error
			</button>
		</div>
	{/if}
	
	<div class="volume-control">
		<label for="volume">Volume: {audioComponent?.volume}</label>
		<input 
			id="volume"
			type="range" 
			min="0" 
			max="1" 
			step="0.1"
			value={audioComponent?.volume || 0.8}
			on:input={(e) => audioComponent?.setVolume(parseFloat(e.target.value))}
		/>
	</div>
</div>
*/
