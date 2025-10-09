import type {
	RealtimeAudioConfig,
	RealtimeAudioFormat,
	RealtimeAudioFormatDefinition
} from '$lib/types/openai.realtime.types';

type CaptureAudioConfigParams = {
	currentFormat: RealtimeAudioFormat;
	currentSampleRate: number;
	currentChannels: number;
	audioConfig?: RealtimeAudioConfig;
};

type CaptureAudioConfigResult = {
	format: RealtimeAudioFormat;
	sampleRate: number;
	channels: number;
	audioConfig?: RealtimeAudioConfig;
};

/**
 * Compute the byte length of a base64-encoded string.
 */
export function base64ByteLength(encoded: string): number {
	if (!encoded) return 0;
	const sanitized = encoded.replace(/[^A-Za-z0-9+/=]/g, '');
	if (sanitized.length === 0) return 0;
	const padding = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
	return Math.max(0, Math.floor((sanitized.length * 3) / 4) - padding);
}

/**
 * Estimate duration (ms) for a PCM/µ-law audio buffer using the known format.
 */
export function estimateDurationFromByteLength(
	byteLength: number,
	format: RealtimeAudioFormatDefinition | undefined,
	sampleRate: number,
	channels: number
): number | null {
	if (!byteLength || !Number.isFinite(byteLength) || byteLength <= 0) return null;

	const effectiveChannels = Math.max(1, channels || 1);
	const effectiveSampleRate = sampleRate > 0 ? sampleRate : 24000;
	const bytesPerSample =
		format?.type === 'audio/pcmu' || format?.type === 'audio/pcma'
			? 1
			: format?.type === 'audio/pcm'
				? 'rate' in format && typeof format.rate === 'number'
					? 2
					: 2
				: 2;

	const samples = byteLength / (bytesPerSample * effectiveChannels);
	if (!Number.isFinite(samples) || samples <= 0) return null;
	const durationMs = (samples / effectiveSampleRate) * 1000;
	return durationMs > 0 ? durationMs : null;
}

/**
 * Estimate duration (ms) for a base64 audio chunk using the known format.
 */
export function estimateDurationFromBase64(
	base64: string,
	format: RealtimeAudioFormatDefinition | undefined,
	sampleRate: number,
	channels: number
): number | null {
	const byteLength = base64ByteLength(base64);
	if (!byteLength) return null;
	return estimateDurationFromByteLength(byteLength, format, sampleRate, channels);
}

/**
 * Normalize and capture output audio configuration, returning updated metadata
 * without mutating the provided config.
 */
export function captureOutputAudioConfig({
	currentFormat,
	currentSampleRate,
	currentChannels,
	audioConfig
}: CaptureAudioConfigParams): CaptureAudioConfigResult {
	if (!audioConfig?.output) {
		return {
			format: currentFormat,
			sampleRate: currentSampleRate,
			channels: currentChannels,
			audioConfig
		};
	}

	const output = { ...audioConfig.output } as Record<string, unknown>;
	let format = currentFormat;
	let sampleRate = currentSampleRate;
	let channels = currentChannels;

	const candidateFormat = output.format as RealtimeAudioFormatDefinition | undefined;
	if (candidateFormat?.type) {
		format = candidateFormat;
		if (
			'rate' in candidateFormat &&
			typeof candidateFormat.rate === 'number' &&
			candidateFormat.rate > 0
		) {
			sampleRate = candidateFormat.rate;
		}
	}

	const rateCandidates = [
		output.sample_rate,
		output.sampleRate,
		output.rate,
		candidateFormat && (candidateFormat as Record<string, unknown>).sample_rate,
		candidateFormat && (candidateFormat as Record<string, unknown>).sampleRate
	];
	for (const candidate of rateCandidates) {
		if (typeof candidate === 'number' && candidate > 0) {
			sampleRate = candidate;
			break;
		}
	}

	const channelCandidates = [output.channels, output.numChannels, output.channelCount];
	for (const candidate of channelCandidates) {
		if (typeof candidate === 'number' && candidate > 0) {
			channels = candidate;
			break;
		}
	}

	const normalizedOutput: RealtimeAudioConfig['output'] = { ...output };
	if (!normalizedOutput?.format) {
		normalizedOutput.format = format;
	}

	return {
		format,
		sampleRate,
		channels: Math.max(1, channels || 1),
		audioConfig: { ...audioConfig, output: normalizedOutput }
	};
}
