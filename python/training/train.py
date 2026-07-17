"""
UXVision AI — ML Training Pipeline v2

Improvements over v1:
  - GridSearchCV hyperparameter optimization for RandomForest and GradientBoosting
  - Stratified 5-fold cross-validation for robust metric estimation
  - StandardScaler preprocessing for stable gradient-based models
  - Per-class precision/recall/f1 reporting (not just macro averages)
  - Feature importance with confidence intervals from RF estimators
  - Exports: model.pkl, scaler.pkl, model-weights.json, experiment logs
"""

import os
import time
import json
import joblib
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, GridSearchCV, cross_validate
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, classification_report
)

warnings.filterwarnings("ignore", category=UserWarning)


def train_and_evaluate_models():
    dataset_path = "research/dataset/features.csv"
    if not os.path.exists(dataset_path):
        print(f"[ML Trainer] Error: Dataset not found at {dataset_path}!")
        return
    
    df = pd.read_csv(dataset_path)
    print(f"[ML Trainer] Loaded dataset: {df.shape[0]} samples, {df.shape[1] - 1} features")
    print(f"[ML Trainer] Label distribution:\n{df['label'].value_counts().sort_index().to_string()}")
    
    X = df.drop(columns=["label"])
    y = df["label"]
    feature_names = list(X.columns)
    
    # Stratified train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # StandardScaler for normalization
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # ============================
    # Model definitions with hyperparameter grids
    # ============================
    
    models = {
        "LogisticRegression": {
            "estimator": LogisticRegression(max_iter=2000, random_state=42, multi_class="multinomial"),
            "params": {
                "C": [0.1, 1.0, 10.0],
                "solver": ["lbfgs"],
            },
            "needs_scaling": True
        },
        "RandomForest": {
            "estimator": RandomForestClassifier(random_state=42),
            "params": {
                "n_estimators": [100, 200, 300],
                "max_depth": [None, 10, 20],
                "min_samples_split": [2, 5],
                "min_samples_leaf": [1, 2],
            },
            "needs_scaling": False  # Tree models don't need scaling
        },
        "GradientBoosting": {
            "estimator": GradientBoostingClassifier(random_state=42),
            "params": {
                "n_estimators": [100, 200],
                "learning_rate": [0.05, 0.1, 0.2],
                "max_depth": [3, 5, 7],
                "min_samples_split": [2, 5],
            },
            "needs_scaling": False
        },
        "MLPClassifier": {
            "estimator": MLPClassifier(max_iter=2000, random_state=42, early_stopping=True),
            "params": {
                "hidden_layer_sizes": [(64, 32), (128, 64), (128, 64, 32)],
                "alpha": [0.0001, 0.001],
                "learning_rate_init": [0.001, 0.01],
            },
            "needs_scaling": True
        }
    }
    
    results = {}
    best_f1 = 0
    best_model_name = None
    best_model_obj = None
    best_needs_scaling = False
    
    os.makedirs("research/experiments", exist_ok=True)
    os.makedirs("python/models", exist_ok=True)
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    print("\n[ML Trainer] Starting hyperparameter optimization with 5-fold stratified CV...\n")
    
    for name, config in models.items():
        t0 = time.time()
        needs_scaling = config["needs_scaling"]
        
        X_tr = X_train_scaled if needs_scaling else X_train.values
        X_te = X_test_scaled if needs_scaling else X_test.values
        
        # GridSearchCV with stratified cross-validation
        grid = GridSearchCV(
            config["estimator"],
            config["params"],
            cv=skf,
            scoring="f1_macro",
            n_jobs=-1,
            refit=True,
            error_score="raise"
        )
        grid.fit(X_tr, y_train)
        
        train_time = time.time() - t0
        best_estimator = grid.best_estimator_
        
        # Evaluate on held-out test set
        t1 = time.time()
        preds = best_estimator.predict(X_te)
        inference_time = time.time() - t1
        
        acc = accuracy_score(y_test, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, preds, average="macro")
        cm = confusion_matrix(y_test, preds, labels=sorted(y.unique()))
        
        # Per-class metrics
        class_report = classification_report(y_test, preds, output_dict=True)
        
        metrics = {
            "model_name": name,
            "best_params": {str(k): str(v) for k, v in grid.best_params_.items()},
            "cv_best_f1": float(grid.best_score_),
            "test_accuracy": float(acc),
            "test_precision": float(precision),
            "test_recall": float(recall),
            "test_f1_score": float(f1),
            "confusionMatrix": cm.tolist(),
            "per_class_report": {
                str(k): {mk: round(mv, 4) for mk, mv in v.items()} 
                for k, v in class_report.items() 
                if isinstance(v, dict)
            },
            "training_time_seconds": float(train_time),
            "inference_time_seconds": float(inference_time),
            "needs_scaling": needs_scaling
        }
        
        results[name] = metrics
        
        # Save individual experiment
        with open(f"research/experiments/{name.lower()}.json", "w") as f:
            json.dump(metrics, f, indent=2)
        
        print(f"  {name}:")
        print(f"    Best params: {grid.best_params_}")
        print(f"    CV F1: {grid.best_score_:.4f} | Test F1: {f1:.4f} | Test Acc: {acc:.4f}")
        print(f"    Train time: {train_time:.2f}s | Inference: {inference_time*1000:.1f}ms\n")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model_obj = best_estimator
            best_needs_scaling = needs_scaling
    
    # Save comparison report
    with open("research/experiments/model_comparison.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"{'='*60}")
    print(f"[ML Trainer] Champion model: {best_model_name}")
    print(f"[ML Trainer] Test F1: {best_f1:.4f}")
    print(f"{'='*60}\n")
    
    # ============================
    # Save production artifacts
    # ============================
    
    # 1. Save the champion model
    joblib.dump(best_model_obj, "python/models/model.pkl")
    print(f"[ML Trainer] Saved model -> python/models/model.pkl")
    
    # 2. Save the scaler (needed if champion requires scaling)
    joblib.dump(scaler, "python/models/scaler.pkl")
    print(f"[ML Trainer] Saved scaler -> python/models/scaler.pkl")
    
    # 3. Save metadata for the inference bridge
    meta = {
        "best_model_name": best_model_name,
        "needs_scaling": best_needs_scaling,
        "feature_names": feature_names,
    }
    with open("python/models/model_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    
    # 4. Export feature importances
    importances = []
    importance_std = []
    if hasattr(best_model_obj, "feature_importances_"):
        importances = list(best_model_obj.feature_importances_)
        # RF: compute std across trees for confidence intervals
        if hasattr(best_model_obj, "estimators_"):
            tree_importances = np.array([
                tree.feature_importances_ for tree in best_model_obj.estimators_
            ])
            importance_std = list(np.std(tree_importances, axis=0))
    elif hasattr(best_model_obj, "coef_"):
        importances = list(np.mean(np.abs(best_model_obj.coef_), axis=0))
    
    feature_ranking = []
    for idx, col in enumerate(feature_names):
        entry = {"feature": col, "importance": float(importances[idx]) if idx < len(importances) else 0.0}
        if idx < len(importance_std):
            entry["std"] = float(importance_std[idx])
        feature_ranking.append(entry)
    feature_ranking.sort(key=lambda x: x["importance"], reverse=True)
    
    # 5. Write model-weights.json for the JS frontend
    champion_metrics = results[best_model_name]
    weights_summary = {
        "best_model_name": best_model_name,
        "f1_score": best_f1,
        "best_params": champion_metrics["best_params"],
        "feature_importances": feature_ranking,
        "validationMetrics": {
            "accuracy": champion_metrics["test_accuracy"],
            "precision": champion_metrics["test_precision"],
            "recall": champion_metrics["test_recall"],
            "f1Score": champion_metrics["test_f1_score"],
            "confusionMatrix": champion_metrics["confusionMatrix"]
        }
    }
    
    with open("src/lib/engines/model-weights.json", "w") as f:
        json.dump(weights_summary, f, indent=2)
    
    print(f"[ML Trainer] Exported weights -> src/lib/engines/model-weights.json")
    print(f"[ML Trainer] Training pipeline complete.\n")


if __name__ == "__main__":
    train_and_evaluate_models()
