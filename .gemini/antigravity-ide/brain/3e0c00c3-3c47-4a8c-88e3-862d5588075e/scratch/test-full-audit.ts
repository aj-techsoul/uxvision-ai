import { captureWebsite } from "../../src/lib/engines/playwright-capture";
import { runFullAudit } from "../../src/lib/engines/recommendations";

async function main() {
  const url = "https://google.com";
  console.log(`Auditing ${url}...`);
  const data = await captureWebsite(url);
  const report = runFullAudit(url, data);
  console.log(`Score: ${report.overallScore}`);
  console.log(`Subscores:`, report.subScores);
  console.log(`Issues count: ${report.issues.length}`);
}

main().catch(console.error);
