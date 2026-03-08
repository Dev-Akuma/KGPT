# KGPT

KGPT is a full-stack Krishna-inspired guidance chat app built with React + Vite on the frontend and Vercel serverless API routes on the backend.

It supports:

- guest chat mode (temporary, not persisted)
- authenticated mode with Firebase (email/password + Google)
- persistent chat history in Firestore
- profile memory extraction and personalization context per user

## Tech Stack

- Frontend: React 19, Vite
- Backend: Vercel Serverless Functions (`/api/*`), AI SDK (`ai`) + Groq provider (`@ai-sdk/groq`)
- Database/Auth: Firebase Authentication + Firestore

## Project Structure

- `api/chat.js`: serverless route for assistant responses (`POST /api/chat`)
- `api/memory/extract.js`: serverless route for memory extraction (`POST /api/memory/extract`)
- `src/pages/ChatPage.jsx`: main chat UI
- `src/pages/LoginPage.jsx`: authentication UI
- `src/hooks/useChatSessions.js`: chat/session + memory orchestration
- `src/services/authService.js`: Firebase auth helpers
- `src/services/chatService.js`: Firestore chat CRUD + subscriptions
- `src/services/userMemoryService.js`: memory extraction, merge, persistence
- `src/services/firebase.js`: Firebase app/auth/db initialization

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend
GROQ_API_KEY=your_groq_api_key_here

# Frontend (Vite + Firebase)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Notes:

- `GROQ_API_KEY` is required by Vercel API routes in `api/*`.
- Vite exposes only `VITE_*` variables to the frontend.
- Firebase values must all belong to the same Firebase project.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start frontend:

```bash
npm run dev
```

3. Open the shown Vite URL (usually `http://localhost:5173`).

For full local API emulation, run with Vercel CLI (`vercel dev`) so `/api/*` functions execute locally.

## Available Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## API Endpoints

### `POST /api/chat`

Generate assistant response.

Request body:

```json
{
  "input": "I feel stuck and distracted lately.",
  "userProfileContext": "Traits: reflective, disciplined"
}
```

`userProfileContext` is optional and used for personalized responses.

### `POST /api/memory/extract`

Extract structured long-term memory signals from a user message.

Request body:

```json
{
  "message": "I overthink exams and want a consistent study routine."
}
```

Response body:

```json
{
  "insights": {
    "traits": ["reflective"],
    "habits": ["inconsistent study routine"],
    "concerns": ["exam anxiety"],
    "goals": ["build consistency"],
    "archetypes": ["reflective overthinker"],
    "communication_style": "calm, concise",
    "insights": ["benefits from structured planning"]
  }
}
```

## Auth and Data Flow

- Unauthenticated users can chat in temporary mode (messages are not saved).
- Authenticated users get persisted Firestore chat sessions under `users/{uid}/chats/{chatId}`.
- Messages are stored under `users/{uid}/chats/{chatId}/messages`.
- Memory profile data is stored under `users/{uid}/profile/memory`.

If memory learning is enabled, each user message can be analyzed via `/api/memory/extract`, merged with existing memory, and reused as context for `/api/chat`.

## Firebase Setup Checklist

- Create a Firebase project.
- Enable Authentication providers you plan to use (Email/Password and Google).
- Add your local/dev domains to authorized domains.
- Create a Firestore database.
- Add the Firebase Web App config values to `.env` as `VITE_*` variables.

## Troubleshooting

- `Missing GROQ_API_KEY`
- Fix: set `GROQ_API_KEY` in your Vercel project environment variables (and local `.env` when using `vercel dev`).

- Firebase auth errors like `configuration-not-found`, `operation-not-allowed`, or `unauthorized-domain`
- Fix: verify `VITE_FIREBASE_*` values, enabled providers, and authorized domains in Firebase Console.

- `404` from `/api/chat` or `/api/memory/extract` in production
- Fix: confirm the files exist at `api/chat.js` and `api/memory/extract.js`, then redeploy on Vercel.
