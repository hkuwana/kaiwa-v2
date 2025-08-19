// 🎵 Audio Feature - Simplified Architecture
// Only device management, no recording/streaming complexity

export { AudioDeviceManager, audioDeviceManager } from './device-manager';
export { eventBus } from '$lib/shared/events/typed-event-bus';

// Legacy exports for backward compatibility (can be removed later)
export { AudioOrchestrator, audioOrchestrator } from './orchestrator';
export { audioCore } from './core';

// Export specific types to avoid conflicts
export type { AudioState, AudioAction, AudioEffect } from './types';
export type { AudioInputPort, AudioOutputPort, AudioProcessingPort } from './adapters';
