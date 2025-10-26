Title: Devlog – Universal Speech Speed (Dual-Layer Control)
Length: 3–5 minutes

Audience
- Learners who said “the AI speaks too fast,” and power users curious about how we fixed it.

Arc
1) Problem (20–30s)
   - “Top complaint: speech is too fast across all languages. Instructions helped, but weren’t precise enough for everyone.”

2) What we shipped (30–45s)
   - Dual‑layer speed control:
     1) AI pacing via instructions (shorter sentences + pauses)
     2) Playback speed slider (50%–100%) for precise control

3) Demo (60–90s)
   - Show Advanced Audio Options → Speech Speed presets (Very Slow → Native)
   - Move the slider to 0.75×; replay a line; highlight instant clarity
   - Toggle back to 1.0×; call out difference in comprehension

4) How to use it (30–45s)
   - New users: Auto mode picks a sane speed by CEFR
   - Need more control? Enable Custom speed and use the 0–100 slider
   - Persists across sessions; works for all languages

5) Behind the scenes (optional 20–30s)
   - Browser audioElement.playbackRate + instruction tuning = natural + controllable

6) CTA (10–15s)
   - “Try changing your speed now and tell me where it still feels too fast or slow. I’ll tune presets based on your feedback.”

Shot List
- A‑roll: you explaining the problem + what shipped
- B‑roll: app UI (Advanced Audio → change presets; move slider; replay)
- Caption overlays: “Dual‑layer = AI pacing + playback slider”

Short (30–45s) – Before/After
- Split screen: 1.0× vs 0.75× of the same tutor line
- On‑screen text: “Set your speed: Advanced Audio → Speech Speed”

