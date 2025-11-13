# A/B Testing Setup for Headlines

This document explains how to set up and monitor the headline A/B test using PostHog.

## Overview

The front page now supports A/B testing for three headline variants:

1. **Original**: "Stop Learning. Start Talking."
2. **Cure**: "The cure for the common language app."
3. **One Percent**: "For the 1% of learners who will actually become speakers."

## PostHog Setup

### 1. Create Feature Flag

1. Go to your PostHog dashboard
2. Navigate to Feature Flags
3. Create a new feature flag named `headline_ab_test`
4. Set the flag type to "String"
5. Configure the variants:
   - `original` (default)
   - `cure`
   - `one_percent`

### 2. Configure Rollout

Set up the rollout percentages as desired:

- 33% for each variant (equal split)
- Or adjust based on your testing strategy

### 3. Set Targeting Rules (Optional)

You can target specific user segments:

- New users only
- Specific geographic regions
- Users with certain properties

## Events Tracked

The A/B test tracks two key events:

### 1. `headline_variant_shown`

Triggered when a user sees a headline variant.

**Properties:**

- `variant`: The variant shown (original, cure, one_percent)
- `headline_text`: The actual text displayed
- `current_headline_variant`: User property set

### 2. `start_speaking_clicked`

Triggered when a user clicks the "Start Speaking" button.

**Properties:**

- `headline_variant`: Which variant was shown
- `headline_text`: The actual text displayed
- `user_type`: Whether user is logged in or guest
- `has_clicked_start_speaking`: User property set

## Analysis

### Conversion Rate Analysis

1. Go to PostHog Insights
2. Create a funnel analysis:
   - Step 1: `headline_variant_shown`
   - Step 2: `start_speaking_clicked`
3. Group by the `variant` property
4. Compare conversion rates between variants

### Key Metrics to Monitor

- **Conversion Rate**: Percentage of users who click "Start Speaking" after seeing each headline
- **Time to Conversion**: How quickly users convert after seeing each variant
- **User Engagement**: Session duration and page interactions by variant

### Statistical Significance

PostHog will automatically calculate statistical significance. Wait for:

- At least 1000 users per variant
- 95% confidence level
- Minimum detectable effect of 5-10%

## Implementation Details

### Code Structure

- **Frontend**: `src/routes/+page.svelte` - Handles variant selection and display
- **Analytics**: `src/lib/analytics/posthog.ts` - Tracks A/B test events
- **Components**: `src/lib/components/LanguageStartButton.svelte` - Tracks button clicks

### Feature Flag Integration

The test uses PostHog's `getFeatureFlag()` function to determine which variant to show:

```typescript
const variant = getFeatureFlag('headline_ab_test');
```

### Fallback Behavior

If PostHog is unavailable or the feature flag fails:

- Defaults to the original headline
- Still tracks events for analysis
- Graceful degradation ensures site functionality

## Best Practices

1. **Run for Sufficient Duration**: Allow at least 2-4 weeks for statistical significance
2. **Monitor for Anomalies**: Watch for unusual traffic patterns or conversion drops
3. **Segment Analysis**: Analyze performance by user type, geography, and device
4. **Document Results**: Keep track of learnings and decisions made

## Troubleshooting

### Common Issues

1. **Feature flag not working**: Check PostHog configuration and API keys
2. **Events not tracking**: Verify PostHog initialization and network connectivity
3. **Uneven traffic**: Check rollout percentages and targeting rules

### Debug Mode

In development mode, you can see which variant is being shown in the browser console.

## Next Steps

After the test concludes:

1. Analyze the results in PostHog
2. Implement the winning variant
3. Document learnings for future tests
4. Consider testing other page elements (CTA buttons, descriptions, etc.)
