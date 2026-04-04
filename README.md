# AI Agent Backend (NestJS)

This backend exposes APIs for:
- AI answer generation.
- Related resource search (article/news/youtube).
- SMS sending (Twilio or mock mode).

## Run

```bash
npm install
npm run start:dev
```

Server starts on `http://localhost:4500` by default.

## Environment

Create `.env`:

```bash
PORT=4500
FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3011

# LLM
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

# Search providers
SERPER_API_KEY=
NEWS_API_KEY=
YOUTUBE_API_KEY=

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

If API keys are missing, backend returns fallback links and mock SMS response.

## Endpoints

- `POST /api/agent`
  - body: `{ question, goal, history }`
  - response: `{ answer, resources }`
- `GET /api/search?q=your+query`
  - response: `{ resources }`
- `POST /api/sms`
  - body: `{ to, message }`
  - response: Twilio status or mock preview
