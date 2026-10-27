"""`python -m srportal_server` / `srportal-server`: run the API with uvicorn."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

import uvicorn

from .app import create_app
from .config import load_config


def main() -> None:
    """Start the server using `config.yaml` (or the path given as the first argument)."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    config_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    config = load_config(config_path)
    uvicorn.run(create_app(config), host=config.server.host, port=config.server.port)


if __name__ == "__main__":
    main()
