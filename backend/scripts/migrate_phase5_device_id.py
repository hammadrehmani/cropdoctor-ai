"""
CropDoctor Ai — Phase 5 Database Migration Script
================================================
Idempotent migration script to add anonymous `device_id` column and index
to the SQLite `diagnoses` table if it does not already exist.

Guarantees:
- Safe & Idempotent (can be run multiple times safely)
- Preserves 100% of legacy records with device_id = NULL
- Does NOT drop tables or lose data
- Creates index `ix_diagnoses_device_id` for performant device-isolated queries

Usage:
    python scripts/migrate_phase5_device_id.py [optional_path_to_db]
"""
from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path


def get_db_path() -> Path:
    """Determine the SQLite database path."""
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).resolve()

    # Check env var or default to cropdoctor.db in current or backend directory
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./cropdoctor.db")
    if db_url.startswith("sqlite"):
        raw_path = db_url.split("///")[-1]
        return Path(raw_path).resolve()

    return Path("cropdoctor.db").resolve()


def migrate_database(db_path: Path) -> bool:
    """Perform safe, idempotent Phase 5 migration."""
    print(f"[*] Inspecting SQLite database at: {db_path}")
    if not db_path.exists():
        print(f"[!] Database file does not exist at {db_path}.")
        print("[*] Initializing empty schema is handled by FastAPI startup lifespan.")
        return False

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # 1. Check if diagnoses table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='diagnoses';"
        )
        table_exists = cursor.fetchone()
        if not table_exists:
            print("[*] Table 'diagnoses' does not exist yet. No migration needed.")
            conn.close()
            return True

        # 2. Inspect table columns
        cursor.execute("PRAGMA table_info(diagnoses);")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        print(f"[*] Existing columns in 'diagnoses': {column_names}")

        # 3. Check row count before migration
        cursor.execute("SELECT COUNT(*) FROM diagnoses;")
        count_before = cursor.fetchone()[0]
        print(f"[*] Record count before migration: {count_before}")

        # 4. Add device_id column if missing
        if "device_id" not in column_names:
            print("[+] Adding 'device_id' column (VARCHAR(64), nullable)...")
            cursor.execute("ALTER TABLE diagnoses ADD COLUMN device_id VARCHAR(64);")
            conn.commit()
            print("[+] Column 'device_id' added successfully.")
        else:
            print("[*] Column 'device_id' already exists.")

        # 5. Create index if not exists
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS ix_diagnoses_device_id ON diagnoses (device_id);"
        )
        conn.commit()
        print("[+] Index 'ix_diagnoses_device_id' verified/created.")

        # 6. Verify row count and integrity after migration
        cursor.execute("SELECT COUNT(*) FROM diagnoses;")
        count_after = cursor.fetchone()[0]
        print(f"[*] Record count after migration: {count_after}")

        if count_before != count_after:
            raise RuntimeError(
                f"Data loss detected! Count before={count_before}, count after={count_after}"
            )

        # 7. Check indexes
        cursor.execute("PRAGMA index_list(diagnoses);")
        indexes = cursor.fetchall()
        print(f"[*] Active indexes on 'diagnoses': {indexes}")

        print("[OK] Phase 5 SQLite migration completed successfully and verified.")
        return True

    except Exception as exc:
        print(f"[!] Migration failed with error: {exc}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    db_file = get_db_path()
    success = migrate_database(db_file)
    sys.exit(0 if success else 1)
