import uvicorn
import sys
import os

if __name__ == "__main__":
    # Ensure current dir is in python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    # Run seed script on first launch if needed
    try:
        from seed_data import seed
        seed()
    except Exception as e:
        print(f"Seed note: {e}")

    print("\n" + "="*60)
    print("  MediKiosk AI Backend Server Starting...")
    print("  Swagger API Docs: http://127.0.0.1:8000/docs")
    print("  API Base URL:     http://127.0.0.1:8000/api")
    print("="*60 + "\n")

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
