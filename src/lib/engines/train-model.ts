import * as fs from "fs";
import * as path from "path";

// Define the 15 features
const FEATURE_NAMES = [
  "accessibilityScore", "visualDesignScore", "typographyScore", "readabilityScore",
  "gridScore", "contrastRatio", "performanceScore", "domDepthScore",
  "semanticCoverage", "elementDiversity", "headingHierarchy", "linkGraphScore",
  "cssSpecificityHealth", "colorHarmony", "spacingConsistency"
] as const;

type FeatureName = typeof FEATURE_NAMES[number];
type ClassLabel = "Excellent" | "Good" | "Average" | "Poor" | "Bad";
const CLASSES: ClassLabel[] = ["Excellent", "Good", "Average", "Poor", "Bad"];

interface DataPoint {
  features: Record<FeatureName, number>;
  label: ClassLabel;
}

// Simple pseudo-random number generator for reproducibility
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(12345);

// Box-Muller transform for normal distributions
function randomNormal(mean: number, std: number): number {
  const u1 = random();
  const u2 = random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

// Generate synthetic UI dataset
function generateDataset(size: number): DataPoint[] {
  const dataset: DataPoint[] = [];
  
  for (let i = 0; i < size; i++) {
    // Pick class label based on distribution
    const classIdx = i % 5;
    const label = CLASSES[classIdx];
    
    // Set class configurations (mean, std)
    let centerMean = 50;
    if (label === "Excellent") centerMean = 90;
    else if (label === "Good") centerMean = 75;
    else if (label === "Average") centerMean = 60;
    else if (label === "Poor") centerMean = 40;
    else centerMean = 20;

    const features = {} as Record<FeatureName, number>;
    
    FEATURE_NAMES.forEach(f => {
      let val: number;
      if (f === "contrastRatio") {
        // Contrast ratio ranges from 1 to 21
        const ratioCenter = centerMean / 100 * 20 + 1;
        val = Math.max(1, Math.min(21, randomNormal(ratioCenter, 2)));
      } else {
        val = Math.max(0, Math.min(100, randomNormal(centerMean, 8)));
      }
      features[f] = parseFloat(val.toFixed(2));
    });

    dataset.push({ features, label });
  }

  return dataset;
}

// Min-Max feature normalization
function normalizeFeatures(dp: DataPoint): number[] {
  return FEATURE_NAMES.map(f => {
    const raw = dp.features[f];
    if (f === "contrastRatio") {
      return Math.min(1.0, raw / 10.0);
    }
    return raw / 100.0;
  });
}

// Softmax function
function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const exps = z.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sum);
}

// Train a 5-class linear classifier
function train() {
  console.log("Generating 1000 UI dataset instances for model optimization...");
  const fullDataset = generateDataset(1000);
  
  // Shuffle dataset
  const shuffled = [...fullDataset].sort(() => random() - 0.5);
  
  // Split into train/validation (80/20)
  const trainSet = shuffled.slice(0, 800);
  const testSet = shuffled.slice(800);

  // Initialize weights and biases to small random numbers
  const W: number[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 15 }, () => (random() - 0.5) * 0.1)
  );
  const b: number[] = Array.from({ length: 5 }, () => 0.0);

  const epochs = 150;
  const learningRate = 0.05;

  console.log("Starting Gradient Descent optimization iterations...");
  
  for (let epoch = 1; epoch <= epochs; epoch++) {
    let lossSum = 0;
    
    // Mini-batch updates or stochastic gradient descent
    trainSet.forEach(dp => {
      const X = normalizeFeatures(dp);
      const targetIdx = CLASSES.indexOf(dp.label);
      
      // Feedforward: z = W*X + b
      const z = W.map((row, idx) => row.reduce((sum, w_ij, j) => sum + w_ij * X[j], 0) + b[idx]);
      const probs = softmax(z);
      
      // Calculate loss (Cross entropy)
      lossSum -= Math.log(Math.max(1e-15, probs[targetIdx]));

      // Backward: compute gradients
      const dZ = probs.map((p, k) => p - (k === targetIdx ? 1 : 0));
      
      // Update weights and biases
      for (let k = 0; k < 5; k++) {
        for (let j = 0; j < 15; j++) {
          W[k][j] -= learningRate * dZ[k] * X[j];
        }
        b[k] -= learningRate * dZ[k];
      }
    });

    if (epoch % 30 === 0 || epoch === 1) {
      console.log(`Epoch ${epoch}/${epochs} | Cross-Entropy Loss: ${(lossSum / trainSet.length).toFixed(4)}`);
    }
  }

  // Evaluation on validation set
  console.log("Optimization complete. Running test evaluations...");
  let correct = 0;
  const confusionMatrix: number[][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));

  testSet.forEach(dp => {
    const X = normalizeFeatures(dp);
    const actualIdx = CLASSES.indexOf(dp.label);

    const z = W.map((row, idx) => row.reduce((sum, w_ij, j) => sum + w_ij * X[j], 0) + b[idx]);
    const probs = softmax(z);
    
    const predIdx = probs.indexOf(Math.max(...probs));
    confusionMatrix[actualIdx][predIdx]++;

    if (predIdx === actualIdx) {
      correct++;
    }
  });

  const accuracy = correct / testSet.length;
  
  // Calculate precision, recall, and F1 for each class
  let classPrecisions = [];
  let classRecalls = [];
  
  for (let c = 0; c < 5; c++) {
    const TP = confusionMatrix[c][c];
    
    let sumCol = 0; // Predicted C
    let sumRow = 0; // Actual C
    for (let i = 0; i < 5; i++) {
      sumCol += confusionMatrix[i][c];
      sumRow += confusionMatrix[c][i];
    }
    
    const precision = sumCol > 0 ? TP / sumCol : 0;
    const recall = sumRow > 0 ? TP / sumRow : 0;
    
    classPrecisions.push(precision);
    classRecalls.push(recall);
  }

  const macroPrecision = classPrecisions.reduce((a, b) => a + b, 0) / 5;
  const macroRecall = classRecalls.reduce((a, b) => a + b, 0) / 5;
  const macroF1 = 2 * (macroPrecision * macroRecall) / (macroPrecision + macroRecall);

  console.log("\n=================== EVALUATION REPORT ===================");
  console.log(`Macro Accuracy : ${(accuracy * 100).toFixed(2)}%`);
  console.log(`Macro Precision: ${(macroPrecision * 100).toFixed(2)}%`);
  console.log(`Macro Recall   : ${(macroRecall * 100).toFixed(2)}%`);
  console.log(`Macro F1 Score : ${(macroF1 * 100).toFixed(2)}%`);
  console.log("=========================================================\n");

  // Output weights and biases to weights JSON
  const outputData = {
    features: FEATURE_NAMES,
    classes: CLASSES,
    weights: W,
    biases: b,
    validationMetrics: {
      accuracy: parseFloat(accuracy.toFixed(4)),
      precision: parseFloat(macroPrecision.toFixed(4)),
      recall: parseFloat(macroRecall.toFixed(4)),
      f1Score: parseFloat(macroF1.toFixed(4)),
      confusionMatrix
    }
  };

  const outputPath = path.resolve(process.cwd(), "src/lib/engines/model-weights.json");
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
  console.log(`Successfully compiled and saved model weights to: ${outputPath}`);
}

train();
