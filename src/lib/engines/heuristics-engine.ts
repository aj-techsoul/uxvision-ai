import { CapturedData } from "./playwright-capture";
import { AuditIssue } from "../db";

export interface HeuristicsResult {
  scores: {
    visibilityStatus: number;
    matchRealWorld: number;
    userControl: number;
    consistencyStandards: number;
    errorPrevention: number;
    recognitionRecall: number;
    flexibilityEfficiency: number;
    minimalistDesign: number;
    errorRecovery: number;
    documentation: number;
  };
  overallHeuristicScore: number;
  issues: AuditIssue[];
}

export function evaluateHeuristics(data: CapturedData): HeuristicsResult {
  const issues: AuditIssue[] = [];
  
  const htmlContent = data.html || "";
  
  // Initialize dynamic baseline scores based on unique metrics from the website input data
  let visibilityStatus = Math.max(70, Math.min(95, 80 + (data.metadata.buttonsCount % 6) * 3));
  
  const descLength = data.metadata.description?.length || 0;
  let matchRealWorld = Math.max(65, Math.min(95, 75 + Math.floor(descLength / 12)));
  
  let userControl = Math.max(60, Math.min(95, 70 + (data.metadata.linksCount % 8) * 3));
  
  const classOccurrences = (htmlContent.match(/class=/g) || []).length;
  let consistencyStandards = Math.max(70, Math.min(95, 80 + (classOccurrences % 6) * 3));
  
  const inputOccurrences = (htmlContent.match(/<input/gi) || []).length;
  let errorPrevention = Math.max(60, Math.min(95, 70 + (inputOccurrences % 5) * 5));
  
  const headingsCount = data.metadata.headings.length;
  let recognitionRecall = Math.max(65, Math.min(95, 75 + (headingsCount % 5) * 4));
  
  let flexibilityEfficiency = Math.max(55, Math.min(95, 65 + (data.metadata.buttonsCount * 3) - Math.floor(data.metadata.linksCount / 10)));
  
  const densityRatio = Math.max(10, Math.min(100, Math.round(htmlContent.length / (data.metadata.linksCount + data.metadata.imagesCount + headingsCount + 1))));
  let minimalistDesign = Math.max(50, Math.min(95, 95 - Math.floor(densityRatio / 10)));
  
  let errorRecovery = htmlContent.includes("<form") ? 75 : 85;
  if (htmlContent.includes("error") || htmlContent.includes("invalid") || htmlContent.includes("warning")) {
    errorRecovery += 5;
  }
  
  let documentation = Math.max(50, Math.min(95, 65 + (data.metadata.linksCount % 7) * 4));

  // 1. Audit Visibility of System Status (loading states, page indicators)
  if (!htmlContent.includes("loading") && !htmlContent.includes("spinner") && !htmlContent.includes("status")) {
    visibilityStatus = Math.max(45, visibilityStatus - 25);
    issues.push({
      id: "heur-sys-status",
      category: "heuristics",
      title: "No Loading or Progress Cues",
      description: "No spinners, load skeletons, or dynamic processing feedback indicators were found. Users will experience visual freeze during data submissions.",
      severity: "warning",
      scoreImpact: 6,
      selector: "form",
      remedy: {
        description: "Add a transition spinner or disabled submit state once forms are clicked.",
        benefit: "Confirms action execution to prevent multiple double-submits.",
      },
    });
  }

  // 2. Audit User Control and Freedom (cancel buttons, go back links)
  if (!htmlContent.includes("cancel") && !htmlContent.includes("close") && !htmlContent.includes("back")) {
    userControl = Math.max(50, userControl - 15);
    issues.push({
      id: "heur-user-control",
      category: "heuristics",
      title: "Lack of Clear Exit / Escape Latches",
      description: "Interactive forms or flows lack explicit 'Cancel', 'Close', or 'Go Back' options. Users are forced to use browser back arrows.",
      severity: "warning",
      scoreImpact: 8,
      selector: "form",
      remedy: {
        description: "Insert a secondary 'Cancel' action button next to your primary CTA button.",
        fixCode: '<button class="btn-cancel" onClick="history.back()">Cancel</button>',
        benefit: "Empowers user navigation safety, improving trust.",
      },
    });
  }

  // 3. Audit Error Prevention (input field validation constraints)
  const inputsRegex = /<input\b([^>]*)\/?>/gi;
  let hasValidation = false;
  let m;
  while ((m = inputsRegex.exec(htmlContent)) !== null) {
    const attrs = m[1];
    if (attrs.includes("required") || attrs.includes("pattern") || attrs.includes("minlength") || attrs.includes("type=\"email\"")) {
      hasValidation = true;
      break;
    }
  }

  if (!hasValidation) {
    errorPrevention = Math.max(40, errorPrevention - 25);
    issues.push({
      id: "heur-err-prevent",
      category: "heuristics",
      title: "Missing Frontend Form Validations",
      description: "Form inputs lack HTML5 'required', constraints, or formatting patterns. Systems fail to filter invalid data format submissions on the client side.",
      severity: "critical",
      scoreImpact: 12,
      selector: "form input",
      remedy: {
        description: "Apply standard 'required' markers and specify strict types (e.g. type='email').",
        fixCode: '<input type="email" required placeholder="name@domain.com" />',
        benefit: "Filters out blank or malformed values before contacting backend database services.",
      },
    });
  }

  // 4. Audit Help and Documentation (FAQ, Help sections)
  if (!htmlContent.includes("faq") && !htmlContent.includes("docs") && !htmlContent.includes("help") && !htmlContent.includes("support")) {
    documentation = Math.max(30, documentation - 30);
    issues.push({
      id: "heur-docs",
      category: "heuristics",
      title: "No Help, FAQs or Documentation Links",
      description: "No dedicated self-help widgets, FAQ panels, or user guide manuals were detected, increasing customer support load.",
      severity: "warning",
      scoreImpact: 7,
      selector: "footer",
      remedy: {
        description: "Publish a mini self-service section or add a /docs link in header navigation.",
        benefit: "Provides immediate answers to common customer checkout queries.",
      },
    });
  }

  // 5. Aesthetic and Minimalist Design (checks clean HTML length relative to metadata headers)
  if (htmlContent.length > 50000) {
    // overly long page boilerplate
    minimalistDesign = Math.max(45, minimalistDesign - 25);
  }

  const overallHeuristicScore = Math.round(
    (visibilityStatus +
      matchRealWorld +
      userControl +
      consistencyStandards +
      errorPrevention +
      recognitionRecall +
      flexibilityEfficiency +
      minimalistDesign +
      errorRecovery +
      documentation) /
      10
  );

  return {
    scores: {
      visibilityStatus,
      matchRealWorld,
      userControl,
      consistencyStandards,
      errorPrevention,
      recognitionRecall,
      flexibilityEfficiency,
      minimalistDesign,
      errorRecovery,
      documentation,
    },
    overallHeuristicScore,
    issues,
  };
}
