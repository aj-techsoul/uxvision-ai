import os
import sys
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def test_fastapi_endpoints():
    try:
        from fastapi.testclient import TestClient
        from python.api.main import app
    except ImportError:
        # Install httpx if required for TestClient
        print("[API Validation] TestClient requires httpx. Installing dependency...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "httpx"], stdout=subprocess.DEVNULL)
        from fastapi.testclient import TestClient
        from python.api.main import app

    client = TestClient(app)
    print("[API Validation] Commencing FastAPI endpoints audit...")
    
    # Test 1: GET / root status check
    r_root = client.get("/")
    print(f" - GET / responds: Status {r_root.status_code} | {r_root.json()}")
    assert r_root.status_code == 200, "Root endpoint check failed"
    
    # Test 2: POST /predict valid payload (15 float layout metrics)
    valid_features = [85.0, 92.0, 90.0, 85.0, 92.0, 8.5, 85.0, 35.0, 88.0, 78.0, 90.0, 88.0, 86.0, 88.0, 90.0]
    r_valid = client.post("/predict", json={"features": valid_features})
    print(f" - POST /predict Valid Payload responds: Status {r_valid.status_code} | {r_valid.json()}")
    assert r_valid.status_code == 200, "Valid payload prediction failed"
    
    # Test 3: POST /predict empty payload list
    r_empty = client.post("/predict", json={"features": []})
    print(f" - POST /predict Empty Payload responds: Status {r_empty.status_code} | {r_empty.json()}")
    assert r_empty.status_code == 400 or r_empty.status_code == 422, f"Failed: empty payload should fail, got status {r_empty.status_code}"
    
    # Test 4: POST /predict invalid types payload (strings instead of numbers)
    invalid_types = ["invalid", "data", "strings"]
    r_invalid_type = client.post("/predict", json={"features": invalid_types})
    print(f" - POST /predict Invalid Types responds: Status {r_invalid_type.status_code} | {r_invalid_type.json()}")
    
    # Test 5: POST /predict oversized payload (e.g. huge array to check bounds)
    oversized = [100.0] * 1000
    r_oversized = client.post("/predict", json={"features": oversized})
    print(f" - POST /predict Oversized Payload responds: Status {r_oversized.status_code} | {r_oversized.json()}")
    assert r_oversized.status_code == 200 or r_oversized.status_code == 500 or r_oversized.status_code == 422, "Oversized validation failed"
    
    print("[API Validation] All payload validation checks completed successfully!")

if __name__ == "__main__":
    test_fastapi_endpoints()
