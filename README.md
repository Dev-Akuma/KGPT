# KGPT

KGPT is a Krishna-inspired AI guidance chat application focused on calm, reflective conversations. It combines a modern chat experience with personalization features, optional therapeutic UX modules, Firebase-backed persistence, and serverless AI APIs on Vercel.

## What The App Does

- Supports guest chat mode for temporary conversations.
- Supports authenticated mode with persistent chats and memory profile.
- Uses long-term profile memory to personalize responses.
- Provides guided UX modules for wellbeing:
  - Daily mood check-in.
  - Daily wisdom reflection card.
  - Personalized session greeting.
  - Guided conversation starters.
- Includes assistant typing animation and polished sidebar/profile interactions.

## Core Experience

- Conversational AI assistant inspired by Bhagavad Gita principles.
- Message-by-message chat interface with markdown rendering.
- Session and historical chat support.
- Personalized follow-up context using stored memory insights.

## Feature Highlights

### Chat and Message UX

- Assistant typing animation renders responses character-by-character.
- Ongoing typing animation is force-completed if user sends a new message.
- Thinking indicator shown while waiting for assistant response.
- Markdown formatting support for assistant messages.

### Empty-State Guidance

- Starter prompts shown only when a chat is empty.
- Starter clicks auto-send the selected prompt.
- Starter cards auto-hide once messages exist.

### Mood and Reflection Modules

- Daily mood check-in card shown once per session.
- Mood choices auto-send contextual user messages.
- Daily wisdom quote card shown once per day.
- Personalized session greeting generated from memory insights.
- Generic greeting fallback when no memory is available.

### Sidebar and Conversation Management

- Responsive sidebar:
  - Desktop: layout sidebar.
  - Mobile/tablet: overlay drawer.
- Chat deletion per conversation with confirmation prompt.
- Active chat reset behavior on delete.

### Profile and Personalization UX

- Avatar button with image fallback to initials.
- Profile dropdown menu:
  - Settings.
  - Personalization.
  - Upgrade Plan placeholder.
  - Help.
  - Log Out.
- Personalization panel integrates memory controls and editing.

## Tech Stack

- Frontend: React 19 + Vite
- Backend: Vercel Serverless Functions (`/api/*`)
- AI: `ai` SDK + `@ai-sdk/groq` (`llama-3.3-70b-versatile`)
- Auth + Database: Firebase Authentication + Firestore
- Deployment: Vercel

## Architecture Overview

- Frontend sends chat requests to `/api/chat`.
- Memory extraction requests go to `/api/memory/extract`.
- Authenticated chat history and memory profile are stored in Firestore.
- Guest chat runs local in-memory state only.

## Project Structure

```text
KGPT/
  api/
    chat.js
    memory/
      extract.js
  public/
  src/
    components/
      CalmBackground.jsx
      ChatInput.jsx
      ChatWindow.jsx
      DailyWisdomCard.jsx
      MessageBubble.jsx
      MoodCheckInCard.jsx
      SessionGreetingCard.jsx
      Sidebar.jsx
      UserProfilePanel.jsx
      UtilityPanel.jsx
    hooks/
      useChatSessions.js
    pages/
      ChatPage.jsx
      LoginPage.jsx
    services/
      authService.js
      chatService.js
      firebase.js
      userMemoryService.js
    useGroqChat.js
```

## Environment Variables

Create a `.env` file in the project root.

```env
# AI backend
GROQ_API_KEY=your_groq_api_key_here

# Firebase client config
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Notes:

- `GROQ_API_KEY` is required by `api/chat.js` and `api/memory/extract.js`.
- Only `VITE_*` variables are exposed to frontend code.
- Firebase values must belong to the same Firebase project.

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Run frontend

```bash
npm run dev
```

### 3) Run local serverless APIs (recommended)

Use Vercel CLI for full local parity with production APIs.

```bash
vercel dev
```

Important:

- The current Vite proxy in `vite.config.js` points `/api` to `http://localhost:3001`.
- Since backend is serverless (not Express), prefer `vercel dev` for API testing.
- If you only run `npm run dev`, API calls may fail unless proxy target is adjusted.

## Available Scripts

- `npm run dev` starts Vite dev server.
- `npm run build` builds production frontend assets.
- `npm run preview` previews production frontend build.
- `npm run lint` runs ESLint.

## API Reference

### `POST /api/chat`

Generates assistant text.

Request:

```json
{
  "input": "I feel uncertain about my career.",
  "userProfileContext": "Traits: reflective, disciplined"
}
```

Response:

```json
{
  "text": "...assistant response..."
}
```

Notes:

- `userProfileContext` is optional.
- Returns `405` for non-POST.

### `POST /api/memory/extract`

Extracts structured memory insights from a user message.

Request:

```json
{
  "message": "I overthink exams and want a consistent routine."
}
```

Response:

```json
{
  "insights": {
    "traits": ["reflective"],
    "habits": ["inconsistent routine"],
    "concerns": ["exam anxiety"],
    "goals": ["build consistency"],
    "archetypes": ["reflective overthinker"],
    "communication_style": "calm, concise",
    "insights": ["benefits from structured planning"]
  }
}
```

Notes:

- Returns `405` for non-POST.
- Backend sanitizes and parses JSON output from model response.

## Data Model

Authenticated user data is stored under:

- `users/{uid}`
- `users/{uid}/chats/{chatId}`
- `users/{uid}/chats/{chatId}/messages/{messageId}`
- `users/{uid}/profile/memory`

Chat docs include metadata like title and timestamps.

Message docs include role, content, and timestamp.

Memory doc includes:

- `traits`, `habits`, `concerns`, `goals`, `archetypes`, `insights`
- `communication_style`
- `memoryEnabled`

## Client Storage Keys

The app uses browser storage to control one-time UX modules.

- `sessionStorage['kgpt:mood-checkin-shown']`
- `sessionStorage['kgpt:daily-wisdom-session-date']`
- `sessionStorage['kgpt:session-greeting-shown']`
- `localStorage['kgpt:daily-wisdom-last-date']`

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variables:
  - `GROQ_API_KEY`
  - all required `VITE_FIREBASE_*` values
4. Deploy.

Expected production API routes:

- `/api/chat`
- `/api/memory/extract`

## Troubleshooting

- `404` for `/api/chat` or `/api/memory/extract` in production.
- Ensure `api/chat.js` and `api/memory/extract.js` exist at repo root and redeploy.

- `Missing GROQ_API_KEY`.
- Add `GROQ_API_KEY` in Vercel project env vars and redeploy.

- Firebase auth/provider errors (`configuration-not-found`, `operation-not-allowed`, `unauthorized-domain`).
- Verify Firebase project config, enabled providers, and authorized domains.

- Local dev chat API failures with `npm run dev`.
- Use `vercel dev` or update `vite.config.js` API proxy target to a running local API endpoint.

## Product Direction Notes

KGPT is designed as supportive reflective guidance, inspired by Krishna's wisdom.

- It does not claim to be Krishna.
- It is not a replacement for professional medical or mental health care.
- For severe distress or crisis, users should seek immediate qualified support.
