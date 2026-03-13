Verified state-wise import format:

- Maintain official records in `state_sources.csv`.
- Use one row per scheme and fill all required columns.
- Run gradual replacement by state:
  - `python scripts/import_official_state_sources.py --state Maharashtra --replace-generated`
  - Repeat state by state as verified records are ready.

Required CSV columns:
- state
- scheme_name
- description
- eligibility
- benefits
- category
- official_link
- official_department
- application_mode
- guidance
- helpline
- required_documents (semicolon-separated)
- source_url
- source_verified_on