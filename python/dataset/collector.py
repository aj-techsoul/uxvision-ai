import os
import csv
import numpy as np

def generate_website_dataset(output_dir="research/dataset"):
    """
    Generate a research-grade synthetic UX dataset with 1000 samples.
    
    Key improvements over the previous version:
    - 1000 samples (up from 300) for better generalization
    - 10 website categories instead of 6 for greater diversity
    - Realistic inter-feature correlations (good design correlates across dimensions)
    - Noise injection to prevent the model from learning trivially separable boundaries
    - Label assignment based on weighted composite score, not hardcoded per category
    - 4-class balanced output: Excellent (3), Good (2), Average (1), Poor (0)
    """
    os.makedirs(output_dir, exist_ok=True)
    features_path = os.path.join(output_dir, "features.csv")
    
    headers = [
        "accessibilityScore", "visualDesignScore", "typographyScore", "readabilityScore",
        "gridScore", "contrastRatio", "performanceScore", "domDepthScore",
        "semanticCoverage", "elementDiversity", "headingHierarchy", "linkGraphScore",
        "cssSpecificityHealth", "colorHarmony", "spacingConsistency", "label"
    ]
    
    # Category archetypes: (base_quality, variance, contrast_mean, contrast_std, dom_depth_mean)
    # base_quality controls the mean of most 0-100 features
    # Higher quality = higher scores, lower DOM depth (cleaner code)
    categories = {
        "SaaS_Premium":     {"base": 90, "var": 4,  "contrast": (9.0, 2.0), "dom": (30, 6)},
        "SaaS_Startup":     {"base": 82, "var": 6,  "contrast": (7.5, 2.0), "dom": (38, 8)},
        "Portfolio_Pro":    {"base": 88, "var": 5,  "contrast": (8.5, 2.5), "dom": (28, 6)},
        "Ecommerce_Major":  {"base": 78, "var": 5,  "contrast": (6.5, 1.5), "dom": (50, 8)},
        "Ecommerce_Small":  {"base": 68, "var": 7,  "contrast": (5.0, 1.5), "dom": (60, 10)},
        "Blog_Modern":      {"base": 76, "var": 5,  "contrast": (6.0, 1.5), "dom": (45, 7)},
        "Blog_Legacy":      {"base": 58, "var": 8,  "contrast": (3.5, 1.0), "dom": (75, 10)},
        "University":       {"base": 62, "var": 7,  "contrast": (4.2, 1.2), "dom": (72, 9)},
        "Government":       {"base": 52, "var": 9,  "contrast": (3.5, 1.0), "dom": (82, 8)},
        "Personal_Hobby":   {"base": 45, "var": 12, "contrast": (3.0, 1.5), "dom": (88, 10)},
    }
    
    samples_per_category = 100
    
    np.random.seed(42)
    
    # Feature-level weight vector for composite quality scoring (label assignment)
    # These weights reflect realistic importance of each dimension to overall UX quality
    LABEL_WEIGHTS = np.array([
        0.12,  # accessibilityScore
        0.12,  # visualDesignScore
        0.08,  # typographyScore
        0.06,  # readabilityScore
        0.08,  # gridScore
        0.10,  # contrastRatio (will be normalized to 0-100 scale)
        0.08,  # performanceScore
        0.06,  # domDepthScore (inverted: lower depth = better)
        0.06,  # semanticCoverage
        0.05,  # elementDiversity
        0.05,  # headingHierarchy
        0.04,  # linkGraphScore
        0.03,  # cssSpecificityHealth
        0.04,  # colorHarmony
        0.03,  # spacingConsistency
    ])
    
    all_rows = []
    
    for cat_name, params in categories.items():
        base = params["base"]
        var = params["var"]
        c_mean, c_std = params["contrast"]
        d_mean, d_std = params["dom"]
        
        for i in range(samples_per_category):
            # Generate correlated features: a shared quality factor plus individual noise
            shared_quality = np.random.normal(base, var * 0.6)
            
            features = []
            # accessibility, visual, typography, readability, grid
            for _ in range(5):
                val = shared_quality + np.random.normal(0, var * 0.8)
                features.append(np.clip(round(val, 2), 10, 100))
            
            # contrastRatio (1-21 scale)
            contrast = np.clip(round(np.random.normal(c_mean, c_std), 2), 1.0, 21.0)
            features.append(contrast)
            
            # performance
            perf = shared_quality + np.random.normal(-5, var)
            features.append(np.clip(round(perf, 2), 10, 100))
            
            # domDepthScore (inverted: lower = better quality sites)
            dom = np.clip(round(np.random.normal(d_mean, d_std), 2), 10, 100)
            features.append(dom)
            
            # semantic, diversity, hierarchy, linkGraph, cssHealth, colorHarmony, spacing
            for _ in range(7):
                val = shared_quality + np.random.normal(-2, var * 0.9)
                features.append(np.clip(round(val, 2), 10, 100))
            
            # Compute composite score for label assignment
            score_features = features.copy()
            # Normalize contrast to 0-100 scale for scoring
            score_features[5] = min(100, (contrast / 10.0) * 100)
            # Invert DOM depth (lower is better)
            score_features[7] = 100 - dom
            
            composite = np.dot(score_features, LABEL_WEIGHTS)
            
            # Add noise to label boundaries to prevent trivial separation
            composite += np.random.normal(0, 3)
            
            # Assign label based on composite score
            if composite >= 80:
                label = 3  # Excellent
            elif composite >= 65:
                label = 2  # Good
            elif composite >= 50:
                label = 1  # Average
            else:
                label = 0  # Poor
            
            all_rows.append(features + [label])
    
    # Shuffle to break category ordering
    np.random.shuffle(all_rows)
    
    with open(features_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in all_rows:
            writer.writerow(row)
    
    # Print label distribution
    labels = [r[-1] for r in all_rows]
    from collections import Counter
    dist = Counter(labels)
    total = len(all_rows)
    print(f"[Dataset Collector] Generated {total} samples -> {features_path}")
    for lbl in sorted(dist.keys()):
        pct = dist[lbl] / total * 100
        print(f"  Class {lbl}: {dist[lbl]} samples ({pct:.1f}%)")

if __name__ == "__main__":
    generate_website_dataset()
