import sys
import json
import base64
import numpy as np

from whitespace import calculate_whitespace
from symmetry import calculate_symmetry
from alignment import calculate_alignment
from overlap import calculate_overlaps

def analyze_image(img_path_or_data):
    if img_path_or_data.startswith("data:image"):
        header, base64_data = img_path_or_data.split(",", 1)
        image_bytes = base64.b64decode(base64_data)
        image_input = image_bytes
    elif len(img_path_or_data) > 1000:
        image_bytes = base64.b64decode(img_path_or_data)
        image_input = image_bytes
    else:
        image_input = img_path_or_data

    whitespace_val = calculate_whitespace(image_input)
    symmetry_val = calculate_symmetry(image_input)
    alignment_val = calculate_alignment(image_input)
    overlap_val = calculate_overlaps(image_input)

    return {
        "Whitespace": whitespace_val,
        "Symmetry": symmetry_val,
        "Alignment": alignment_val,
        "Overlap": overlap_val
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image source provided"}))
        sys.exit(1)
        
    source = sys.argv[1]
    if source == "-":
        source = sys.stdin.read().strip()
        
    try:
        results = analyze_image(source)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
