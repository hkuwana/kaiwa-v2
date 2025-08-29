// src/lib/services/event-handler.service.ts
import type { ServerEvent } from '$lib/types/openai.realtime.types';

export interface EventHandlerCallbacks {
	onUserSpeechStarted: () => void;
	onUserSpeechStopped: () => void;
	onSessionCreated: () => void;
	onOtherEvent: (serverEvent: ServerEvent) => void;
	onError: (error: string) => void;
}

export function handleDataChannelMessage(
	event: MessageEvent,
	callbacks: EventHandlerCallbacks
): void {
	try {
		const serverEvent: ServerEvent = JSON.parse(event.data);

		if (serverEvent.type === 'input_audio_buffer.speech_started') {
			callbacks.onUserSpeechStarted();
		} else if (serverEvent.type === 'input_audio_buffer.speech_stopped') {
			callbacks.onUserSpeechStopped();
		} else if (serverEvent.type === 'session.created') {
			callbacks.onSessionCreated();
		} else {
			callbacks.onOtherEvent(serverEvent);
		}
	} catch (error) {
		callbacks.onError('Failed to process server message');
	}
}

export function setupDataChannelErrorHandlers(
	dataChannel: RTCDataChannel,
	callbacks: {
		onError: (error: string) => void;
		onClose: () => void;
	}
): void {
	dataChannel.onerror = (error) => {
		console.error('Data channel error:', error);
		callbacks.onError('Data channel error');
	};

	dataChannel.onclose = () => {
		console.log('Data channel closed');
		callbacks.onClose();
	};
}

export function setupPeerConnectionHandlers(
	peerConnection: RTCPeerConnection,
	callbacks: {
		onConnectionStateChange: (state: string) => void;
		onError: (error: string) => void;
	}
): void {
	peerConnection.onconnectionstatechange = () => {
		const state = peerConnection.connectionState;
		console.log('WebRTC connection state:', state);

		if (state === 'failed' || state === 'closed') {
			callbacks.onError(`Connection ${state}`);
		} else {
			callbacks.onConnectionStateChange(state);
		}
	};
}
