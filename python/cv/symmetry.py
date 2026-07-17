import cv2
import numpy as np

def calculate_symmetry(image_path_or_buf):
    if isinstance(image_path_or_buf, str):
        img = cv2.imread(image_path_or_buf)
    else:
        img = cv2.imdecode(np.frombuffer(image_path_or_buf, np.uint8), cv2.IMREAD_COLOR)
        
    if img is None:
        return 0
        
    # Resize to standard analysis dimensions
    img = cv2.resize(img, (800, 600))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    height, width = gray.shape
    mid = width // 2
    
    left_half = gray[:, :mid]
    right_half = gray[:, mid:]
    
    if right_half.shape[1] > left_half.shape[1]:
        right_half = right_half[:, :left_half.shape[1]]
        
    # Reflect the right half vertically
    right_half_flipped = cv2.flip(right_half, 1)
    
    # Calculate Mean Squared Error
    mse = np.mean((left_half - right_half_flipped) ** 2)
    
    # Map MSE (0 to 100)
    symmetry_score = max(0, 100 - (mse / 10))
    return round(symmetry_score)
