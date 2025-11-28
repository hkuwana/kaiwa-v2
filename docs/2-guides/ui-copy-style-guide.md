# UI Copy & Code Style Guide

> **Purpose**: Consistent conventions for Kaiwa's user-facing copy and frontend code.
> **Last Updated**: November 2024

---

## Copy Conventions

### Punctuation

| Do | Don't |
|---|---|
| Use colons after bold labels: `<strong>Feature</strong>: Description` | Em dashes: `Feature — Description` |
| Use periods to separate related thoughts: `No distractions. Easy habit.` | Em dashes: `No distractions—easy habit` |
| Use commas for light pauses: `Practice conversations that matter, so you can...` | Em dashes: `that matter—so you can` |

**Why**: Em dashes render inconsistently across devices and can look broken in some fonts.

### Tone

- **Sharp and direct**: "Personalized for you. Kaiwa helps you speak with your loved ones."
- **Emotional outcomes over features**: Focus on feelings ("their face lights up") not mechanics
- **No jargon**: Avoid "AI", "gamification", "scenarios" in marketing copy
- **Active voice**: "Get tailored feedback" not "Feedback is provided"

### Headlines

```
Hero Pattern:
1. First line: Bold statement about the user
2. Second line: What Kaiwa does for them

Example:
"Personalized for you."
"Kaiwa helps you speak with your loved ones."
```

---

## Icons

### Using MDI Icons

Always use the iconify pattern with full class names for Tailwind compatibility:

```svelte
<!-- Correct: Full class name -->
<span class="icon-[mdi--account-group] h-6 w-6"></span>

<!-- Incorrect: Dynamic interpolation (won't work with Tailwind JIT) -->
<span class="icon-[{iconName}] h-6 w-6"></span>
```

For dynamic icons in data files, store the full class:

```typescript
// Correct
const items = [
  { iconClass: 'icon-[mdi--heart]', label: 'Love' },
  { iconClass: 'icon-[mdi--briefcase]', label: 'Work' }
];

// In template
<span class="{item.iconClass} h-6 w-6"></span>
```

### Common Icon Mappings

| Use Case | Icon Class |
|----------|------------|
| Family/Group | `icon-[mdi--account-group]` |
| Love/Heart | `icon-[mdi--heart]` |
| Business | `icon-[mdi--briefcase]` |
| Home | `icon-[mdi--home]` |
| Check/Success | `icon-[mdi--check-circle]` |
| Premium/Crown | `icon-[mdi--crown]` |
| Light mode | `icon-[mdi--weather-sunny]` |
| Dark mode | `icon-[mdi--weather-night]` |

### No Emojis in Code

Replace emojis with MDI icons in all user-facing components. Emojis render inconsistently and don't support theming.

---

## Theme Switching

Use native localStorage, not external libraries:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let isDark = $state(false);

  function setTheme(theme: string) {
    if (!browser) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  onMount(() => {
    const stored = localStorage.getItem('theme');
    if (stored) {
      isDark = stored === 'night';
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDark = prefersDark;
      setTheme(prefersDark ? 'night' : 'light');
    }
  });
</script>
```

---

## DaisyUI Components

### Toggles/Switches

Use toggle for on/off states, not swap:

```svelte
<!-- Preferred: Toggle slider -->
<label class="flex cursor-pointer items-center gap-2">
  <span class="icon-[mdi--weather-sunny] h-5 w-5"></span>
  <input type="checkbox" class="toggle toggle-sm" checked={isDark} onchange={toggleTheme} />
  <span class="icon-[mdi--weather-night] h-5 w-5"></span>
</label>

<!-- Avoid: Swap (harder to understand state) -->
<label class="swap swap-rotate">...</label>
```

---

## Data Files

### Marketing Data Structure

```typescript
// src/lib/data/marketing.ts

export const personalizedPathExamples = [
  {
    iconClass: 'icon-[mdi--account-group]',  // Full Tailwind class
    situation: "Meeting my partner's parents",  // User's words, in quotes
    language: 'Japanese'
  }
] as const;
```

### Type Exports

Always export inferred types for data arrays:

```typescript
export type PersonalizedPathExample = (typeof personalizedPathExamples)[number];
```

---

## File Organization

| Type | Location |
|------|----------|
| Marketing copy/data | `src/lib/data/marketing.ts` |
| UI components | `src/lib/components/` |
| Feature components | `src/lib/features/{feature}/components/` |
| Page routes | `src/routes/{page}/+page.svelte` |

---

## Checklist for New Copy

- [ ] No em dashes (use colons, periods, or commas)
- [ ] No emojis (use MDI icons)
- [ ] Active voice
- [ ] Emotional outcome focus
- [ ] Sharp and direct
- [ ] Works in both light and dark themes
