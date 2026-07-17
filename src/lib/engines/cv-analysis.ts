/**
 * Computer Vision & Visual Design Analysis Engine (Upgraded)
 * 
 * Now works with real fetched CSS data instead of string-matching on HTML.
 * Integrates with CSS Graph Engine for color harmony, contrast computation,
 * whitespace analysis, and layout grid detection.
 */

import { CapturedData } from './playwright-capture';
import { AuditIssue } from '../db';
import { CSSGraphResult } from './css-graph-engine';
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface CVImageMetrics {
  Whitespace: number;
  Symmetry: number;
  Alignment: number;
  Overlap: number;
}

export interface CVAnalysisResult {
  colorPalette: string[];
  contrastScores: { element: string; ratio: number; pass: boolean }[];
  visualHierarchyScore: number;
  whitespaceScore: number;
  gridScore: number;
  typographyScore: number;
  responsiveScore: number;
  issues: AuditIssue[];
  imageMetrics?: {
    whitespace: number;
    symmetry: number;
    alignment: number;
    overlaps: number;
  };
}

export function runOpenCVVisualAnalysis(screenshotBase64: string): CVImageMetrics {
  try {
    const base64Content = screenshotBase64.includes("base64,")
      ? screenshotBase64.split("base64,")[1]
      : screenshotBase64;
      
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `uxvision-cv-${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Content, "base64"));
    
    const scriptPath = path.resolve(process.cwd(), "python/cv/visual_analyzer.py");
    const cmd = `python "${scriptPath}" "${tempFilePath}"`;
    const stdout = execSync(cmd, { encoding: "utf8", timeout: 10000 });
    
    try { fs.unlinkSync(tempFilePath); } catch {}
    
    const metrics = JSON.parse(stdout.trim());
    return {
      Whitespace: typeof metrics.Whitespace === "number" ? metrics.Whitespace : 65,
      Symmetry: typeof metrics.Symmetry === "number" ? metrics.Symmetry : 75,
      Alignment: typeof metrics.Alignment === "number" ? metrics.Alignment : 80,
      Overlap: typeof metrics.Overlap === "number" ? metrics.Overlap : 0
    };
  } catch (err) {
    console.error("[CV Bridge] OpenCV visual analysis failure, using local defaults:", err);
    return {
      Whitespace: 68,
      Symmetry: 82,
      Alignment: 76,
      Overlap: 0
    };
  }
}

// Convert Hex to Relative Luminance (WCAG formula)
function getLuminance(hex: string): number {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
  } catch {
    return 4.5;
  }
}

/**
 * Extract foreground/background color pairs from CSS for contrast checking.
 * Looks for real CSS rules that set both color and background-color.
 */
function extractColorPairs(cssContents: string[], html: string): { element: string; text: string; bg: string }[] {
  const pairs: { element: string; text: string; bg: string }[] = [];
  const combined = cssContents.join('\n');

  // Extract rule blocks: selector { properties }
  const ruleRegex = /([^{}@]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(combined)) !== null) {
    const selector = match[1].trim();
    const properties = match[2];

    if (selector.startsWith('@') || selector.startsWith('from') || selector.startsWith('to')) continue;

    const colorMatch = properties.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})\b/i);
    const bgMatch = properties.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})\b/i);

    if (colorMatch && bgMatch) {
      pairs.push({
        element: selector.length > 30 ? selector.substring(0, 27) + '...' : selector,
        text: colorMatch[1],
        bg: bgMatch[1],
      });
    }
  }

  // Also check inline styles in HTML
  const inlineRegex = /style\s*=\s*"([^"]*color\s*:[^"]*)"/gi;
  while ((match = inlineRegex.exec(html)) !== null) {
    const style = match[1];
    const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/i);
    const bgMatch = style.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i);
    if (colorMatch && bgMatch) {
      pairs.push({
        element: 'Inline Style Element',
        text: colorMatch[1],
        bg: bgMatch[1],
      });
    }
  }

  // If we found no explicit pairs, create a test against common body text assumptions
  if (pairs.length === 0) {
    // Try to find body/page background
    const bodyBgMatch = combined.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i)
      || html.match(/body[^>]*style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i);
    const bodyColorMatch = combined.match(/body\s*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/i);

    const bg = bodyBgMatch ? bodyBgMatch[1] : '#FFFFFF';
    const text = bodyColorMatch ? bodyColorMatch[1] : '#333333';
    pairs.push({ element: 'Body Text', text, bg });
  }

  return pairs.slice(0, 8); // Limit to 8 pairs
}

/**
 * Main CV analysis function — upgraded to work with real CSS data
 */
export function analyzeComputerVision(data: CapturedData, cssGraph?: CSSGraphResult): CVAnalysisResult {
  const issues: AuditIssue[] = [];
  const seenIds = new Set<string>();
  const pushIssue = (issue: AuditIssue) => {
    if (!seenIds.has(issue.id)) {
      seenIds.add(issue.id);
      issues.push(issue);
    }
  };

  const htmlContent = data.html || '';
  const cssList = (data.css || []).filter((c): c is string => typeof c === 'string' && c !== '');

  // ─── Spawns OpenCV Python visual metrics analyzer ───
  const cvMetrics = data.screenshots?.desktop 
    ? runOpenCVVisualAnalysis(data.screenshots.desktop)
    : { Whitespace: 65, Symmetry: 80, Alignment: 75, Overlap: 0 };

  // ─── 1. Color Palette from real CSS data ───
  let colorPalette: string[];
  if (cssGraph && cssGraph.extractedColors.length >= 3) {
    colorPalette = cssGraph.extractedColors.slice(0, 8);
  } else {
    // Extract directly from CSS contents
    const foundColors = new Set<string>();
    const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
    cssList.forEach(css => {
      const matches = css.match(hexRegex);
      if (matches) matches.forEach(c => foundColors.add(c.toUpperCase()));
    });
    const htmlMatches = htmlContent.match(hexRegex);
    if (htmlMatches) htmlMatches.forEach(c => foundColors.add(c.toUpperCase()));
    colorPalette = Array.from(foundColors).slice(0, 8);

    if (colorPalette.length < 2) {
      colorPalette = ['#0F172A', '#FFFFFF', '#3B82F6', '#94A3B8', '#1E293B'];
    }
  }

  // ─── 2. Contrast Ratio Checks on real color pairs ───
  const colorPairs = extractColorPairs(cssList, htmlContent);
  const contrastScores = colorPairs.map(pair => {
    const ratio = getContrastRatio(pair.text, pair.bg);
    const pass = ratio >= 4.5;

    if (!pass) {
      pushIssue({
        id: `cv-contrast-${pair.element.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`,
        category: 'visual',
        title: `Low Contrast: ${pair.element}`,
        description: `The contrast ratio of ${ratio}:1 between text color (${pair.text}) and background (${pair.bg}) is below the WCAG 2.2 AA requirement of 4.5:1.`,
        severity: ratio < 3 ? 'critical' : 'warning',
        scoreImpact: ratio < 3 ? 12 : 6,
        selector: pair.element,
        codeSnippet: `color: ${pair.text}; background: ${pair.bg}; /* ratio: ${ratio}:1 */`,
        remedy: {
          description: 'Adjust text or background color to achieve at least 4.5:1 contrast ratio.',
          benefit: 'Ensures text is readable for users with visual impairments (WCAG 2.2 AA).',
        },
        actualValue: `${ratio}:1`,
        requiredValue: '4.5:1',
        guideline: 'WCAG 2.2 AA (1.4.3 Contrast Minimum)'
      });
    }

    return { element: pair.element, ratio, pass };
  });

  // ─── 3. Grid & Spacing Score ───
  let gridScore: number;
  if (cssGraph) {
    gridScore = cssGraph.spacingConsistencyScore;
  } else {
    // Fallback: check for flex/grid usage
    const hasGap = cssList.some(c => c.includes('gap:') || c.includes('gap :'));
    const hasFlex = cssList.some(c => c.includes('display: flex') || c.includes('display:flex'));
    const hasGrid = cssList.some(c => c.includes('display: grid') || c.includes('display:grid'));
    gridScore = (hasFlex || hasGrid) ? (hasGap ? 85 : 65) : 50;
  }
  // Fuse with OpenCV alignment index
  gridScore = Math.round((gridScore * 0.4) + (cvMetrics.Alignment * 0.6));

  // ─── 4. Responsive Score ───
  let responsiveScore: number;
  if (cssGraph) {
    if (cssGraph.mediaQueryCount >= 3) responsiveScore = 92;
    else if (cssGraph.mediaQueryCount >= 1) responsiveScore = 72;
    else responsiveScore = 40;
  } else {
    const hasMediaQuery = cssList.some(c => c.includes('@media'));
    const hasFlexWrap = cssList.some(c => c.includes('flex-wrap'));
    responsiveScore = hasMediaQuery ? (hasFlexWrap ? 85 : 70) : 45;

    if (!hasMediaQuery) {
      pushIssue({
        id: 'cv-responsive-wrap',
        category: 'visual',
        title: 'No Responsive Layout Detected',
        description: 'No CSS media queries or responsive layout patterns found. The layout may break on mobile and tablet screens.',
        severity: 'critical',
        scoreImpact: 15,
        remedy: {
          description: 'Add responsive breakpoints and flexible layout patterns.',
          fixCode: '@media (max-width: 768px) { .container { flex-direction: column; } }',
          benefit: 'Prevents layout overflow and clipping on mobile viewports.',
        },
        actualValue: '0 media queries',
        requiredValue: '>= 3 breakpoints',
        guideline: 'Mobile Responsiveness Hierarchy'
      });
    }
  }

  // ─── 5. Typography Score ───
  let typographyScore: number;
  if (cssGraph) {
    typographyScore = cssGraph.typographyScaleScore;
  } else {
    typographyScore = 70; // neutral when no data
  }

  // ─── 6. Whitespace Score ───
  let whitespaceScore: number = cvMetrics.Whitespace;

  // ─── 7. Real Geometric Layout Audits using element bounding boxes ───
  const layoutElements = data.layoutElements || [];
  let overlapCount = 0;
  let misalignmentCount = 0;

  for (let i = 0; i < layoutElements.length; i++) {
    const el1 = layoutElements[i];
    const box1 = el1.box;

    // Check 8px alignment
    const isXAligned = box1.x % 8 === 0 || box1.x % 4 === 0;
    const isYAligned = box1.y % 8 === 0 || box1.y % 4 === 0;
    if (!isXAligned && !isYAligned && el1.tag !== 'body' && el1.tag !== 'html') {
      misalignmentCount++;
      if (misalignmentCount <= 2) {
        pushIssue({
          id: `cv-grid-align-${el1.selector.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${box1.x}-${box1.y}`,
          category: 'visual',
          title: `Off-Grid Alignment: ${el1.selector}`,
          description: `Element is positioned at (${box1.x}px, ${box1.y}px), which does not align with a standard 8px layout grid.`,
          severity: 'info',
          scoreImpact: 3,
          selector: el1.selector,
          remedy: {
            description: 'Snap element position or margins to the nearest multiple of 8px.',
            fixCode: `${el1.selector} { margin-left: ${Math.round(box1.x / 8) * 8}px; }`,
            benefit: 'Implements consistent visual alignment and grid discipline.'
          },
          actualValue: `(${box1.x}px, ${box1.y}px)`,
          requiredValue: 'Multiple of 8px or 4px',
          guideline: '8px Visual Layout Grid'
        });
      }
    }

    // Check collisions with other elements
    for (let j = i + 1; j < layoutElements.length; j++) {
      const el2 = layoutElements[j];
      if (el1.selector === el2.selector) continue;
      const box2 = el2.box;

      const overlapX = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x));
      const overlapY = Math.max(0, Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y));
      const overlapArea = overlapX * overlapY;

      if (overlapArea > 0) {
        const area1 = box1.width * box1.height;
        const area2 = box2.width * box2.height;
        
        // Neither contains the other fully
        const isNested = (overlapArea >= 0.9 * area1) || (overlapArea >= 0.9 * area2);
        
        if (!isNested) {
          overlapCount++;
          if (overlapCount <= 2) {
            pushIssue({
              id: `cv-overlap-${el1.selector.replace(/[^a-z0-9]/g, '-')}-${el2.selector.replace(/[^a-z0-9]/g, '-')}-${box1.x}-${box1.y}`,
              category: 'visual',
              title: `Visual Element Collision Detected`,
              description: `Collision overlap of ${overlapArea}px² detected between element ${el1.selector} and ${el2.selector}. Elements may obscure each other.`,
              severity: 'critical',
              scoreImpact: 10,
              selector: `${el1.selector}, ${el2.selector}`,
              remedy: {
                description: 'Adjust positioning, display layouts (e.g. block/flex), or adjust margins to prevent overlaps.',
                fixCode: `${el1.selector} { position: relative; margin-bottom: 16px; }`,
                benefit: 'Avoids visual text overlaps and maintains layout integrity.'
              },
              actualValue: `${overlapArea}px² overlap`,
              requiredValue: '0px² overlap',
              guideline: 'Layout Collision Free Constraint'
            });
          }
        }
      }
    }
  }

  // Adjust visual scores based on real defects
  if (overlapCount > 0) {
    gridScore = Math.max(30, gridScore - (overlapCount * 12));
  }
  if (misalignmentCount > 0) {
    typographyScore = Math.max(40, typographyScore - (misalignmentCount * 4));
  }

  // ─── 8. Visual Hierarchy Score ───
  const visualHierarchyScore = Math.round(
    (typographyScore * 0.3) + (gridScore * 0.3) + (whitespaceScore * 0.2) + (cvMetrics.Symmetry * 0.2)
  );

  return {
    colorPalette,
    contrastScores,
    visualHierarchyScore,
    whitespaceScore,
    gridScore,
    typographyScore,
    responsiveScore,
    issues,
    imageMetrics: {
      whitespace: cvMetrics.Whitespace,
      symmetry: cvMetrics.Symmetry,
      alignment: cvMetrics.Alignment,
      overlaps: cvMetrics.Overlap
    }
  };
}
