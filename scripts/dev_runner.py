import os
import signal
import subprocess
import sys
import time
from pathlib import Path


def _npm_cmd() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


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


def main() -> int:
    root = Path(__file__).resolve().parents[1]

    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    frontend_cmd = [_npm_cmd(), "run", "dev"]

    print("Starting backend on http://localhost:8000 ...")
    backend = subprocess.Popen(backend_cmd, cwd=root)
    time.sleep(1)

    if backend.poll() is not None:
        print("Backend failed to start.")
        return 1

    print("Starting frontend on http://localhost:8080 ...")
    frontend = subprocess.Popen(frontend_cmd, cwd=root)

    processes = [backend, frontend]

    try:
        while True:
            if any(proc.poll() is not None for proc in processes):
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        _terminate(frontend)
        _terminate(backend)

    backend_code = backend.poll()
    frontend_code = frontend.poll()

    if backend_code in (0, None) and frontend_code in (0, None):
        return 0

    return 1


if __name__ == "__main__":
    if os.name != "nt":
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    raise SystemExit(main())
