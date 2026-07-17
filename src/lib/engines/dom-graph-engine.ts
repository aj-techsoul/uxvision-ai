/**
 * DOM Graph Analysis Engine
 * Parses HTML into a tree structure and runs graph-based scoring algorithms:
 * - Tree depth analysis
 * - Heading hierarchy validation
 * - Semantic tag coverage
 * - Element diversity (Shannon entropy)
 * - Interactive element density
 * - Nesting complexity (branching factor)
 */

import { AuditIssue } from '../db';

export interface DOMNode {
  tag: string;
  depth: number;
  children: DOMNode[];
  attributes: Record<string, string>;
  isInteractive: boolean;
  isSemantic: boolean;
}

export interface DOMGraphResult {
  treeDepthScore: number;         // 0-100: penalizes too flat (< 5) or too deep (> 25)
  maxDepth: number;
  avgDepth: number;
  headingHierarchyScore: number;  // 0-100: sequential H1->H2->H3 ordering
  semanticCoverageScore: number;  // 0-100: usage of semantic HTML5 tags
  elementDiversityScore: number;  // 0-100: Shannon entropy of tag distribution
  interactiveDensity: number;     // ratio of interactive to total elements
  branchingFactor: number;        // average children per non-leaf node
  totalElements: number;
  uniqueTags: number;
  semanticTagsUsed: string[];
  issues: AuditIssue[];
}

const SEMANTIC_TAGS = new Set([
  'nav', 'main', 'article', 'section', 'aside', 'footer', 'header',
  'figure', 'figcaption', 'details', 'summary', 'mark', 'time',
  'dialog', 'menu',
]);

const INTERACTIVE_TAGS = new Set([
  'a', 'button', 'input', 'select', 'textarea', 'details', 'summary',
  'label', 'option', 'datalist',
]);

/**
 * Lightweight HTML tag counter and structure analyzer.
 * Uses regex-based extraction rather than full DOM parsing
 * for server-side compatibility.
 */
