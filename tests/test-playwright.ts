import { captureWebsite } from "../src/lib/engines/playwright-capture";
import * as fs from "fs";
import * as path from "path";

async function runTest() {
  try {
    const url = "https://example.com";
    console.log(`[Test] Starting Playwright capture for: ${url}`);
    
    const results = await captureWebsite(url);
    
    console.log(`[Test] Capture completed. Scraped ${results.length} page(s).`);
    
    if (results.length > 0) {
      const pageData = results[0];
      console.log(`- Page URL: ${pageData.url}`);
      console.log(`- Title: ${pageData.metadata.title}`);
      console.log(`- Headings: ${pageData.metadata.headings.join(", ")}`);
      console.log(`- CSS Rules extracted: ${pageData.css.length}`);
      console.log(`- DOM Layout Elements captured: ${pageData.layoutElements?.length}`);
      console.log(`- Desktop Screenshot length: ${pageData.screenshots.desktop.substring(0, 50)}...`);
      console.log(`- Tablet Screenshot length: ${pageData.screenshots.tablet.substring(0, 50)}...`);
      console.log(`- Mobile Screenshot length: ${pageData.screenshots.mobile.substring(0, 50)}...`);
      console.log(`- Accessibility tree root tag: ${JSON.stringify(pageData.accessibilityTree).substring(0, 100)}...`);
      
      // Save verification file
      const outDir = path.resolve(process.cwd(), "tests/outputs");
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(outDir, "playwright-output-verify.json"),
        JSON.stringify({
          url: pageData.url,
          title: pageData.metadata.title,
          cssCount: pageData.css.length,
          layoutElementsCount: pageData.layoutElements?.length,
          hasDesktopScreenshot: !!pageData.screenshots.desktop,
          hasTabletScreenshot: !!pageData.screenshots.tablet,
          hasMobileScreenshot: !!pageData.screenshots.mobile,
          hasAccessibilityTree: !!pageData.accessibilityTree
        }, null, 2)
      );
      console.log(`[Test] Verification JSON saved to tests/outputs/playwright-output-verify.json`);
    } else {
      console.error("[Test] Error: No pages scraped!");
      process.exit(1);
    }
  } catch (err) {
    console.error("[Test] Crash:", err);
    process.exit(1);
  }
}

runTest();
