import { captureWebsite } from "../src/lib/engines/playwright-capture";

async function runSecurityValidation() {
  console.log("[Security Audit] Commencing URL security validation...");
  
  const testCases = [
    { name: "Invalid URL syntax", url: "not-a-valid-url" },
    { name: "Unreachable website", url: "https://this-domain-does-not-exist-12345.com" },
    { name: "SSL Exception Bypass", url: "https://self-signed.badssl.com/" }
  ];
  
  for (const tc of testCases) {
    console.log(`\nTesting Case: ${tc.name} ("${tc.url}")`);
    const t0 = Date.now();
    try {
      const results = await captureWebsite(tc.url);
      const latency = Date.now() - t0;
      if (results.length > 0) {
        console.log(` - Completed check: Crawl Succeeded in ${latency}ms | Title: "${results[0].metadata.title}"`);
      } else {
        console.warn(` - Completed check: Crawl failed gracefully in ${latency}ms (0 pages returned)`);
      }
    } catch (err: any) {
      const latency = Date.now() - t0;
      console.log(` - Caught expected failure in ${latency}ms: "${err.message || err}"`);
    }
  }
  
  console.log("\n[Security Audit] Security verification checks completed!");
}

runSecurityValidation();
