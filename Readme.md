# Reject Me First

> Get your startup idea evaluated by an AI committee of 7 expert perspectives before pitching to real investors.

Reject Me First simulates a realistic pitch evaluation with Investor, Customer, Technical, Financial, Legal, Operator, and Marketing reviewers. Submit your idea → get committee feedback → provide rebuttals → see final verdict, all in English or Arabic.

## Features

- 7 AI Evaluators: Investor, Customer, Technical, Financial, Legal, Operator, Marketing
- Score + Feedback: 0-10 scores with confidence levels and articulated objections
- Free-Text or Structured Input: Describe your idea your way or fill out a form
- Rebuttal & Re-Evaluation: Respond to concerns and see how reviewers' scores shift
- Final Judge Verdict: Synthesized guidance on strongest points, risks, and next steps
- Bilingual: Full English/Arabic support with RTL/LTR layouts
- Demo Mode: Explore with sample data, no setup required
- Editorial Brutalism Design: Clean, credible interface with light/dark mode

## Tech Stack

Frontend: React 19, TypeScript, Vite, TailwindCSS 4, Shadcn UI, Wouter, React Query, React Hook Form, Framer Motion

Backend: Express.js, tRPC 11, Drizzle ORM, MySQL, OpenAI API, AWS S3

Dev: TypeScript, Vitest, Prettier, Drizzle Kit

## Quick Start

Requirements: Node.js 18+, pnpm, OpenAI API key, MySQL (optional for dev)
```

pnpm install
cp .env.example .env.local  # Add OPENAI_API_KEY, DATABASE_URL
pnpm dev                     # Start at http://localhost:5173
pnpm test                    # Run tests
pnpm build && pnpm start     # Production
```
## Project Structure
```
reject-me-first/
├── client/          # React frontend (components, pages, hooks)
├── server/          # Express backend (tRPC routers, committee logic, LLM calls)
├── shared/          # Types, schemas, constants
├── drizzle/         # Database schema & migrations
├── vite.config.ts   # Frontend build config
└── package.json     # Dependencies & scripts
```
