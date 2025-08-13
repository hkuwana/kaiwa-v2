# Kaiwa App Structure

## 🎯 Design Philosophy Implementation

This app follows the **Invisible Tutor** design philosophy with **Radical Simplicity**:

- **Main Page (`/`)**: Clean language selection with minimal UI
- **Conversation Page (`/conversation`)**: Dedicated space for dialogue practice
- **Single Purpose**: Each page serves one clear function

## 🏗️ Architecture

### Routes

- `/` - Language selection page (main entry point)
- `/conversation` - Conversation practice with AI
- `/login` - Authentication
- `/logout` - Sign out

### Key Components

#### Main Page Components

- `LanguageCard.svelte` - Individual language selection cards
- Clean grid layout with minimal distractions

#### Conversation Page Components

- `RecordButton.svelte` - Single button to start/stop speaking
- `ConversationHistory.svelte` - Message display
- Language-specific messaging (e.g., "Practice speaking Japanese")

### Data Flow

1. User selects language on main page
2. Redirects to `/conversation?lang=ja&mode=traditional&voice=alloy`
3. Conversation page initializes with selected settings
4. Single "Start Speaking" button begins practice

## ✨ Design Principles Applied

### Radical Simplicity

- **Removed**: Multiple selector buttons, debug panels, complex settings
- **Kept**: Essential language selection and conversation controls
- **Result**: User masters app in seconds

### Effortless Immersion

- Main page: Choose language, get practicing
- Conversation page: Speak naturally, AI responds
- No UI distractions during practice

### Anticipatory Intelligence

- Backend handles complexity (language detection, voice synthesis)
- Frontend remains simple and focused
- Settings passed via URL parameters for seamless experience

## 🚀 Usage

1. **Select Language**: Choose from 12 supported languages
2. **Start Speaking**: Single button to begin conversation
3. **Practice**: Natural dialogue with AI tutor
4. **Return**: Easy navigation back to language selection

The app now provides a **space dedicated to dialogue** rather than a complex application interface.
