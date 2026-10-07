"""Run browser checks against real frontend/API in an isolated PostgreSQL schema."""
from pathlib import Path
import json
import os
import shutil
import socket
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener
from uuid import uuid4

from alembic import command
from alembic.config import Config
from sqlalchemy.schema import CreateSchema, DropSchema

from app.core.config import get_settings
from app.db.session import get_engine


def free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def wait_http(process: subprocess.Popen, url: str) -> None:
    opener = build_opener(ProxyHandler({}))
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"Test server exited before startup: {url}")
        try:
            with opener.open(url, timeout=1):
                return
        except (URLError, TimeoutError):
            time.sleep(0.1)
    raise RuntimeError(f"Test server startup timed out: {url}")


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    root = backend.parent
    node = shutil.which("node")
    if node is None:
        raise RuntimeError("Node.js is required")
    schema = f"finance_e2e_{uuid4().hex}"
    admin = get_engine()
    processes: list[subprocess.Popen] = []
    with admin.begin() as connection:
        connection.execute(CreateSchema(schema))
    try:
        os.environ["FINANCE_DB_SCHEMA"] = schema
        get_settings.cache_clear()
        get_engine.cache_clear()
        command.upgrade(Config(str(backend / "alembic.ini")), "head")
        api_port = free_port()
        frontend_port = free_port()
        base_url = f"http://127.0.0.1:{frontend_port}"
        environment = dict(
            os.environ,
            FINANCE_ACCESS_TOKEN_SECONDS="2",
            FINANCE_COOKIE_SECURE="false",
            FINANCE_API_TARGET=f"http://127.0.0.1:{api_port}",
            FINANCE_E2E_BASE_URL=base_url,
            FINANCE_ALLOWED_ORIGINS=json.dumps([base_url]),
        )
        # Manage direct child processes ourselves: no Windows shell/process-tree teardown.
        for args, directory, health_url in (
            ([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(api_port)], backend, f"http://127.0.0.1:{api_port}/api/health/db"),
            ([node, str(root / "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", str(frontend_port), "--strictPort"], root, base_url),
        ):
            process = subprocess.Popen(
                args, cwd=directory, env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            processes.append(process)
            wait_http(process, health_url)
        return subprocess.call([node, str(root / "node_modules/@playwright/test/cli.js"), "test", *sys.argv[1:]], cwd=root, env=environment)
    finally:
        for process in reversed(processes):
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
        get_engine().dispose()
        # Only the schema created by this invocation is removed.
        with admin.begin() as connection:
            connection.execute(DropSchema(schema, cascade=True))
        admin.dispose()
        print("Test servers stopped; temporary browser-test database schema removed", flush=True)


if __name__ == "__main__":
    raise SystemExit(main())
