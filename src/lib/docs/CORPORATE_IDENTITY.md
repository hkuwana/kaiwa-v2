# 🌸 Kaiwa Corporate Identity Guide

## DaisyUI-Aligned Design Language

### 🎨 Brand Philosophy

**"Like morning mist clearing to reveal the mountain, confidence grows one conversation at a time."**

Kaiwa embodies the Japanese concept of **"優しさ" (yasashisa)** - gentle kindness. Our design language uses DaisyUI's carefully crafted `caramellatte` and `night` themes to create a warm, accessible experience that reflects the serene beauty of Japanese nature, family connections, and personal growth.

---

## 🌅 DaisyUI Theme-Based Color Palette

### Light Theme (Caramellatte) Colors

- **Primary**: Black - Strong, confident foundation for actions
- **Secondary**: Dark grayish brown - Warm, earthy complementary tones
- **Base-100**: Very light cream - Clean, breathable background (98% lightness)
- **Base-Content**: Dark text on light background for excellent readability

### Dark Theme (Night) Colors

- **Primary**: Sky blue - Calming, trustworthy action color (75% lightness)
- **Secondary**: Grayish purple - Sophisticated, gentle complementary tone (68% lightness)
- **Base-100**: Dark blue-gray - Comfortable dark background (21% lightness)
- **Base-Content**: Light text on dark background for comfortable night viewing

### Semantic DaisyUI Colors

- **Success**: Green tones for positive feedback
- **Warning**: Amber tones for caution states
- **Error**: Red tones for alerts and errors
- **Info**: Blue tones for informational states

---

## 🖋️ Typography

### Primary Font: Gentle Sans-Serif

- **Headings**: Light to Medium weight (300-500)
- **Body Text**: Regular weight (400)
- **Emphasis**: Medium weight (500), never bold

### Japanese Text Integration

- **Hiragana/Katakana**: Soft, rounded forms
- **Kanji**: Clean, balanced strokes
- **Furigana**: Delicate, supportive presence

### Voice & Tone

- **Gentle**: Never harsh or demanding
- **Encouraging**: Like a patient teacher
- **Warm**: Like family conversations
- **Respectful**: Honoring the learning journey

---

## 🌿 Visual Elements

### Nature-Inspired Motifs

- **Flowing Water**: Curved lines, gentle gradients
- **Mountain Silhouettes**: Soft, layered backgrounds
- **Bamboo Growth**: Vertical elements suggesting progress
- **Stone Gardens**: Balanced, minimalist layouts
- **Morning Dew**: Subtle sparkles and light effects

### Geometric Patterns

- **Soft Circles**: Representing completeness and harmony
- **Gentle Curves**: No harsh angles or sharp edges
- **Layered Transparency**: Like morning mist
- **Organic Shapes**: Inspired by leaves and petals

### Visual Hierarchy

- **Breathing Space**: Generous whitespace
- **Gentle Emphasis**: Soft shadows, subtle highlights
- **Natural Flow**: Elements that guide the eye naturally

---

## 🏞️ Background Treatments

### DaisyUI-Based Gradient Styles

```css
/* Light Theme Gradients */
.gradient-light {
  background: linear-gradient(135deg, oklch(var(--b1)) 0%, oklch(var(--b2)) 100%);
}

/* Dark Theme Gradients */
.gradient-dark {
  background: linear-gradient(135deg, oklch(var(--b1)) 0%, oklch(var(--b3)) 100%);
}

/* Primary Accent Gradient */
.gradient-primary {
  background: linear-gradient(135deg, oklch(var(--p) / 0.1) 0%, oklch(var(--s) / 0.1) 100%);
}

/* Neutral Gentle Gradient */
.gradient-neutral {
  background: linear-gradient(135deg, oklch(var(--n) / 0.05) 0%, oklch(var(--nc) / 0.05) 100%);
}
```

### Decorative Elements

