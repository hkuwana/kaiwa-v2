// 🎵 OpenAI Audio Adapter
// Implements AudioProcessingPort for AI-powered audio processing

import type { AudioProcessingPort } from '../types';

export class OpenAIAudioAdapter implements AudioProcessingPort {
	private baseUrl: string;

	constructor(baseUrl: string = '') {
		this.baseUrl = baseUrl;
	}

	async transcribe(audio: ArrayBuffer): Promise<string> {
		try {
			// Convert ArrayBuffer to Blob
			const audioBlob = new Blob([audio], { type: 'audio/webm' });

			// Create FormData for the request
			const formData = new FormData();
			formData.append('audio', audioBlob, 'audio.webm');

			// Call our server endpoint
			const response = await fetch(`${this.baseUrl}/api/audio/transcribe`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Transcription failed');
			}

			const result = await response.json();
			return result.transcript;
		} catch (error) {
			console.error('Transcription error:', error);
			throw new Error(
				`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async textToSpeech(text: string, voice: string = 'alloy'): Promise<ArrayBuffer> {
		try {
			// Call our server endpoint
			const response = await fetch(`${this.baseUrl}/api/audio/tts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ text, voice })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Text-to-speech failed');
			}

			const result = await response.json();

			// Convert base64 back to ArrayBuffer
			const binaryString = atob(result.audio);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			return bytes.buffer;
		} catch (error) {
			console.error('TTS error:', error);
			throw new Error(
				`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async streamTextToSpeech(
		text: string,
		onChunk: (chunk: ArrayBuffer) => void,
		voice: string = 'alloy'
	): Promise<void> {
		try {
			// For streaming, we'll generate the full audio first and then simulate streaming
			// In a real implementation, you might want to use OpenAI's streaming TTS endpoint
			const audioBuffer = await this.textToSpeech(text, voice);

			// Simulate streaming by chunking the audio
			const chunkSize = 4096; // 4KB chunks
			for (let i = 0; i < audioBuffer.byteLength; i += chunkSize) {
				const chunk = audioBuffer.slice(i, i + chunkSize);
				onChunk(chunk);

				// Small delay to simulate real streaming
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		} catch (error) {
			console.error('Streaming TTS error:', error);
			throw new Error(
				`Failed to stream speech: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async streamTranscription(
		audioStream: MediaStream,
		onTranscript: (text: string, isFinal: boolean) => void,
		onError?: (error: string) => void
	): Promise<void> {
		try {
			// Create MediaRecorder to capture audio chunks
			const mediaRecorder = new MediaRecorder(audioStream, {
				mimeType: 'audio/webm;codecs=opus'
			});

			const audioChunks: Blob[] = [];

			mediaRecorder.ondataavailable = async (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);

					// Process chunk for real-time transcription
					try {
						const audioBuffer = await event.data.arrayBuffer();
						const transcript = await this.transcribe(audioBuffer);

						if (transcript.trim()) {
							onTranscript(transcript, false); // Not final
						}
					} catch (error) {
						if (onError) {
							onError(
								`Chunk transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
							);
						}
					}
				}
			};

			mediaRecorder.onstop = async () => {
				try {
					// Process final audio for complete transcription
					const finalBlob = new Blob(audioChunks, { type: 'audio/webm' });
					const finalBuffer = await finalBlob.arrayBuffer();
					const finalTranscript = await this.transcribe(finalBuffer);

					if (finalTranscript.trim()) {
						onTranscript(finalTranscript, true); // Final
					}
				} catch (error) {
					if (onError) {
						onError(
							`Final transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
					}
				}
			};

			mediaRecorder.start(1000); // Capture every second
		} catch (error) {
			console.error('Streaming transcription error:', error);
			if (onError) {
				onError(
					`Streaming transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}
	}

	// Remove client-side API key methods - these are now handled server-side
	// setApiKey and getApiKey are no longer needed
}
