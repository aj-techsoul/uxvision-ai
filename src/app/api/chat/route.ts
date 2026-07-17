import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { reportContext, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = reportContext?.url || "the audited site";
    const overallScore = reportContext?.overallScore || 0;
    const subScores = JSON.stringify(reportContext?.subScores || {}, null, 2);
    const issues = JSON.stringify(
      (reportContext?.issues || []).map((i: any) => ({
        category: i.category,
        title: i.title,
        description: i.description,
        selector: i.selector,
        remedy: i.remedy?.description
      })),
      null,
      2
    );

    const systemPrompt = `You are a helpful and experienced UX/UI and accessibility auditing assistant. 
The user is viewing their website audit report for "${url}".
Here is the audit context:
- Overall Score: ${overallScore}/100
- Dimension Subscores:
${subScores}

- Detected Usability & Accessibility Issues:
${issues}

Use this context to answer the user's questions. Offer concise, actionable UX/UI recommendations, CSS layout guidelines, or semantic HTML fixes. Make your answers professional, friendly, and formatted in clear markdown.`;

    if (apiKey) {
      console.log(`[Gemini Chat] Querying assistant for user question on: ${url}`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Question: "${message}"` }]
            }
          ]
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I could not formulate an answer right now.";
        return NextResponse.json({ text });
      } else {
        console.warn("[Gemini Chat] API returned error status:", response.status);
      }
    }

    // Fallback: Local rule-based chat responder if no API key is set
    console.log("[Gemini Chat] Using local rule-based fallback response.");
    let text = `I'm currently running in **offline fallback mode** because no Google Gemini API key is configured. 

Based on your audit for **${url}** (Score: **${overallScore}/100**):
`;

    const msgLower = message.toLowerCase();
    if (msgLower.includes("contrast") || msgLower.includes("color")) {
      text += `
* Your report lists low-contrast elements. WCAG 2.2 requires at least a **4.5:1 ratio** for body text and **3:1** for UI elements.
* I suggest increasing the brightness of text or dark background layers.
* Specifically, look at: \`#main-cta\` or body text nodes.`;
    } else if (msgLower.includes("accessibility") || msgLower.includes("a11y") || msgLower.includes("wcag")) {
      text += `
* The primary accessibility challenges on this page concern heading hierarchy compliance and alt descriptors.
* Ensure all \`<img>\` tags have descriptive, non-empty \`alt="..."\` tags.
* Ensure headings follow a clean sequential ordering (e.g. H1 followed by H2, not skipping to H3).`;
    } else if (msgLower.includes("spacing") || msgLower.includes("alignment") || msgLower.includes("grid") || msgLower.includes("overlap")) {
      text += `
* We noticed elements crossing bounding thresholds causing partial visual overlaps.
* I highly recommend using standard CSS grids with predefined paddings (like 8px spacing rules) instead of manual pixel absolute offsets.`;
    } else {
      text += `
* You have **${(reportContext?.issues || []).length}** total flagged visual or accessibility alerts.
* Try asking specifically about "color contrast", "accessibility", or "spacing and overlaps" for detailed tips!`;
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Chat Endpoint Error:", error);
    return NextResponse.json({ error: "Internal Server Error in chat assistant" }, { status: 500 });
  }
}
