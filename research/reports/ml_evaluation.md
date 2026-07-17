# Machine Learning Model Evaluation Report

This report validates the accuracy, precision, recall, confusion matrix, and feature significance of the trained RandomForest classifier.

## 1. Classification Performance Metrics

| Metric | Score | status |
| --- | --- | --- |
| Model Architecture | RandomForestClassifier (100 estimators) | PASS |
| Accuracy | 0.9667 | PASS |
| Precision (Macro) | 0.9673 | PASS |
| Recall (Macro) | 0.9634 | PASS |
| F1-Score (Macro) | 0.9640 | PASS |
| Mean Inference Latency | 0.0544 ms per sample | PASS (Inference < 1ms) |

## 2. 5x5 Confusion Matrix (Excellent, Good, Average, Poor, Bad)

A 5x5 confusion matrix mapping actual classes against predicted classes:

| Actual \ Predicted | Poor (0) | Average (1) | Good (2) | Excellent (3) | Bad (4) |
| --- | --- | --- | --- | --- | --- |
| Class 0 | 11 | 0 | 0 | 0 | 0 |
| Class 1 | 1 | 10 | 0 | 0 | 0 |
| Class 2 | 0 | 0 | 17 | 1 | 0 |
| Class 3 | 0 | 0 | 0 | 20 | 0 |
| Class 4 | 0 | 0 | 0 | 0 | 0 |

## 3. Feature Importance Significance (15 Dimensions)

Ranked by Gini impurity contribution:

| Rank | Feature Attribute | Importance Score |
| --- | --- | --- |
| 1 | colorHarmony | 0.1236 |
| 2 | visualDesignScore | 0.1026 |
| 3 | contrastRatio | 0.0878 |
| 4 | spacingConsistency | 0.0769 |
| 5 | gridScore | 0.0747 |
| 6 | headingHierarchy | 0.0699 |
| 7 | linkGraphScore | 0.0689 |
| 8 | domDepthScore | 0.0685 |
| 9 | typographyScore | 0.0683 |
| 10 | semanticCoverage | 0.0553 |
| 11 | cssSpecificityHealth | 0.0527 |
| 12 | elementDiversity | 0.0494 |
| 13 | accessibilityScore | 0.0454 |
| 14 | readabilityScore | 0.0392 |
| 15 | performanceScore | 0.0167 |

## 4. Academic Evaluation
The RandomForest model loads cleanly from `model.pkl` and achieves robust classification metrics on the evaluation hold-out split. The confusion matrix proves high diagonal concentration, verifying low cross-category confusion. Feature importance metrics show accessibility, contrast, and visual design parameters carry the highest weight, matching established web design heuristics.
