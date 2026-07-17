import os
import time
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

def train_and_evaluate_models():
    dataset_path = "research/dataset/features.csv"
    if not os.path.exists(dataset_path):
        print(f"[ML Trainer] Error: Dataset features.csv not found at {dataset_path}!")
        return
        
    df = pd.read_csv(dataset_path)
    X = df.drop(columns=["label"])
    y = df["label"]
    
    # Train-test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(random_state=42),
        "MLPClassifier": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1000, random_state=42)
    }
    
    results = {}
    best_f1 = 0
    best_model_name = None
    best_model_obj = None
    
    os.makedirs("research/experiments", exist_ok=True)
    os.makedirs("python/models", exist_ok=True)
    
    print("[ML Trainer] Commencing comparative training run...")
    
    for name, model in models.items():
        # Measure training time
        t0 = time.time()
        model.fit(X_train, y_train)
        train_time = time.time() - t0
        
        # Measure inference time
        t1 = time.time()
        preds = model.predict(X_test)
        inference_time = time.time() - t1
        
        # Calculate metrics
        acc = accuracy_score(y_test, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, preds, average="macro")
        
        # Calculate 5x5 confusion matrix
        cm = confusion_matrix(y_test, preds, labels=[0, 1, 2, 3, 4])
        
        metrics = {
            "model_name": name,
            "accuracy": float(acc),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "confusionMatrix": cm.tolist(),
            "training_time_seconds": float(train_time),
            "inference_time_seconds": float(inference_time)
        }
        
        results[name] = metrics
        
        # Save individual experiment result
        indiv_path = f"research/experiments/{name.lower()}.json"
        with open(indiv_path, "w") as f:
            json.dump(metrics, f, indent=2)
            
        print(f" - Trained {name} in {train_time:.4f}s | F1: {f1:.4f}")
        
        # Track the best model based on F1
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model_obj = model

    # Save summary report
    summary_path = "research/experiments/model_comparison.json"
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"[ML Trainer] Saving best model ({best_model_name}) with F1: {best_f1:.4f}")
    
    # Save the best model as a serialized joblib pickle
    model_save_path = "python/models/model.pkl"
    joblib.dump(best_model_obj, model_save_path)
    
    # Write a clean JSON weights summary for JS fallback compatibility
    # For linear models like Logistic Regression or simple Neural Net weights:
    # If the best model is Random Forest, we will save its feature importances
    importances = []
    if hasattr(best_model_obj, "feature_importances_"):
        importances = list(best_model_obj.feature_importances_)
    elif hasattr(best_model_obj, "coef_"):
        importances = list(np.mean(np.abs(best_model_obj.coef_), axis=0))
        
    feature_ranking = [
        {"feature": col, "importance": float(imp)}
        for col, imp in zip(X.columns, importances)
    ]
    feature_ranking.sort(key=lambda x: x["importance"], reverse=True)
    
    weights_summary = {
        "best_model_name": best_model_name,
        "f1_score": best_f1,
        "feature_importances": feature_ranking,
        "validationMetrics": {
            "accuracy": results[best_model_name]["accuracy"],
            "precision": results[best_model_name]["precision"],
            "recall": results[best_model_name]["recall"],
            "f1Score": results[best_model_name]["f1_score"],
            "confusionMatrix": results[best_model_name]["confusionMatrix"]
        }
    }
    
    with open("src/lib/engines/model-weights.json", "w") as f:
        json.dump(weights_summary, f, indent=2)
        
    print(f"[ML Trainer] Exported summary weights to src/lib/engines/model-weights.json")

if __name__ == "__main__":
    train_and_evaluate_models()
