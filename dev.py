#!/usr/bin/env python3
"""
Payoova Development Server Script
This script starts both frontend and backend services for development.
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path

def print_banner():
    print("""
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                           PAYOOVA 2.0 - DEV SERVER                          ║
    ╠══════════════════════════════════════════════════════════════════════════════╣
    ║  🟢 Starting development environment...                                     ║
    ║                                                                              ║
    ║  Frontend: http://localhost:5173                                            ║
    ║  Backend:  http://localhost:5000                                            ║
    ║  API:      http://localhost:5000/api                                        ║
    ║  Health:   http://localhost:5000/health                                     ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    """)

def start_backend():
    """Start the backend Flask server"""
    print("🚀 Starting backend server...")
    original_dir = os.getcwd()
    try:
        os.chdir('backend')
        # Start the Flask development server
        subprocess.run([sys.executable, 'src/main.py'])
    except KeyboardInterrupt:
        print("💡 Backend server stopped by user")
    except Exception as e:
        print(f"❌ Backend failed to start: {e}")
    finally:
        os.chdir(original_dir)

def start_frontend():
    """Start the frontend Vite server"""
    print("🚀 Starting frontend server...")
    try:
        # Wait a bit for backend to start
        time.sleep(3)
        subprocess.run(['npm', 'run', 'dev'])
    except KeyboardInterrupt:
        print("💡 Frontend server stopped by user")
    except Exception as e:
        print(f"❌ Frontend failed to start: {e}")

def main():
    print_banner()
    
    # Check if we're in the right directory
    if not Path('package.json').exists() or not Path('backend').exists():
        print("❌ Error: Please run this script from the project root directory")
        print("   Expected files: package.json, backend/ folder")
        sys.exit(1)
    
    print("✅ Starting servers...")
    print("💡 Use Ctrl+C to stop both servers")
    
    try:
        # Start backend in a separate thread
        backend_thread = threading.Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Wait a moment for backend to initialize
        print("⏳ Waiting for backend to initialize...")
        time.sleep(2)
        
        # Start frontend in main thread
        start_frontend()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down development servers...")
        print("   Both servers will stop...")

if __name__ == "__main__":
    main()
