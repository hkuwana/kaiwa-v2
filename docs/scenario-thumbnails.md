# Scenario Thumbnail System

## Overview
Scenarios can have visual thumbnails displayed in the UI to make browsing more engaging. This document explains how the thumbnail system works.

## Thumbnail URL Structure

### File Location
Thumbnails are stored in the static directory:
```
/static/thumbnails/scenarios/{scenario-id}.jpg
```

### Naming Convention
- Use the **scenario ID** as the filename
- Format: `{scenario-id}.jpg` or `{scenario-id}.png`
- Example: `family-dinner-introduction.jpg`

### Current Scenario Thumbnail Paths

| Scenario ID | Thumbnail Path |
|------------|----------------|
| `beginner-confidence-bridge` | `/thumbnails/scenarios/beginner-confidence-bridge.jpg` |
| `onboarding-welcome` | `/thumbnails/scenarios/onboarding-welcome.jpg` |
| `family-dinner-introduction` | `/thumbnails/scenarios/family-dinner-introduction.jpg` |
| `inlaws-family-friends-intro` | `/thumbnails/scenarios/inlaws-family-friends-intro.jpg` |
| `clinic-night-triage` | `/thumbnails/scenarios/clinic-night-triage.jpg` |
| `first-date-drinks` | `/thumbnails/scenarios/first-date-drinks.jpg` |
| `relationship-apology` | `/thumbnails/scenarios/relationship-apology.jpg` |
| `vulnerable-heart-to-heart` | `/thumbnails/scenarios/vulnerable-heart-to-heart.jpg` |
| `family-milestone-toast` | `/thumbnails/scenarios/family-milestone-toast.jpg` |
| `breaking-important-news` | `/thumbnails/scenarios/breaking-important-news.jpg` |

## How It Works

### Service Function
The `scenario-interaction.service.ts` provides helper functions:

```typescript
import { getScenarioThumbnailUrl } from '$lib/services/scenarios/scenario-interaction.service';

// Get thumbnail URL for a scenario
const thumbnailUrl = getScenarioThumbnailUrl(scenario);
// Returns: '/thumbnails/scenarios/family-dinner-introduction.jpg'

// Get thumbnail with fallback to placeholder
const thumbnailWithFallback = getScenarioThumbnailUrlWithFallback(scenario);
// Returns scenario thumbnail or placeholder if not found

// Check if scenario has custom thumbnail
const hasThumb = hasCustomThumbnail(scenario);
// Returns: true if thumbnailUrl is set
```

### In Components
Components use the service functions to get thumbnail URLs:

```svelte
<script>
  import { getScenarioThumbnailUrl } from '$lib/services/scenarios/scenario-interaction.service';

  const thumbnailUrl = getScenarioThumbnailUrl(scenario);
</script>

{#if hasCustomThumbnail(scenario)}
  <img src={thumbnailUrl} alt={scenario.title} />
{/if}
```

## Adding New Thumbnails

### Step 1: Create the Image
- **Dimensions**: Recommended 16:9 aspect ratio (e.g., 640x360px)
- **Format**: JPG or PNG
- **Style**: Watercolor/artistic style preferred (matches brand)
- **File size**: Keep under 100KB for performance

### Step 2: Save to Static Directory
```bash
cp your-image.jpg /static/thumbnails/scenarios/{scenario-id}.jpg
```

### Step 3: Update Scenario Data (Optional)
The thumbnail URL is already set in `src/lib/data/scenarios.ts`. If adding a new scenario:

```typescript
{
  id: 'new-scenario-id',
  title: 'New Scenario',
  // ... other fields ...
  thumbnailUrl: '/thumbnails/scenarios/new-scenario-id.jpg'
}
```

### Step 4: Test
Run the dev server and verify the thumbnail displays:
```bash
pnpm dev
```

Visit `/scenarios` to see thumbnails in the browse page.

## Fallback Behavior

### If Thumbnail Missing
- Service returns the expected path: `/thumbnails/scenarios/{id}.jpg`
- Browser will show broken image (can handle with `onerror` event)
- Or use `getScenarioThumbnailUrlWithFallback()` for graceful degradation

### Placeholder Image
Create a default placeholder:
```
/static/thumbnails/scenarios/placeholder.jpg
```

This will be used when `getScenarioThumbnailUrlWithFallback()` is called and no custom thumbnail exists.

## Best Practices

1. **Consistent Style**: Use the same artistic style for all thumbnails
2. **Performance**: Optimize images before adding (use tools like ImageOptim)
3. **Accessibility**: Thumbnails are decorative - ensure text content is clear
4. **Responsive**: Images should look good at different sizes (card view, full view)
5. **Color Palette**: Match the Kaiwa brand colors

## Technical Notes

- Thumbnails are served statically (no processing required)
- URLs are generated server-side during seed/creation
- Custom scenarios can have thumbnails added post-creation
- Thumbnails are optional - scenarios work fine without them

## Future Enhancements

- [ ] Auto-generate thumbnails using AI (Replicate, DALL-E, etc.)
- [ ] Admin UI for uploading thumbnails
- [ ] Multiple thumbnail sizes (responsive images)
- [ ] Lazy loading for better performance
- [ ] WebP format support for better compression