- **Soft Blurred Circles**: Scattered background orbs
- **Gentle Light Rays**: Diagonal soft glows
- **Organic Shapes**: Flowing, nature-inspired forms
- **Textural Overlays**: Subtle paper or fabric textures

---

## 🎯 DaisyUI Integration Best Practices

### Using Theme Variables

```css
/* Correct - Theme-aware colors */
.custom-element {
  background: oklch(var(--b1));
  color: oklch(var(--bc));
  border: 1px solid oklch(var(--b3));
}

/* Avoid - Hardcoded colors that don't adapt */
.bad-element {
  background: #ffffff;
  color: #000000;
  border: 1px solid #e5e7eb;
}
```

### DaisyUI Color Variables Reference

- `--p` Primary color (black in caramellatte, sky blue in night)
- `--s` Secondary color (dark brown in caramellatte, purple in night)
- `--b1` Base 100 - Main background
- `--b2` Base 200 - Slightly darker background
- `--b3` Base 300 - Even darker background
- `--bc` Base content - Text color on base backgrounds
- `--pc` Primary content - Text color on primary backgrounds
- `--sc` Secondary content - Text color on secondary backgrounds

### Theme-Specific Adaptations

```css
/* Components that adapt to theme characteristics */
.theme-adaptive-card {
  /* Caramellatte gets 2rem radius, Night gets 1rem */
  border-radius: var(--rounded-box, 1rem);

  /* Caramellatte gets depth, Night stays flat */
  box-shadow: var(--caramellatte-shadow, 0 1px 3px oklch(var(--b3) / 0.2));
}

[data-theme="night"] .theme-adaptive-card {
  --caramellatte-shadow: none;
}
```

---

## 💬 MVP-Focused Messaging Framework

### MVP Core Messages

1. **"Practice Japanese Conversations with AI"** - Clear, direct value proposition
2. **"Build Confidence Before Real Conversations"** - Practical benefit
3. **"Learn at Your Own Pace"** - Stress-free approach
4. **"Multiple Scenarios Available"** - Feature highlight

### MVP Value Propositions

- **AI Conversation Practice**: Safe environment to practice speaking
- **Scenario-Based Learning**: Practical situations you'll actually encounter
- **Instant Feedback**: Immediate responses to help you improve
- **Theme Preference**: Comfortable viewing experience day or night
- **No Judgment**: Practice mistakes without embarrassment

### MVP Content Tone Guidelines

- **Clear and Direct**: Focus on what the app actually does
- **Practical Benefits**: How it helps users in real situations
- **Accessible Language**: Simple, straightforward explanations
- **Encouraging but Realistic**: Supportive without overpromising
- **Feature-Focused**: Highlight actual capabilities and scenarios

---

## 🌸 UI Component Styling

### DaisyUI Component Styling

```css
/* Primary Button - Uses DaisyUI Variables */
.btn-primary {
  /* DaisyUI handles all primary button styling */
  /* Caramellatte: Black background, white text */
  /* Night: Sky blue background, dark text */
  border-radius: 1rem; /* Matches DaisyUI night theme radius */
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px oklch(var(--p) / 0.3);
}

/* Caramellatte theme uses 2rem radius for selectors */
.btn-rounded {
  border-radius: 2rem;
}
```

### Cards

```css
.card {
  /* Uses DaisyUI base colors automatically */
  background: oklch(var(--b1));
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  box-shadow: 0 1px 3px oklch(var(--b3) / 0.2);
}
```

### Input Fields

```css
.input {
  /* DaisyUI handles theme-aware styling */
  border: 1px solid oklch(var(--b3)); /* Night theme uses 1px borders */
  border-radius: 0.5rem; /* DaisyUI field radius */
  transition: all 0.3s ease;
}

.input:focus {
  border-color: oklch(var(--p));
  box-shadow: 0 0 0 3px oklch(var(--p) / 0.1);
}
```

---

## 🎭 Iconography

### Style Guidelines

