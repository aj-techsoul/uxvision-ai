import { captureWebsite } from "../src/lib/engines/playwright-capture";
import * as os from "os";

async function runConcurrencyStressTest() {
  const targetUrl = "https://example.com";
  const concurrencies = [5, 10];
  
  console.log("[Stress Test] Starting concurrency evaluation on target:", targetUrl);
  console.log(`System Profile: ${os.type()} | CPU Cores: ${os.cpus().length} | Total Memory: ${(os.totalmem() / (1024**3)).toFixed(1)} GB`);
  
  for (const threads of concurrencies) {
    console.log(`\n----------------------------------------`);
    console.log(`Evaluating Concurrency Level: ${threads} simultaneous tasks`);
    console.log(`----------------------------------------`);
    
    const memStart = process.memoryUsage().heapUsed / (1024**2);
    const t0 = Date.now();
    
    // Spawn threads tasks
    const promises = Array.from({ length: threads }).map(async (_, idx) => {
      try {
        const result = await captureWebsite(targetUrl);
        return { task: idx + 1, success: result.length > 0 };
      } catch (err) {
        return { task: idx + 1, success: false, error: err };
      }
    });
    
    const results = await Promise.all(promises);
    const latency = Date.now() - t0;
    const memEnd = process.memoryUsage().heapUsed / (1024**2);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = threads - successCount;
    
    console.log(`Results for ${threads} Threads:`);
    console.log(`- Success Rate: ${successCount} / ${threads} (${(successCount / threads * 100).toFixed(0)}%)`);
    console.log(`- Fail Rate: ${failCount} / ${threads}`);
    console.log(`- Total Duration: ${(latency / 1000).toFixed(2)} seconds`);
    console.log(`- Average Task Latency: ${(latency / threads).toFixed(0)} ms`);
    console.log(`- Memory Impact: +${(memEnd - memStart).toFixed(2)} MB Heap usage`);
  }
  
  console.log("\n[Stress Test] Concurrency stress test audit completed!");
}

runConcurrencyStressTest();
