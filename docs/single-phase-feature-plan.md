# CiviX Single-Phase Feature Expansion Plan

This plan defines 15 frontend + 15 backend features to implement in one coordinated phase.

## Frontend (15 Features)

1. Authentication screens (register/login/logout)
2. Protected route guard for dashboard/admin views
3. User profile page (fetch + update)
4. Saved schemes (bookmark/unbookmark)
5. Scheme comparison view (up to 3 schemes)
6. Advanced filters (state, category, income, occupation)
7. Search suggestions with debounce/autocomplete
8. Pagination + infinite scroll in scheme explorer
9. Chat conversation history persistence per user
10. Chat citation cards for retrieved schemes
11. Voice query upload progress + retry state
12. Eligibility result explainer (why matched)
13. Admin panel pages for CRUD + stats charts
14. Error boundaries + offline fallback UI
15. Role-aware navigation (citizen/admin)

## Backend (15 Features)

1. Refresh token flow + token revocation list
2. User profile endpoints (GET/PUT /me)
3. Bookmark endpoints (CRUD /bookmarks)
4. Conversation history endpoints (chat sessions/messages)
5. Scheme compare endpoint (POST /schemes/compare)
6. Recommendation endpoint based on profile + history
7. Advanced eligibility rule engine (config-driven)
8. Background ingestion jobs with status tracking
9. Structured logging + request IDs
10. API key rotation support for LLM providers
11. Circuit breaker/fallback for Gemini outages
12. Response caching for hot scheme queries
13. Admin audit logs for all write operations
14. Metrics endpoint for monitoring (/metrics)
15. Webhook/event pipeline for data refresh notifications

## Single-Phase Delivery Order

1. Core security/auth + profile APIs
2. Schemes/bookmarks/history APIs
3. Frontend auth + protected routes + profile
4. Explorer/search enhancements + compare
5. Eligibility explainability + chat history UX
6. Admin panel + audit + stats wiring
7. Reliability layer (caching, retries, logging, metrics)

## Definition of Done

- All core endpoints pass smoke tests.
- Frontend uses live APIs only (no local mock dataset).
- Dataset ingestion pipeline is executable and repeatable.
- Admin APIs are protected and auditable.
- Feature-level acceptance tests pass for auth, chat, schemes, eligibility, voice.
