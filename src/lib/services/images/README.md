# Scenario Image Service

Provides beautiful watercolor/artistic style images for scenario cards using free APIs.

## Quick Start

### Option 1: Use Gradient Backgrounds (No Setup Required) ✨

Perfect for MVP and development. No API keys needed!

```typescript
import { getWatercolorGradient } from '$lib/services/images/scenario-images.service';

// Get instant watercolor-style gradient
const gradient = getWatercolorGradient('relationships');
// Returns: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)"

// Use in your component
<div style="background: {gradient}">
  <!-- Scenario card content -->
</div>
```

### Option 2: Use Free Image APIs (Better Quality)

Get actual watercolor-style photos from Unsplash or Pexels.

**Setup:**

1. Get free API keys:
   - **Unsplash**: https://unsplash.com/developers (50 requests/hour free)
   - **Pexels**: https://www.pexels.com/api/ (unlimited free)

2. Add to your `.env`:

   ```bash
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   PEXELS_API_KEY=your_pexels_api_key_here
   ```

3. Use in your code:

   ```typescript
   import { getScenarioImage } from '$lib/services/images/scenario-images.service';

   const result = await getScenarioImage(
   	'family-dinner',
   	['family', 'dinner', 'parents'],
   	'relationships'
   );

   // result.imageUrl will be:
   // - Real photo URL if API keys are configured
   // - Gradient fallback if not configured
   ```

## Features

### Watercolor-Style Categories

Each category has a custom watercolor gradient palette:

- **Relationships**: Warm pinks/peach
- **Professional**: Cool blues to gold
- **Travel**: Sunrise colors
- **Education**: Soft purples/blues
- **Health**: Fresh greens/aqua
- **Daily Life**: Neutral pastels
- **Entertainment**: Vibrant multi-color
- **Food & Drink**: Warm yellows/golds
- **Services**: Calm teals
- **Emergency**: Soft alert colors

### Automatic Fallback

The service automatically falls back in this order:

1. **Unsplash** (best quality watercolor images)
2. **Pexels** (good variety)
3. **Gradients** (instant, always works)

### Batch Processing

Fetch images for multiple scenarios at once with rate limiting:

```typescript
import { batchGetScenarioImages } from '$lib/services/images/scenario-images.service';

const scenarios = [
	{ id: 'family-dinner', tags: ['family', 'dinner'], categories: ['relationships'] },
	{ id: 'first-date', tags: ['date', 'romance'], categories: ['relationships'] }
];

const images = await batchGetScenarioImages(scenarios);

images.forEach((result, scenarioId) => {
	console.log(`${scenarioId}: ${result.imageUrl}`);
	if (result.attribution) {
		console.log(`Attribution: ${result.attribution}`);
	}
});
```

## Recommended Dimensions

```typescript
import { SCENARIO_IMAGE_DIMENSIONS } from '$lib/services/images/scenario-images.service';

// Use these for consistent sizing:
SCENARIO_IMAGE_DIMENSIONS.thumbnail; // { width: 400, height: 250 }
SCENARIO_IMAGE_DIMENSIONS.card; // { width: 800, height: 500 }
SCENARIO_IMAGE_DIMENSIONS.hero; // { width: 1200, height: 600 }
```

## Attribution

When using Unsplash or Pexels images, **always display attribution**:

```typescript
const result = await getScenarioImage('scenario-id', tags, category);

if (result.attribution) {
	// Display: "Photo by John Doe on Unsplash"
	console.log(result.attribution);
}
```

## API Rate Limits

- **Unsplash**: 50 requests/hour (free tier)
- **Pexels**: Unlimited (free with attribution)
- **Gradients**: Unlimited (no API calls)

## Best Practices

1. **For Development**: Use gradients (no setup needed)
2. **For Production**: Configure Pexels (unlimited free)
3. **For Premium Quality**: Add Unsplash (50/hour usually enough)
4. **Always Cache**: Store `thumbnailUrl` in database after first fetch
5. **Respect Limits**: Use `batchGetScenarioImages` with built-in rate limiting

## Examples

### Simple Gradient Card

```svelte
<script>
	import { getWatercolorGradient } from '$lib/services/images/scenario-images.service';

	export let scenario;

	const gradient = getWatercolorGradient(scenario.categories[0]);
</script>

<div class="card" style="background: {gradient}">
	<h3>{scenario.title}</h3>
	<p>{scenario.description}</p>
</div>
```

### Advanced with API Fetch

```svelte
<script>
	import { getScenarioImage } from '$lib/services/images/scenario-images.service';
	import { onMount } from 'svelte';

	export let scenario;

	let imageUrl = '';
	let isGradient = true;
	let attribution = '';

	onMount(async () => {
		const result = await getScenarioImage(scenario.id, scenario.tags, scenario.categories[0]);

		imageUrl = result.imageUrl;
		isGradient = result.isGradient;
		attribution = result.attribution || '';
	});
</script>

<div class="card" style={isGradient ? `background: ${imageUrl}` : ''}>
	{#if !isGradient}
		<img src={imageUrl} alt={scenario.title} />
		{#if attribution}
			<small class="attribution">{attribution}</small>
		{/if}
	{/if}
	<h3>{scenario.title}</h3>
	<p>{scenario.description}</p>
</div>
```

## Watercolor Style Rationale

Why watercolor/artistic style instead of stock photos?

1. **Cohesive Brand**: Creates a unique, artistic aesthetic
2. **Universal Appeal**: Works across all cultures and languages
3. **Emotional Connection**: Soft, warm feel reduces anxiety
4. **Free Assets**: Easier to find free watercolor images than high-quality photos
5. **Scalable**: Gradients work perfectly as instant fallbacks

---

**Next Steps:**

- Add Pexels API key to `.env` for unlimited free images
- Consider adding Unsplash for premium scenarios
- Cache fetched URLs in database to avoid repeat API calls
