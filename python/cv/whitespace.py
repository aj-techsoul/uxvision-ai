import cv2
import numpy as np

def calculate_whitespace(image_path_or_buf):
    if isinstance(image_path_or_buf, str):
        img = cv2.imread(image_path_or_buf)
    else:
        img = cv2.imdecode(np.frombuffer(image_path_or_buf, np.uint8), cv2.IMREAD_COLOR)
    
    if img is None:
        return 0
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Threshold white and near-white pixels (e.g. > 245)
    _, thresh = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY)
    total_pixels = gray.size
    white_pixels = np.sum(thresh == 255)
    whitespace_ratio = (white_pixels / total_pixels) * 100
    
    return round(whitespace_ratio)
