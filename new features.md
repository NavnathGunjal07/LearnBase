. Conversational Topic Onboarding (Focus)
Current: User selects a topic from a dropdown. Proposed: When a user selects (or types) a topic, don't just start. Enter a "Tuning" phase.

The "Why" Interaction: The AI asks 1-2 quick questions:
"Cool, React! Are you building something specific, or just exploring the basics?"
"Do you prefer videos, code snippets, or deep theory?"
Benefit: The generated subtopics are no longer generic; they are tailored (e.g., "React for Dashboards" vs "React Internals"). 2. "Understanding You" Progress State
Current: A simple loading spinner or static wait. Proposed: A visual "Thinking/Building" phase that mirrors Unfold's progress bar.

"Analyzing your request..."
"Curating subtopics..."
"Structuring your path..."
Benefit: Makes the wait feel valuable and personalized, not just slow. 3. Dynamic Course Roadmap
Current: A list of subtopics. Proposed: A visually rich "Journey Map".

Instead of a simple list, show a connected path (nodes and lines).
Mark "You are here" clearly.
Wow Factor: Animate the path appearing after the "Understanding You" phase. 4. Interactive Quick-Replies
Current: User mostly types text. Proposed: For the "Tuning" phase and quizzes, offer pill-shaped buttons for quick answers.

[Just Exploring] [Building an App] [Preparing for Interview]
Benefit: Reduces friction and speeds up the personalization flow. 5. Minimalist "Focus Mode" UI customisation
Current: Standard chat interface. Proposed: A "Cinematic" or "Zen" mode for the visualizer.

When the visualizer is active, dim the sidebar and other distractions.
Center the content similar to Unfold's clean aesthetic.
Implementation Roadmap (Draft)
Phase 1: The Tuning Flow - Implement the interceptor for new topics to ask "Why?".
Phase 2: Visual Polish - Add the "Building..." animation and quick-reply buttons.
Phase 3: The Roadmap - Upgrade the subtopic list to a visual path.
