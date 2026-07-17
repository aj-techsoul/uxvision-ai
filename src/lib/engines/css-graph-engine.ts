/**
 * CSS Graph Analysis Engine
 * Parses real fetched CSS stylesheets with graph-based analysis:
 * - Specificity score distribution & !important detection
 * - Color palette extraction with Euclidean clustering
 * - Typography scale ratio analysis
 * - Spacing consistency (4px/8px grid detection)
 * - Media query breakpoint analysis
 * - Animation/transition inventory
 */

import { AuditIssue } from '../db';

export interface CSSGraphResult {
  specificityScore: number;        // 0-100: health of CSS specificity distribution
  importantCount: number;          // number of !important declarations
  totalRules: number;
  colorHarmonyScore: number;       // 0-100: palette consistency via hue clustering
  extractedColors: string[];       // unique hex colors found
  colorClusters: number;           // number of distinct color groups
  typographyScaleScore: number;    // 0-100: adherence to mathematical type scale
  fontSizes: number[];             // extracted font sizes in px
  spacingConsistencyScore: number; // 0-100: grid alignment of spacing values
  spacingValues: number[];         // extracted margin/padding values
  mediaQueryCount: number;         // number of responsive breakpoints
  breakpoints: number[];           // pixel values of breakpoints
  animationCount: number;          // total transitions + keyframes
  transitionProperties: string[];  // list of animated CSS properties
  issues: AuditIssue[];
}

/**
 * Parse CSS specificity from a selector string.
 * Returns tuple [ids, classes, elements]
 */
