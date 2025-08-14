---
title: 'Styling Test'
description: 'Testing mdsvex rendering with Tailwind v4 and enhanced prose styling'
author: 'Test Author'
date: '2025-01-15'
tags: ['test', 'styling', 'mdsvex', 'tailwind']
---

# 🎨 Styling Test Document

This is a **test document** to verify that mdsvex is working properly with our new Tailwind v4 styling.

## Typography Elements

### Headings

- H1: Main title (above)
- H2: Section title (this)
- H3: Subsection title (below)
- H4: Minor heading
- H5: Small heading
- H6: Tiny heading

### Text Formatting

- **Bold text** for emphasis
- _Italic text_ for subtle emphasis
- `Inline code` for technical terms
- ~~Strikethrough~~ for removed content

### Lists

1. **Ordered list item 1**
2. **Ordered list item 2**
   - Nested unordered item
   - Another nested item
3. **Ordered list item 3**

- **Unordered list item 1**
- **Unordered list item 2**
  - Nested ordered item
  - Another nested item
- **Unordered list item 3**

### Blockquotes

> This is a blockquote that should have enhanced styling with a background and left border.

> **Multiple paragraphs** in a blockquote
>
> Should work properly with spacing and styling.

### Code Blocks

#### TypeScript Example

```typescript
interface User {
	id: string;
	name: string;
	email: string;
}

function createUser(userData: Omit<User, 'id'>): User {
	return {
		id: crypto.randomUUID(),
		...userData
	};
}
```

#### JSON Example

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "user_123",
			"name": "John Doe"
		}
	}
}
```

### Tables

| Feature           | Status     | Notes                  |
| ----------------- | ---------- | ---------------------- |
| Typography        | ✅ Working | Tailwind prose classes |
| Code Highlighting | ✅ Working | rehype-highlight       |
| Tables            | ✅ Working | Enhanced borders       |
| Lists             | ✅ Working | Custom markers         |
| Blockquotes       | ✅ Working | Background styling     |

### Links and References

- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [mdsvex](https://mdsvex.com) - Markdown preprocessor for Svelte
- [DaisyUI](https://daisyui.com) - Component library for Tailwind

### Horizontal Rules

---

This should create a styled horizontal rule above this text.

## Conclusion

If you can see this document with proper styling, then our mdsvex + Tailwind v4 setup is working correctly! 🎉

The document should have:

- ✅ Proper heading hierarchy and spacing
- ✅ Enhanced typography with Tailwind prose
- ✅ Code highlighting with syntax colors
- ✅ Styled tables with borders
- ✅ Enhanced blockquotes and lists
- ✅ Consistent color scheme using DaisyUI themes
