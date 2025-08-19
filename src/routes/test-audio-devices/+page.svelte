<!-- Test Audio Devices Only -->
<script lang="ts">
  import { audioDeviceManager } from '$lib/features/audio/device-manager';
  import { eventBus } from '$lib/shared/events/typed-event-bus';
  
  let devices = $state<MediaDeviceInfo[]>([]);
  let stream = $state<MediaStream | null>(null);
  let audioLevel = $state(0);
  let isTesting = $state(false);
  let events = $state<Array<{ type: string; data: any; timestamp: string }>>([]);
  let eventCount = $state(0);
  
  // Initialize audio device manager
  $effect(() => {
    audioDeviceManager.initialize();
  });
  
  // Listen to audio events
  $effect(() => {
    const unsubscribers = [
      eventBus.on('audio.device.changed', (data) => {
        events = [...events, {
          type: 'audio.device.changed',
          data,
          timestamp: new Date().toLocaleTimeString()
        }];
        eventCount++;
      }),
      
      eventBus.on('audio.level.update', (data) => {
        audioLevel = data.level;
        events = [...events, {
          type: 'audio.level.update',
          data: { level: data.level.toFixed(3) },
          timestamp: new Date().toLocaleTimeString()
        }];
        eventCount++;
      }),
      
      eventBus.on('audio.stream.ready', (data) => {
        events = [...events, {
          type: 'audio.stream.ready',
          data: { streamId: data.stream.id },
          timestamp: new Date().toLocaleTimeString()
        }];
        eventCount++;
      }),
      
      eventBus.on('audio.stream.error', (data) => {
        events = [...events, {
          type: 'audio.stream.error',
          data,
          timestamp: new Date().toLocaleTimeString()
        }];
        eventCount++;
      })
    ];
    
    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  });
  
  async function loadDevices() {
    devices = await audioDeviceManager.getAvailableDevices();
  }
  
  async function testDevice(deviceId: string) {
    try {
      stream = await audioDeviceManager.getStream(deviceId);
      isTesting = true;
    } catch (error) {
      console.error('Failed to test device:', error);
      alert(`Failed to test device: ${error.message}`);
    }
  }
  
  function stopTest() {
    if (stream) {
      audioDeviceManager.cleanup();
      stream = null;
      isTesting = false;
      audioLevel = 0;
    }
  }
  
  function clearEvents() {
    events = [];
    eventCount = 0;
  }
  
  // Load devices on mount
  $effect(() => {
    loadDevices();
  });
</script>

<div class="container">
  <h1>🎵 Audio Device Test</h1>
  <p>Test audio devices independently from recording/streaming with real-time events</p>
  
  <div class="devices-section">
    <h2>Available Devices</h2>
    <button on:click={loadDevices}>🔄 Refresh Devices</button>
    
    <div class="device-list">
      {#each devices as device}
        <div class="device-item">
          <span class="device-name">{device.label || `Device ${device.deviceId.slice(0, 8)}...`}</span>
          <button 
            on:click={() => testDevice(device.deviceId)}
            disabled={isTesting}
          >
            {isTesting && stream ? 'Testing...' : 'Test Device'}
          </button>
        </div>
      {/each}
    </div>
  </div>
  
  {#if isTesting && stream}
    <div class="test-section">
      <h2>🎤 Device Test Active</h2>
      <p>Testing device: {audioDeviceManager.getCurrentDeviceId()}</p>
      
      <div class="audio-visualizer">
        <div class="level-bar">
          <div class="level-fill" style="width: {audioLevel * 100}%"></div>
        </div>
        <span>Audio Level: {Math.round(audioLevel * 100)}%</span>
      </div>
      
      <button on:click={stopTest} class="stop-btn">⏹️ Stop Test</button>
    </div>
  {/if}
  
  <div class="events-section">
    <h2>📡 Real-time Events ({eventCount})</h2>
    <button on:click={clearEvents} class="clear-btn">🗑️ Clear Events</button>
    
    <div class="events-list">
      {#each events.slice(-10) as event}
        <div class="event-item">
          <div class="event-header">
            <span class="event-type">{event.type}</span>
            <span class="event-time">{event.timestamp}</span>
          </div>
          <pre class="event-data">{JSON.stringify(event.data, null, 2)}</pre>
        </div>
      {/each}
      
      {#if events.length === 0}
        <p class="no-events">No events yet. Test a device to see events here.</p>
      {/if}
    </div>
  </div>
  
  <div class="info-section">
    <h2>ℹ️ Device Manager Info</h2>
    <p>Has Active Stream: {audioDeviceManager.hasActiveStream()}</p>
    <p>Current Device: {audioDeviceManager.getCurrentDeviceId()}</p>
    <p>Current Audio Level: {audioDeviceManager.getCurrentAudioLevel().toFixed(3)}</p>
    <p>Registered Events: {eventBus.getRegisteredEvents().join(', ')}</p>
  </div>
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  h1 {
    color: #2563eb;
    margin-bottom: 0.5rem;
  }
  
  .devices-section, .test-section, .events-section, .info-section {
    margin: 2rem 0;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
  
  .device-list {
    margin-top: 1rem;
  }
  
  .device-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    margin: 0.5rem 0;
    background: white;
    border-radius: 6px;
    border: 1px solid #d1d5db;
  }
  
  button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    margin-right: 0.5rem;
  }
  
  button:hover:not(:disabled) {
    background: #1d4ed8;
  }
  
  button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .stop-btn {
    background: #dc2626;
  }
  
  .stop-btn:hover {
    background: #b91c1c;
  }
  
  .clear-btn {
    background: #6b7280;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .clear-btn:hover {
    background: #4b5563;
  }
  
  .audio-visualizer {
    margin: 1rem 0;
    text-align: center;
  }
  
  .level-bar {
    width: 100%;
    height: 20px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .level-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #3b82f6);
    transition: width 0.1s ease;
  }
  
  .events-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .events-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .event-item {
    margin: 0.5rem 0;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: white;
  }
  
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  .event-type {
    font-weight: 600;
    color: #374151;
  }
  
  .event-time {
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  .event-data {
    background: #1f2937;
    color: #f9fafb;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    overflow-x: auto;
    margin: 0;
  }
  
  .no-events {
    text-align: center;
    color: #6b7280;
    font-style: italic;
    padding: 2rem;
  }
</style>