function calculateSpecificity(selector: string): [number, number, number] {
  // Remove pseudo-elements (::before, ::after) 
  const cleaned = selector.replace(/::[a-zA-Z-]+/g, '');
  
  const ids = (cleaned.match(/#[a-zA-Z_-][a-zA-Z0-9_-]*/g) || []).length;
  const classes = (cleaned.match(/\.[a-zA-Z_-][a-zA-Z0-9_-]*/g) || []).length
    + (cleaned.match(/\[[^\]]+\]/g) || []).length
    + (cleaned.match(/:[a-zA-Z-]+/g) || []).length;
  const elements = (cleaned.match(/(?:^|[\s>+~])([a-zA-Z][a-zA-Z0-9]*)/g) || []).length;

  return [ids, classes, elements];
}

/**
 * Convert hex color to RGB tuple
 */
function hexToRGB(hex: string): [number, number, number] | null {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

/**
 * Convert RGB to HSL
 */
function rgbToHSL(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Euclidean distance between two RGB colors
 */
function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

/**
 * Simple greedy clustering: group colors within Euclidean distance threshold
 */
function clusterColors(rgbColors: [number, number, number][], threshold = 50): [number, number, number][][] {
  const clusters: [number, number, number][][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < rgbColors.length; i++) {
    if (assigned.has(i)) continue;
    
    const cluster: [number, number, number][] = [rgbColors[i]];
    assigned.add(i);

    for (let j = i + 1; j < rgbColors.length; j++) {
      if (assigned.has(j)) continue;
      if (colorDistance(rgbColors[i], rgbColors[j]) < threshold) {
        cluster.push(rgbColors[j]);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Parse a CSS value to pixels (handles px, rem, em)
 */
function parseToPx(value: string): number | null {
  const pxMatch = value.match(/([\d.]+)\s*px/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  
  const remMatch = value.match(/([\d.]+)\s*rem/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  
  const emMatch = value.match(/([\d.]+)\s*em/);
  if (emMatch) return parseFloat(emMatch[1]) * 16;

  const ptMatch = value.match(/([\d.]+)\s*pt/);
  if (ptMatch) return parseFloat(ptMatch[1]) * 1.333;
  
  return null;
}

/**
 * Check if font sizes follow a mathematical type scale ratio
 */
function detectTypeScale(sizes: number[]): { ratio: number; name: string; adherence: number } {
  if (sizes.length < 3) return { ratio: 0, name: 'Insufficient data', adherence: 0 };

  const sorted = [...new Set(sizes)].sort((a, b) => a - b);
  if (sorted.length < 3) return { ratio: 0, name: 'Too few unique sizes', adherence: 0 };

  // Known type scale ratios
  const knownScales = [
    { ratio: 1.067, name: 'Minor Second' },
    { ratio: 1.125, name: 'Major Second' },
    { ratio: 1.200, name: 'Minor Third' },
    { ratio: 1.250, name: 'Major Third' },
    { ratio: 1.333, name: 'Perfect Fourth' },
    { ratio: 1.414, name: 'Augmented Fourth' },
    { ratio: 1.500, name: 'Perfect Fifth' },
    { ratio: 1.618, name: 'Golden Ratio' },
  ];

  let bestMatch = knownScales[0];
  let bestAdherence = 0;

  for (const scale of knownScales) {
    let matchCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const actualRatio = sorted[i] / sorted[i - 1];
      // Allow 15% tolerance
      if (Math.abs(actualRatio - scale.ratio) / scale.ratio < 0.15) {
        matchCount++;
      }
    }
    const adherence = matchCount / (sorted.length - 1);
    if (adherence > bestAdherence) {
      bestAdherence = adherence;
      bestMatch = scale;
    }
  }

  return {
    ratio: bestMatch.ratio,
    name: bestMatch.name,
    adherence: Math.round(bestAdherence * 100),
  };
}

/**
 * Main CSS graph analysis function
 */
export function analyzeCSSGraph(cssContents: string[]): CSSGraphResult {
  const issues: AuditIssue[] = [];
  const combined = cssContents.join('\n');

  // ─── 1. Specificity Analysis ───
  const selectorRegex = /([^{}@]+)\s*\{[^}]*\}/g;
  const specificities: [number, number, number][] = [];
  let totalRules = 0;
  let sMatch;

  while ((sMatch = selectorRegex.exec(combined)) !== null) {
    const selectorGroup = sMatch[1].trim();
    if (selectorGroup.startsWith('@') || selectorGroup.startsWith('from') || selectorGroup.startsWith('to') || /^\d+%/.test(selectorGroup)) continue;
    
    const selectors = selectorGroup.split(',');
    for (const sel of selectors) {
      const trimmed = sel.trim();
      if (trimmed && !trimmed.startsWith('@')) {
        specificities.push(calculateSpecificity(trimmed));
        totalRules++;
      }
    }
  }

  // Count !important declarations
  const importantCount = (combined.match(/!important/gi) || []).length;

  // Specificity health score
  let specificityScore = 90;
  if (importantCount > 10) {
    specificityScore -= Math.min(40, importantCount * 2);
    issues.push({
      id: 'css-important-overuse',
      category: 'visual',
      title: `CSS !important Overuse (${importantCount} declarations)`,
      description: `Found ${importantCount} uses of !important. This creates a "specificity war" making CSS maintenance extremely difficult and indicates architectural problems.`,
      severity: importantCount > 20 ? 'critical' : 'warning',
      scoreImpact: Math.min(10, Math.floor(importantCount / 3)),
      remedy: {
        description: 'Refactor CSS to use proper specificity hierarchy instead of !important overrides.',
        benefit: 'Reduces CSS conflicts and makes styles predictable and maintainable.',
      },
    });
  }

  // Check for overly-specific selectors (more than 2 IDs)
  const highSpecCount = specificities.filter(s => s[0] > 2).length;
  if (highSpecCount > 5) {
    specificityScore -= 15;
  }
  specificityScore = Math.max(10, specificityScore);

  // ─── 2. Color Extraction & Harmony ───
  const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const rgbFuncRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi;
  const rgbaFuncRegex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/gi;
  
  const uniqueHexColors = new Set<string>();
  const rgbColors: [number, number, number][] = [];

  // Extract hex colors
  let cMatch;
  while ((cMatch = hexRegex.exec(combined)) !== null) {
    let hex = cMatch[0].toUpperCase();
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    uniqueHexColors.add(hex);
    const rgb = hexToRGB(hex);
    if (rgb) rgbColors.push(rgb);
  }

  // Extract rgb() colors
  while ((cMatch = rgbFuncRegex.exec(combined)) !== null) {
    const rgb: [number, number, number] = [parseInt(cMatch[1]), parseInt(cMatch[2]), parseInt(cMatch[3])];
    rgbColors.push(rgb);
    const hex = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    uniqueHexColors.add(hex);
  }

  // Extract rgba() colors
  while ((cMatch = rgbaFuncRegex.exec(combined)) !== null) {
    const rgb: [number, number, number] = [parseInt(cMatch[1]), parseInt(cMatch[2]), parseInt(cMatch[3])];
    rgbColors.push(rgb);
  }

  const extractedColors = Array.from(uniqueHexColors).slice(0, 20);
  const clusters = clusterColors(rgbColors, 50);
  const colorClusters = clusters.length;

  // Color harmony: check hue distribution
  let colorHarmonyScore = 75; // default
  if (rgbColors.length >= 3) {
    const hues = rgbColors
      .map(rgb => rgbToHSL(rgb[0], rgb[1], rgb[2])[0])
      .filter(h => h > 0); // exclude pure greys

    if (hues.length >= 2) {
      // Check for analogous (hues within 60°), complementary (opposite on wheel), or triadic patterns
      const sortedHues = [...hues].sort((a, b) => a - b);
      const hueSpread = sortedHues[sortedHues.length - 1] - sortedHues[0];

      if (hueSpread <= 60) {
        // Analogous scheme — harmonious
        colorHarmonyScore = 90;
      } else if (hueSpread >= 150 && hueSpread <= 210) {
        // Complementary scheme — bold but harmonious
        colorHarmonyScore = 85;
      } else if (colorClusters <= 4) {
        // Restrained palette — good
        colorHarmonyScore = 80;
      } else if (colorClusters > 8) {
        // Too many color groups — chaotic
        colorHarmonyScore = 55;
        issues.push({
          id: 'css-color-chaos',
          category: 'visual',
          title: `Chaotic Color Palette (${colorClusters} color clusters)`,
          description: `The CSS contains ${colorClusters} distinct color groups and ${extractedColors.length} unique colors. A cohesive design typically uses 3-5 color clusters.`,
          severity: 'warning',
          scoreImpact: 5,
          remedy: {
            description: 'Consolidate colors into a defined design token system with primary, secondary, accent, and neutral palettes.',
            benefit: 'Creates visual consistency and stronger brand recognition.',
          },
        });
      }
    }
  }

  // ─── 3. Typography Scale ───
  const fontSizeRegex = /font-size\s*:\s*([^;{}]+)/gi;
  const fontSizes: number[] = [];
  let fMatch;
  while ((fMatch = fontSizeRegex.exec(combined)) !== null) {
    const px = parseToPx(fMatch[1].trim());
    if (px && px > 0 && px < 200) fontSizes.push(Math.round(px));
  }

  const typeScale = detectTypeScale(fontSizes);
  const typographyScaleScore = fontSizes.length >= 3
    ? Math.max(30, Math.min(100, 40 + typeScale.adherence * 0.6))
    : 65; // insufficient data = neutral

  if (fontSizes.length >= 3 && typeScale.adherence < 30) {
    issues.push({
      id: 'css-no-type-scale',
      category: 'visual',
      title: 'No Consistent Typography Scale',
      description: `Font sizes don't follow a recognizable mathematical scale (best match: ${typeScale.name} at ${typeScale.adherence}% adherence). Random sizes create an unprofessional visual hierarchy.`,
      severity: 'warning',
      scoreImpact: 5,
      remedy: {
        description: `Adopt a typography scale ratio like Major Third (1.250) or Perfect Fourth (1.333) for consistent visual hierarchy.`,
        benefit: 'Creates a predictable, aesthetically pleasing size progression.',
      },
    });
  }

  // ─── 4. Spacing Consistency ───
  const spacingRegex = /(?:margin|padding|gap)\s*:\s*([^;{}]+)/gi;
  const spacingValues: number[] = [];
  let spMatch;
  while ((spMatch = spacingRegex.exec(combined)) !== null) {
    const parts = spMatch[1].trim().split(/\s+/);
    for (const part of parts) {
      const px = parseToPx(part);
      if (px && px > 0 && px < 500) spacingValues.push(Math.round(px));
    }
  }

  let spacingConsistencyScore = 75;
  if (spacingValues.length >= 5) {
    // Check adherence to a base unit grid (4px or 8px)
    const bases = [4, 8];
    let bestGridAdherence = 0;
    
    for (const base of bases) {
      const onGrid = spacingValues.filter(v => v % base === 0).length;
      const adherence = onGrid / spacingValues.length;
      if (adherence > bestGridAdherence) bestGridAdherence = adherence;
    }

    spacingConsistencyScore = Math.round(bestGridAdherence * 100);

    if (bestGridAdherence < 0.5) {
      issues.push({
        id: 'css-inconsistent-spacing',
        category: 'visual',
        title: 'Inconsistent Spacing System',
        description: `Only ${Math.round(bestGridAdherence * 100)}% of spacing values align to a 4px or 8px grid. Arbitrary spacing values create visual misalignment.`,
        severity: 'info',
        scoreImpact: 3,
        remedy: {
          description: 'Adopt a spacing scale based on multiples of 4px (4, 8, 12, 16, 24, 32, 48, 64).',
          benefit: 'Creates visually consistent layouts with predictable spacing rhythm.',
        },
      });
    }
  }

  // ─── 5. Media Query Breakpoints ───
  const mediaRegex = /@media[^{]*\(\s*(?:max|min)-width\s*:\s*([\d.]+)\s*px\s*\)/gi;
  const breakpoints: number[] = [];
  let mMatch;
  while ((mMatch = mediaRegex.exec(combined)) !== null) {
    const bp = parseFloat(mMatch[1]);
    if (!breakpoints.includes(bp)) breakpoints.push(bp);
  }
  breakpoints.sort((a, b) => a - b);

  if (breakpoints.length === 0 && totalRules > 10) {
    issues.push({
      id: 'css-no-responsive',
      category: 'visual',
      title: 'No Responsive Media Queries',
      description: 'No CSS media queries with width breakpoints were found. The layout may not adapt to mobile, tablet, or different screen sizes.',
      severity: 'critical',
      scoreImpact: 12,
      remedy: {
        description: 'Add responsive breakpoints at 768px (tablet) and 480px (mobile) minimum.',
        fixCode: '@media (max-width: 768px) { /* tablet styles */ }\n@media (max-width: 480px) { /* mobile styles */ }',
        benefit: 'Ensures usable layouts across all device sizes.',
      },
    });
  }

  // ─── 6. Animation & Transition Inventory ───
  const transitionRegex = /transition\s*:[^;{}]+/gi;
  const transitionProperties: string[] = [];
  let tMatch;
  while ((tMatch = transitionRegex.exec(combined)) !== null) {
    const prop = tMatch[0].replace('transition:', '').trim();
    if (!prop.includes('none')) transitionProperties.push(prop);
  }

  const keyframeCount = (combined.match(/@keyframes\s+\w+/gi) || []).length;
  const animationCount = transitionProperties.length + keyframeCount;

  return {
    specificityScore,
    importantCount,
    totalRules,
    colorHarmonyScore,
    extractedColors,
    colorClusters,
    typographyScaleScore,
    fontSizes: [...new Set(fontSizes)].sort((a, b) => a - b),
    spacingConsistencyScore,
    spacingValues: [...new Set(spacingValues)].sort((a, b) => a - b),
    mediaQueryCount: breakpoints.length,
    breakpoints,
    animationCount,
    transitionProperties,
    issues,
  };
}
