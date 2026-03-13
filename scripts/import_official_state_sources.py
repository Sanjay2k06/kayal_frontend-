from __future__ import annotations

import argparse
from pathlib import Path
import sys

import pandas as pd
from pymongo import MongoClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.ai.embedding_model import embed_text
from app.config import get_settings


def _required_columns() -> list[str]:
    return [
        "state",
        "scheme_name",
        "description",
        "eligibility",
        "benefits",
        "category",
        "official_link",
        "official_department",
        "application_mode",
        "guidance",
        "helpline",
        "required_documents",
        "source_url",
        "source_verified_on",
    ]


def _build_doc(row: pd.Series) -> dict:
    text_for_embedding = f"{row['description']}\n{row['eligibility']}\n{row['benefits']}"
    embedding = embed_text(text_for_embedding)
    required_documents = [
        item.strip()
        for item in str(row.get("required_documents", "")).split(";")
        if item.strip()
    ]

    return {
        "scheme_name": str(row["scheme_name"]).strip(),
        "description": str(row["description"]).strip(),
        "eligibility": str(row["eligibility"]).strip(),
        "benefits": str(row["benefits"]).strip(),
        "category": str(row["category"]).strip(),
        "state": str(row["state"]).strip(),
        "official_link": str(row["official_link"]).strip(),
        "official_department": str(row["official_department"]).strip(),
        "application_mode": str(row["application_mode"]).strip(),
        "guidance": str(row["guidance"]).strip(),
        "helpline": str(row["helpline"]).strip(),
        "required_documents": required_documents,
        "source_url": str(row.get("source_url", "")).strip(),
        "source_verified_on": str(row.get("source_verified_on", "")).strip(),
        "record_source": "official_verified",
        "embedding": embedding,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Import verified official state scheme records.")
    parser.add_argument(
        "--csv",
        type=str,
        default=str(ROOT_DIR / "data" / "official_sources" / "state_sources.csv"),
        help="Path to official sources CSV",
    )
    parser.add_argument("--state", type=str, default="", help="Optional single state to import")
    parser.add_argument(
        "--replace-generated",
        action="store_true",
        help="If set, remove generated records for targeted states before importing official records.",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"Official source file not found: {csv_path}")

    df = pd.read_csv(csv_path)
    missing = [col for col in _required_columns() if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in official source file: {', '.join(missing)}")

    if args.state:
        df = df[df["state"].astype(str).str.lower() == args.state.lower()]

    if df.empty:
        print("No rows found for the requested filter.")
        return

    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]
    schemes = db.schemes

    target_states = sorted(set(df["state"].astype(str).str.strip().tolist()))
    if args.replace_generated:
        delete_result = schemes.delete_many({"state": {"$in": target_states}, "record_source": "synthetic_generated"})
        print(f"Removed {delete_result.deleted_count} generated rows for states: {', '.join(target_states)}")

    inserted = 0
    updated = 0
    for _, row in df.iterrows():
        doc = _build_doc(row)
        result = schemes.update_one(
            {
                "scheme_name": doc["scheme_name"],
                "state": doc["state"],
                "official_link": doc["official_link"],
            },
            {"$set": doc},
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
        elif result.modified_count > 0:
            updated += 1

    print(
        "Official import completed. "
        f"States: {', '.join(target_states)} | Inserted: {inserted} | Updated: {updated}"
    )


if __name__ == "__main__":
    main()