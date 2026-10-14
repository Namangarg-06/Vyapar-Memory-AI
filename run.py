"""Single-click unified launcher for Vyapar Memory AI.

Runs the FastAPI backend and serves the clean React UI on http://localhost:8000
and automatically opens your browser.
"""

import os
import sys
import threading
import time
import webbrowser
import uvicorn


def open_browser():
    time.sleep(1.2)
    print("\n[Browser] Opening http://localhost:8000 in your browser...\n")
    webbrowser.open("http://127.0.0.1:8000")


if __name__ == "__main__":
    print("=" * 60)
    print("   VYAPAR MEMORY AI — BUSINESS OPERATIONS OS")
    print("=" * 60)
    print(" -> Server starting on: http://127.0.0.1:8000")
    print(" -> Swagger API Docs:   http://127.0.0.1:8000/docs")
    print("=" * 60)

    threading.Thread(target=open_browser, daemon=True).start()
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
