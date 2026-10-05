"""Generate a local JWT signing key without printing it or replacing an existing key."""
from pathlib import Path
import secrets


def main() -> None:
    path = Path(__file__).resolve().parents[1] / ".env"
    if not path.exists():
        raise SystemExit("Сначала скопируйте backend/.env.example в backend/.env.")
    content = path.read_text(encoding="utf-8-sig")
    lines = content.splitlines()
    matches = [index for index, line in enumerate(lines) if line.startswith("FINANCE_JWT_SECRET=")]
    if matches:
        value = lines[matches[0]].split("=", 1)[1].strip().strip("\"'")
        if value:
            if len(value.encode("utf-8")) < 32:
                raise SystemExit("Существующий FINANCE_JWT_SECRET короче 32 байт. Исправьте его локально.")
            print("Существующий ключ JWT сохранён.")
            return
        lines[matches[0]] = "FINANCE_JWT_SECRET=" + secrets.token_urlsafe(48)
    else:
        lines.append("FINANCE_JWT_SECRET=" + secrets.token_urlsafe(48))
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Ключ JWT создан в локальном .env. Секрет не выводится.")


if __name__ == "__main__":
    main()
