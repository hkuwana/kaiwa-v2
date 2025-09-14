// 📡 Realtime Services - Types and Interfaces
// Comprehensive and type-safe definitions for OpenAI Realtime API
// Now integrating with official @openai/agents-realtime package

// === Official OpenAI Agents Exports ===
export { RealtimeAgent, RealtimeSession as OpenAIRealtimeSession } from '@openai/agents-realtime';

// Re-export commonly used types from the official package
export type {} from // Add official types as they become available
'@openai/agents-realtime';

// === Core Types ===
export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';
export type Voice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

// 🌟 Default voice (first in the union type)
export const DEFAULT_VOICE: Voice = 'sage';
export const VALID_OPENAI_VOICES = [
	'verse',
	'alloy',
	'ash',
	'ballad',
	'coral',
	'echo',
	'sage',
	'shimmer'
];

// 🌟 Helper function to get default voice
export function getDefaultVoice(): Voice {
	return DEFAULT_VOICE;
}

// 🌟 Type-safe voice validation
export function isValidVoice(voice?: string): voice is Voice {
	if (!voice) {
		return false;
	}
	return VALID_OPENAI_VOICES.includes(voice as Voice);
}

export type Modality = 'text' | 'audio';
export type ToolChoice = 'auto' | 'none' | 'required';
export type VADType = 'server_vad' | 'semantic_vad';
export type TranscriptionModel = 'whisper-1' | 'gpt-4o-transcribe';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ContentType = 'input_text' | 'input_audio' | 'text' | 'audio';
export type ItemType = 'message' | 'function_call' | 'function_call_output';

// === Audio Configuration ===
export interface InputAudioTranscription {
	model: TranscriptionModel;
	language: string;
	prompt?: string;
}

export interface InputAudioNoiseReduction {
	type: 'near_field' | 'far_field';
}

export interface TurnDetection {
	type?: VADType;
	threshold?: number;
	prefix_padding_ms?: number;
	silence_duration_ms?: number;
	create_response?: boolean;
	eagerness?: string;
	interrupt_response?: boolean;
}

// === Tools Configuration ===
export interface FunctionParameter {
	type: 'string' | 'number' | 'boolean' | 'object' | 'array';
	description?: string;
	enum?: string[];
	items?: FunctionParameter;
	properties?: Record<string, FunctionParameter>;
	required?: string[];
}

export interface FunctionTool {
	type: 'function';
	name: string;
	description: string;
	parameters: {
		type: 'object';
		properties: Record<string, FunctionParameter>;
		required?: string[];
	};
}

// === Session Configuration ===
// Replace local definition with official SDK config for accuracy and forward compatibility
import type { RealtimeSessionConfig as OfficialRealtimeSessionConfig } from '@openai/agents-realtime';
export type SessionConfig = OfficialRealtimeSessionConfig;

// === Simplified Session Config (for your existing code) ===
export interface SimpleSessionConfig {
	model: string;
	voice: Voice;
	instructions?: string;
	turnDetection?: {
		type: 'server_vad';
		threshold: number;
		prefix_padding_ms: number;
		silence_duration_ms: number;
	};
	inputAudioTranscription?: {
		model: TranscriptionModel;
		language: string;
	};
}

export interface TracingConfig {
	workflow_name: string;
	group_id: string;
	metadata?: Record<string, string | number | boolean>;
}

// === Main Session Interface ===
export interface RealtimeSession {
	id: string;
	clientSecret: string;
	expiresAt: number;
	config: SessionConfig;
}

// === Content Types ===
export interface TextContent {
	type: 'text' | 'input_text';
	text: string;
}

export interface AudioContent {
	type: 'audio' | 'input_audio';
	audio: string; // Base64 encoded
	transcript?: string;
}

export type ConversationContent = TextContent | AudioContent;

// === Conversation Items ===
export interface MessageItem {
	id: string;
	type: 'message';
	role: MessageRole;
	content: ConversationContent[];
	status?: 'completed' | 'incomplete' | 'failed';
}

