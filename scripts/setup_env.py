#!/usr/bin/env python3
"""DocMind AI - Environment Setup Script

Cross-platform, standard library only.
Initializes backend/.env and frontend/.env, auto-generates JWT_SECRET,
and checks for required environment variables.
"""

import os
import sys
import secrets
from pathlib import Path


def parse_env_file(filepath: Path) -> dict[str, str]:
    """Parse an env file into a key-value dict, preserving order."""
    env_vars = {}
    if not filepath.exists():
        return env_vars

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars


def write_env_file(filepath: Path, env_vars: dict[str, str]) -> None:
    """Write dict to an env file (no quotes around values)."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    
    key_comments = {
        "DATABASE_URL": "# Format: postgresql+psycopg://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/rag_db?sslmode=require",
        "GROQ_API_KEY": "# Groq API Key (from https://console.groq.com/keys)",
        "HF_API_TOKEN": "# HuggingFace API Token (from https://huggingface.co/settings/tokens)",
        "JWT_SECRET": "# Secret key for JWT signing",
        "FRONTEND_URL": "# Frontend CORS origin",
    }

    for key, val in env_vars.items():
        if key in key_comments:
            lines.append(key_comments[key])
        lines.append(f"{key}={val}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    root_dir = Path(__file__).resolve().parent.parent
    backend_env = root_dir / "backend" / ".env"
    frontend_env = root_dir / "frontend" / ".env"
    env_example = root_dir / ".env.example"

    print("=== DocMind AI Environment Setup ===\n")

    default_backend_keys = {
        "DATABASE_URL": "",
        "GROQ_API_KEY": "",
        "HF_API_TOKEN": "",
        "JWT_SECRET": "",
        "SECRET_KEY": "",
        "FRONTEND_URL": "http://localhost:5173",
        "CHUNK_SIZE": "800",
        "CHUNK_OVERLAP": "150",
        "RETRIEVAL_TOP_K": "5",
        "SIMILARITY_THRESHOLD": "0.3",
        "HF_EMBEDDING_MODEL": "sentence-transformers/all-MiniLM-L6-v2",
        "HF_EMBEDDING_DIM": "384",
    }

    backend_vars = {}
    if not backend_env.exists():
        print("Creating backend/.env...")
        if env_example.exists():
            example_vars = parse_env_file(env_example)
            for k, v in example_vars.items():
                if k not in ["VITE_API_URL"]:
                    backend_vars[k] = v
        
        for k, default_val in default_backend_keys.items():
            if k not in backend_vars:
                backend_vars[k] = default_val
    else:
        print("backend/.env already exists. Checking for missing keys...")
        backend_vars = parse_env_file(backend_env)
        for k, default_val in default_backend_keys.items():
            if k not in backend_vars:
                print(f"  + Appending missing key: {k}")
                backend_vars[k] = default_val

    # Auto-generate JWT_SECRET if empty
    jwt_secret_value = backend_vars.get("JWT_SECRET", "").strip()
    if not jwt_secret_value or jwt_secret_value == "your-secret-key-change-this":
        new_secret = secrets.token_hex(32)
        backend_vars["JWT_SECRET"] = new_secret
        backend_vars["SECRET_KEY"] = new_secret
        print("Generated new JWT_SECRET.")
    elif not backend_vars.get("SECRET_KEY", "").strip():
        backend_vars["SECRET_KEY"] = jwt_secret_value

    write_env_file(backend_env, backend_vars)

    # 2. Setup frontend/.env
    if not frontend_env.exists():
        print("Creating frontend/.env...")
        write_env_file(frontend_env, {"VITE_API_URL": "http://localhost:8000"})
    else:
        frontend_vars = parse_env_file(frontend_env)
        if "VITE_API_URL" not in frontend_vars:
            print("Appending missing VITE_API_URL to frontend/.env...")
            frontend_vars["VITE_API_URL"] = "http://localhost:8000"
            write_env_file(frontend_env, frontend_vars)

    # 3. Check required variables status
    required_keys = ["DATABASE_URL", "GROQ_API_KEY", "HF_API_TOKEN", "JWT_SECRET"]
    missing_or_empty = []

    print("\n--- Environment Configuration Status ---")
    for key in required_keys:
        val = backend_vars.get(key, "").strip()
        is_placeholder = val.startswith("gsk_your") or val.startswith("hf_your") or "user:password@host" in val
        if not val or is_placeholder:
            missing_or_empty.append(key)
            print(f"  [EMPTY] {key}: MISSING / UNCONFIGURED")
        else:
            print(f"  [OK]    {key}: CONFIGURED")

    print("\n--- Non-Secret Defaults ---")
    for key in ["FRONTEND_URL", "CHUNK_SIZE", "CHUNK_OVERLAP", "RETRIEVAL_TOP_K", "SIMILARITY_THRESHOLD"]:
        val = backend_vars.get(key, "")
        print(f"  [OK]    {key}: {val}")

    if missing_or_empty:
        print(f"\n[!] WARNING: {len(missing_or_empty)} required variable(s) are still empty or set to placeholders:")
        for key in missing_or_empty:
            print(f"    - {key}")
        print("\nPlease update backend/.env with your actual service credentials.")
        sys.exit(1)
    else:
        print("\nAll required environment variables are set up properly!")
        sys.exit(0)


if __name__ == "__main__":
    main()
