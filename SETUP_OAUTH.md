# 🔐 Google OAuth Setup Guide

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (for user profile access)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:5173/login/google/callback`
   - Production: `https://yourdomain.com/login/google/callback`
7. Copy your Client ID and Client Secret

## 2. Environment Variables

Create a `.env` file in the project root with:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"

# OpenAI API (optional, has fallbacks)
OPENAI_API_KEY="your-openai-api-key-here"

# Database (if you want to persist data)
DATABASE_URL="postgresql://username:password@localhost:5432/kaiwa"

# Environment
NODE_ENV="development"
```

## 3. Database Setup (Optional)

If you want to persist user data and conversations:

```bash
# Install and start PostgreSQL
# Create database
createdb kaiwa

# Run migrations
pnpm run db:push
```

## 4. Test the Setup

1. Start the development server:

   ```bash
   pnpm run dev
   ```

2. Visit `http://localhost:5173`
3. Click "Sign in" → "Continue with Google"
4. You should be redirected to Google's OAuth flow

## 🎯 Features

- ✅ **Anonymous Usage**: Works without authentication
- ✅ **Google OAuth**: Optional sign-in to save progress
- ✅ **Progressive Enhancement**: App works even if OAuth is disabled
- ✅ **Secure Sessions**: Uses secure HTTP-only cookies
- ✅ **Auto-cleanup**: Sessions expire automatically

## 🔧 Troubleshooting

**OAuth not working?**

- Check your redirect URI matches exactly
- Ensure Google+ API is enabled
- Verify environment variables are loaded

**Database errors?**

- App works without database (uses localStorage)
- Check DATABASE_URL format
- Run `pnpm run db:push` to create tables

**OpenAI errors?**

- App has fallbacks for transcription and TTS
- Browser speech APIs are used as backup
- Add OPENAI_API_KEY for full functionality

