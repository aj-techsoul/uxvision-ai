import cv2
import numpy as np

def calculate_overlaps(image_path_or_buf):
    if isinstance(image_path_or_buf, str):
        img = cv2.imread(image_path_or_buf)
    else:
        img = cv2.imdecode(np.frombuffer(image_path_or_buf, np.uint8), cv2.IMREAD_COLOR)
        
    if img is None:
        return 0
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edged = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w > 15 and h > 15:
            boxes.append((x, y, w, h))
            
    overlap_count = 0
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            x1, y1, w1, h1 = boxes[i]
            x2, y2, w2, h2 = boxes[j]
            
            ox = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            oy = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
            
            if ox > 0 and oy > 0:
                area_overlap = ox * oy
                area1 = w1 * h1
                area2 = w2 * h2
                # Ensure they are not fully nested
                if area_overlap < 0.85 * area1 and area_overlap < 0.85 * area2:
                    overlap_count += 1
                    
    return overlap_count
