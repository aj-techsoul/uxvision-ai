/**
 * Recommendations & Full Audit Orchestrator (Upgraded)
 * 
 * Integrates all analysis engines:
 * - CV Analysis (visual design, contrast, responsive)
 * - NLP Analysis (readability, SEO, CTA)
 * - Accessibility Engine (WCAG compliance)
 * - Heuristics Engine (Nielsen's 10 heuristics)
 * - DOM Graph Engine (tree depth, semantic coverage, diversity)
 * - CSS Graph Engine (specificity, color harmony, type scale, spacing)
 * - Link Graph Engine (PageRank, navigation depth, orphans)
 * - ML Model (15-feature sigmoid classifier)
 */

import { CapturedData } from './playwright-capture';
import { analyzeComputerVision } from './cv-analysis';
import { analyzeNLP } from './nlp-analysis';
import { analyzeAccessibility } from './accessibility-engine';
import { evaluateHeuristics } from './heuristics-engine';
import { analyzeDOMGraph, DOMGraphResult } from './dom-graph-engine';
import { analyzeCSSGraph, CSSGraphResult } from './css-graph-engine';
import { analyzeLinkGraph, LinkGraphResult } from './link-graph-engine';
import { predictUIQuality, getModelEvaluationMetrics, FeatureVector } from './ml-model';
import { AuditReport, AuditIssue, Recommendation, CarouselSlide, VideoScene } from '../db';

