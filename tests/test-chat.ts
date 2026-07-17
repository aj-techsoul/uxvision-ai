import { POST } from "../src/app/api/chat/route";
import { NextRequest } from "next/server";

// Simple test check for api/chat handler
async function runChatTest() {
  try {
    console.log("[Chat Test] Formulating Mock request to /api/chat endpoint...");
    
    // Create a mock Request
    const body = {
      reportContext: {
        url: "https://example.com",
        overallScore: 78,
        subScores: {
          accessibility: 85,
          visualDesign: 70,
          navigation: 90
        },
        issues: [
          {
            id: "cv-contrast-123",
            category: "visual",
            title: "Low contrast on hero heading",
            description: "Contrast ratio of 2.8:1 is below the WCAG 4.5:1 guideline."
          }
        ]
      },
      message: "How can I fix the low contrast issue on my page?"
    };

    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const response = await POST(req as any);
    const resBody = await response.json();
    
    console.log("[Chat Test] Received Response:");
    console.log(`- Status: ${response.status}`);
    console.log(`- Response Text:\n${resBody.text}`);
    
    if (response.status === 200 && resBody.text.includes("contrast")) {
      console.log("[Chat Test] Success: Chat handler is fully functional!");
    } else {
      console.error("[Chat Test] Error: Response is empty or incorrect!");
      process.exit(1);
    }
  } catch (err) {
    console.error("[Chat Test] Fatal Exception:", err);
    process.exit(1);
  }
}

runChatTest();