export function analyzeDOMGraph(html: string): DOMGraphResult {
  const issues: AuditIssue[] = [];

  // ─── 1. Tag frequency extraction ───
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  const tagCounts: Record<string, number> = {};
  let totalElements = 0;
  let interactiveCount = 0;
  const semanticTagsUsed: Set<string> = new Set();
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    // Skip non-element tags
    if (tag === 'br' || tag === 'hr' || tag === 'meta' || tag === 'link' || tag === '!doctype') continue;
    
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    totalElements++;

    if (INTERACTIVE_TAGS.has(tag)) interactiveCount++;
    if (SEMANTIC_TAGS.has(tag)) semanticTagsUsed.add(tag);
  }

  const uniqueTags = Object.keys(tagCounts).length;

  // ─── 2. Tree Depth Analysis ───
  // Approximate nesting depth by tracking open/close tag balance
  let currentDepth = 0;
  let maxDepth = 0;
  let depthSum = 0;
  let depthSamples = 0;

  const openCloseRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const selfClosingTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);
  
  while ((match = openCloseRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tag = match[1].toLowerCase();
    
    if (selfClosingTags.has(tag) || fullTag.endsWith('/>')) continue;
    
    if (fullTag.startsWith('</')) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else {
      currentDepth++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;
      depthSum += currentDepth;
      depthSamples++;
    }
  }

  const avgDepth = depthSamples > 0 ? depthSum / depthSamples : 0;

  // Tree depth score: ideal range is 8-15
  let treeDepthScore: number;
  if (maxDepth >= 8 && maxDepth <= 15) {
    treeDepthScore = 95;
  } else if (maxDepth >= 5 && maxDepth <= 20) {
    treeDepthScore = 80;
  } else if (maxDepth < 5) {
    treeDepthScore = Math.max(30, 60 - (5 - maxDepth) * 10);
    issues.push({
      id: 'dom-flat-structure',
      category: 'visual',
      title: 'Overly Flat DOM Structure',
      description: `The DOM tree has a maximum depth of only ${maxDepth} levels. This suggests a lack of proper component nesting and semantic grouping, which hurts maintainability and screen reader navigation.`,
      severity: 'warning',
      scoreImpact: 5,
      remedy: {
        description: 'Wrap related content blocks in semantic containers like <section>, <article>, <nav>.',
        benefit: 'Improves code organization and accessibility tree structure.',
      },
    });
  } else {
    // maxDepth > 20
    treeDepthScore = Math.max(40, 85 - (maxDepth - 20) * 5);
    issues.push({
      id: 'dom-deep-nesting',
      category: 'performance',
      title: 'Excessive DOM Nesting Depth',
      description: `The DOM tree reaches ${maxDepth} levels deep. Deeply nested elements increase rendering time, CSS selector complexity, and memory consumption.`,
      severity: maxDepth > 30 ? 'critical' : 'warning',
      scoreImpact: maxDepth > 30 ? 12 : 6,
      remedy: {
        description: 'Flatten component hierarchies by removing unnecessary wrapper divs.',
        benefit: 'Reduces browser layout/paint time and improves CSS performance.',
      },
    });
  }

  // ─── 3. Heading Hierarchy Validation ───
  const headingRegex = /<(h[1-6])\b[^>]*>/gi;
  const headingLevels: number[] = [];
  while ((match = headingRegex.exec(html)) !== null) {
    headingLevels.push(parseInt(match[1].charAt(1)));
  }

  let headingHierarchyScore = 100;
  let headingSkips = 0;
  let hasMultipleH1 = 0;

  for (let i = 0; i < headingLevels.length; i++) {
    if (headingLevels[i] === 1) hasMultipleH1++;
    if (i > 0 && headingLevels[i] > headingLevels[i - 1] + 1) {
      headingSkips++;
    }
  }

  if (headingLevels.length === 0) {
    headingHierarchyScore = 40;
    issues.push({
      id: 'dom-no-headings',
      category: 'accessibility',
      title: 'No Heading Elements Found',
      description: 'The page lacks heading tags entirely. Headings provide document structure for screen readers and improve SEO crawlability.',
      severity: 'critical',
      scoreImpact: 15,
      remedy: {
        description: 'Add at least an H1 for the page title and H2s for major sections.',
        benefit: 'Creates navigable document outline for assistive technologies.',
      },
    });
  } else {
    if (headingSkips > 0) {
      headingHierarchyScore -= headingSkips * 15;
      issues.push({
        id: 'dom-heading-skip',
        category: 'accessibility',
        title: `Heading Level Skips Detected (${headingSkips} skip${headingSkips > 1 ? 's' : ''})`,
        description: `Found ${headingSkips} instance(s) where heading levels jump (e.g., H1 to H3, skipping H2). This breaks the document outline for screen readers.`,
        severity: 'warning',
        scoreImpact: 5,
        remedy: {
          description: 'Ensure headings follow sequential order: H1 → H2 → H3 → H4.',
          benefit: 'Screen readers can parse the page structure map correctly.',
        },
      });
    }
    if (hasMultipleH1 > 1) {
      headingHierarchyScore -= 10;
      issues.push({
        id: 'dom-multiple-h1',
        category: 'accessibility',
        title: `Multiple H1 Tags Found (${hasMultipleH1})`,
        description: `The page contains ${hasMultipleH1} H1 elements. Best practice is a single H1 representing the primary document title.`,
        severity: 'info',
        scoreImpact: 3,
        remedy: {
          description: 'Consolidate to a single H1 and use H2+ for subsections.',
          benefit: 'Clarifies the primary topic for search engines and screen readers.',
        },
      });
    }
    if (headingLevels[0] !== 1) {
      headingHierarchyScore -= 10;
    }
  }
  headingHierarchyScore = Math.max(0, headingHierarchyScore);

  // ─── 4. Semantic Tag Coverage ───
  const totalPossibleSemantic = SEMANTIC_TAGS.size;
  const semanticRatio = semanticTagsUsed.size / totalPossibleSemantic;
  let semanticCoverageScore = Math.round(semanticRatio * 100);

  // Bonus: if at least nav, main, footer, header are present
  const essentialSemantic = ['nav', 'main', 'footer', 'header'];
  const essentialCount = essentialSemantic.filter(t => semanticTagsUsed.has(t)).length;
  semanticCoverageScore = Math.round(semanticCoverageScore * 0.5 + (essentialCount / essentialSemantic.length) * 50);

  if (essentialCount < 2) {
    issues.push({
      id: 'dom-low-semantic',
      category: 'accessibility',
      title: 'Low Semantic HTML5 Tag Usage',
      description: `Only ${semanticTagsUsed.size} of ${totalPossibleSemantic} semantic HTML5 tags are used (${Array.from(semanticTagsUsed).join(', ') || 'none'}). Missing essential structural tags like <main>, <nav>, <header>, <footer>.`,
      severity: essentialCount === 0 ? 'critical' : 'warning',
      scoreImpact: 8,
      remedy: {
        description: 'Replace generic <div> wrappers with appropriate semantic elements.',
        benefit: 'Improves accessibility, SEO ranking, and code maintainability.',
      },
    });
  }

  // ─── 5. Element Diversity (Shannon Entropy) ───
  // Higher entropy = more diverse tag usage. Pure <div> soup = low entropy
  let entropy = 0;
  if (totalElements > 0) {
    for (const tag of Object.keys(tagCounts)) {
      const probability = tagCounts[tag] / totalElements;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }
  }
  // Normalize entropy: maximum possible entropy is log2(uniqueTags)
  const maxPossibleEntropy = uniqueTags > 1 ? Math.log2(uniqueTags) : 1;
  const normalizedEntropy = maxPossibleEntropy > 0 ? entropy / maxPossibleEntropy : 0;
  const elementDiversityScore = Math.round(normalizedEntropy * 100);

  // Check for div-soup
  const divCount = tagCounts['div'] || 0;
  const divRatio = totalElements > 0 ? divCount / totalElements : 0;
  if (divRatio > 0.5) {
    issues.push({
      id: 'dom-div-soup',
      category: 'visual',
      title: 'Div Soup Detected',
      description: `${Math.round(divRatio * 100)}% of elements are <div> tags (${divCount} out of ${totalElements}). This indicates poor semantic markup and makes the codebase harder to maintain.`,
      severity: 'warning',
      scoreImpact: 5,
      remedy: {
        description: 'Replace <div> elements with appropriate semantic tags where possible.',
        benefit: 'Improves code readability, accessibility, and SEO.',
      },
    });
  }

  // ─── 6. Interactive Element Density ───
  const interactiveDensity = totalElements > 0 ? interactiveCount / totalElements : 0;

  // ─── 7. Branching Factor ───
  // Approximate: total elements / (total elements - leaf elements)
  // Leaf elements are those without children (self-closing or elements that typically don't nest)
  const leafTags = new Set(['img', 'input', 'br', 'hr', 'textarea', 'select', 'source', 'embed', 'track', 'wbr', 'p', 'span', 'li']);
  let leafCount = 0;
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (leafTags.has(tag)) leafCount += count;
  }
  const nonLeafCount = Math.max(1, totalElements - leafCount);
  const branchingFactor = parseFloat((totalElements / nonLeafCount).toFixed(2));

  return {
    treeDepthScore,
    maxDepth,
    avgDepth: parseFloat(avgDepth.toFixed(1)),
    headingHierarchyScore,
    semanticCoverageScore,
    elementDiversityScore,
    interactiveDensity: parseFloat(interactiveDensity.toFixed(4)),
    branchingFactor,
    totalElements,
    uniqueTags,
    semanticTagsUsed: Array.from(semanticTagsUsed),
    issues,
  };
}
