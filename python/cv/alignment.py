import cv2
import numpy as np

def calculate_alignment(image_path_or_buf):
    if isinstance(image_path_or_buf, str):
        img = cv2.imread(image_path_or_buf)
    else:
        img = cv2.imdecode(np.frombuffer(image_path_or_buf, np.uint8), cv2.IMREAD_COLOR)
        
    if img is None:
        return 0
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)
    
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    left_edges = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w > 10 and h > 10:
            left_edges.append(x)
            
    if not left_edges:
        return 100
        
    aligned_count = 0
    for x in left_edges:
        if x % 8 == 0 or x % 4 == 0:
            aligned_count += 1
            
    alignment_ratio = (aligned_count / len(left_edges)) * 100
    return round(max(30, min(100, alignment_ratio)))
