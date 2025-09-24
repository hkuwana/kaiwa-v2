# RealtimeDebugPanel Component

A reusable debug panel component for investigating duplicate messages and realtime conversation flow issues.

## Features

- **Side-by-side message comparison** between conversation store and realtime store
- **Visual duplicate detection** - duplicates highlighted with red borders
- **Message status tracking** (PLACEHOLDER, TRANSCRIBING, PARTIAL, STREAMING, FINAL)
- **Collapsible interface** - starts collapsed, can be expanded or hidden
- **Event logging** with optional detailed view
- **Floating position** - doesn't interfere with your main UI

## Usage

### 1. Import the component

```svelte
import RealtimeDebugPanel from '$lib/features/development/components/RealtimeDebugPanel.svelte';
```

### 2. Add the component to your template

```svelte
{#if dev && showDebugPanel}
	<RealtimeDebugPanel
		messages={conversationStore.messages}
		realtimeMessages={realtimeOpenAI.messages}
		events={realtimeOpenAI.events}
		connectionStatus={conversationStore.status}
		isCollapsed={debugCollapsed}
		onToggleCollapse={toggleDebugPanel}
	/>
{/if}
```

### 3. Add state management

```javascript
// Debug panel state (only in dev mode)
let showDebugPanel = $state(dev && false); // Start hidden
let debugCollapsed = $state(true); // Start collapsed when shown

function toggleDebugPanel() {
	if (!showDebugPanel) {
		showDebugPanel = true;
		debugCollapsed = false;
	} else {
		debugCollapsed = !debugCollapsed;
	}
}

function hideDebugPanel() {
	showDebugPanel = false;
}
```

### 4. Add toggle button to your dev controls

```svelte
<button
	class="btn btn-sm {showDebugPanel ? 'btn-secondary' : 'btn-outline'}"
	onclick={toggleDebugPanel}
>
	{#if !showDebugPanel}
		Show Debug Panel
	{:else if debugCollapsed}
		Expand Debug
	{:else}
		Collapse Debug
	{/if}
</button>
```

### 5. Handle clear events (optional)

```javascript
onMount(() => {
	// Listen for clear events from debug panel
	const handleClearEvents = () => {
		realtimeOpenAI.clearEvents();
	};

	document.addEventListener('clearEvents', handleClearEvents);

	return () => {
		document.removeEventListener('clearEvents', handleClearEvents);
	};
});
```

## Props

| Prop               | Type                              | Description                              |
| ------------------ | --------------------------------- | ---------------------------------------- |
| `messages`         | `Message[]`                       | Messages from conversation store         |
| `realtimeMessages` | `Message[]`                       | Messages from realtime store             |
| `events`           | `Array<{dir, type, payload, ts}>` | Raw events from realtime connection      |
| `connectionStatus` | `string`                          | Current connection status                |
| `isCollapsed`      | `boolean`                         | Whether panel is collapsed               |
| `onToggleCollapse` | `function`                        | Callback when collapse button is clicked |

## Example Integration

The panel is already integrated into:

- `/dev-realtime-debug` - Standalone debug page
- `/conversation` - Embedded in actual conversation (dev mode only)

## How to Debug Duplicate Messages

1. **Start a conversation** with the debug panel visible
2. **Look for red borders** around messages - these indicate duplicates
3. **Check sequence IDs** to understand ordering issues
4. **Review raw events** to see the exact event sequence that causes duplicates
5. **Compare both stores** to see where the duplication occurs

The panel will help you identify:

- Multiple placeholder creation
- Race conditions in event processing
- ID prefix conflicts
- Timing issues in message finalization
