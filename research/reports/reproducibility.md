# Research Experiment Reproducibility Profile

This document outlines the software configuration, dependency packages, environment metadata, and execution commands required to reproduce the visual audit benchmarking results.

---

## 1. System Environment Configuration

| System Property | Specification |
| --- | --- |
| Operating System | Windows (x86_64) |
| CPU Cores | 8 Cores (Intel / AMD) |
| System RAM | 16 GB DDR4/DDR5 |
| Node.js Runtime | v20.x or higher |
| Python Interpreter | v3.11.x / v3.13.x |
| Target Browser | Headless Chromium (Playwright bundled) |

## 2. Dependency Package Versions

| Dependency Module | Package Version |
| --- | --- |
| `next` | v15.0.0 |
| `playwright` | v1.49.0 |
| `fastapi` | v0.139.0 |
| `uvicorn` | v0.51.0 |
| `opencv-python` | v4.9.0.x or higher |
| `scikit-learn` | v1.4.x or higher |
| `pandas` | v2.2.x or higher |
| `joblib` | v1.3.x or higher |

## 3. Installation Steps

Install the required node modules:
```bash
npm install
```

Install python dependencies:
```bash
pip install numpy pandas scikit-learn joblib fastapi uvicorn pydantic opencv-python httpx
```

## 4. Commands to Reproduce Validation Metrics

Execute the validation testing suite:

1. **Dataset Summary Audit:**
   ```bash
   python tests/validate-dataset.py
   ```
2. **Machine Learning Model Benchmarking:**
   ```bash
   python tests/validate-ml.py
   ```
3. **FastAPI Endpoints payload Fuzzing:**
   ```bash
   python tests/test-api-payloads.py
   ```
4. **URL Security & Exception Handling:**
   ```bash
   npx tsx tests/test-security.ts
   ```
5. **Integrated E2E Pipeline Check:**
   ```bash
   npx tsx tests/test-full-pipeline.ts
   ```
6. **Lighthouse vs axe-core Benchmarking:**
   ```bash
   npx tsx tests/run-benchmarks.ts
   ```
7. **Concurrency Load Stress Testing:**
   ```bash
   npx tsx tests/stress-test.ts
   ```
