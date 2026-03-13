# CiviX

CiviX includes a React frontend and a FastAPI backend (MongoDB + Gemini + RAG).

## What is implemented

- Auth flow with register, login, refresh token, logout, and protected routes
- Multi-step onboarding flow after signup/login for profile capture
- Eligibility engine with profile-based scoring and ranked schemes
- AI assistant with RAG over scheme dataset + Gemini response generation
- Voice query endpoint integration support
- Scheme explorer with search, filters, pagination, and bookmarks
- Dashboard with profile summary, suggested schemes, and saved schemes
- Admin panel with scheme CRUD, search, filters, pagination, and inline update
- State-wise official data import pipeline for gradual replacement of synthetic data
- Dataset pipeline supporting large scheme generation and MongoDB ingestion

## Who are the users

- Citizens (students, employees, women, men, senior citizens, farmers, job seekers)
- Government welfare applicants looking for eligibility guidance
- Administrators managing schemes and quality of records
- Project evaluators/researchers analyzing public welfare discovery systems

## How the system is used

1. Open home page
2. Signup/login with name, email, and password
3. Complete onboarding profile form
4. View eligibility-based suggested schemes
5. Explore schemes, bookmark relevant ones, and open official links
6. Use AI assistant chat for guided recommendations
7. Admin users can manage scheme records and monitor stats

## Features applied

- Authentication and role-based access
- Multi-step onboarding
- Profile persistence
- Eligibility matching
- Semantic search + RAG
- Assistant with strict recommendation format
- Bookmarking and history
- Admin CRUD and analytics
- Official source import pipeline

## Future additions

- Direct integration with authenticated state/central government APIs and portals
- Scheduled state-wise sync jobs and automated source freshness checks
- Multilingual UI + model responses by locale preference
- Explainable eligibility scoring with rule breakdowns
- Notification system for deadline/eligibility updates
- Mobile app and offline-first mode for low-connectivity regions
- Audit trail and moderation workflow for admin changes

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router
- Backend: FastAPI, Pydantic, Motor
- Database: MongoDB
- AI: Gemini API + retrieval-augmented generation
- Security: JWT access/refresh, bcrypt, token revocation
- Tooling: pandas dataset scripts, smoke API checks

## Prerequisites

- Node.js 18+
- npm
- Python 3.11+
- MongoDB running locally or remotely

## Backend setup

```sh
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set values in `.env`:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.0-flash`)
- `GEMINI_QUOTA_COOLDOWN_SECONDS` (temporarily skip quota-blocked models)
- `CORS_ORIGINS`

## Commands for another system (fresh machine)

### Windows

```sh
git clone <your-repo-url>
cd scheme-navigator
npm install

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

copy .env.example .env
```

Update `.env` values (`MONGODB_URI`, `JWT_SECRET_KEY`, `GEMINI_API_KEY`).

Generate and load dataset:

```sh
python scripts/generate_dataset.py
python scripts/load_schemes.py
```

Run backend + frontend:

```sh
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
npm run dev -- --host 127.0.0.1 --port 8080
```

Or use single command:

```sh
npm run dev:stack
```

## Dataset pipeline

```sh
python scripts/generate_dataset.py
python scripts/load_schemes.py
```

## Official state-wise import (gradual replacement)

1. Fill `data/official_sources/state_sources.csv` with verified state records
2. Import one state at a time:

```sh
python scripts/import_official_state_sources.py --state Maharashtra --replace-generated
```

3. Repeat for each state

## One-command dev run (frontend + backend)

```sh
npm install
npm run dev:stack
```

This starts:

- Backend at `http://localhost:8000`
- Frontend at `http://localhost:8080`

## Available scripts

- `npm run dev` - frontend only (Vite)
- `npm run dev:stack` - frontend + backend together
- `npm run smoke:api` - run backend endpoint smoke checks
- `npm run build` - frontend production build
- `npm run preview` - frontend preview
- `npm run lint` - frontend lint
- `npm run test` - frontend tests

## API docs

- Swagger UI: `http://localhost:8000/docs`
- Gemini diagnostics (auth required): `GET /chat/diagnostics`

## Endpoint verification

With backend running, execute:

```sh
npm run smoke:api
```

This validates root, auth, schemes, eligibility, chat, admin protection, and voice endpoint request validation.

## Final year project docs

- PPT content: `docs/ppt-content.md`
- Detailed project report content: `docs/final-year-project-content.md`
