import json
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen


def _terminate(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    try:
        process.terminate()
        process.wait(timeout=8)
    except Exception:
        try:
            process.kill()
        except Exception:
            pass


def _resolve_ngrok() -> str | None:
    return shutil.which("ngrok") or ("C:\\ngrok\\ngrok.exe" if Path("C:\\ngrok\\ngrok.exe").exists() else None)


def _read_ngrok_url() -> str | None:
    try:
        with urlopen("http://127.0.0.1:4040/api/tunnels", timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
        tunnels = payload.get("tunnels", [])
        for tunnel in tunnels:
            if tunnel.get("proto") == "https":
                return tunnel.get("public_url")
    except Exception:
        return None
    return None


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]

    print("Starting backend on http://127.0.0.1:8000 ...")
    backend = subprocess.Popen(backend_cmd, cwd=root)
    time.sleep(2)
    if backend.poll() is not None:
        print("Backend failed to start.")
        return 1

    ngrok_path = _resolve_ngrok()
    if not ngrok_path:
        print("ngrok not found. Install ngrok or add it to PATH.")
        _terminate(backend)
        return 1

    print("Starting ngrok for port 8000 ...")
    ngrok = subprocess.Popen([ngrok_path, "http", "8000"], cwd=root)
    time.sleep(3)

    public_url = _read_ngrok_url()
    if public_url:
        print("\nTwilio 'When a message comes in' URL:")
        print(f"{public_url}/whatsapp/webhook\n")
        print("Health check URL:")
        print(f"{public_url}/whatsapp/health\n")
    else:
        print("ngrok started, but public URL could not be detected yet.")

    processes = [backend, ngrok]
    try:
        while True:
            if any(proc.poll() is not None for proc in processes):
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping WhatsApp services...")
    finally:
        _terminate(ngrok)
        _terminate(backend)

    return 0


if __name__ == "__main__":
    if os.name != "nt":
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    raise SystemExit(main())
