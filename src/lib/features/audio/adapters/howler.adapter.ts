// 🎵 Howler Audio Adapter
// Implements AudioOutputPort using Howler.js for cross-browser compatibility

import { Howl } from 'howler';
import type { AudioOutputPort } from '../types';

export class HowlerAudioAdapter implements AudioOutputPort {
	private currentSound?: Howl;
	private volume: number = 0.8;

	async play(audioData: ArrayBuffer): Promise<void> {
		// Convert ArrayBuffer to blob URL for Howler
		const blob = new Blob([audioData], { type: 'audio/wav' });
		const url = URL.createObjectURL(blob);

		try {
			await this.playFromUrl(url);
		} finally {
			// Clean up the blob URL
			URL.revokeObjectURL(url);
		}
	}

	async playFromUrl(url: string): Promise<void> {
		// Stop any currently playing audio
		this.stop();

		return new Promise((resolve, reject) => {
			this.currentSound = new Howl({
				src: [url],
				volume: this.volume,
				html5: true, // Better for streaming and real-time audio
				format: ['mp3', 'wav', 'ogg', 'm4a'], // Support multiple formats
				onload: () => {
					this.currentSound?.play();
					resolve();
				},
				onloaderror: (id, error) => {
					reject(new Error(`Failed to load audio: ${error}`));
				},
				onend: () => {
					// Audio completed naturally
					this.currentSound = undefined;
				},
				onstop: () => {
					// Audio was stopped manually
					this.currentSound = undefined;
				}
			});
		});
	}

	stop(): void {
		if (this.currentSound) {
			this.currentSound.stop();
			this.currentSound = undefined;
		}
	}

	setVolume(volume: number): void {
		this.volume = Math.max(0, Math.min(1, volume));

		if (this.currentSound) {
			this.currentSound.volume(this.volume);
		}
	}

	// Additional Howler-specific utilities
	getCurrentVolume(): number {
		return this.volume;
	}

	isPlaying(): boolean {
		return this.currentSound ? this.currentSound.playing() : false;
	}

	getDuration(): number {
		return this.currentSound ? this.currentSound.duration() : 0;
	}

	seek(position: number): void {
		if (this.currentSound) {
			this.currentSound.seek(position);
		}
	}

	fade(from: number, to: number, duration: number): void {
		if (this.currentSound) {
			this.currentSound.fade(from, to, duration);
		}
	}
}
