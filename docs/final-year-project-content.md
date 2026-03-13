# CiviX Final Year Project Content

## 1. Abstract
CiviX is an AI-powered civic platform designed to help citizens discover government welfare schemes quickly and accurately. The system collects user profile details through a guided onboarding flow, evaluates eligibility, and recommends relevant schemes with required documents, official guidance, and direct official links. The platform includes an assistant powered by retrieval-augmented generation (RAG) using Gemini, a dashboard for user tracking, and an admin panel for scheme management. To support real-world deployment, CiviX includes a state-wise import pipeline for gradually replacing synthetic records with verified official sources.

## 2. Introduction
Government welfare programs are often difficult to navigate due to fragmented information, varying eligibility criteria, and lack of personalized guidance. Citizens frequently miss benefits because they cannot identify suitable schemes in time. CiviX addresses this by creating a single intelligent platform that combines profile-based filtering, AI assistance, and structured data presentation.

## 3. Problem Statement
- Welfare information is distributed across multiple websites
- Citizens cannot easily map their profile to eligibility rules
- Existing systems provide limited personalization
- Scheme details are often presented in non-standard formats

## 4. Objectives
- Build a unified platform for scheme discovery and guidance
- Provide personalized recommendations based on profile inputs
- Offer eligibility checks with ranked scheme suggestions
- Integrate AI assistant for conversational support
- Enable admin-side data operations and state-wise official imports

## 5. Scope
### In Scope
- Authentication and user profile onboarding
- Eligibility calculation and suggestion ranking
- Scheme explorer with filtering and bookmarking
- AI assistant with strict recommendation output format
- Admin CRUD and analytics
- Official-source import pipeline for phased data replacement

### Out of Scope (Current Phase)
- Fully automated direct API sync from all government portals
- Full multilingual speech-to-text for all Indian languages in production
- Native mobile app release

## 6. Proposed Methodology
1. Collect user profile data via onboarding
2. Persist profile and compute eligibility score across scheme dataset
3. Retrieve top matching schemes with semantic and rule-based relevance
4. Generate assistant response with strict sections: summary, eligibility, documents, guidance, official link
5. Allow user exploration, bookmarking, and dashboard review
6. Maintain data quality through admin controls and official import pipeline

## 7. System Architecture
- Frontend: React + TypeScript + Vite
- Backend: FastAPI microservice style routes
- Database: MongoDB collections for users, schemes, bookmarks, sessions, chat history
- AI Layer: embeddings + RAG + Gemini response generation
- Security: JWT access/refresh tokens, revocation, role checks

## 8. Module Description
### 8.1 Authentication Module
- Register/login/logout
- Refresh tokens and session revocation
- Role-based admin routes

### 8.2 Onboarding Module
- Multi-step profile capture after authentication
- Mandatory profile completion before app access
- Input dimensions for students/employees/women/men and broader categories

### 8.3 Eligibility Module
- Rule-based scoring with profile-to-scheme matching
- Ranked top scheme output

### 8.4 Scheme Explorer Module
- Search, filter, pagination
- Card-level details including required documents and official guidance

### 8.5 Assistant Module
- RAG retrieval over stored schemes
- Gemini response generation
- Strict response format for readability and compliance

### 8.6 Admin Module
- Add/update/delete scheme records
- Dataset monitoring via stats
- Supports richer official fields

### 8.7 Data Pipeline Module
- Synthetic dataset generation for initial bootstrap
- State-wise verified import script for gradual official replacement

## 9. Database Design (High Level)
- users
- schemes
- bookmarks
- chat_history
- revoked_tokens
- user_sessions

## 10. Tech Stack
- Frontend: React, TypeScript, Tailwind CSS, Framer Motion
- Backend: FastAPI, Pydantic, Motor
- DB: MongoDB
- AI: Gemini API, sentence embeddings, RAG
- Utilities: pandas scripts, smoke test tooling

## 11. Implementation Status
Implemented:
- Full auth + protected routing
- Multi-step onboarding flow
- Dashboard suggestions and bookmarks
- AI assistant with strict output template
- Admin panel with CRUD and table controls
- Official state-wise import script and template

## 12. Results
- Personalized scheme recommendations generated post-onboarding
- Structured and transparent assistant output
- Working phased migration path from synthetic to verified state records
- Deployable architecture for further expansion

## 13. Testing and Validation
- Frontend production build validation
- API smoke tests for major endpoints
- Manual flow validation for onboarding to dashboard journey
- Data pipeline verification for generation and import commands

## 14. Limitations
- Official data verification remains dependent on source curation process
- Real-time policy changes require periodic source refresh
- Voice quality and multilingual depth depend on deployed ASR model setup

## 15. Future Enhancements
- Automated connectors for official state portals/APIs
- Real-time policy update crawler with human verification queue
- Explainable AI eligibility reasoning interface
- Multilingual expansion and accessibility improvements
- Mobile application and notification workflows

## 16. Conclusion
CiviX demonstrates a practical and scalable approach to welfare scheme discovery by combining user-centric onboarding, eligibility intelligence, and AI-assisted guidance. The project provides immediate utility with extensible architecture and a clear path to verified official-source integration, making it suitable as a robust final year project implementation.

## 16.1 Hero USP Feature (Single Flow)
The project now includes a high-impact hero flow inside Eligibility Checker:
- What-if Simulator: compare baseline profile vs simulated scenario (for example, lower income bracket)
- Success Predictor: per-scheme application success probability estimate
- Action Plan: step-by-step tasks for document readiness and submission

This creates a strong demo narrative because evaluators can see profile intelligence, prediction, and practical next actions in one run.

## 16.2 Demo Script for Review Panel (3-5 minutes)
1. Open Eligibility Checker and click Run Demo Story (1-click)
2. Show baseline eligible schemes and match scores
3. Show hero simulation summary and per-scheme score delta
4. Highlight Success Predictor percentage and missing document prompts
5. Walk through generated Action Plan and explain real-world user benefit

## 17. Commands for Another System (Run)
```sh
git clone <repo-url>
cd scheme-navigator
npm install
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python scripts/generate_dataset.py
python scripts/load_schemes.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
npm run dev -- --host 127.0.0.1 --port 8080
```

Optional official import (state-wise, gradual):
```sh
python scripts/import_official_state_sources.py --state Maharashtra --replace-generated
```
