import subprocess
import os
import signal 
import sys
import time

FRONTEND_DIR = "frontend"
BACKEND_DIR = "backend"
BACKEND_CMD = ["uvicorn", "app.main:app", "--reload", "--port", "8001"]
FRONTEND_CMD = ["npm", "run", "dev"]

def launch():
    # Start backend in the background
    print("Starting backend...")
    backend_proc = subprocess.Popen(
        BACKEND_CMD,
        cwd=BACKEND_DIR,
        shell=True,
    )

    time.sleep(5)

    print("Starting frontend...")
    frontend_proc = subprocess.Popen(
        FRONTEND_CMD,
        cwd=FRONTEND_DIR,
        shell=True,
    )

    print("Backend and frontend running. Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")
        for proc in [backend_proc, frontend_proc]:
            if proc.poll() is None:
                proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "start":
        launch()
    else:
        print("Usage: python cli.py start")