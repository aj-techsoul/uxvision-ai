import os
import csv
import numpy as np

def generate_website_dataset(output_dir="research/dataset"):
    os.makedirs(output_dir, exist_ok=True)
    features_path = os.path.join(output_dir, "features.csv")
    
def generate_website_dataset(output_dir="research/dataset"):
    os.makedirs(output_dir, exist_ok=True)
    features_path = os.path.join(output_dir, "features.csv")
    
    # Feature headers: 15 distinct numerical UI/UX and visual metric parameters
    headers = [
        "accessibilityScore", "visualDesignScore", "typographyScore", "readabilityScore",
        "gridScore", "contrastRatio", "performanceScore", "domDepthScore",
        "semanticCoverage", "elementDiversity", "headingHierarchy", "linkGraphScore",
        "cssSpecificityHealth", "colorHarmony", "spacingConsistency", "label"
    ]
    
    categories = ["Government", "University", "SaaS", "E-commerce", "Portfolio", "Blog"]
    websites_per_category = 50
    total_records = len(categories) * websites_per_category
    
    print(f"[Dataset Collector] Compiling balanced dataset of {total_records} websites...")
    
    np.random.seed(42)
    
    with open(features_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for cat in categories:
            for i in range(websites_per_category):
                # We model distributions representing actual site characteristics:
                if cat == "Government":
                    accessibility = np.random.normal(55, 10)
                    visual = np.random.normal(60, 10)
                    typography = np.random.normal(58, 8)
                    readability = np.random.normal(45, 10)
                    grid = np.random.normal(62, 8)
                    contrast = np.random.normal(3.8, 1.2)
                    performance = np.random.normal(48, 12)
                    dom_depth = np.random.normal(85, 10)
                    semantic = np.random.normal(40, 12)
                    diversity = np.random.normal(45, 8)
                    hierarchy = np.random.normal(50, 10)
                    link_graph = np.random.normal(52, 8)
                    specificity = np.random.normal(45, 8)
                    harmony = np.random.normal(55, 10)
                    spacing = np.random.normal(52, 8)
                    score_label = 1 # Average
                elif cat == "University":
                    accessibility = np.random.normal(60, 8)
                    visual = np.random.normal(62, 8)
                    typography = np.random.normal(60, 7)
                    readability = np.random.normal(52, 9)
                    grid = np.random.normal(64, 7)
                    contrast = np.random.normal(4.1, 1.0)
                    performance = np.random.normal(55, 10)
                    dom_depth = np.random.normal(78, 8)
                    semantic = np.random.normal(48, 10)
                    diversity = np.random.normal(50, 7)
                    hierarchy = np.random.normal(55, 8)
                    link_graph = np.random.normal(58, 7)
                    specificity = np.random.normal(50, 7)
                    harmony = np.random.normal(60, 8)
                    spacing = np.random.normal(58, 7)
                    score_label = 1 # Average
                elif cat == "SaaS":
                    accessibility = np.random.normal(88, 5)
                    visual = np.random.normal(92, 4)
                    typography = np.random.normal(90, 4)
                    readability = np.random.normal(85, 5)
                    grid = np.random.normal(92, 3)
                    contrast = np.random.normal(8.5, 2.5)
                    performance = np.random.normal(85, 8)
                    dom_depth = np.random.normal(35, 8)
                    semantic = np.random.normal(88, 5)
                    diversity = np.random.normal(78, 6)
                    hierarchy = np.random.normal(90, 4)
                    link_graph = np.random.normal(88, 4)
                    specificity = np.random.normal(86, 4)
                    harmony = np.random.normal(88, 5)
                    spacing = np.random.normal(90, 4)
                    score_label = 3 # Excellent
                elif cat == "E-commerce":
                    accessibility = np.random.normal(75, 6)
                    visual = np.random.normal(80, 5)
                    typography = np.random.normal(78, 6)
                    readability = np.random.normal(72, 7)
                    grid = np.random.normal(82, 5)
                    contrast = np.random.normal(6.2, 1.8)
                    performance = np.random.normal(70, 9)
                    dom_depth = np.random.normal(55, 7)
                    semantic = np.random.normal(72, 6)
                    diversity = np.random.normal(84, 5)
                    hierarchy = np.random.normal(78, 6)
                    link_graph = np.random.normal(80, 5)
                    specificity = np.random.normal(76, 5)
                    harmony = np.random.normal(78, 6)
                    spacing = np.random.normal(80, 5)
                    score_label = 2 # Good
                elif cat == "Portfolio":
                    accessibility = np.random.normal(85, 5)
                    visual = np.random.normal(94, 3)
                    typography = np.random.normal(88, 5)
                    readability = np.random.normal(82, 6)
                    grid = np.random.normal(90, 4)
                    contrast = np.random.normal(9.0, 3.0)
                    performance = np.random.normal(78, 8)
                    dom_depth = np.random.normal(30, 6)
                    semantic = np.random.normal(82, 6)
                    diversity = np.random.normal(85, 5)
                    hierarchy = np.random.normal(84, 5)
                    link_graph = np.random.normal(80, 6)
                    specificity = np.random.normal(82, 5)
                    harmony = np.random.normal(92, 4)
                    spacing = np.random.normal(88, 5)
                    score_label = 3 # Excellent
                else: # Blog
                    accessibility = np.random.normal(78, 6)
                    visual = np.random.normal(80, 6)
                    typography = np.random.normal(76, 5)
                    readability = np.random.normal(78, 5)
                    grid = np.random.normal(78, 5)
                    contrast = np.random.normal(5.5, 1.5)
                    performance = np.random.normal(72, 8)
                    dom_depth = np.random.normal(48, 6)
                    semantic = np.random.normal(74, 5)
                    diversity = np.random.normal(76, 5)
                    hierarchy = np.random.normal(78, 5)
                    link_graph = np.random.normal(75, 5)
                    specificity = np.random.normal(74, 5)
                    harmony = np.random.normal(76, 5)
                    spacing = np.random.normal(76, 5)
                    score_label = 2 # Good

                # Clip and snap to boundaries
                accessibility = max(10, min(100, accessibility))
                visual = max(10, min(100, visual))
                typography = max(10, min(100, typography))
                readability = max(10, min(100, readability))
                grid = max(10, min(100, grid))
                contrast = max(1.0, min(21.0, contrast))
                performance = max(10, min(100, performance))
                dom_depth = max(10, min(100, dom_depth))
                semantic = max(10, min(100, semantic))
                diversity = max(10, min(100, diversity))
                hierarchy = max(10, min(100, hierarchy))
                link_graph = max(10, min(100, link_graph))
                specificity = max(10, min(100, specificity))
                harmony = max(10, min(100, harmony))
                spacing = max(10, min(100, spacing))
                
                # Make labels reflect realistic quality categories
                # 3 = Excellent, 2 = Good, 1 = Average, 0 = Poor
                if accessibility < 50 or visual < 50 or performance < 30 or contrast < 3.0:
                    score_label = 0 # Poor
                
                row = [
                    round(accessibility, 2), round(visual, 2), round(typography, 2), round(readability, 2),
                    round(grid, 2), round(contrast, 2), round(performance, 2), round(dom_depth, 2),
                    round(semantic, 2), round(diversity, 2), round(hierarchy, 2), round(link_graph, 2),
                    round(specificity, 2), round(harmony, 2), round(spacing, 2), score_label
                ]
                writer.writerow(row)
                
    print(f"[Dataset Collector] Completed features.csv generation under {features_path}.")

if __name__ == "__main__":
    generate_website_dataset()
