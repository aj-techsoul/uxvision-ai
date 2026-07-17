from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import os

# Import local prediction logic
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from inference.predict import predict_layout_quality

app = FastAPI(
    title="UXVision AI Layout Classifier API",
    description="Explainable ML inference endpoints using Python and scikit-learn",
    version="1.0"
)

class PredictRequest(BaseModel):
    features: list

@app.get("/")
def read_root():
    return {"status": "online", "model": "RandomForestClassifier"}

@app.post("/predict")
def predict(request: PredictRequest):
    if not request.features or len(request.features) == 0:
        raise HTTPException(status_code=400, detail="Features list is required and cannot be empty.")
    
    result = predict_layout_quality(request.features)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return {
        "score": result["score"],
        "confidence": result["confidence"],
        "label": result["label"]
    }
