# Design Philosophy: Swipeable Card Stack

## Jony Ive's Design Principles Applied

### 1. **Simplicity Through Reduction**

> "Simplicity is not the absence of clutter, it's the absence of complexity."

**Applied:**

- Show only **3 cards** in the stack (not 5-6) - just enough to suggest depth without overwhelming
- Each card has a single, clear purpose: showcase a scenario
- One primary action per card: "Start Conversation"
- Remove unnecessary chrome - let the content breathe

### 2. **Depth and Materiality**

> "We spent a lot of time on how you perceive depth and layering."

**Applied:**

- Cards stack with **precise 12px, 24px increments** - creating rhythm
- Opacity decreases by clear steps: **100% → 70% → 40%** - reinforcing depth
- Scale decreases subtly: **100% → 96% → 92%** - cards "recede" naturally
- Each card casts its own shadow, creating physical presence

### 3. **Purposeful Motion**

> "It's very easy to be different, but very difficult to be better. And 'better' involves an understanding of more than just aesthetic."

**Applied:**

- **Spring-like easing** (`cubic-bezier(0.34, 1.56, 0.64, 1)`) - feels responsive, alive
- Drag rotation is **subtle** (1/30th of drag distance) - suggests physicality without exaggeration
- Transitions are **400ms** - fast enough to feel immediate, slow enough to follow
- Swiped cards exit with **slight rotation** (-12deg) - like being tossed aside

### 4. **Clarity of Function**

> "When you use something and it becomes invisible, that's when you know you've designed something good."

**Applied:**

- The **top card is fully interactive** - others are dormant
- Visual hierarchy is clear: active card is crisp, others fade back
- Touch/swipe gestures feel natural - no learning curve
- Button inside card = **zero ambiguity** about what to do

### 5. **The Inevitable Design**

> "Our goal is to try to bring a calm and simplicity to what are incredibly complex problems."

**Applied:**

- Language selector → Advanced options (optional) → Cards → Action
- This flow is **inevitable** - each step naturally leads to the next
- The "Browse All" card at the end feels like a natural conclusion
- Advanced options are **collapsed by default** - there when you need them, invisible when you don't

### 6. **Attention to Detail**

> "We made the buttons on the screen look so good you'll want to lick them."

**Applied:**

- Cards have **subtle gradient overlays** - adding dimension
- Buttons have **micro-interactions** on hover (scale 1.02) and press (scale 0.98)
- Typography hierarchy is precise: titles at 2xl, labels at xs
- Spacing follows a **rhythm**: 2, 4, 8, 12, 24px

### 7. **Respect for Content**

> "We're at a point where we need to design with empathy."

**Applied:**

- The scenario is the **hero** - not the UI
- Speaker photos are **prominent but not dominant**
- Text is **readable** - never sacrificing legibility for aesthetics
- White space **surrounds and elevates** content

### 8. **The Power of "No"**

> "It's actually harder to make something easy and simple than it is to make something complex."

**What we said NO to:**

- ❌ Showing all 6 cards at once (overwhelming)
- ❌ Complex gesture controls (swipe up, down, diagonal)
- ❌ Animations longer than 500ms (feels sluggish)
- ❌ Multiple actions per card (confusing)
- ❌ Auto-rotation (takes control away from user)
- ❌ Decorative elements that don't serve function

### 9. **Hierarchy Through Restraint**

> "So much of what we try to do is get to a point where the solution seems inevitable."

**Visual Hierarchy:**

1. **Language** (choose context)
2. **Advanced Options** (optional refinement)
3. **Featured Scenarios** (explore)
4. **Start Conversation** (commit)
5. **Browse All** (extend)

Each step naturally suggests the next, creating an **inevitable flow**.

### 10. **Delight in Discovery**

> "It's not just what it looks like and feels like. Design is how it works."

**Delightful Moments:**

- First swipe - "Oh, the cards move like real cards!"
- Seeing the stack - "I can see what's coming next"
- Drag feedback - "It follows my finger perfectly"
- Spring animation - "That felt satisfying"
- Finding the Browse All card - "Perfect, now I can see everything"

---

## Core Design Values

### **Clarity Over Cleverness**

The interface doesn't show off. It gets out of the way.

### **Depth Over Decoration**

Real depth through layering, not skeuomorphic textures.

### **Purpose Over Personality**

Every element serves the user's goal: finding and starting a conversation.

### **Restraint Over Richness**

We could add more. We chose not to.

---

## Technical Execution

### **Performance as Design**

- `will-change: transform, opacity` - smooth 60fps animations
- Disabled transitions during drag - immediate feedback
- Only 3 rendered cards - minimal DOM

### **Accessibility as Design**

- ARIA labels for all interactive elements
- Keyboard navigation support
- Clear focus states
- Semantic HTML structure

### **Responsive as Design**

- Mobile-first approach
- Touch gestures on mobile, mouse on desktop
- Typography scales naturally
- Spacing adjusts proportionally

---

## The Result

A swipeable card interface that feels:

- **Inevitable** - like it couldn't be any other way
- **Invisible** - you focus on scenarios, not UI
- **Delightful** - small moments of joy in interaction
- **Purposeful** - every element serves the user

_"That's been one of my mantras — focus and simplicity. Simple can be harder than complex."_
— Steve Jobs (but Jony would agree)