export function runFullAudit(
  url: string,
  data: CapturedData,
  linkGraphResult?: LinkGraphResult,
): AuditReport {
  // ─── Run all analysis engines ───
  
  // 1. DOM Graph Analysis (new)
  const domGraph = analyzeDOMGraph(data.html);
  
  // 2. CSS Graph Analysis (new)
  const cssGraph = analyzeCSSGraph(data.css);
  
  // 3. CV Analysis (upgraded — now receives CSS graph data)
  const cvResult = analyzeComputerVision(data, cssGraph);
  
  // 4. NLP Analysis
  const nlpResult = analyzeNLP(data);
  
  // 5. Accessibility Engine
  const a11yResult = analyzeAccessibility(data);
  
  // 6. Heuristics Engine
  const heurResult = evaluateHeuristics(data);

  // ─── Merge all detected issues from all engines ───
  const allIssues: AuditIssue[] = [
    ...cvResult.issues,
    ...nlpResult.issues,
    ...a11yResult.issues,
    ...heurResult.issues,
    ...domGraph.issues,
    ...cssGraph.issues,
    ...(linkGraphResult?.issues || []),
  ];

  // ─── Compute sub-scores with graph engine integration ───
  
  // Accessibility: blend a11y engine with DOM heading hierarchy and semantic coverage
  const accessibility = Math.round(
    a11yResult.accessibilityScore * 0.5 +
    domGraph.headingHierarchyScore * 0.25 +
    domGraph.semanticCoverageScore * 0.25
  );

  // Visual Design: blend CV hierarchy with CSS specificity health and color harmony
  const visualDesign = Math.round(
    cvResult.visualHierarchyScore * 0.4 +
    cssGraph.colorHarmonyScore * 0.3 +
    cssGraph.specificityScore * 0.15 +
    domGraph.elementDiversityScore * 0.15
  );

  // Navigation: blend heuristics with link graph navigation depth
  const linkNavScore = linkGraphResult?.navigationDepthScore ?? 75;
  const navigation = Math.round(
    (heurResult.scores.userControl * 0.3) +
    (heurResult.scores.visibilityStatus * 0.2) +
    (linkNavScore * 0.5)
  );

  // Typography: from CSS graph type scale analysis
  const typography = Math.round(
    cssGraph.typographyScaleScore * 0.6 +
    cvResult.typographyScore * 0.4
  );

  // Consistency: blend heuristics with CSS spacing consistency
  const consistency = Math.round(
    heurResult.scores.consistencyStandards * 0.5 +
    cssGraph.spacingConsistencyScore * 0.5
  );

  // Usability: heuristics overall
  const usability = heurResult.overallHeuristicScore;

  // Color: from contrast pass rate + CSS color harmony
  const totalContrast = cvResult.contrastScores.length;
  const passedContrast = cvResult.contrastScores.filter(c => c.pass).length;
  const contrastPassRate = totalContrast > 0 ? (passedContrast / totalContrast) * 100 : 80;
  const color = Math.round(contrastPassRate * 0.6 + cssGraph.colorHarmonyScore * 0.4);

  // Mobile: responsive score from CSS graph breakpoints
  const mobile = cvResult.responsiveScore;

  // Performance: DOM depth + element count + CSS efficiency
  const domSizePenalty = Math.max(0, Math.min(30, (domGraph.totalElements - 500) / 100));
  const cssEfficiency = cssGraph.importantCount > 20 ? 60 : 90;
  const performance = Math.round(
    Math.max(30, Math.min(99,
      domGraph.treeDepthScore * 0.3 +
      cssEfficiency * 0.3 +
      (100 - domSizePenalty) * 0.2 +
      (cssGraph.mediaQueryCount > 0 ? 85 : 55) * 0.2
    ))
  );

  // ─── Calculate Overall UX Score (weighted average of all sub-scores) ───
  const overallScore = Math.round(
    (accessibility * 0.18) +
    (visualDesign * 0.13) +
    (usability * 0.16) +
    (mobile * 0.12) +
    (color * 0.08) +
    (navigation * 0.10) +
    (performance * 0.08) +
    (typography * 0.05) +
    (consistency * 0.05) +
    (domGraph.elementDiversityScore * 0.03) +
    (domGraph.semanticCoverageScore * 0.02)
  );

  // ─── Feed expanded 15-feature vector into ML classifier ───
  const features: FeatureVector = {
    accessibilityScore: accessibility,
    visualDesignScore: visualDesign,
    typographyScore: typography,
    readabilityScore: nlpResult.readabilityScore,
    gridScore: cvResult.gridScore,
    contrastRatio: cvResult.contrastScores[0]?.ratio || 4.5,
    performanceScore: performance,
    domDepthScore: domGraph.treeDepthScore,
    semanticCoverage: domGraph.semanticCoverageScore,
    elementDiversity: domGraph.elementDiversityScore,
    headingHierarchy: domGraph.headingHierarchyScore,
    linkGraphScore: linkNavScore,
    cssSpecificityHealth: cssGraph.specificityScore,
    colorHarmony: cssGraph.colorHarmonyScore,
    spacingConsistency: cssGraph.spacingConsistencyScore,
  };

  const mlPrediction = predictUIQuality(features);
  const mlEvaluation = getModelEvaluationMetrics(features);

  const mlResult = {
    rating: mlPrediction.rating,
    confidence: mlPrediction.confidence,
    features: Object.entries(features).map(([name, value]) => ({
      name: name.replace(/([A-Z])/g, ' $1').trim(),
      value,
      weight: mlPrediction.weights[name as keyof typeof mlPrediction.weights] || 0,
    })),
    validationMetrics: mlEvaluation,
  };

  // ─── Generate structured recommendations ───
  const recommendations: Recommendation[] = allIssues.map((issue, idx) => {
    const confidence = mlResult.confidence;
    const confidenceLevel = confidence >= 0.90 ? "Very High" : confidence >= 0.75 ? "High" : "Moderate";

    return {
      id: `rec-${idx + 1}`,
      issueId: issue.id,
      category: issue.category.toUpperCase(),
      problem: issue.title,
      reason: issue.description,
      solution: issue.remedy.description + (issue.remedy.fixCode
        ? `\n\nCode repair solution:\n\`\`\`html\n${issue.remedy.fixCode}\n\`\`\`` : ''),
      expectedImprovement: `+${issue.scoreImpact}% UI quality impact`,
      impactScore: issue.scoreImpact,
      element: issue.selector || "Viewport / Page Scope",
      actualValue: issue.actualValue || "Failed Check",
      requiredValue: issue.requiredValue || "Pass Criteria",
      guideline: issue.guideline || (issue.category === "accessibility" ? "WCAG 2.2 AA" : "Nielsen Heuristics"),
      confidence: confidence,
      confidenceLevel: confidenceLevel,
      severity: issue.severity
    };
  });

  // ─── Site Niche & Dynamic Descriptions ───
  const titleLower = (data.metadata.title || '').toLowerCase();
  const descLower = (data.metadata.description || '').toLowerCase();
  const urlLower = url.toLowerCase();

  let siteNiche = 'web interface';
  if (urlLower.includes('shop') || urlLower.includes('store') || titleLower.includes('shop') || descLower.includes('buy') || descLower.includes('product')) {
    siteNiche = 'e-commerce catalog';
  } else if (urlLower.includes('blog') || titleLower.includes('blog') || descLower.includes('article') || descLower.includes('news')) {
    siteNiche = 'editorial blog';
  } else if (urlLower.includes('edu') || titleLower.includes('university') || titleLower.includes('college') || descLower.includes('education')) {
    siteNiche = 'educational institution portal';
  } else if (urlLower.includes('gov') || titleLower.includes('government') || descLower.includes('government')) {
    siteNiche = 'government services portal';
  } else if (urlLower.includes('portfolio') || titleLower.includes('portfolio')) {
    siteNiche = 'creative portfolio';
  } else if (titleLower.includes('saas') || titleLower.includes('dashboard') || descLower.includes('platform') || descLower.includes('software')) {
    siteNiche = 'SaaS application dashboard';
  } else if (descLower.includes('documentation') || urlLower.includes('docs')) {
    siteNiche = 'technical documentation hub';
  }

  const layoutDensity = domGraph.totalElements > 500
    ? 'highly complex and dense'
    : domGraph.totalElements > 100
      ? 'moderate complexity'
      : 'minimalist and highly focused';

  let ratingJustification = '';
  if (mlResult.rating === 'Excellent') {
    ratingJustification = `The AI rated this interface as Excellent (${overallScore}/100) because it exhibits top-tier WCAG accessibility compliance (${accessibility}/100), strong DOM structural health (depth score: ${domGraph.treeDepthScore}/100), and consistent CSS design tokens (specificity: ${cssGraph.specificityScore}/100).`;
  } else if (mlResult.rating === 'Good') {
    ratingJustification = `The AI rated this interface as Good (${overallScore}/100) because it shows solid foundations across ${domGraph.semanticTagsUsed.length} semantic tags with ${cssGraph.mediaQueryCount} responsive breakpoints. Minor improvements in ${color < 80 ? 'color contrast' : 'accessibility'} would push it to Excellent.`;
  } else if (mlResult.rating === 'Average') {
    const weakAreas = [];
    if (accessibility < 70) weakAreas.push(`accessibility (${accessibility}/100)`);
    if (color < 60) weakAreas.push(`color contrast (${color}/100)`);
    if (mobile < 70) weakAreas.push(`mobile responsiveness (${mobile}/100)`);
    if (domGraph.semanticCoverageScore < 50) weakAreas.push(`semantic HTML coverage (${domGraph.semanticCoverageScore}/100)`);
    ratingJustification = `The AI rated this interface as Average (${overallScore}/100). Key weaknesses: ${weakAreas.join(', ') || 'general design inconsistencies'}.`;
  } else {
    ratingJustification = `The AI rated this interface as ${mlResult.rating} (${overallScore}/100) due to ${allIssues.length} design defects including critical issues in mobile layout (${mobile}/100) and accessibility (${accessibility}/100).`;
  }

  // ─── Generate Carousel Slides ───
  const carousel: CarouselSlide[] = [
    {
      title: `UI/UX Audit: ${url.replace(/https?:\/\/(www\.)?/, '')}`,
      subtitle: 'Generated by UXVision AI — Deep Graph Analysis',
      points: [
        `Overall UX Quality: ${mlResult.rating} (${Math.round(mlResult.confidence * 100)}% Confidence)`,
        `Calculated UX Score: ${overallScore}/100`,
        `Analyzed ${domGraph.totalElements} DOM elements across ${domGraph.uniqueTags} tag types`,
        `Detected ${allIssues.length} design system infractions.`,
      ],
      type: 'intro',
    },
    {
      title: 'Score Breakdown',
      subtitle: 'Visual & Compliance Metrics',
      points: [
        `Accessibility & WCAG: ${accessibility}/100`,
        `Visual Design & Contrast: ${visualDesign}/100`,
        `Usability & Heuristics: ${usability}/100`,
        `Mobile Responsiveness: ${mobile}/100`,
      ],
      type: 'stats',
      metric: { label: 'Overall Score', value: `${overallScore}` },
    },
  ];

  const topIssues = allIssues.slice(0, 2);
  topIssues.forEach((issue, idx) => {
    carousel.push({
      title: `UX Issue #${idx + 1}: ${issue.title}`,
      subtitle: `${issue.category.toUpperCase()} INFRACTION - SEVERITY: ${issue.severity.toUpperCase()}`,
      points: [issue.description, `Remedy: ${issue.remedy.description}`],
      type: 'comparison',
      beforeText: issue.codeSnippet || 'Original configuration has compliance error.',
      afterText: issue.remedy.fixCode || issue.remedy.targetValue || 'Updated configuration satisfying rule checks.',
    });
  });

  carousel.push({
    title: `Action Plan for ${url.replace(/https?:\/\/(www\.)?/, '')}`,
    subtitle: `REPAIR CHECKLIST FOR ${siteNiche.toUpperCase()}`,
    points: [
      `Fixing ${allIssues.length} detected alerts will elevate the UI quality class.`,
      accessibility < 80 ? 'Prioritize WCAG accessibility fixes for screen reader compliance.' : 'Maintain high compliance standard for visually impaired users.',
      mobile < 70 ? 'Add responsive CSS breakpoints to prevent mobile layout breakage.' : 'Review responsive grids for cross-device consistency.',
      'Track optimization progress on the UXVision dashboard.',
    ],
    type: 'outro',
  });

  // ─── Generate Video Script Timeline ───
  const voiceoverScript = `
    Welcome to the automated UI/UX deep analysis for the ${siteNiche} at ${url.replace(/https?:\/\/(www\.)?/, '')}.
    We performed a comprehensive graph-based audit analyzing ${domGraph.totalElements} DOM elements, ${cssGraph.totalRules} CSS rules, and ${cssGraph.extractedColors.length} unique colors.
    ${ratingJustification}
    The DOM structure has a maximum depth of ${domGraph.maxDepth} levels with ${domGraph.semanticTagsUsed.length} semantic HTML5 tags.
    CSS analysis found ${cssGraph.mediaQueryCount} responsive breakpoints and ${cssGraph.animationCount} animation declarations.
    By implementing the recommended fixes, the overall UX score can improve by up to ${allIssues.reduce((sum, i) => sum + i.scoreImpact, 0)} points.
  `.replace(/\s+/g, ' ').trim();

  const timeline: VideoScene[] = [
    {
      sceneId: 1,
      title: 'Introduction & ML Rating',
      durationSeconds: 10,
      narration: `This is the deep graph analysis report for ${url.replace(/https?:\/\/(www\.)?/, '')}. Our 15-feature ML classifier predicted a ${mlResult.rating} rating with ${overallScore}/100 score across ${domGraph.totalElements} DOM elements.`,
      visualCue: 'Show desktop viewport with animated score cards.',
      highlightedSection: 'header',
    },
    {
      sceneId: 2,
      title: 'Visual Design & CSS Graph Analysis',
      durationSeconds: 15,
      narration: `CSS graph analysis found ${cssGraph.extractedColors.length} unique colors in ${cssGraph.colorClusters} palette clusters. Typography follows ${cssGraph.fontSizes.length} distinct sizes. Specificity health: ${cssGraph.specificityScore}/100.`,
      visualCue: 'Zoom into color palette grid and typography scale visualization.',
      highlightedSection: 'main',
    },
    {
      sceneId: 3,
      title: 'DOM Structure & Accessibility',
      durationSeconds: 15,
      narration: `The DOM tree reaches ${domGraph.maxDepth} levels deep with ${domGraph.uniqueTags} unique tag types. Semantic coverage: ${domGraph.semanticCoverageScore}/100. ${a11yResult.issues[0]?.description || 'Accessibility structure is solid.'}`,
      visualCue: 'Show DOM tree depth visualization and heading hierarchy.',
      highlightedSection: 'body',
    },
    {
      sceneId: 4,
      title: 'Optimization Steps & Conclusion',
      durationSeconds: 10,
      narration: `Implementing the ${allIssues.length} recommended fixes will improve the ${siteNiche} by up to ${allIssues.reduce((sum, i) => sum + i.scoreImpact, 0)} score points.`,
      visualCue: 'Show before/after comparison card.',
      highlightedSection: 'footer',
    },
  ];

  const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: reportId,
    url,
    timestamp: new Date().toISOString(),
    overallScore,
    subScores: {
      accessibility,
      visualDesign,
      navigation,
      typography,
      consistency,
      usability,
      color,
      mobile,
      performance,
    },
    issues: allIssues,
    recommendations,
    mlResult,
    carousel,
    videoScript: {
      timeline,
      voiceoverScript,
    },
    screenshots: data.screenshots,
  };
}
