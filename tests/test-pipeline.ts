import { captureWebsite } from "../src/lib/engines/playwright-capture";
import { analyzeComputerVision } from "../src/lib/engines/cv-analysis";

async function runPipelineTest() {
  try {
    const url = "https://example.com";
    console.log(`[Pipeline Test] Scaping and Auditing URL: ${url}`);
    
    const captureResults = await captureWebsite(url);
    if (captureResults.length === 0) {
      console.error("[Pipeline Test] Failed to capture page data.");
      process.exit(1);
    }
    
    const pageData = captureResults[0];
    console.log(`[Pipeline Test] Crawl success. Analyzing page via CV engine...`);
    
    const cvResult = analyzeComputerVision(pageData);
    console.log(`[Pipeline Test] CV Engine Analysis Success!`);
    console.log(`----------------------------------------`);
    console.log(`- Visual Hierarchy Score: ${cvResult.visualHierarchyScore}`);
    console.log(`- Spacing/Grid Score: ${cvResult.gridScore}`);
    console.log(`- Typography Score: ${cvResult.typographyScore}`);
    console.log(`- Whitespace Score: ${cvResult.whitespaceScore}`);
    console.log(`- Extracted Image Metrics (OpenCV):`);
    console.log(`   * Whitespace ratio: ${cvResult.imageMetrics?.whitespace}%`);
    console.log(`   * Symmetry score: ${cvResult.imageMetrics?.symmetry}/100`);
    console.log(`   * Layout grid alignment: ${cvResult.imageMetrics?.alignment}%`);
    console.log(`   * Elements overlap count: ${cvResult.imageMetrics?.overlaps}`);
    console.log(`- Generated Issues count: ${cvResult.issues.length}`);
    console.log(`----------------------------------------`);
    
    if (cvResult.imageMetrics && typeof cvResult.imageMetrics.whitespace === "number") {
      console.log("[Pipeline Test] Verification Success: OpenCV image metrics successfully parsed and integrated!");
    } else {
      console.error("[Pipeline Test] Verification Error: imageMetrics are missing or incorrect!");
      process.exit(1);
    }
  } catch (err) {
    console.error("[Pipeline Test] Fatal Exception:", err);
    process.exit(1);
  }
}

runPipelineTest();
