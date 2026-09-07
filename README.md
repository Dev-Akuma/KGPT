# The Compass 🧭

**The Compass** is a modern, reflective AI guidance application designed to help users think clearly, gain self-awareness, and process life decisions through honest, non-judgmental dialogue. 

Moving away from generic platitudes and superficial motivational advice, **The Compass** acts as a sharp, empathetic companion. Powered by a multi-tier LLM architecture, real-time Server-Sent Events (SSE) streaming, a structured subconscious memory engine, and Firebase persistence, it delivers personalized, context-aware conversations that evolve over time.

---

## 🌟 Key Features

### 💬 Mindful & Anti-Generic Conversational AI
- **Honest & Direct Guidance**: Focuses on clarity, reframing premises, and non-syrupy, actionable insights rather than repetitive validation.
- **Multi-Turn Chat Streaming**: Low-latency token-by-token response streaming built on Server-Sent Events (SSE).
- **Markdown & Code Support**: Full rich-text rendering with `react-markdown`, `remark-gfm`, and `remark-breaks`.
- **Character Typing Animation**: Smooth visual streaming with dynamic cancellation on new user submissions.

### 🧠 Subconscious Memory Architect
- **Atomic Delta Extraction Engine**: Automatically extracts new, non-duplicative user facts from conversation history using structured Zod schemas.
- **5-Tier Fact Categorization**:
  - `core_essence`: Values, goals, identity, and life milestones.
  - `ecosystem`: Key people, relationships, and sentiment.
  - `shadow_work`: Recurring anxieties, fears, and triggers.
  - `daily_routine`: Current focus, habits, projects, and routines.
  - `ephemeral`: Transient thoughts and current state of mind.
- **Dynamic Context Injection**: Injects pinned and relevant memory profile context into downstream AI system prompts for deep personalization.

### ⚡ Intent Router & Dynamic Model Mesh
- **Guardian Gatekeeper Layer**: Micro-LLM classifier (`ministral-3b-2512`) inspects incoming prompts and categorizes intent (`DEEP_GUIDANCE`, `DAILY_REFLECTION`, `CASUAL_MANTRA`).
- **Dynamic Model Allocation**:
  - `DEEP_GUIDANCE` → `ministral-14b-2512` (High-capacity reasoning for complex life decisions).
  - `DAILY_REFLECTION` / `CASUAL_MANTRA` → `ministral-8b-2512` (Fast, efficient responses for daily check-ins).

### 🌿 Well-being & Reflection UX Modules
- **Interactive Mood Check-in**: Track daily emotional states with visual mood selectors.
- **Mood Calendar & Streak Tracker**: Visualize historical mood trends and maintain continuous reflection streaks.
- **Daily Wisdom Card**: Contextual daily quotes and reflections presented once per day.
- **Personalized Session Greetings**: Tailored greetings synthesized from stored memory insights.

### 🔒 Dual-Mode Access & Cloud Persistence
- **Guest Mode**: Privacy-focused, in-memory local session for instant interaction without sign-in.
- **Authenticated Mode**: Full Cloud Firestore synchronisation backed by Firebase Authentication (Email/Password & Google Sign-In).

---

## 🛠️ Architecture & System Design

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                            React 19 Frontend                            │
│           (Vite + Custom CSS Modules + Interactive Background)           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    POST /api/chat   │   POST /api/memory/extract
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Vercel Serverless Edge API Layer                      │
├────────────────────────────────────┬────────────────────────────────────┤
│ 1. Intent Classification Router    │ 2. Subconscious Memory Architect   │
│    (ministral-3b + Zod Schema)     │    (Delta Fact Extraction + Zod)  │
├────────────────────────────────────┼────────────────────────────────────┤
│ 3. Dynamic Model Dispatch          │ 4. SSE Realtime Text Stream        │
│    (ministral-8b / 14b)            │    (streamText Event Stream)      │
└────────────────────────────────────┴────────────────────────────────────┘
                                     │
                         Firestore   │   Firebase Auth
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Firebase Cloud Infrastructure                      │
│     - Auth: Google OAuth / Email / Anonymous                            │
│     - Firestore: `users/{uid}/chats/{chatId}/messages`                 │
│     - Memory Doc: `users/{uid}/profile/memory`                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS / Custom Animations, `ogl` (WebGL canvas background)
- **Backend / APIs**: Vercel Serverless Functions (Node.js ES Modules)
- **AI Core & Orchestration**: Vercel AI SDK (`ai`), `@ai-sdk/mistral`, Zod Structured Output Parsing
- **LLM Engine**: Mistral AI Mesh (`ministral-3b-2512`, `ministral-8b-2512`, `ministral-14b-2512`)
- **Authentication & Database**: Firebase Auth, Google OAuth, Cloud Firestore
- **Deployment & Hosting**: Vercel