- **Rounded corners**: No sharp edges
- **Organic shapes**: Inspired by nature
- **Gentle lines**: 2px stroke weight
- **Warm colors**: Using brand palette
- **Meaningful symbols**: Family, growth, conversation

### Icon Categories

- **Family**: Home, heart, people connecting
- **Growth**: Seedling, tree, mountain, sunrise
- **Conversation**: Speech bubbles, connecting lines
- **Japanese Culture**: Respectful, elegant symbols

---

## 🌊 Animation Principles

### Movement Style

- **Gentle Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Flowing Motion**: Like water or wind
- **Organic Timing**: Natural, not mechanical
- **Subtle Effects**: Never overwhelming

### Transition Examples

```css
/* Gentle Scale */
.gentle-hover {
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.gentle-hover:hover {
	transform: scale(1.02);
}

/* Flowing Fade */
.gentle-fade {
	transition: opacity 0.5s ease-in-out;
}
```

---

## 🏡 Family-First Messaging

### Emotional Hooks

- **"Talk to Your Japanese Grandmother"** - Specific, emotional
- **"Connect with Family in Their Native Language"** - Universal desire
- **"Those Precious Moments That Matter"** - Emotional weight
- **"Your Family is Waiting"** - Gentle urgency

### Scenario-Based Content

- **Grandmother Conversations**: Traditional wisdom, family stories
- **Family Dinners**: Daily connection, sharing experiences
- **Special Occasions**: Celebrations, meaningful moments
- **Cultural Bridge**: Understanding heritage and tradition

---

## 🕊️ Anxiety-Free Learning

### Safe Space Messaging

- **"No Judgment"** - Freedom to make mistakes
- **"At Your Pace"** - No pressure or deadlines
- **"Gentle AI"** - Patient, encouraging responses
- **"Safe Practice"** - Comfort before real conversations

### Visual Cues for Safety

- **Soft Colors**: Calming, non-threatening
- **Rounded Shapes**: No sharp, intimidating edges
- **Gentle Icons**: Peaceful, reassuring symbols
- **Breathing Room**: Plenty of whitespace

---

## 🌱 DaisyUI Implementation Guidelines

### Do's

- ✅ Use DaisyUI semantic color variables (`oklch(var(--p))`, `oklch(var(--s))`, etc.)
- ✅ Leverage DaisyUI component classes (`btn-primary`, `card`, `input`)
- ✅ Respect theme-specific radius values (2rem for caramellatte selectors, 1rem for night)
- ✅ Use nature metaphors in copy while maintaining theme consistency
- ✅ Emphasize emotional benefits with accessible color contrasts
- ✅ Include gentle encouragement through proper semantic colors
- ✅ Focus on family connections with warm, theme-appropriate tones
- ✅ Provide plenty of whitespace using DaisyUI spacing utilities
- ✅ Let themes handle light/dark adaptation automatically

### Don'ts

- ❌ Override DaisyUI color variables with hardcoded hex values
- ❌ Use custom colors that break theme consistency
- ❌ Force specific colors that don't adapt to light/dark themes
- ❌ Ignore DaisyUI's accessibility features
- ❌ Use inconsistent border radius across themes
- ❌ Override theme-appropriate depth/shadow effects
- ❌ Make the experience feel disconnected from the chosen themes

---

## 🎨 Theme Switching Considerations

### Caramellatte Theme (Light)
- Perfect for daytime use and bright environments
- Black primary creates strong, confident actions
- Cream base provides gentle, warm foundation
- 2rem radius creates friendly, approachable feel
- 2px borders with depth effects add subtle sophistication

### Night Theme (Dark)
- Ideal for evening use and low-light environments
- Sky blue primary feels calm and trustworthy
- Dark blue-gray base reduces eye strain
- 1rem radius maintains clean, modern aesthetic
- Minimal borders and no depth effects for sleek appearance

---

**Remember**: Every design decision should ask, "Does this feel like a warm hug from family while respecting the user's theme preference?" Use DaisyUI's semantic variables to ensure accessibility and theme consistency.
