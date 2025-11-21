# How to Send Your Weekly Product Email

A super simple guide to sending beautiful, Kaiwa-style weekly updates.

---

## 🚀 Quick Start (3 Steps)

### 1. Edit Your Content

Open `src/lib/emails/campaigns/product-updates/weekly-update-template.ts`

Find this section:
```typescript
export const THIS_WEEKS_EMAIL: KaiwaEmailContent = {
  logoText: 'KAIWA',
  preheader: 'New features, improvements, and what\'s coming next',

  greeting: 'Hey 👋',
  intro: 'Quick update on what we shipped this week...',

  sections: [
    // ✏️ EDIT YOUR CONTENT HERE
  ]
}
```

### 2. Preview Your Email

**Option A: Via Dashboard**
```bash
http://localhost:5173/api/admin/send-weekly-update?preview=true
```

**Option B: Via Dev Email Dashboard**
- Go to `/dev/email`
- Select "Product Update" email type
- Click "Preview"

### 3. Send It!

**Option A: Via Terminal**
```bash
curl -X POST http://localhost:5173/api/admin/send-weekly-update \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

**Option B: Via Dashboard**
- Go to `/dev/email`
- Select "Product Update" email type
- Click "Send Test Email" (sends to weijo34@gmail.com)
- Once verified, use the API to send to all users

---

## 📧 Email Template Structure

### The Kaiwa Style

Clean, minimal, easy to scan. Here's the structure:

```
┌──────────────────────────────┐
│ KAIWA                        │ ← Optional logo
├──────────────────────────────┤
│ Hey [FirstName]              │ ← Personalized greeting
│                              │
│ Quick update on...           │ ← Short intro (1 line)
│                              │
│ ✨ NEW THIS WEEK             │ ← Section title
│ • Feature 1                  │
│   Description                │
│   → Link                     │
│                              │
│ • Feature 2                  │
│   Description                │
│                              │
│ 🎯 COMING SOON              │
│ • Upcoming feature           │
│                              │
│ 📝 YOUR FEEDBACK            │
│ • How we fixed X             │
│                              │
│ That's it for this week...   │ ← Closing
│                              │
│ Hiro                         │ ← Signature
│ Founder                      │
│ P.S. ...                     │ ← Optional PS
├──────────────────────────────┤
│ Unsubscribe | Preferences    │ ← Footer
└──────────────────────────────┘
```

---

## ✏️ Content Template

Copy-paste this and fill it in each week:

```typescript
export const THIS_WEEKS_EMAIL: KaiwaEmailContent = {
  logoText: 'KAIWA',
  preheader: 'Week of [DATE] - New features and improvements',

  greeting: 'Hey 👋',
  intro: 'Quick update on what we shipped this week and what\'s coming next.',

  sections: [
    // ✨ NEW THIS WEEK
    {
      title: '✨ New This Week',
      items: [
        {
          heading: '[Feature Name]',
          description: '[What it does and why it matters]',
          link: {
            text: 'Try it now',
            url: 'https://trykaiwa.com/...'
          }
        }
      ]
    },

    // 🎯 COMING SOON (Optional)
    {
      title: '🎯 Coming Soon',
      items: [
        {
          heading: '[Upcoming Feature]',
          description: '[What to expect]'
        }
      ]
    },

    // 📝 FEEDBACK (Optional)
    {
      title: '📝 Your Feedback in Action',
      items: [
        {
          heading: '[Issue you fixed]',
          description: '[How you fixed it]',
          link: {
            text: 'See the details',
            url: 'https://...'
          }
        }
      ]
    }
  ],

  closingNote: 'That\'s it for this week. Reply if you need anything!',

  signature: {
    name: 'Hiro',
    title: 'Founder',
    ps: 'P.S. [Optional personal note]'
  }
};
```

---

## 🎨 Design Principles (Kaiwa Style)

### ✅ Do:
- **Keep it short** - People skim emails
- **One idea per item** - Don't combine multiple features
- **Use emojis sparingly** - Just for section headers
- **Link strategically** - Only important CTAs
- **Personalize** - Use first names
- **Be conversational** - Write like you're talking to a friend

### ❌ Don't:
- Use multiple fonts or colors
- Add images (they often break)
- Write long paragraphs
- Include attachments
- Use "corporate speak"
- Over-design

---

## 📊 Best Practices

### Subject Lines
```
✅ "What's new in Kaiwa"
✅ "Quick update + new feature"
✅ "Kaiwa Weekly - Feb 14"