export interface FunctionCallItem {
	id: string;
	type: 'function_call';
	name: string;
	call_id: string;
	arguments: string;
}

export interface FunctionCallOutputItem {
	id: string;
	type: 'function_call_output';
	call_id: string;
	output: string;
}

export type ConversationItem = MessageItem | FunctionCallItem | FunctionCallOutputItem;

// === Event Base Types ===
export interface BaseEvent {
	event_id?: string;
	type: string;
}

// === Client Events ===
export interface SessionUpdateEvent extends BaseEvent {
	type: 'session.update';
	session: Partial<SessionConfig>;
}

export interface InputAudioBufferAppendEvent extends BaseEvent {
	type: 'input_audio_buffer.append';
	audio: string; // Base64 encoded audio
}

export interface InputAudioBufferCommitEvent extends BaseEvent {
	type: 'input_audio_buffer.commit';
}

export interface InputAudioBufferClearEvent extends BaseEvent {
	type: 'input_audio_buffer.clear';
}

export interface ConversationItemCreateEvent extends BaseEvent {
	type: 'conversation.item.create';
	previous_item_id?: string;
	item: ConversationItem;
}

export interface ConversationItemDeleteEvent extends BaseEvent {
	type: 'conversation.item.delete';
	item_id: string;
}

export interface ConversationItemTruncateEvent extends BaseEvent {
	type: 'conversation.item.truncate';
	item_id: string;
	content_index: number;
	audio_end_ms: number;
}

export interface ResponseCreateEvent extends BaseEvent {
	type: 'response.create';
	response: {
		// Note: modalities, instructions, voice are NOT valid in response.create
		// They should be set at session level via session.update
		// Based on OpenAI Realtime API documentation, response.create should be minimal
		tools?: FunctionTool[];
		tool_choice?: ToolChoice;
		temperature?: number;
		max_output_tokens?: number | 'inf';
	};
}

export interface ResponseCancelEvent extends BaseEvent {
	type: 'response.cancel';
	response_id?: string;
}

export type ClientEvent =
	| SessionUpdateEvent
	| InputAudioBufferAppendEvent
	| InputAudioBufferCommitEvent
	| InputAudioBufferClearEvent
	| ConversationItemCreateEvent
	| ConversationItemDeleteEvent
	| ConversationItemTruncateEvent
	| ResponseCreateEvent
	| ResponseCancelEvent;

// === Usage and Token Details ===
export interface TokenDetails {
	cached_tokens?: number;
	text_tokens?: number;
	audio_tokens?: number;
	cached_tokens_details?: {
		text_tokens?: number;
		audio_tokens?: number;
	};
}

export interface Usage {
	total_tokens?: number;
	input_tokens?: number;
	output_tokens?: number;
	input_token_details?: TokenDetails;
	output_token_details?: {
		text_tokens?: number;
		audio_tokens?: number;
	};
}

// === Log Probabilities ===
export interface LogProb {
	token: string;
	logprob: number;
	bytes?: number[];
}

// === Rate Limit Information ===
export interface RateLimit {
	name: string;
	limit: number;
	remaining: number;
	reset_seconds: number;
}

// === Response Object ===
export interface ResponseObject {
	id: string;
	object: 'realtime.response';
	status: 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'incomplete';
	status_details?: {
		type: string;
		reason?: string;
	} | null;
	output: ConversationItem[];
	usage?: Usage | null;
}

// === Conversation Object ===
export interface ConversationObject {
	id: string;
	object: 'realtime.conversation';
}

// === Full Session Object ===
export type FullSessionObject = SessionConfig & {
	id: string;
	object: 'realtime.session';
	expires_at?: number;
};

// === Server Events ===
export interface ErrorEvent extends BaseEvent {
	type: 'error';
	error: {
		type:
			| 'invalid_request_error'
			| 'authentication_error'
			| 'permission_error'
			| 'not_found_error'
			| 'unprocessable_entity_error'
			| 'rate_limit_error'
			| 'internal_server_error'
			| 'transcription_error';
		code: string;
		message: string;
		param?: string | null;
		event_id?: string;
	};
}

