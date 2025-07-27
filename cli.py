import subprocess
import sys
import time
import signal
import os

FRONTEND_DIR = "frontend"
BACKEND_DIR = "backend"

BACKEND_RUN_CMD = ["uvicorn", "app.main:app", "--port", "8001"]
FRONTEND_RUN_CMD = ["npm", "run", "dev"]

BACKEND_INSTALL_CMD = ["pip", "install", "-r", "requirements.txt"]
FRONTEND_INSTALL_CMD = ["npm", "install"]

INSTALL_QWEN3_0_6B_CMD = ["ollama", "pull", "qwen3:0.6b"]
INSTALL_QWEN3_1_7B_CMD = ["ollama", "pull", "qwen3:1.7b"]

def install():
    print("Installing backend dependencies...")
    backend_install_proc = subprocess.Popen(
        BACKEND_INSTALL_CMD,
        cwd=BACKEND_DIR,
        shell=True,
    )
    backend_install_proc.wait()  # Wait for backend installation to complete
    
    print("Installing frontend dependencies...")
    frontend_install_proc = subprocess.Popen(
        FRONTEND_INSTALL_CMD,
        cwd=FRONTEND_DIR,
        shell=True,
    )
    frontend_install_proc.wait()  # Wait for frontend installation to complete

    print("Installing Ollama models...")
    ollama_install_proc_1 = subprocess.Popen(
        INSTALL_QWEN3_0_6B_CMD,
        shell=True,
    )
    ollama_install_proc_1.wait()  # Wait for first model to complete
    
    ollama_install_proc_2 = subprocess.Popen( 
        INSTALL_QWEN3_1_7B_CMD,
        shell=True,
    )
    ollama_install_proc_2.wait()  # Wait for second model to complete
    print("All installations completed successfully!")

def launch():
    backend_proc = None
    frontend_proc = None
    
    try:
        # Start backend in the background
        print("Starting backend server...")
        # Create process in new process group for easier termination
        if os.name == 'nt':  # Windows
            backend_proc = subprocess.Popen(
                BACKEND_RUN_CMD,
                cwd=BACKEND_DIR,
                shell=True,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:  # Unix/Linux/Mac
            backend_proc = subprocess.Popen(
                BACKEND_RUN_CMD,
                cwd=BACKEND_DIR,
                shell=True,
                preexec_fn=os.setsid
            )
        
        # Give backend time to start and check if it's still running
        time.sleep(10)
        if backend_proc.poll() is not None:
            print("❌ Backend failed to start!")
            return
        print("✅ Backend server started successfully")

        # Start frontend
        print("Starting frontend development server...")
        # Create process in new process group for easier termination
        if os.name == 'nt':  # Windows
            frontend_proc = subprocess.Popen(
                FRONTEND_RUN_CMD,
                cwd=FRONTEND_DIR,
                shell=True,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:  # Unix/Linux/Mac
            frontend_proc = subprocess.Popen(
                FRONTEND_RUN_CMD,
                cwd=FRONTEND_DIR,
                shell=True,
                preexec_fn=os.setsid
            )
        
        # Give frontend time to start and check if it's still running
        time.sleep(10)
        if frontend_proc.poll() is not None:
            print("❌ Frontend failed to start!")
            return
        print("✅ Frontend development server started successfully")
        
        print("\n🚀 Both servers are running!")
        print("   Backend:  http://localhost:8001")
        print("   Frontend: http://localhost:3000")
        print("\nPress Ctrl+C to stop both servers...")

        # Monitor processes and wait for interruption
        while True:
            time.sleep(1)
            
            # Check if either process has died
            if backend_proc.poll() is not None:
                print("\n❌ Backend process died unexpectedly!")
                break
            if frontend_proc.poll() is not None:
                print("\n❌ Frontend process died unexpectedly!")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        # Clean shutdown with process tree termination
        for name, proc in [("Backend", backend_proc), ("Frontend", frontend_proc)]:
            if proc and proc.poll() is None:
                print(f"   Stopping {name.lower()}...")
                
                # On Windows, terminate the entire process tree
                if os.name == 'nt':  # Windows
                    subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], 
                                    capture_output=True, check=False)
                    print(f"   ✅ {name} process tree stopped")
                else:  # Unix/Linux/Mac
                    # Send SIGTERM to process group
                    os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                    proc.wait(timeout=3)
                    print(f"   ✅ {name} stopped")
                
        print("🏁 All servers stopped. Goodbye!")
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