---

## 📁 Project Structure

```text
The-Compass/
├── api/
│   ├── chat.js                  # SSE Streaming handler + Intent Classifier Router
│   └── memory/
│       └── extract.js           # Subconscious Memory Delta Extractor API
├── public/
├── src/
│   ├── assets/                  # Icons, graphics, and visual assets
│   ├── components/
│   │   ├── CalmBackground.jsx    # WebGL / OGL smooth ambient canvas
│   │   ├── ChatInput.jsx         # Auto-resizing input box with action triggers
│   │   ├── ChatWindow.jsx        # Scroll-managed chat feed with typing indicator
│   │   ├── DailyWisdomCard.jsx   # Reflection card overlay
│   │   ├── MessageBubble.jsx     # Markdown renderer with code formatting
│   │   ├── MoodCalendar.jsx      # Visual calendar view for historical moods
│   │   ├── MoodCheckInCard.jsx   # Interactive daily mood prompt
│   │   ├── Sidebar.jsx           # Conversation thread management & drawer
│   │   └── UserProfilePanel.jsx # Profile settings & memory controls
│   ├── hooks/
│   │   └── useChatSessions.js   # Firestore chat sync hook
│   ├── pages/
│   │   ├── ChatPage.jsx         # Main application workspace
│   │   └── LoginPage.jsx        # Auth landing page
│   ├── services/
│   │   ├── authService.js       # Firebase Auth workflows
│   │   ├── chatService.js       # Stream consumer service for SSE API
│   │   ├── firebase.js          # Firebase SDK initialization
│   │   ├── memoryStoreService.js# Client memory cache & Firestore sync
│   │   └── moodService.js       # Mood logging & analytics service
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 🔌 API Reference

### `POST /api/chat`
Streams assistant responses token-by-token via Server-Sent Events (SSE).

**Request Body:**
```json
{
  "input": "I am feeling stuck between sticking with my job and starting a company.",
  "userProfileContext": "Core goals: independence; Shadow work: fear of financial instability.",
  "history": [
    { "role": "user", "content": "I need some advice on career decisions." },
    { "role": "assistant", "content": "What is driving the urge to change right now?" }
  ]
}
```

**Response Format:** `text/event-stream`
```text
data: {"chunk":"It sounds like "}
data: {"chunk":"you are weighing security against autonomy..."}
...
data: {"done":true}
```

---

### `POST /api/memory/extract`
Extracts new, non-duplicative atomic user insights to update the user's subconscious memory profile.

**Request Body:**
```json
{
  "messages": [
    "I'm working on a new React app called The Compass.",
    "Sometimes I struggle with time management on weekends."
  ],
  "existingMemories": [
    { "fact": "User is a developer." }
  ]
}
```

**Response:** `application/json`
```json
{
  "memories": [
    {
      "fact": "User is building a React app named The Compass",
      "category": "daily_routine",
      "isPinned": false
    },
    {
      "fact": "User struggles with weekend time management",
      "category": "shadow_work",
      "isPinned": false
    }
  ]
}
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- A Mistral AI API key
- A Firebase Project (with Auth & Firestore enabled)

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Server-side API key (Vercel Serverless)
MISTRAL_API_KEY=your_mistral_api_key_here

# Client-side Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Installation & Local Development

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# Run full serverless stack locally (Vercel CLI)
vercel dev
```

---

## 🚀 Deployment

1. Push your repository to GitHub.
2. Import the repository into your **Vercel** dashboard.
3. Configure the Environment Variables (`MISTRAL_API_KEY` and `VITE_FIREBASE_*`).
4. Deploy! Vercel automatically exposes the `/api/chat` and `/api/memory/extract` endpoints as serverless functions.

---

## 📄 License

This project is open-source under the MIT License.