❌ "AMAZING NEW FEATURES YOU MUST SEE!!!"
❌ "This week's newsletter #47"
❌ "Important update regarding our platform"
```

### Intro Lines
```
✅ "Quick update on what we shipped this week."
✅ "Two new features and one fix you requested."
✅ "This week: faster loading and new scenarios."

❌ "We hope this email finds you well..."
❌ "We're excited to announce that we've been working hard on..."
```

### Feature Descriptions
```
✅ "Conversations now start 1.5s faster. Especially noticeable on older devices."

❌ "We've implemented a comprehensive optimization strategy that leverages
     advanced database indexing techniques to significantly reduce latency..."
```

---

## 🔄 Weekly Workflow

### Monday
1. Review what shipped last week
2. Check your changelog / git commits
3. Draft content in `weekly-update-template.ts`

### Tuesday
1. Preview email via dashboard
2. Send test email to yourself
3. Check formatting on mobile and desktop

### Wednesday
1. Final edits
2. Send to all users (morning is best)
3. Monitor open rates in Resend dashboard

---

## 📈 Track Performance

After sending, check Resend dashboard for:
- **Open rate** (aim for 25%+)
- **Click rate** (aim for 5%+)
- **Unsubscribe rate** (keep under 0.5%)

If open rates are low:
1. Try different subject lines
2. Send at different times
3. Make content more scannable
4. Add more value, less fluff

---

## 🎯 Example Emails

### Week with 1 Big Feature
```typescript
sections: [
  {
    title: '✨ New This Week',
    items: [
      {
        heading: 'AI-powered scenario recommendations',
        description: 'We analyze your practice history and suggest the perfect next scenario. Available now in your dashboard.',
        link: { text: 'See your recommendations', url: 'https://...' }
      }
    ]
  }
]
```

### Week with Multiple Small Updates
```typescript
sections: [
  {
    title: '✨ New This Week',
    items: [
      {
        heading: 'Faster loading',
        description: 'Removed a slow database query. Everything is snappier now.'
      },
      {
        heading: 'Better error messages',
        description: 'Clear, helpful errors instead of cryptic codes.'
      },
      {
        heading: 'Mobile improvements',
        description: 'Fixed 3 bugs on iOS and Android.'
      }
    ]
  }
]
```

### Week with Feedback Response
```typescript
sections: [
  {
    title: '📝 You Asked, We Delivered',
    items: [
      {
        heading: 'Microphone auto-pause fix',
        description: '15 of you reported this. Changed timeout from 30s to 90s and added a visual countdown.',
        link: { text: 'See the changelog', url: 'https://...' }
      }
    ]
  }
]
```

---

## 🛠 Customization

Want to change the design? Edit `generateKaiwaEmail()` in `weekly-update-template.ts`.

### Colors
```typescript
// Primary color (links, buttons)
color: #667eea

// Text colors
heading: #111827
body: #374151
muted: #6b7280

// Background
white: #ffffff
gray: #f9fafb
```

### Typography
```typescript
// Font stack
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

// Sizes
heading: 15-16px
body: 14-15px
small: 12-13px
```

---

## ❓ FAQ

**Q: How often should I send these?**
A: Weekly is perfect. More = annoying, less = people forget about you.

**Q: What if I have no updates?**
A: Skip that week! Only send when you have something valuable to share.

**Q: Should I send at the same time every week?**
A: Yes! Consistency builds habit. Wednesday 10am works well.

**Q: Can I A/B test subject lines?**
A: Not built-in yet, but you can send to half your list with one subject, half with another.

**Q: What if someone replies?**
A: Great! These emails go from hiro@trykaiwa.com with replyTo enabled. Just respond normally.

**Q: How do I see who opened my email?**
A: Check the Resend dashboard at https://resend.com/emails

---

## 🎓 Learn From the Best

Study these companies for inspiration:
- **Kaiwa** - Master of minimal, scannable updates
- **Linear** - Great feature announcements
- **Notion** - Excellent changelog style
- **Hey** - Conversational tone
- **Stripe** - Clean technical writing

---

## 🚨 Emergency: Undo a Send

You can't! Email is forever. That's why:
1. Always preview first
2. Send test email to yourself
3. Double-check links work
4. Spell check (seriously)

---

**Next:** Read `NEXT_STEPS_EMAIL_COST_CONTROL.md` for tips on reducing email costs as you scale!
