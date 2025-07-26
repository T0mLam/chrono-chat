import subprocess
import sys
import time

FRONTEND_DIR = "frontend"
BACKEND_DIR = "backend"

BACKEND_RUN_CMD = ["uvicorn", "app.main:app", "--reload", "--port", "8001"]
FRONTEND_RUN_CMD = ["npm", "run", "dev"]

BACKEND_INSTALL_CMD = ["pip", "install", "-r", "requirements.txt"]
FRONTEND_INSTALL_CMD = ["npm", "install"]

def install():
    backend_install_proc = subprocess.Popen(
        BACKEND_INSTALL_CMD,
        cwd=BACKEND_DIR,
        shell=True,
    )
    frontend_install_proc = subprocess.Popen(
        FRONTEND_INSTALL_CMD,
        cwd=FRONTEND_DIR,
        shell=True,
    )

    print("Backend and frontend dependencies installed.")


def launch():
    # Start backend in the background
    print("Starting backend...")
    backend_proc = subprocess.Popen(
        BACKEND_RUN_CMD,
        cwd=BACKEND_DIR,
        shell=True,
    )

    time.sleep(5)

    print("Starting frontend...")
    frontend_proc = subprocess.Popen(
        FRONTEND_RUN_CMD,
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
    if len(sys.argv) > 1:
        match sys.argv[1]:
            case "start":
                launch()
            case "install":
                install()
            case _:
                print("Usage: python cli.py (start | install)")
    else:
        print("Usage: python cli.py (start | install)")