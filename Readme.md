# Reject Me First

> An AI-powered startup pitch evaluation platform that simulates a diverse committee of expert reviewers to provide rigorous, constructive feedback on your idea.

## Overview

Reject Me First is a sophisticated evaluation tool designed for founders and innovators who want objective, multi-perspective feedback on their startup ideas before pitching to real investors. Instead of one person's opinion, your idea is evaluated by a diverse AI committee of Investor, Customer, Technical, Financial, Legal, Operator, and Marketing perspectives.

The platform guides you through a structured evaluation process: submit your idea → receive committee feedback → provide rebuttals → get re-evaluated with a final verdict. All with a clean, editorial-brutalism interface and bilingual (English/Arabic) support.

## Features

### 🎭 Diverse Committee Evaluation
- Seven AI Evaluators: Investor, Customer, Technical, Financial, Legal, Operator, and Marketing agents
- Multi-Perspective Feedback: Get candid, realistic assessments from each reviewer
- Articulated Scores: Each evaluator provides scores (0-10) with confidence levels
- Real Objections: Committee identifies genuine concerns rather than invented problems

### 📝 Flexible Input Methods
- Free-Text Entry: Describe your idea in your own words
- Structured Form: Provide name, problem, solution, market type, and additional details
- Voice & Document Support: (Setup required) Transcribe voice or ingest PDF/text documents

### 💬 Rebuttal & Re-Evaluation  
- Free-Text Responses: Write rebuttals in your own voice
- Structured Rebuttal: Address objections organized by evaluator and concern
- Re-Evaluation Round: Committee reassesses your idea given your responses, with score deltas and stance changes
- Quality Assessment: Evaluators rate the quality of your rebuttals

### 🏛 Final Verdict
- Judge Consolidation: A final Judge agent summarizes the strongest points, biggest risks, improvements made, and remaining weaknesses
- Actionable Guidance: Clear next steps for strengthening your idea
- Export & Download: Save your full evaluation report

### 🌍 Bilingual Experience
- English & Arabic Support: Full RTL/LTR layout switching
- Language Preference: Choose your preferred interface language
- Output-Matched Language: Committee responses respect your language selection

### 💡 Demo Mode
- Risk-Free Testing: Explore the full flow with realistic sample data
- No Setup Required: Immediate access to see how the platform works

### 🎨 Design & UX
- Editorial Brutalism: Institutional design language that emphasizes clarity and credibility
- Light & Dark Mode: Theme toggle for comfortable reading
- Multi-page Flow: Clear separation between submission, evaluation, rebuttal, and verdict stages
- Responsive Design: Works seamlessly on desktop and tablet

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for fast development and optimized builds
- TailwindCSS 4 with custom animations
- Shadcn UI component library (Radix UI primitives)
- Wouter for client-side routing
- React Query for server state management
- React Hook Form with Zod validation
- Framer Motion for restrained animations

### Backend
- Express.js for HTTP server
- tRPC 11 for end-to-end type-safe API
- Drizzle ORM with MySQL database
- OpenAI API for LLM evaluations
- AWS S3 for file storage and presigned URLs

### Development & Testing
- TypeScript for type safety across the stack
- Vitest for unit testing
- Prettier for code formatting
- Drizzle Kit for database migrations

## Getting Started

### Prerequisites
- Node.js 18+ (tested with pnpm 10.15.1)
- pnpm package manager
- OpenAI API Key (for live LLM evaluations)
- MySQL Database (for production; SQLite for development)
- AWS S3 Credentials (optional, for file uploads)

### Installation
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Set your keys:
# - OPENAI_API_KEY=sk-...
# - DATABASE_URL=mysql://user:pass@localhost/reject_me_first
# - AWS_ACCESS_KEY_ID=...
# - AWS_SECRET_ACCESS_KEY=...
# - AWS_S3_BUCKET=your-bucket-name

### Development

# Start development server (backend + Vite HMR)
pnpm dev

# In another terminal (optional), watch the database
pnpm db:push

# Run tests
pnpm test

# Check types
pnpm check

# Format code
pnpm format

The app will be available at http://localhost:5173 (Vite dev server).

### Database Setup

# Generate new migrations
pnpm db:push

The schema uses Drizzle ORM with typed relations. See [drizzle/schema.ts](drizzle/schema.ts) for the full data model.

