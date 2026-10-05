"""Run browser checks against a real API in an isolated PostgreSQL schema."""
from pathlib import Path
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


def main() -> int:
    backend = Path(__file__).resolve().parents[1]
    root = backend.parent
    schema = f"finance_e2e_{uuid4().hex}"
    admin = get_engine()
    process = None
    with admin.begin() as connection:
        connection.execute(CreateSchema(schema))
    try:
        os.environ["FINANCE_DB_SCHEMA"] = schema
        get_settings.cache_clear()
        get_engine.cache_clear()
        command.upgrade(Config(str(backend / "alembic.ini")), "head")
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        environment = dict(os.environ, FINANCE_ACCESS_TOKEN_SECONDS="2", FINANCE_API_TARGET=f"http://127.0.0.1:{port}")
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
            cwd=backend, env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        opener = build_opener(ProxyHandler({}))
        for _ in range(200):
            if process.poll() is not None:
                raise RuntimeError("Test API exited before startup")
            try:
                with opener.open(f"http://127.0.0.1:{port}/api/health", timeout=1):
                    break
            except (URLError, TimeoutError):
                time.sleep(0.1)
        else:
            raise RuntimeError("Test API startup timed out")
        node = shutil.which("node")
        if node is None:
            raise RuntimeError("Node.js is required")
        return subprocess.call([node, str(root / "node_modules/@playwright/test/cli.js"), "test", *sys.argv[1:]], cwd=root, env=environment)
    finally:
        if process is not None and process.poll() is None:
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
        print("Temporary browser-test database schema removed", flush=True)


if __name__ == "__main__":
    raise SystemExit(main())
