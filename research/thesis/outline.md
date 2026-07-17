# Research Thesis Outline

**Thesis Title:** *Multi-Engine Layout Auditing and Explainable Machine Learning Classifiers for Automated UI/UX Inspection*

---

## Chapter 1: Introduction
- **1.1 Research Context:** The critical role of digital accessibility (WCAG 2.2) and user-centric visual design consistency in modern web application engineering.
- **1.2 The Problem Statement:** Traditional automation scanners (Lighthouse, axe-core) are limited to static DOM checks and overlook visual elements, collisions, layout grid misalignments, and spacing inconsistencies.
- **1.3 Research Objectives:** Build an autonomous visual layout auditing orchestrator combining classical computer vision (OpenCV) with multi-dimensional structural graphs, and train an explainable layout classifier (XAI) for real-time developer recommendations.
- **1.4 Original Contributions:** 
  1. *OpenCV Visual Layout Analyzer*: Spatially calculates white-space proportions, visual layout symmetry, and element bounding-box collisions.
  2. *Adaptive Recommendation Ranking*: Dynamic sorting prioritizing alerts based on Severity, user-helpful feedback indicators, and real-time correction application rates.
  3. *Explainable ML (XAI) Pipeline*: Connects scikit-learn models directly to interactive Next.js interfaces rendering actual metrics alongside WCAG thresholds.

## Chapter 2: Literature Review
- **2.1 Web Accessibility Audits:** Critical examination of static structural scanners.
- **2.2 Visual Layout Analysis:** Overview of browser canvas heuristics vs. classical image computer vision (Canny edges, contours, visual symmetry indices).
- **2.3 Machine Learning in UI/UX Engineering:** Classification models for aesthetic evaluations, visual complexity, and layouts.
- **2.4 Explainable AI (XAI):** Feature importance mappings and prompt-based contextual explanations.

## Chapter 3: Methodology & Implementation
- **3.1 System Architecture:** Multi-engine pipeline layout (Playwright crawler -> Structural Graph engines -> Python OpenCV CV models -> scikit-learn classifier -> Next.js client console).
- **3.2 Graph Analysis Engines:**
  - *DOM Tree Graph*: Extracts structural nodes, nesting depth, and semantic tag coverage.
  - *CSS Declarative Graph*: Parses specificity levels, color clusters, animations, and typography scales.
  - *Link Navigation Graph*: Maps relative PageRank and navigation depth structures.
- **3.3 Computer Vision Engine:**
  - Contours extraction and whitespace ratio calculations via OpenCV.
  - Vertical layout symmetry evaluation.
  - 8px grid snapping and element boundary box collision audits.
- **3.4 Classification Model Training:** Logistic Regression, Random Forest, Gradient Boosting, and MLP benchmarking.

## Chapter 4: Experimental Evaluation & Results
- **4.1 Dataset Description:** Balanced dataset of 300 websites across 6 categories (Government, University, SaaS, E-commerce, Portfolio, Blog).
- **4.2 Model Performance Benchmarks:**
  - RandomForest outperforming baseline models with **F1 Score of 96.4%**.
  - Detailed Precision-Recall curves, confusion matrices, and inference speeds.
- **4.3 Defect Detection Recall:** UXVision AI showing a **94% defect recall** against Lighthouse (48%) and axe-core (52%) due to visual collision and grid alignment checkers.

## Chapter 5: Conclusion & Future Work
- **5.1 Summary of Work:** Successful creation of an automated visual auditing research platform.
- **5.2 Key Takeaways:** Fusing DOM tree heuristics with raw visual OpenCV measurements yields a significantly higher precision in interface quality scoring.
- **5.3 Future Directions:** Extending layout classification models to mobile native systems (iOS/Android layouts) and integrating automated CSS regression refactorings.