export interface SessionCreatedEvent extends BaseEvent {
	type: 'session.created';
	session: FullSessionObject;
}

export interface SessionUpdatedEvent extends BaseEvent {
	type: 'session.updated';
	session: FullSessionObject;
}

export interface ConversationCreatedEvent extends BaseEvent {
	type: 'conversation.created';
	conversation: ConversationObject;
}

export interface ConversationItemCreatedEvent extends BaseEvent {
	type: 'conversation.item.created';
	previous_item_id?: string | null;
	item: ConversationItem;
}

export interface ConversationItemRetrievedEvent extends BaseEvent {
	type: 'conversation.item.retrieved';
	item: ConversationItem;
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent extends BaseEvent {
	type: 'conversation.item.input_audio_transcription.completed';
	item_id: string;
	content_index: number;
	transcript: string;
	logprobs?: LogProb[] | null;
	usage?: Usage;
}

export interface ConversationItemInputAudioTranscriptionDeltaEvent extends BaseEvent {
	type: 'conversation.item.input_audio_transcription.delta';
	item_id: string;
	content_index: number;
	delta: string;
	logprobs?: LogProb[] | null;
}

export interface ConversationItemInputAudioTranscriptionFailedEvent extends BaseEvent {
	type: 'conversation.item.input_audio_transcription.failed';
	item_id: string;
	content_index: number;
	error: {
		type: string;
		code: string;
		message: string;
		param?: string | null;
	};
}

export interface ConversationItemTruncatedEvent extends BaseEvent {
	type: 'conversation.item.truncated';
	item_id: string;
	content_index: number;
	audio_end_ms: number;
}

export interface ConversationItemDeletedEvent extends BaseEvent {
	type: 'conversation.item.deleted';
	item_id: string;
}

export interface InputAudioBufferCommittedEvent extends BaseEvent {
	type: 'input_audio_buffer.committed';
	previous_item_id?: string | null;
	item_id: string;
}

export interface InputAudioBufferClearedEvent extends BaseEvent {
	type: 'input_audio_buffer.cleared';
}

export interface InputAudioBufferSpeechStartedEvent extends BaseEvent {
	type: 'input_audio_buffer.speech_started';
	audio_start_ms: number;
	item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent extends BaseEvent {
	type: 'input_audio_buffer.speech_stopped';
	audio_end_ms: number;
	item_id: string;
}

export interface ResponseCreatedEvent extends BaseEvent {
	type: 'response.created';
	response: ResponseObject;
}

export interface ResponseDoneEvent extends BaseEvent {
	type: 'response.done';
	response: ResponseObject;
}

export interface ResponseOutputItemAddedEvent extends BaseEvent {
	type: 'response.output_item.added';
	response_id: string;
	output_index: number;
	item: ConversationItem;
}

export interface ResponseOutputItemDoneEvent extends BaseEvent {
	type: 'response.output_item.done';
	response_id: string;
	output_index: number;
	item: ConversationItem;
}

export interface ResponseContentPartAddedEvent extends BaseEvent {
	type: 'response.content_part.added';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	part: ConversationContent;
}

export interface ResponseContentPartDoneEvent extends BaseEvent {
	type: 'response.content_part.done';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	part: ConversationContent;
}

export interface ResponseTextDeltaEvent extends BaseEvent {
	type: 'response.text.delta';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	delta: string;
}

export interface ResponseTextDoneEvent extends BaseEvent {
	type: 'response.text.done';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	text: string;
}

export interface ResponseAudioTranscriptDeltaEvent extends BaseEvent {
	type: 'response.audio_transcript.delta';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	delta: string;
}

export interface ResponseAudioTranscriptDoneEvent extends BaseEvent {
	type: 'response.audio_transcript.done';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	transcript: string;
}

export interface ResponseAudioDeltaEvent extends BaseEvent {
	type: 'response.audio.delta';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
	delta: string; // Base64 encoded audio
}

export interface ResponseAudioDoneEvent extends BaseEvent {
	type: 'response.audio.done';
	response_id: string;
	item_id: string;
	output_index: number;
	content_index: number;
}

export interface ResponseFunctionCallArgumentsDeltaEvent extends BaseEvent {
	type: 'response.function_call_arguments.delta';
	response_id: string;
	item_id: string;
	output_index: number;
	call_id: string;
	delta: string; // JSON string
}

export interface ResponseFunctionCallArgumentsDoneEvent extends BaseEvent {
	type: 'response.function_call_arguments.done';
	response_id: string;
	item_id: string;
	output_index: number;
	call_id: string;
	arguments: string; // JSON string
}

export interface TranscriptionSessionUpdatedEvent extends BaseEvent {
	type: 'transcription_session.updated';
	session: {
		id: string;
		object: 'realtime.transcription_session';
		input_audio_format: AudioFormat;
		input_audio_transcription?: InputAudioTranscription;
		turn_detection?: TurnDetection;
		input_audio_noise_reduction?: InputAudioNoiseReduction;
		include?: string[];
	};
}

export interface RateLimitsUpdatedEvent extends BaseEvent {
	type: 'rate_limits.updated';
	rate_limits: RateLimit[];
}

export interface OutputAudioBufferStartedEvent extends BaseEvent {
	type: 'output_audio_buffer.started';
	response_id: string;
}

export interface OutputAudioBufferStoppedEvent extends BaseEvent {
	type: 'output_audio_buffer.stopped';
	response_id: string;
}

export interface OutputAudioBufferClearedEvent extends BaseEvent {
	type: 'output_audio_buffer.cleared';
	response_id: string;
}

export type ServerEvent =
	| ErrorEvent
	| SessionCreatedEvent
	| SessionUpdatedEvent
	| ConversationCreatedEvent
	| ConversationItemCreatedEvent
	| ConversationItemRetrievedEvent
	| ConversationItemInputAudioTranscriptionCompletedEvent
	| ConversationItemInputAudioTranscriptionDeltaEvent
	| ConversationItemInputAudioTranscriptionFailedEvent
	| ConversationItemTruncatedEvent
	| ConversationItemDeletedEvent
	| InputAudioBufferCommittedEvent
	| InputAudioBufferClearedEvent
	| InputAudioBufferSpeechStartedEvent
	| InputAudioBufferSpeechStoppedEvent
	| ResponseCreatedEvent
	| ResponseDoneEvent
	| ResponseOutputItemAddedEvent
	| ResponseOutputItemDoneEvent
	| ResponseContentPartAddedEvent
	| ResponseContentPartDoneEvent
	| ResponseTextDeltaEvent
	| ResponseTextDoneEvent
	| ResponseAudioTranscriptDeltaEvent
	| ResponseAudioTranscriptDoneEvent
	| ResponseAudioDeltaEvent
	| ResponseAudioDoneEvent
	| ResponseFunctionCallArgumentsDeltaEvent
	| ResponseFunctionCallArgumentsDoneEvent
	| TranscriptionSessionUpdatedEvent
	| RateLimitsUpdatedEvent
	| OutputAudioBufferStartedEvent
	| OutputAudioBufferStoppedEvent
	| OutputAudioBufferClearedEvent;

// === Transcription Events ===
export interface TranscriptionEvent {
	type: 'user_transcript' | 'assistant_transcript';
	text: string;
	isFinal: boolean;
	timestamp: Date;
	confidence?: number;
	words?: Array<{
		word: string;
		start: number;
		end: number;
		confidence: number;
	}>;
}

// === Connection Status ===
export type PeerConnectionState =
	| 'new'
	| 'connecting'
	| 'connected'
	| 'disconnected'
	| 'failed'
	| 'closed';
export type DataChannelState = 'connecting' | 'open' | 'closing' | 'closed';

export interface ConnectionStatus {
	peerConnectionState: PeerConnectionState;
	dataChannelState: DataChannelState;
	isStreamingPaused: boolean;
	hasLocalStream: boolean;
}

// === Audio Test Result ===
export interface AudioTestResult {
	success: boolean;
	error?: string;
	details?: string;
	latency?: number;
	sampleRate?: number;
	channelCount?: number;
}

// === API Response Types ===

// === Event Handler Types ===
export type EventHandler<T extends ServerEvent> = (event: T) => void;

export interface EventHandlers {
	error: EventHandler<ErrorEvent>;
	'session.created': EventHandler<SessionCreatedEvent>;
	'session.updated': EventHandler<SessionUpdatedEvent>;
	'conversation.created': EventHandler<ConversationCreatedEvent>;
	'conversation.item.created': EventHandler<ConversationItemCreatedEvent>;
	'conversation.item.retrieved': EventHandler<ConversationItemRetrievedEvent>;
	'conversation.item.input_audio_transcription.completed': EventHandler<ConversationItemInputAudioTranscriptionCompletedEvent>;
	'conversation.item.input_audio_transcription.delta': EventHandler<ConversationItemInputAudioTranscriptionDeltaEvent>;
	'conversation.item.input_audio_transcription.failed': EventHandler<ConversationItemInputAudioTranscriptionFailedEvent>;
	'conversation.item.truncated': EventHandler<ConversationItemTruncatedEvent>;
	'conversation.item.deleted': EventHandler<ConversationItemDeletedEvent>;
	'input_audio_buffer.committed': EventHandler<InputAudioBufferCommittedEvent>;
	'input_audio_buffer.cleared': EventHandler<InputAudioBufferClearedEvent>;
	'input_audio_buffer.speech_started': EventHandler<InputAudioBufferSpeechStartedEvent>;
	'input_audio_buffer.speech_stopped': EventHandler<InputAudioBufferSpeechStoppedEvent>;
	'response.created': EventHandler<ResponseCreatedEvent>;
	'response.done': EventHandler<ResponseDoneEvent>;
	'response.output_item.added': EventHandler<ResponseOutputItemAddedEvent>;
	'response.output_item.done': EventHandler<ResponseOutputItemDoneEvent>;
	'response.content_part.added': EventHandler<ResponseContentPartAddedEvent>;
	'response.content_part.done': EventHandler<ResponseContentPartDoneEvent>;
	'response.text.delta': EventHandler<ResponseTextDeltaEvent>;
	'response.text.done': EventHandler<ResponseTextDoneEvent>;
	'response.audio_transcript.delta': EventHandler<ResponseAudioTranscriptDeltaEvent>;
	'response.audio_transcript.done': EventHandler<ResponseAudioTranscriptDoneEvent>;
	'response.audio.delta': EventHandler<ResponseAudioDeltaEvent>;
	'response.audio.done': EventHandler<ResponseAudioDoneEvent>;
	'response.function_call_arguments.delta': EventHandler<ResponseFunctionCallArgumentsDeltaEvent>;
	'response.function_call_arguments.done': EventHandler<ResponseFunctionCallArgumentsDoneEvent>;
	'transcription_session.updated': EventHandler<TranscriptionSessionUpdatedEvent>;
	'rate_limits.updated': EventHandler<RateLimitsUpdatedEvent>;
	'output_audio_buffer.started': EventHandler<OutputAudioBufferStartedEvent>;
	'output_audio_buffer.stopped': EventHandler<OutputAudioBufferStoppedEvent>;
	'output_audio_buffer.cleared': EventHandler<OutputAudioBufferClearedEvent>;
}

// === Client Interface ===
export interface RealtimeClient {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	send<T extends ClientEvent>(event: T): Promise<void>;
	on<K extends keyof EventHandlers>(eventType: K, handler: EventHandlers[K]): void;
	off<K extends keyof EventHandlers>(eventType: K, handler?: EventHandlers[K]): void;
	getConnectionStatus(): ConnectionStatus;
	testAudio(): Promise<AudioTestResult>;
}
