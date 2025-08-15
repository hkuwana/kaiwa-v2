// 🎵 Browser Audio Adapter
// Implements AudioInputPort using browser's MediaRecorder API

import type { AudioInputPort } from '../types';

export class BrowserAudioAdapter implements AudioInputPort {
	private currentStream?: MediaStream;
	private currentRecorder?: MediaRecorder;

	async startRecording(deviceId?: string): Promise<MediaRecorder> {
		try {
			// Stop any existing recording
			if (this.currentRecorder) {
				await this.stopRecording(this.currentRecorder);
			}

			// Get audio stream with optional device selection
			const constraints: MediaStreamConstraints = {
				audio: deviceId ? { deviceId: { exact: deviceId } } : true
			};

			this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);

			// Create MediaRecorder with optimal settings for speech
			this.currentRecorder = new MediaRecorder(this.currentStream, {
				mimeType: this.getBestMimeType(),
				audioBitsPerSecond: 16000 // Good quality for speech recognition
			});

			return this.currentRecorder;
		} catch (error) {
			console.error('Failed to start recording:', error);
			throw new Error(
				`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async stopRecording(recorder: MediaRecorder): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			if (recorder.state === 'inactive') {
				reject(new Error('Recorder is not active'));
				return;
			}

			const chunks: Blob[] = [];

			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunks.push(event.data);
				}
			};

			recorder.onstop = async () => {
				try {
					const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/wav' });
					const arrayBuffer = await audioBlob.arrayBuffer();
					resolve(arrayBuffer);
				} catch (error) {
					reject(
						new Error(
							`Failed to process recording: ${error instanceof Error ? error.message : 'Unknown error'}`
						)
					);
				}
			};

			recorder.onerror = (event) => {
				reject(new Error(`Recording error: ${event.error?.message || 'Unknown error'}`));
			};

			// Stop recording and stream
			recorder.stop();

			if (this.currentStream) {
				this.currentStream.getTracks().forEach((track) => track.stop());
				this.currentStream = undefined;
			}

			this.currentRecorder = undefined;
		});
	}

	async getDevices(): Promise<MediaDeviceInfo[]> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			return devices.filter((device) => device.kind === 'audioinput');
		} catch (error) {
			console.error('Failed to get audio devices:', error);
			return [];
		}
	}

	// Get the best available MIME type for recording
	private getBestMimeType(): string {
		const mimeTypes = [
			'audio/webm;codecs=opus',
			'audio/webm',
			'audio/mp4',
			'audio/ogg;codecs=opus',
			'audio/wav'
		];

		for (const mimeType of mimeTypes) {
			if (MediaRecorder.isTypeSupported(mimeType)) {
				return mimeType;
			}
		}

		// Fallback to default
		return '';
	}

	// Check if recording is supported
	isRecordingSupported(): boolean {
		return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
	}

	// Get current recording state
	getRecordingState(): 'inactive' | 'recording' | 'paused' | undefined {
		return this.currentRecorder?.state;
	}

	// Pause recording (if supported)
	pauseRecording(): void {
		if (this.currentRecorder?.state === 'recording') {
			this.currentRecorder.pause();
		}
	}

	// Resume recording (if supported)
	resumeRecording(): void {
		if (this.currentRecorder?.state === 'paused') {
			this.currentRecorder.resume();
		}
	}

	// Get audio levels for visualization
	getAudioLevels(): Promise<number[]> {
		return new Promise((resolve) => {
			if (!this.currentStream) {
				resolve([]);
				return;
			}

			const audioContext = new AudioContext();
			const analyser = audioContext.createAnalyser();
			const source = audioContext.createMediaStreamSource(this.currentStream);

			source.connect(analyser);
			analyser.fftSize = 256;

			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);

			const updateLevels = () => {
				analyser.getByteFrequencyData(dataArray);
				const levels = Array.from(dataArray).map((value) => value / 255);
				resolve(levels);
			};

			// Get levels after a short delay to allow audio to start
			setTimeout(updateLevels, 100);
		});
	}

	// Clean up resources
	dispose(): void {
		if (this.currentRecorder) {
			this.currentRecorder.stop();
			this.currentRecorder = undefined;
		}

		if (this.currentStream) {
			this.currentStream.getTracks().forEach((track) => track.stop());
			this.currentStream = undefined;
		}
	}
}
