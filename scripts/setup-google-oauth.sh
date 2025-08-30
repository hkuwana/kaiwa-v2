#!/bin/bash

# Google OAuth Setup Script for Kaiwa
# This script helps you set up Google OAuth credentials

echo "🔐 Google OAuth Setup for Kaiwa"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one first."
    echo "   You can copy from .env.example: cp .env.example .env"
    exit 1
fi

echo "📝 Please follow these steps to set up Google OAuth:"
echo ""
echo "1. Go to https://console.cloud.google.com/"
echo "2. Create a new project or select an existing one"
echo "3. Enable the Google+ API"
echo "4. Go to 'Credentials' → 'Create Credentials' → 'OAuth 2.0 Client IDs'"
echo "5. Set application type to 'Web application'"
echo "6. Add these redirect URIs:"
echo "   - http://localhost:5173/auth/google/callback (development)"
echo "   - https://trykaiwa.com/auth/google/callback (production)"
echo "7. Copy the Client ID and Client Secret"
echo ""

# Prompt for credentials
read -p "Enter your Google Client ID: " CLIENT_ID
read -p "Enter your Google Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Client ID and Client Secret are required!"
    exit 1
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."

# Check if GOOGLE_CLIENT_ID already exists
if grep -q "GOOGLE_CLIENT_ID" .env; then
    # Update existing values
    sed -i.bak "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$CLIENT_ID/" .env
    sed -i.bak "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$CLIENT_SECRET/" .env
else
    # Add new values
    echo "" >> .env
    echo "# Google OAuth Configuration" >> .env
    echo "GOOGLE_CLIENT_ID=$CLIENT_ID" >> .env
    echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET" >> .env
fi

echo "✅ Google OAuth credentials added to .env file!"
echo ""
echo "🔄 Restart your development server for changes to take effect."
echo "   The Google OAuth button should now appear on the auth page."
echo ""
echo "🔒 Remember to keep your .env file secure and never commit it to version control!"
