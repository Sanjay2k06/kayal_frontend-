# CiviX PPT Content (Final Year Project)

## Slide 1: Title
- Project: CiviX – AI-Powered Government Scheme Navigator
- Team members, guide name, department, college
- Academic year

## Slide 2: Problem Statement
- Citizens struggle to discover relevant welfare schemes
- Information is fragmented across portals
- Eligibility criteria are hard to interpret
- Manual search causes missed benefits

## Slide 3: Objective
- Build a smart platform to match users with schemes
- Provide profile-based eligibility checking
- Deliver AI-guided recommendations with official links
- Support gradual replacement with verified official records

## Slide 4: Target Users
- Students
- Employees
- Women
- Men
- Farmers
- Senior citizens
- Low-income and special-category applicants
- Administrators

## Slide 5: Proposed Solution
- Home → Auth → Onboarding → Eligibility suggestions → Dashboard/Assistant
- AI assistant for conversational guidance
- Structured scheme cards with documents and official guidance
- Admin panel for scheme management

## Slide 6: System Architecture
- Frontend: React + TypeScript + Vite
- Backend: FastAPI
- Database: MongoDB
- AI layer: RAG + Gemini
- Data pipelines: synthetic generation + official import

## Slide 7: Core Modules
- Authentication and authorization
- Onboarding wizard
- Eligibility engine
- Scheme explorer and bookmarks
- Assistant chat + voice query support
- Admin CRUD + stats
- Official state-wise import pipeline

## Slide 8: Workflow Demo
- User signs up with name/email
- Completes profile onboarding
- System computes eligibility and suggestions
- User explores, bookmarks, chats, and opens official links

## Slide 9: Features Implemented
- Multi-step onboarding
- Protected routes and role-based admin
- Strict assistant output format
- Detailed scheme metadata (documents/guidance/helpline)
- Pagination, filters, and search
- State-wise official import script

## Slide 10: Dataset Strategy
- Large synthetic dataset for baseline system training/testing
- Official import template for verified records
- Gradual state-by-state replacement model
- Source fields include URL and verification date

## Slide 11: Results / Outcomes
- End-to-end functioning platform
- Personalized recommendations based on user profile
- Reduced effort to find relevant schemes
- Scalable architecture for official-source growth

## Slide 12: Limitations
- Official-source rows must be curated and verified externally
- Voice transcription quality depends on deployed speech model
- Recommendation quality tied to data freshness

## Slide 13: Future Scope
- Direct ingestion from state APIs and verified portals
- Multi-language interface and responses
- Notification system for deadlines and status updates
- Explainable scoring and eligibility breakdowns
- Mobile app and offline mode

## Slide 14: Tech Stack
- React, TypeScript, Vite, Tailwind
- FastAPI, Pydantic, Motor
- MongoDB
- Gemini API, RAG
- JWT, bcrypt, rate limiting

## Slide 15: Conclusion
- CiviX simplifies welfare access with AI + structured data
- Supports both current usability and long-term official data integration
- Practical and scalable final year project outcome

## Slide 16: Thank You
- Questions and answers
