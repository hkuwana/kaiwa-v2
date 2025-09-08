# Assessment Testing Tools

This directory contains tools for testing the onboarding assessment flow for guest/first-time users.

## Routes

### `/dev/assessment-test` - Basic Testing

- **Purpose**: Test the assessment flow and results display
- **Features**:
  - Start mock assessment with 3-second simulation
  - Test different user profiles (Beginner, Advanced, Travel-focused)
  - View assessment results using the OnboardingResults component
  - **Message Objects Display**: See the actual message structure used in assessment
  - Debug information about store state

### `/dev/assessment-test/api-simulation` - API Simulation Testing

- **Purpose**: Test the complete assessment flow including API simulation
- **Features**:
  - Simulate conversation recording and processing
  - Simulate AI analysis with progress bars
  - Generate realistic mock results based on conversation content
  - **Full Message Object Structure**: View complete message objects with all properties
  - **API Request Structure**: See exactly what gets sent to the API
  - Test API endpoint structure (console output)
  - Full flow simulation: conversation → analysis → results

## Message Object Structure

The testing tools now display the actual message objects that would be sent to the assessment API:

```typescript
{
  id: 'msg-1',
  role: 'user' | 'assistant',
  content: 'Message content...',
  timestamp: Date,
  language: 'ja' | 'en',
  conversationId: 'conv-001',
  audioUrl: string | null,
  transcriptionConfidence: number | null
}
```

### Key Properties

- **id**: Unique message identifier
- **role**: User or AI assistant
- **content**: Actual message text
- **timestamp**: When the message was sent
- **language**: Language of the message
- **conversationId**: Links messages to conversation
- **audioUrl**: Audio recording URL (if available)
- **transcriptionConfidence**: Speech-to-text confidence score

## How to Use

### 1. Basic Testing

1. Navigate to `/dev/assessment-test`
2. View the **Message Objects** section to see the data structure
3. Click "Start Mock Assessment" to simulate the 3-second analysis process
4. Use the profile-specific buttons to test different user types
5. View results in the OnboardingResults modal
6. Use "Reset Assessment" to start over

### 2. API Simulation Testing

1. Navigate to `/dev/assessment-test/api-simulation`
2. View the **Message Objects Structure** section for full object details
3. View the **API Request Structure** section for the exact API payload
4. Click "Start Full Simulation" to run the complete flow
5. Watch the progress bars for conversation and analysis phases
6. View generated results based on mock conversation data
7. Check console for API endpoint simulation

### 3. In-Conversation Testing

1. Start a conversation on `/conversation`
2. In dev mode, you'll see additional dev controls
3. Use "Start Analysis" to trigger the analysis state
4. Use "Set Mock Results" to populate with test data
5. Use "Clear Results" to reset the state

## Mock Data

The testing tools use realistic mock data including:

- **Beginner Profile**: Low skill levels, comfortable challenge preference
- **Advanced Profile**: High skill levels, challenging preferences
- **Travel Focus**: Travel-specific goals and preferences
- **Business Focus**: Career-oriented goals and business context

### Sample Message Objects

The tools include realistic conversation data with:

- Mixed language content (Japanese/English)
- User and AI assistant roles
- Timestamps and conversation IDs
- Transcription confidence scores
- Business-focused conversation context

## Store Integration

These tools integrate with:

- `userPreferencesStore` - Manages analysis state and results
- `conversationStore` - Handles conversation flow
- `OnboardingResults` component - Displays assessment results

## Testing Scenarios

### Guest User Flow

1. User starts conversation without account
2. Conversation ends after timer expires
3. Analysis process begins automatically
4. Results are displayed in OnboardingResults modal
5. User can continue learning or save profile

### First-Time User Flow

1. New user completes onboarding conversation
2. AI analyzes conversation content and language patterns
3. Personalized learning profile is generated
4. Results show skill levels, goals, and preferences
5. User can customize and save their profile

## Debug Information

Each testing route includes debug panels showing:

- Current step/state
- Progress indicators
- Store state information
- Error handling
- **Message object details**
- **API request structure**

## Notes

- These tools are only available in development mode
- Mock data is generated locally and doesn't affect production
- **Message objects show the exact structure used in real assessment**
- **API simulation shows the expected request/response structure**
- Results can be reset and regenerated for testing different scenarios
- All message properties are displayed for comprehensive testing
