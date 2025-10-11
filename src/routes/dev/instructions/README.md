# Agile Instruction Controls - Dev Page

This dev page provides UI controls for testing the new agile instruction system with real-time parameter adjustments.

## 🎯 Features

### 1. **Auto-Adaptation Simulation**

- **Error Tracking**: Simulate consecutive errors (triggers easier settings after 3 errors)
- **Success Tracking**: Simulate success streaks (triggers harder settings after 5 successes)
- **Real-time Adjustment**: See instructions update automatically based on performance

### 2. **Quick Presets**

One-click presets for common scenarios:

- **Absolute Beginner** - Very slow, lots of help, basic vocabulary
- **Beginner** - Slow, scaffolding, simple grammar
- **Intermediate** - Moderate pace, flexible support
- **Advanced** - Fast, minimal help, complex vocabulary
- **Tutor Mode** - Explicit corrections, heavy scaffolding
- **Conversation** - Natural flow, minimal corrections

### 3. **Granular Parameter Controls**

#### Speaking Dynamics

- **Speaking Speed**: Very Slow (40%) → Native (85%)
- **Sentence Length**: 3-5 words → Variable native
- **Pause Frequency**: Frequent (2-3s) → Minimal

#### Complexity

- **Target CEFR**: A1 → C2
- **Vocabulary**: Basic (top 500) → Specialized
- **Grammar**: Simple → Native

#### Support & Corrections

- **Scaffolding**: Heavy → None
- **Correction Style**: Explicit → None
- **Language Mixing**: Code-switching → Strict immersion

### 4. **Real-time Preview**

- See generated instructions update instantly
- Character count display
- Copy to clipboard

### 5. **Context Selection**

- Choose target language
- Select learning scenario
- See how different contexts affect instructions

## 🚀 How to Use

### Basic Testing

1. **Navigate** to `/dev/instructions`
2. **Select a preset** to load common settings
3. **Adjust individual parameters** using the controls
4. **View** the generated instructions in real-time

### Auto-Adaptation Testing

1. **Enable** the "Auto-Adaptation" toggle
2. **Click** "Simulate Error" 3 times → Instructions become easier
3. **Click** "Simulate Success" 5 times → Instructions become harder
4. **Observe** how parameters change automatically

### Fine-Tuning for User Profiles

1. Start with a **preset** matching user level
2. **Adjust specific parameters** based on user needs:
   - Struggling with speed? → Slower speaking speed
   - Frustrated by complexity? → Simpler vocabulary
   - Needs more support? → Heavy scaffolding
3. **Copy** the generated instructions
4. **Use** in your realtime agent configuration

## 📊 Speaking Speed Reference

All speeds are **slower than actual native** to prioritize clarity:

- **Very Slow (40%)**: 3-4 second pauses, extremely clear
- **Slow (60%)**: 2-3 second pauses, deliberate
- **Normal (70%)**: 1-2 second pauses, measured
- **Fast (80%)**: Brief pauses, still clear
- **Native (85%)**: Near-native but NEVER sacrifices clarity

> **Note**: Even "native" speed is 15% slower than actual native speakers to ensure comprehension!

## 🎛️ Recommended Parameter Combinations

### For Beginners (A1-A2)

```
Speed: Slow
Length: Very Short
Pauses: Frequent
Scaffolding: Heavy
Corrections: Recast
Mixing: Code-switching
```

### For Intermediate (B1-B2)

```
Speed: Normal
Length: Medium
Pauses: Moderate
Scaffolding: Medium
Corrections: Recast
Mixing: Flexible
```

### For Advanced (C1-C2)

```
Speed: Fast
Length: Native
Pauses: Minimal
Scaffolding: Light
Corrections: Minimal
Mixing: Strict Immersion
```

### For Grammar Tutoring

```
Speed: Slow
Length: Short
Corrections: Explicit
Scaffolding: Heavy
Topic Changes: Focused
```

### For Natural Conversation

```
Speed: Normal
Length: Native
Corrections: Recast
Scaffolding: Light
Topic Changes: Exploratory
```

## 🧪 Testing Workflow

1. **Choose your user persona** (beginner/intermediate/advanced)
2. **Load the corresponding preset**
3. **Adjust 1-2 parameters** to simulate specific needs
4. **Enable auto-adaptation**
5. **Simulate performance** (errors/successes)
6. **Observe** how instructions adapt
7. **Copy** final instructions for use in production

## 🔧 Integration with Production

Once you've tested parameters that work well:

```typescript
import { createComposer } from '$lib/services/instructions';

// Create composer with your tested parameters
const composer = createComposer({
	user,
	language,
	preferences,
	scenario,
	parameters: {
		speakingSpeed: 'slow', // Your tested value
		scaffoldingLevel: 'medium' // Your tested value
		// ... other parameters
	}
});

// Use in realtime agent
const agent = new RealtimeAgent({
	instructions: composer.compose(),
	voice: 'alloy'
});
```

## 📝 Future Enhancements

Potential additions to this dev page:

- [ ] **A/B Testing**: Side-by-side comparison of different parameter sets
- [ ] **Preset Saving**: Save your custom parameter combinations
- [ ] **Performance Metrics**: Track which settings work best
- [ ] **Audio Preview**: Test actual speech output with current settings
- [ ] **Session Replay**: Simulate full conversation flows

## 🐛 Troubleshooting

### Instructions look too complex

→ Lower vocabulary/grammar complexity, increase scaffolding

### Instructions too simple

→ Raise CEFR level, reduce scaffolding

### Auto-adaptation not working

→ Make sure toggle is ON and simulate errors/successes

### Can't copy instructions

→ Click inside instruction box first, then use Copy button

## 📚 Related Documentation

- [Instruction System README](../../../lib/services/instructions/README.md)
- [Parameters Reference](../../../lib/services/instructions/parameters.ts)
- [Migration Guide](../../../lib/services/instructions/MIGRATION.md)
- [OpenAI Realtime API Guide](https://github.com/openai/openai-cookbook/blob/main/examples/Realtime_prompting_guide.ipynb)
