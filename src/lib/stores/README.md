# Props-Based Component Design with Stores

This approach ensures that components never directly access stores, making them more predictable, testable, and maintainable.

## 🎯 **Key Principles**

1. **Components receive data through props only**
2. **Stores provide data through getter methods**
3. **Parent components manage store interactions**
4. **Child components are pure and predictable**

## 🚀 **Usage Pattern**

### 1. **Store Layer** (Data Management)
```typescript
// src/lib/stores/scenario.store.svelte.ts
export class ScenarioStore {
  private selectedScenario = $state<Scenario | null>(null);
  
  // Public getter methods
  getSelectedScenario = (): Scenario | null => this.selectedScenario;
  getScenarioId = (): string => this.selectedScenario?.id || 'onboarding-welcome';
  
  // Public setter methods
  setScenarioById = (scenarioId: string) => { /* ... */ };
}
```

### 2. **Parent Component** (Store Integration)
```typescript
<!-- src/lib/components/ScenarioManager.svelte -->
<script lang="ts">
  import { scenarioStore } from '$lib/stores/scenario.store.svelte';
  
  // Local state for component
  let scenarios = $state<Scenario[]>([]);
  let selectedScenario = $state<Scenario | null>(null);
  
  onMount(() => {
    // Get data from store
    scenarios = scenarioStore.getScenariosByCategory('comfort');
    selectedScenario = scenarioStore.getSelectedScenario();
  });
  
  function handleScenarioSelect(scenario: Scenario) {
    // Update local state
    selectedScenario = scenario;
    // Update store
    scenarioStore.setScenario(scenario);
  }
</script>

<!-- Pass data through props -->
<ScenarioSelector
  {scenarios}
  {selectedScenario}
  onScenarioSelect={handleScenarioSelect}
/>
```

### 3. **Child Component** (Pure Props)
```typescript
<!-- src/lib/components/ScenarioSelector.svelte -->
<script lang="ts">
  // Props-based design - no direct store access
  interface Props {
    scenarios: Scenario[];
    selectedScenario: Scenario | null;
    onScenarioSelect: (scenario: Scenario) => void;
  }
  
  const { scenarios, selectedScenario, onScenarioSelect } = $props<Props>();
</script>

<!-- Component only uses props -->
<div class="scenario-selector">
  {#each scenarios as scenario}
    <div on:click={() => onScenarioSelect(scenario)}>
      {scenario.title}
    </div>
  {/each}
</div>
```

## 🔧 **Benefits**

### **Testability**
```typescript
// Easy to test with mock props
const mockProps = {
  scenarios: [mockScenario],
  selectedScenario: null,
  onScenarioSelect: vi.fn()
};

render(ScenarioSelector, { props: mockProps });
```

### **Reusability**
```typescript
// Same component can be used in different contexts
<ScenarioSelector
  {scenarios}
  {selectedScenario}
  onScenarioSelect={handleScenarioSelect}
/>

<ScenarioSelector
  {scenarios}
  {selectedScenario}
  onScenarioSelect={differentHandler}
/>
```

### **Predictability**
- Components always behave the same with the same props
- No hidden dependencies on store state
- Clear data flow from parent to child

## 📱 **Real Example**

### **Before (Direct Store Access)**
```typescript
// ❌ Component directly accesses store
<script>
  import { scenarioStore } from '$lib/stores/scenario.store.svelte';
  
  // Direct store access - hard to test and predict
  const selectedScenario = $derived(scenarioStore.selectedScenario);
</script>
```

### **After (Props-Based)**
```typescript
// ✅ Component receives data through props
<script>
  interface Props {
    selectedScenario: Scenario | null;
    onScenarioSelect: (scenario: Scenario) => void;
  }
  
  const { selectedScenario, onScenarioSelect } = $props<Props>();
</script>
```

## 🎨 **Component Hierarchy**

```
App
├── ScenarioManager (manages store)
│   ├── ScenarioSelector (receives props)
│   └── ScenarioStartButton (receives props)
└── OtherComponents
```

## 🚫 **What NOT to Do**

```typescript
// ❌ Don't access stores directly in components
<script>
  import { scenarioStore } from '$lib/stores/scenario.store.svelte';
  
  // This makes the component unpredictable
  const scenario = $derived(scenarioStore.selectedScenario);
</script>
```

## ✅ **What TO Do**

```typescript
// ✅ Receive data through props
<script>
  interface Props {
    scenario: Scenario | null;
  }
  
  const { scenario } = $props<Props>();
</script>
```

This approach makes your components:
- 🧪 **Easier to test**
- 🔄 **More reusable**
- 📱 **More predictable**
- 🏗️ **Easier to maintain**
