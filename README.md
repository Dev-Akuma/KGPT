# KGPT (Vite + React + Groq via AI SDK)

This project uses a secure backend (`server.js`) to call Groq with `@ai-sdk/groq` and `generateText`:

```js
const { text } = await generateText({
  model: groq('llama-3.3-70b-versatile'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

The frontend calls `/api/chat`, and Vite proxies that route to `http://localhost:3001` during development.

## Setup

1. Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

2. Install dependencies:

```bash
npm install
```

## Run

Open two terminals in the project root.

Terminal 1 (API server):

```bash
npm run server
```

Terminal 2 (Vite frontend):

```bash
npm run dev
```

Then open the Vite URL shown in terminal (usually `http://localhost:5173`).

## Endpoints

- `GET /api/health`
- `POST /api/chat` with body:

```json
{ "input": "Explain the importance of fast language models" }
```
