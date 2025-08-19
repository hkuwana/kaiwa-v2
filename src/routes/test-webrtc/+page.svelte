<!-- Test WebRTC Connection Only -->
<script lang="ts">
  import { webrtcConnection } from '$lib/features/realtime/webrtc-connection';
  
  let connected = $state(false);
  let connectionState = $state('disconnected');
  let error = $state<string | null>(null);
  let testMessage = $state('');
  let receivedEvents = $state<any[]>([]);
  
  async function connect() {
    try {
      error = null;
      await webrtcConnection.connect('alloy');
      connected = true;
      connectionState = webrtcConnection.getConnectionState();
      
      // Set up message handler to capture events
      webrtcConnection.onMessage((event) => {
        receivedEvents = [...receivedEvents, {
          ...event,
          timestamp: new Date().toLocaleTimeString()
        }];
      });
      
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      connected = false;
      connectionState = 'error';
    }
  }
  
  function disconnect() {
    webrtcConnection.cleanup();
    connected = false;
    connectionState = 'disconnected';
    receivedEvents = [];
  }
  
  function sendTest() {
    if (!connected) return;
    
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: testMessage || 'Hello!' }]
      }
    };
    
    webrtcConnection.sendEvent(event);
    
    // Add to received events for visibility
    receivedEvents = [...receivedEvents, {
      ...event,
      timestamp: new Date().toLocaleTimeString(),
      sent: true
    }];
    
    testMessage = '';
  }
  
  function clearEvents() {
    receivedEvents = [];
  }
</script>

<div class="container">
  <h1>📡 WebRTC Connection Test</h1>
  <p>Test WebRTC connection independently from business logic</p>
  
  <div class="connection-section">
    <h2>🔌 Connection Status</h2>
    <div class="status-grid">
      <div class="status-item">
        <span class="label">Connected:</span>
        <span class="value {connected ? 'success' : 'error'}">
          {connected ? '✅ Yes' : '❌ No'}
        </span>
      </div>
      <div class="status-item">
        <span class="label">State:</span>
        <span class="value">{connectionState}</span>
      </div>
    </div>
    
    <div class="connection-actions">
      {#if !connected}
        <button on:click={connect} class="connect-btn">🔌 Connect</button>
      {:else}
        <button on:click={disconnect} class="disconnect-btn">🔌 Disconnect</button>
      {/if}
    </div>
    
    {#if error}
      <div class="error-message">
        ❌ Error: {error}
      </div>
    {/if}
  </div>
  
  {#if connected}
    <div class="test-section">
      <h2>🧪 Test Communication</h2>
      
      <div class="message-input">
        <input 
          type="text" 
          bind:value={testMessage}
          placeholder="Enter test message..."
          class="message-field"
        />
        <button on:click={sendTest} class="send-btn">📤 Send Test</button>
      </div>
      
      <div class="events-section">
        <div class="events-header">
          <h3>📨 Events Log</h3>
          <button on:click={clearEvents} class="clear-btn">🗑️ Clear</button>
        </div>
        
        <div class="events-list">
          {#each receivedEvents as event, index}
            <div class="event-item {event.sent ? 'sent' : 'received'}">
              <div class="event-header">
                <span class="event-type">{event.type}</span>
                <span class="event-time">{event.timestamp}</span>
                {#if event.sent}
                  <span class="event-direction">📤 Sent</span>
                {:else}
                  <span class="event-direction">📥 Received</span>
                {/if}
              </div>
              <pre class="event-data">{JSON.stringify(event, null, 2)}</pre>
            </div>
          {/each}
          
          {#if receivedEvents.length === 0}
            <p class="no-events">No events yet. Send a test message to see events here.</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  <div class="info-section">
    <h2>ℹ️ Connection Info</h2>
    <p>This test page isolates WebRTC functionality from:</p>
    <ul>
      <li>❌ Business logic</li>
      <li>❌ Conversation state</li>
      <li>❌ UI complexity</li>
    </ul>
    <p>✅ Only tests connection, data channel, and basic communication</p>
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
  
  .connection-section, .test-section, .info-section {
    margin: 2rem 0;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #d1d5db;
  }
  
  .label {
    font-weight: 500;
  }
  
  .value.success {
    color: #059669;
  }
  
  .value.error {
    color: #dc2626;
  }
  
  .connection-actions {
    margin: 1rem 0;
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
  
  button:hover {
    background: #1d4ed8;
  }
  
  .connect-btn {
    background: #059669;
  }
  
  .connect-btn:hover {
    background: #047857;
  }
  
  .disconnect-btn {
    background: #dc2626;
  }
  
  .disconnect-btn:hover {
    background: #b91c1c;
  }
  
  .error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #fecaca;
    margin-top: 1rem;
  }
  
  .message-input {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  
  .message-field {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }
  
  .send-btn {
    background: #7c3aed;
  }
  
  .send-btn:hover {
    background: #6d28d9;
  }
  
  .events-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .clear-btn {
    background: #6b7280;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .clear-btn:hover {
    background: #4b5563;
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
  }
  
  .event-item.sent {
    background: #f0f9ff;
    border-color: #0ea5e9;
  }
  
  .event-item.received {
    background: #f0fdf4;
    border-color: #22c55e;
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
  
  .event-direction {
    font-size: 0.75rem;
    font-weight: 500;
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
  
  ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }
  
  li {
    margin: 0.25rem 0;
  }
</style>
