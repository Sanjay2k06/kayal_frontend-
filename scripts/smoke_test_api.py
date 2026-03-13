import json
import time
import uuid
from typing import Any

import httpx

BASE_URL = "http://127.0.0.1:8000"


def assert_status(response: httpx.Response, allowed: set[int], name: str) -> None:
    if response.status_code not in allowed:
        raise RuntimeError(
            f"{name} failed. status={response.status_code}, body={response.text[:400]}"
        )


def pick_first_scheme(items: list[dict[str, Any]]) -> str:
    if not items:
        raise RuntimeError("No schemes returned from /schemes endpoint")
    return items[0]["id"]


def main() -> None:
    run_id = str(uuid.uuid4())[:8]
    email = f"smoke_{run_id}@example.com"
    password = "SmokeTest@123"

    with httpx.Client(timeout=30) as client:
        print("[1/9] GET /")
        res = client.get(f"{BASE_URL}/")
        assert_status(res, {200}, "root")

        print("[2/9] POST /auth/register")
        res = client.post(
            f"{BASE_URL}/auth/register",
            json={"name": "Smoke Tester", "email": email, "password": password},
        )
        assert_status(res, {200}, "register")

        print("[3/9] POST /auth/login")
        res = client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        assert_status(res, {200}, "login")
        token = res.json()["access_token"]
        refresh_token = res.json()["refresh_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("[3.1/11] POST /auth/refresh")
        res = client.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh_token})
        assert_status(res, {200}, "refresh")
        token = res.json()["access_token"]
        refresh_token = res.json()["refresh_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("[4/11] GET /me")
        res = client.get(f"{BASE_URL}/me", headers=headers)
        assert_status(res, {200}, "me")

        print("[5/11] GET /schemes")
        res = client.get(f"{BASE_URL}/schemes?page=1&limit=5")
        assert_status(res, {200}, "list_schemes")
        schemes = res.json().get("items", [])
        scheme_id = pick_first_scheme(schemes)

        print("[6/11] GET /schemes/{id}")
        res = client.get(f"{BASE_URL}/schemes/{scheme_id}")
        assert_status(res, {200}, "get_scheme")

        print("[7/11] POST /bookmarks")
        res = client.post(f"{BASE_URL}/bookmarks", headers=headers, json={"scheme_id": scheme_id})
        assert_status(res, {200}, "add_bookmark")

        print("[8/11] GET /bookmarks")
        res = client.get(f"{BASE_URL}/bookmarks", headers=headers)
        assert_status(res, {200}, "list_bookmarks")

        print("[9/11] POST /eligibility")
        res = client.post(
            f"{BASE_URL}/eligibility",
            json={
                "age": 32,
                "gender": "Male",
                "occupation": "Farmer",
                "income": 250000,
                "state": "Tamil Nadu",
            },
        )
        assert_status(res, {200}, "eligibility")

        print("[10/11] POST /chat")
        res = client.post(
            f"{BASE_URL}/chat",
            json={"query": "schemes for small farmers in Tamil Nadu"},
        )
        assert_status(res, {200}, "chat")

        print("[11/11] GET /admin/stats with non-admin token (expect 403)")
        res = client.get(f"{BASE_URL}/admin/stats", headers=headers)
        assert_status(res, {403}, "admin_protection")

        print("[11.5/11] POST /auth/logout")
        res = client.post(
            f"{BASE_URL}/auth/logout",
            headers=headers,
            json={"refresh_token": refresh_token},
        )
        assert_status(res, {200}, "logout")

        print("[11.6/11] GET /me after logout (expect 401)")
        res = client.get(f"{BASE_URL}/me", headers=headers)
        assert_status(res, {401}, "logout_invalidation")

        print("[extra] POST /voice-query without file (expect 422)")
        res = client.post(f"{BASE_URL}/voice-query")
        assert_status(res, {422}, "voice_validation")

    print("\nSmoke test passed: core endpoints are reachable and behaving as expected.")


if __name__ == "__main__":
    started = time.time()
    main()
    print(f"Duration: {time.time() - started:.2f}s")
