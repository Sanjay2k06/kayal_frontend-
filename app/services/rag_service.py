from app.ai.embedding_model import embed_text
from app.ai.gemini_client import gemini_client
from app.services.scheme_service import SchemeService

PROMPT_TEMPLATE = """You are an AI assistant helping citizens discover government welfare schemes.

Context:
{retrieved_schemes}

User Question:
{query}

Output Rules:
- Respond in plain, simple English.
- Use exactly this format:

SUMMARY:
- 2-3 bullet points with the key guidance.

RECOMMENDED SCHEMES:
For each relevant scheme, include the following fields in order:
1) Scheme Name
2) Who Should Apply (eligibility in simple terms)
3) Benefits
4) Required Documents
5) Guidance (how to apply / important cautions)
6) Official Link

NOTES:
- If information is missing in context, say "Not available in current source".
- Do not invent policy details.
- Use only the provided context.
"""


class RagService:
    @staticmethod
    def _build_fallback_response(query: str, matches: list[dict]) -> str:
        if not matches:
            return (
                "SUMMARY:\n"
                "- No matching schemes were found for your query.\n"
                "- Try adding your state, occupation, age, or income details for better results.\n\n"
                "RECOMMENDED SCHEMES:\n"
                "Not available in current source.\n\n"
                "NOTES:\n"
                "- This response was generated from the local scheme database because the AI model is currently unavailable."
            )

        lines = [
            "SUMMARY:",
            "- Based on your query, these schemes from the current database are most relevant.",
            "- Check eligibility and required documents before applying.",
            "",
            "RECOMMENDED SCHEMES:",
        ]

        for item in matches:
            required_docs = item.get("required_documents", [])
            required_docs_text = ", ".join(required_docs) if required_docs else "Not available in current source"
            lines.extend(
                [
                    f"1) Scheme Name: {item.get('scheme_name', 'Not available in current source')}",
                    f"2) Who Should Apply: {item.get('eligibility', 'Not available in current source')}",
                    f"3) Benefits: {item.get('benefits', 'Not available in current source')}",
                    f"4) Required Documents: {required_docs_text}",
                    f"5) Guidance: {item.get('guidance') or 'Not available in current source'}",
                    f"6) Official Link: {item.get('official_link', 'Not available in current source')}",
                    "",
                ]
            )

        lines.extend(
            [
                "NOTES:",
                "- This response was generated from the local scheme database because the AI model is currently unavailable.",
            ]
        )
        return "\n".join(lines)

    @staticmethod
    async def answer_query(query: str) -> dict:
        query_embedding = embed_text(query)
        matches = await SchemeService.semantic_search(query_embedding=query_embedding, top_k=5)

        if matches:
            context = "\n\n".join(
                [
                    (
                        f"Scheme: {item['scheme_name']}\n"
                        f"State: {item['state']}\n"
                        f"Category: {item['category']}\n"
                        f"Department: {item.get('official_department', '')}\n"
                        f"Eligibility: {item['eligibility']}\n"
                        f"Benefits: {item['benefits']}\n"
                        f"Required Documents: {', '.join(item.get('required_documents', []))}\n"
                        f"Application Mode: {item.get('application_mode', '')}\n"
                        f"Guidance: {item.get('guidance', '')}\n"
                        f"Helpline: {item.get('helpline', '')}\n"
                        f"Official Link: {item['official_link']}"
                    )
                    for item in matches
                ]
            )
        else:
            context = "No matching schemes found in the database."

        prompt = PROMPT_TEMPLATE.format(retrieved_schemes=context, query=query)
        response = await gemini_client.generate(prompt)
        if not response:
            response = RagService._build_fallback_response(query=query, matches=matches)

        return {
            "response": response,
            "recommended_schemes": matches,
        }
