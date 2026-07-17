import cv2
import numpy as np
import subprocess
import json
import os

def test_cv_pipeline():
    # 1. Create a mock layout image: 800x600 white background
    img = np.ones((600, 800, 3), dtype=np.uint8) * 255
    
    # Draw some boxes (simulating visual UI cards)
    # Box 1 (Left header/card)
    cv2.rectangle(img, (50, 50), (250, 150), (0, 0, 0), -1)
    # Box 2 (Right symmetry card)
    cv2.rectangle(img, (550, 50), (750, 150), (0, 0, 0), -1)
    
    # Overlapping boxes
    cv2.rectangle(img, (300, 300), (500, 400), (128, 128, 128), -1)
    cv2.rectangle(img, (450, 350), (600, 450), (128, 128, 128), -1) # overlaps
    
    # Save the mock image
    temp_img_path = "tests/outputs/mock_layout.png"
    os.makedirs("tests/outputs", exist_ok=True)
    cv2.imwrite(temp_img_path, img)
    print(f"[Test] Saved mock layout image to {temp_img_path}")
    
    # 2. Execute visual_analyzer.py via python command
    print("[Test] Running visual_analyzer.py on mock layout...")
    # Run from workspace root to keep paths simple
    result = subprocess.run(
        ["python", "python/cv/visual_analyzer.py", temp_img_path],
        capture_output=True,
        text=True,
        cwd=os.getcwd()
    )
    
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    
    try:
        metrics = json.loads(result.stdout.strip())
        print("[Test] Visual metrics calculated successfully:")
        print(json.dumps(metrics, indent=2))
        
        assert "Whitespace" in metrics
        assert "Symmetry" in metrics
        assert "Alignment" in metrics
        assert "Overlap" in metrics
        print("[Test] Success! All keys present.")
    except Exception as e:
        print("[Test] Error parsing stdout:", e)
        exit(1)

if __name__ == "__main__":
    test_cv_pipeline()