### Production Build

# Build front-end and bundle backend
pnpm build

# Start production server
pnpm start

The production build:
1. Bundles the React client with Vite (to dist/client)
2. Bundles the Express backend with esbuild (to dist/index.js)
3. Serves both statically and via tRPC on the same port

## Project Structure

reject-me-first/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # React components & Shadcn UI
│   │   ├── pages/          # Page components for routing
│   │   ├── contexts/       # React context (theme, committee state)
│   │   ├── hooks/          # Custom hooks (useAuth, useComposition, etc.)
│   │   ├── lib/            # tRPC client, utils
│   │   └── App.tsx         # Main app component
│   └── index.html          # Entry point
│
├── server/                  # Express backend
│   ├── _core/
│   │   ├── llm.ts          # LLM / OpenAI integration
│   │   ├── context.ts      # tRPC context setup
│   │   ├── trpc.ts         # tRPC router definition
│   │   ├── systemRouter.ts # System-level routes
│   │   └── ...             # Other utilities
│   ├── committee.ts        # Committee evaluation orchestration
│   ├── routers.ts          # tRPC route definitions
│   ├── auth.logout.test.ts # Authentication tests
│   └── committee.test.ts   # Committee logic tests
│
├── shared/                  # Shared types & schemas
│   ├── rejectMeFirst.ts    # Core types (Agent, Verdict, etc.)
│   ├── types.ts            # Shared TypeScript types
│   └── const.ts            # Constants & labels
│
├── drizzle/                # Database schema & migrations
│   ├── schema.ts           # Drizzle ORM schema
│   ├── relations.ts        # Entity relationships
│   └── migrations/         # Auto-generated migrations
│
├── patches/                # Patch files for dependencies
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
├── tsconfig.json           # TypeScript config
├── drizzle.config.ts       # Drizzle Kit config
└── package.json            # Dependencies & scripts

## Key Workflows

### Submitting an Idea

1. Entry Page: Choose between free-text or structured input
2. Project Brief Creation: Provide idea details (auto-formatted or manually structured)
3. Committee Analysis Starts: System orchestrates parallel evaluator calls

### Committee Evaluation

1. First-Round Reviews: All evaluators assess the project simultaneously
2. Card Display: Each evaluator's feedback shown with score, stance, and confidence
3. Before-vs-After View: Compare evaluator positions side-by-side

### Rebuttal & Re-Evaluation

1. Rebuttal Input: Respond to objections (free-text or structured by concern)
2. Second-Round Assessment: Evaluators re-assess with rebuttals in context
3. Deltas & Changes: See how scores and stances shifted

### Final Verdict

1. Judge Consolidation: Synthesizes all feedback into actionable guidance
2. Report Generation: Strongest points, risks, improvements, remaining weaknesses
3. Export Option: Download your evaluation as a report

## Environment Variables
# Server Configuration
NODE_ENV=development|production
PORT=3000

# Database
DATABASE_URL=mysql://user:password@localhost:3306/reject_me_first

# LLM & AI
OPENAI_API_KEY=sk-...

# AWS S3 (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=my-bucket

# OAuth (optional)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

## Design Philosophy

Editorial Brutalism for Institutional Products

The interface follows a brutalist design language with:
- Strong Hierarchy: Clear visual emphasis on what matters
- Asymmetrical Composition: Deliberate off-balance layouts that feel intentional
- Visible Structure: Procedural labels and document-style dividers
- Restrained Authority: Warm ivory + graphite base, muted crimson only for challenges

Typography: Space Grotesk (headings), IBM Plex Sans (body), mono for metadata  
Motion: Short slides, subtle fades, no floaty effects  
Color: Warm neutrals → graphite shadows → crimson objections

## Testing

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Generate coverage
pnpm test --coverage

Key test files:
- [server/committee.test.ts](server/committee.test.ts) — Committee logic
- [server/committee.flow.test.ts](server/committee.flow.test.ts) — Evaluation workflows
- [server/auth.logout.test.ts](server/auth.logout.test.ts) — Authentication
- [server/navigation.validation.test.ts](server/navigation.validation.test.ts) — Form validation

## Contributing

We follow conventional commit messages and maintain TypeScript strict mode. Before submitting:

pnpm check      # Type check
pnpm test       # Run tests
pnpm format     # Format code




