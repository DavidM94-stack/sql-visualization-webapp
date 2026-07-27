import os
import sys
import time
import webbrowser
import threading
import uvicorn

# Adjust path for PyInstaller frozen executable vs standard python run
def get_resource_path(relative_path: str) -> str:
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

def open_browser():
    time.sleep(1.2)
    print("Opening application dashboard in web browser: http://localhost:8000 ...")
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    print("=" * 65)
    print(" PostgreSQL Query Visualizer & Performance Analyzer Engine")
    print("=" * 65)
    print("Starting local server on http://localhost:8000 ...")
    print("Press CTRL+C to stop the application server.\n")

    # Launch browser in a background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Import main app
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
