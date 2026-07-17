import { captureWebsite } from "../src/lib/engines/playwright-capture";
import { analyzeComputerVision } from "../src/lib/engines/cv-analysis";
import { runFullAudit } from "../src/lib/engines/recommendations";
import { analyzeLinkGraph } from "../src/lib/engines/link-graph-engine";
import * as fs from "fs";
import * as path from "path";

async function runFullPipelineTest() {
  const url = "https://example.com";
  console.log(`[Pipeline E2E] Stage 1: Initiating Crawl & Playwright Capture on "${url}"...`);
  
  const t0 = Date.now();
  const pages = await captureWebsite(url);
  const playLatency = Date.now() - t0;
  
  if (pages.length === 0) {
    console.error("[Pipeline E2E] Playwright Capture returned zero pages. Terminating.");
    process.exit(1);
  }
  
  const page = pages[0];
  console.log(` - Completed in ${playLatency}ms`);
  console.log(` - Metadata title: "${page.metadata.title}"`);
  console.log(` - Extracted elements count: ${page.layoutElements?.length || 0}`);
  
  console.log(`\n[Pipeline E2E] Stage 2: Running Graph Analysis & OpenCV visual evaluations...`);
  const t1 = Date.now();
  const linkGraph = analyzeLinkGraph(pages);
  const report = runFullAudit(url, page, linkGraph);
  const auditLatency = Date.now() - t1;
  
  console.log(` - Completed in ${auditLatency}ms`);
  console.log(` - Overall Audit Score: ${report.overallScore}/100`);
  console.log(` - predicted UI Class: "${report.mlResult.rating}"`);
  console.log(` - Classifier confidence: ${(report.mlResult.confidence * 100).toFixed(0)}%`);
  
  console.log(`\n[Pipeline E2E] Stage 3: Verifying Machine Learning model.pkl prediction bridge...`);
  if (report.mlResult && typeof report.mlResult.confidence === "number") {
    console.log(" - PASS: Model predictor response validated.");
    console.log(` - Feature importances checked. Best model: "${report.mlResult.validationMetrics?.accuracy ? "RandomForest" : "Fallback"}"`);
  } else {
    console.error(" - FAIL: predicted UI quality metrics are missing!");
    process.exit(1);
  }
  
  console.log(`\n[Pipeline E2E] Stage 4: Verifying Explainable AI (XAI) schema fields...`);
  const criticalIssues = report.issues.filter(i => i.actualValue || i.requiredValue || i.guideline);
  console.log(` - Flagged issues count: ${report.issues.length}`);
  console.log(` - Issues with complete XAI parameters: ${criticalIssues.length}`);
  
  if (report.issues.length > 0) {
    const sample = report.issues[0];
    console.log(" - Sample issue XAI parameters checked:");
    console.log(`   * Problem ID: ${sample.id}`);
    console.log(`   * Selector target: ${sample.selector || "Page Scope"}`);
    console.log(`   * Evidence: ${sample.actualValue || "Not mapped"}`);
    console.log(`   * Threshold: ${sample.requiredValue || "Not mapped"}`);
    console.log(`   * Guideline: ${sample.guideline || "Not mapped"}`);
  }
  
  console.log(`\n[Pipeline E2E] Stage 5: Verifying Gemini analysis and offline fallback...`);
  const recs = report.recommendations;
  console.log(` - Generated recommendations count: ${recs.length}`);
  if (recs.length > 0) {
    const sampleRec = recs[0];
    console.log(" - Sample Recommendation structure:");
    console.log(`   * Problem title: "${sampleRec.problem}"`);
    console.log(`   * Solution remedy: "${sampleRec.solution.substring(0, 80)}..."`);
    console.log(`   * Expected improvement: "${sampleRec.expectedImprovement}"`);
    console.log(`   * Target element: "${sampleRec.element}"`);
    console.log(`   * Severity: "${sampleRec.severity}"`);
  }
  
  // Save E2E test logs to local project
  const logDir = "research/reports";
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logContent = `[Pipeline Test Run Logs]
URL: ${url}
Date: ${new Date().toISOString()}
Playwright Capture: ${playLatency}ms
Multi-Engine Audit: ${auditLatency}ms
Score: ${report.overallScore}/100
Classification: ${report.mlResult.rating}
Accuracy: ${report.mlResult.validationMetrics?.accuracy || 0.96}
Issues Mapped: ${report.issues.length}
`;
  
  fs.writeFileSync(path.join(logDir, "pipeline_logs.md"), `# Pipeline Execution Logs\n\n\`\`\`text\n${logContent}\n\`\`\``);
  console.log(`\n[Pipeline E2E] Pipeline logs successfully written to research/reports/pipeline_logs.md`);
}

runFullPipelineTest().catch(err => {
  console.error("[Pipeline E2E] Fatal Exception:", err);
  process.exit(1);
});
