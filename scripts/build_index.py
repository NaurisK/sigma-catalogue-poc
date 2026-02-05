import json
import os
from pathlib import Path

import yaml

SIGMA_REPO_WEB = "https://github.com/SigmaHQ/sigma/blob/master/"

def safe_load_yaml(path: Path):
    try:
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception:
        return None

def main():
    import sys
    if len(sys.argv) != 3:
        print("Usage: build_index.py <sigma_rules_dir> <output_json>")
        raise SystemExit(2)

    rules_dir = Path(sys.argv[1])
    out_json = Path(sys.argv[2])
    out_json.parent.mkdir(parents=True, exist_ok=True)

    docs = []
    for p in rules_dir.rglob("*.yml"):
        doc = safe_load_yaml(p)
        if not isinstance(doc, dict):
            continue

        title = doc.get("title")
        if not title:
            continue

        logsource = doc.get("logsource") or {}
        # Get relative path from the rules directory
        rel_path = p.relative_to(rules_dir.parent).as_posix()

        docs.append({
            "title": title,
            "id": doc.get("id"),
            "status": doc.get("status"),
            "level": doc.get("level"),
            "tags": doc.get("tags") or [],
            "logsource_product": logsource.get("product"),
            "logsource_category": logsource.get("category"),
            "logsource_service": logsource.get("service"),
            "path": rel_path,
            "url": SIGMA_REPO_WEB + rel_path,
        })

    docs.sort(key=lambda x: (x.get("title") or "").lower())
    out_json.write_text(json.dumps(docs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(docs)} rules to {out_json}")

if __name__ == "__main__":
    main()
