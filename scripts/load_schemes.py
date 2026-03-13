from pathlib import Path
import sys

import pandas as pd
from pymongo import MongoClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.ai.embedding_model import embed_text
from app.config import get_settings


def main() -> None:
    settings = get_settings()
    csv_path = ROOT_DIR / "data" / "schemes.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    df = pd.read_csv(csv_path)

    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]
    schemes = db.schemes

    documents = []
    for _, row in df.iterrows():
        text_for_embedding = f"{row['description']}\n{row['eligibility']}"
        embedding = embed_text(text_for_embedding)

        documents.append(
            {
                "scheme_name": str(row["scheme_name"]),
                "description": str(row["description"]),
                "eligibility": str(row["eligibility"]),
                "benefits": str(row["benefits"]),
                "category": str(row["category"]),
                "state": str(row["state"]),
                "official_link": str(row["official_link"]),
                "official_department": str(row.get("official_department", "Government of India")),
                "application_mode": str(row.get("application_mode", "Online")),
                "guidance": str(row.get("guidance", "Refer to the official portal for updated instructions.")),
                "helpline": str(row.get("helpline", "1800-000-000")),
                "required_documents": [item.strip() for item in str(row.get("required_documents", "")).split(";") if item.strip()],
                "record_source": "synthetic_generated",
                "embedding": embedding,
            }
        )

    if documents:
        schemes.delete_many({})
        schemes.insert_many(documents)

    schemes.create_index("scheme_name")
    schemes.create_index("category")
    schemes.create_index("state")
    schemes.create_index([("scheme_name", "text"), ("description", "text"), ("eligibility", "text")])

    print(f"Inserted {len(documents)} schemes into MongoDB database '{settings.mongodb_db}'.")


if __name__ == "__main__":
    main()
