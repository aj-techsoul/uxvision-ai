import { NextRequest, NextResponse } from "next/server";
import { captureWebsite } from "@/lib/engines/playwright-capture";
import { runFullAudit } from "@/lib/engines/recommendations";
import { analyzeLinkGraph } from "@/lib/engines/link-graph-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    console.log("API POST /api/analyze called with URL:", url);

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required." },
        { status: 400 }
      );
    }

    // Normalize URL format
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    console.log(`[Crawl Pipeline] Initializing HTTP-based BFS crawl on: ${targetUrl}`);
    
    // Phase 1: Run BFS crawler — fetches real HTML/CSS from up to 5 pages
    const crawledPagesData = await captureWebsite(targetUrl);
    
    if (crawledPagesData.length === 0) {
      return NextResponse.json(
        { error: "Could not fetch any pages from the provided URL. The site may be down, blocking requests, or the URL may be invalid." },
        { status: 422 }
      );
    }
    
    console.log(`[Crawl Pipeline] Crawled ${crawledPagesData.length} real pages. Running graph analysis engines...`);

    // Phase 2: Run Link Graph Analysis across all crawled pages
    const linkGraphResult = analyzeLinkGraph(crawledPagesData);
    console.log(`[Crawl Pipeline] Link graph: ${linkGraphResult.totalInternalLinks} internal links, ${linkGraphResult.orphanPages.length} orphan pages, max depth: ${linkGraphResult.maxDepth}`);

    // Phase 3: Run individual full sub-analyses for each crawled page
    const pageReports = crawledPagesData.map(page =>
      runFullAudit(page.url, page, linkGraphResult)
    );

    // Phase 4: Compile dynamic pagesScanned array
    const pagesScanned = pageReports.map((report, idx) => ({
      url: report.url,
      score: report.overallScore,
      interactiveStatesScanned: crawledPagesData[idx].interactiveStatesScanned || {
        tabsFound: 0,
        buttonsWithHoverTransitions: 0
      },
      screenshots: report.screenshots,
      subScores: report.subScores,
      issues: report.issues
    }));

    // Phase 5: Calculate aggregated overall score and subscores as averages
    const pageCount = pageReports.length;
    const aggregatedSubScores = {
      accessibility: 0,
      visualDesign: 0,
      navigation: 0,
      typography: 0,
      consistency: 0,
      usability: 0,
      color: 0,
      mobile: 0,
      performance: 0
    };

    pageReports.forEach(report => {
      aggregatedSubScores.accessibility += report.subScores.accessibility;
      aggregatedSubScores.visualDesign += report.subScores.visualDesign;
      aggregatedSubScores.navigation += report.subScores.navigation;
      aggregatedSubScores.typography += report.subScores.typography;
      aggregatedSubScores.consistency += report.subScores.consistency;
      aggregatedSubScores.usability += report.subScores.usability;
      aggregatedSubScores.color += report.subScores.color;
      aggregatedSubScores.mobile += report.subScores.mobile;
      aggregatedSubScores.performance += report.subScores.performance;
    });

    const subScores = {
      accessibility: Math.round(aggregatedSubScores.accessibility / pageCount),
      visualDesign: Math.round(aggregatedSubScores.visualDesign / pageCount),
      navigation: Math.round(aggregatedSubScores.navigation / pageCount),
      typography: Math.round(aggregatedSubScores.typography / pageCount),
      consistency: Math.round(aggregatedSubScores.consistency / pageCount),
      usability: Math.round(aggregatedSubScores.usability / pageCount),
      color: Math.round(aggregatedSubScores.color / pageCount),
      mobile: Math.round(aggregatedSubScores.mobile / pageCount),
      performance: Math.round(aggregatedSubScores.performance / pageCount)
    };

    const overallScore = Math.round(
      pageReports.reduce((sum, r) => sum + r.overallScore, 0) / pageCount
    );

    // Phase 6: Merge and deduplicate all issues & recommendations
    const uniqueIssues = new Map<string, any>();
    const uniqueRecommendations = new Map<string, any>();

    pageReports.forEach(report => {
      report.issues.forEach(issue => {
        if (!uniqueIssues.has(issue.id)) {
          uniqueIssues.set(issue.id, issue);
        }
      });
      report.recommendations.forEach(rec => {
        if (!uniqueRecommendations.has(rec.issueId)) {
          uniqueRecommendations.set(rec.issueId, rec);
        }
      });
    });

    // Also add link graph issues (cross-page analysis)
    linkGraphResult.issues.forEach(issue => {
      if (!uniqueIssues.has(issue.id)) {
        uniqueIssues.set(issue.id, issue);
      }
    });

    const issues = Array.from(uniqueIssues.values());
    const recommendations = Array.from(uniqueRecommendations.values()).map((rec, index) => ({
      ...rec,
      id: `rec-${index + 1}`
    }));

    // Option: Direct Gemini API recommendation compilation
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && issues.length > 0) {
      try {
        console.log(`[Gemini API] Requesting AI solutions for ${issues.length} layout/UX infractions on: ${targetUrl}`);
        const prompt = `You are an expert UX/UI designer and accessibility developer. We have audited the website "${targetUrl}" and detected these design issues:
${JSON.stringify(issues.map(i => ({ id: i.id, title: i.title, description: i.description, selector: i.selector })), null, 2)}

Provide context-aware solutions and CSS/HTML code corrections. Return your response strictly as a JSON array matching the structure:
[
  {
    "issueId": "string matching target issue ID",
    "solutionDescription": "step-by-step repair instruction",
    "remedyCode": "css or html snippet to resolve it",
    "remedyBenefit": "expected visual or screen-reader benefit"
  }
]`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (geminiRes.ok) {
          const resJson = await geminiRes.json();
          const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const remedies = JSON.parse(responseText.trim());
            console.log(`[Gemini API] Successfully parsed ${remedies.length} AI redesign corrections.`);
            
            remedies.forEach((rem: any) => {
              const targetIssue = issues.find(i => i.id === rem.issueId);
              if (targetIssue) {
                targetIssue.remedy = {
                  description: rem.solutionDescription || targetIssue.remedy.description,
                  fixCode: rem.remedyCode || targetIssue.remedy.fixCode,
                  benefit: rem.remedyBenefit || targetIssue.remedy.benefit
                };
              }
            });

            // Re-map recommendations with new Gemini details
            recommendations.length = 0;
            issues.forEach((issue, idx) => {
              recommendations.push({
                id: `rec-${idx + 1}`,
                issueId: issue.id,
                category: issue.category.toUpperCase(),
                problem: issue.title,
                reason: issue.description,
                solution: issue.remedy.description + (issue.remedy.fixCode
                  ? `\n\nCode repair solution:\n\`\`\`html\n${issue.remedy.fixCode}\n\`\`\`` : ''),
                expectedImprovement: issue.remedy.benefit,
                impactScore: issue.scoreImpact,
              });
            });
          }
        } else {
          console.warn("[Gemini API] Failed to fetch. Status code:", geminiRes.status);
        }
      } catch (geminiErr) {
        console.error("[Gemini API] Enrichment failed, using rule fallbacks:", geminiErr);
      }
    }

    const exploration = (crawledPagesData as any).exploration;

    // Construct the aggregated report payload
    const aggregatedReport = {
      ...pageReports[0],
      overallScore,
      pagesScanned,
      subScores,
      issues,
      recommendations,
      exploration
    };

    console.log(`[Crawl Pipeline] Pipeline complete. Overall Score: ${overallScore}/100 | Pages: ${pageCount} | Issues: ${issues.length} | ML Rating: ${pageReports[0].mlResult.rating}`);
    return NextResponse.json(aggregatedReport);
  } catch (error: any) {
    console.error("API Audit Failure:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error running audit crawler pipeline." },
      { status: 500 }
    );
  }
}
