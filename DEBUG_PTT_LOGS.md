# PTT Double Message Debug Guide

## What to Look For

When you reproduce the issue with the enhanced logging, you should see a clear sequence of events. Here's what to watch for:

### Expected Flow for Two PTT Presses

#### First PTT Press (Silent/Short)

1. `▶️ ConversationStore: resumeStreaming() CALLED` - User presses button
2. `🔄 RESETTING SUPPRESSION FLAG IN resumeStreaming()` - Flag is reset to FALSE
3. `🔄 SUPPRESSION FLAG RESET TO FALSE` - Confirms flag is now FALSE
4. `⏸️ ConversationStore: pauseStreaming() CALLED` - User releases button
5. `🎯 SILENCE DETECTION LOGIC` - Check if turn was silence
6. `🧹 ConversationStore: SETTING suppressNextUserTranscript = TRUE` - Flag set to TRUE (if silent)
7. `📤 SENDING input_audio_buffer.commit EVENT NOW` - Commit sent to server
8. `📤 AUDIO BUFFER COMMITTED (SERVER RESPONSE)` - Server confirms commit with item_id #1
9. `📋 ITEM_ID TO WATCH FOR TRANSCRIPT` - Note the item_id (e.g., `item_ABC123`)

#### Second PTT Press (With Speech)

10. `▶️ ConversationStore: resumeStreaming() CALLED` - User presses button AGAIN
11. `🔄 RESETTING SUPPRESSION FLAG IN resumeStreaming()` - **⚠️ THE BUG: Flag reset from TRUE to FALSE**
12. `🔄 SUPPRESSION FLAG RESET TO FALSE` - Flag is now FALSE (lost the suppression!)
13. `🗑️ SENDING input_audio_buffer.clear EVENT NOW` - Clear sent
14. User speaks...
15. `⏸️ ConversationStore: pauseStreaming() CALLED` - User releases button
16. `🎯 SILENCE DETECTION LOGIC` - Should show this turn was NOT silent
17. `✅ NOT SUPPRESSING - turn had activity` - Don't set suppression flag
18. `📤 SENDING input_audio_buffer.commit EVENT NOW` - Commit #2 sent
19. `📤 AUDIO BUFFER COMMITTED (SERVER RESPONSE)` - Server confirms commit with item_id #2

#### The Problem - Transcripts Arrive

20. `🎤 USER TRANSCRIPTION COMPLETED` - Transcript for item_id #1 arrives (the SILENT one)
21. `🔍 TRANSCRIPT WILL NOW GO THROUGH FILTER` - Going to filter
22. `🔍 TRANSCRIPT FILTER CHECK` - **Check the suppressFlag value here** (should be FALSE because it was reset!)
23. `✅ TRANSCRIPT ALLOWED (suppression flag was false)` - **BUG: Silent transcript allowed!**
24. `🎤 USER TRANSCRIPTION COMPLETED` - Transcript for item_id #2 arrives (the REAL one)
25. `✅ TRANSCRIPT ALLOWED` - This one is correctly allowed

## Key Debug Points

### 1. Flag Reset Timing

Look for this sequence:

```
🧹 ConversationStore: suppressNextUserTranscript is now TRUE (after pauseStreaming)
...
🔄 RESETTING SUPPRESSION FLAG IN resumeStreaming() (on next PTT press)
🔄 SUPPRESSION FLAG RESET TO FALSE
```

The time between these shows how long we held the suppression flag before it was incorrectly reset.

### 2. Item ID Tracking

Track the item_ids:

- First commit → `item_ABC123` (should be suppressed)
- Second commit → `item_XYZ789` (should be shown)

### 3. Filter Check vs Flag Setting

Compare:

- When was `suppressNextUserTranscript = TRUE` set? (timestamp)
- When was `suppressNextUserTranscript = FALSE` reset? (timestamp)
- When did the transcript arrive and check the flag? (timestamp)

The transcript will likely arrive AFTER the flag was reset, causing it to pass through.

## What the Logs Will Prove

The enhanced logging should show:

1. **Flag is set correctly** after first PTT release (silence detected)
2. **Flag is incorrectly reset** when second PTT starts (resumeStreaming)
3. **First transcript arrives AFTER flag was reset**, so it's not suppressed
4. **Second transcript arrives** and is correctly shown

This confirms the race condition: the boolean flag gets reset before the server sends back the transcript for the silent turn.

## Solution Needed

Instead of a boolean flag, we need to track item_ids:

- When we detect silence, wait for the `input_audio_buffer.committed` event to get the item_id
- Add that item_id to a Set of IDs to suppress
- When transcripts arrive, check if their item_id is in the suppression Set
- Remove item_ids from the Set after processing

This way, each silent turn is tracked by its specific item_id, regardless of timing or subsequent PTT presses.
