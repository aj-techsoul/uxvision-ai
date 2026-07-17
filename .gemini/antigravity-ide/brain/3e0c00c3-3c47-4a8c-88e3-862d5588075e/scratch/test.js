function getDomainHash(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getFallbackAuditData(url) {
  const parsedDomain = url.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
  const hash = getDomainHash(parsedDomain);

  const hasAltBug = hash % 2 === 0;       // 50% of sites have missing alt tags
  const hasLabelBug = hash % 3 !== 0;     // 66% of sites have input label bugs
  const hasHeadingBug = hash % 4 !== 0;   // 75% of sites have heading skips
  const hasContrastBug = hash % 5 !== 1;  // 80% of sites have button contrast failures

  return {
    url,
    hasAltBug,
    hasLabelBug,
    hasHeadingBug,
    hasContrastBug,
    hash
  };
}

// Replicate analyzeAccessibility
function analyzeAccessibility(url, data) {
  let score = 100;
  let totalImgs = 1;
  let missingAlt = data.hasAltBug ? 1 : 0;

  if (url.includes("example.com") || url.includes("test")) {
    totalImgs = Math.max(totalImgs, 1);
    missingAlt = Math.max(missingAlt, 1);
  }

  if (missingAlt > 0) {
    score -= (missingAlt / totalImgs) * 30;
  }

  // Check for form inputs missing labels
  // HTML has: data.hasLabelBug ? "<label>Name</label>\n<input type='text' placeholder='Enter name' />" : ...
  // Under label bug, it does not have "<label for=" so it subtracts 20.
  if (data.hasLabelBug) {
    score -= 20;
  }

  // Heading check: always has <h1> in fallback, and never skips h2 (has <h2>Get in Touch</h2> always)
  // So no heading bugs subtracted.
  score = Math.max(0, Math.round(score));
  return score;
}

// Replicate analyzeComputerVision
function analyzeComputerVision(data) {
  let gridScore = 92; // display: flex and gap: 20px exists in fallback html
  let responsiveScore = 55; // flex-direction: row exists, no @media or flex-wrap in fallback style block
  let typographyScore = 90; // no font-size: 12px or 14px in fallback html style block
  let whitespaceScore = 85; // no margin: 0 or padding: 0 in fallback html

  const visualHierarchyScore = Math.round(
    (typographyScore * 0.4) + (gridScore * 0.3) + (whitespaceScore * 0.3)
  );

  return {
    visualHierarchyScore,
    typographyScore,
    responsiveScore,
    gridScore,
    whitespaceScore
  };
}

// Replicate evaluateHeuristics
function evaluateHeuristics(data) {
  let visibilityStatus = 60; // no loading / spinner / status
  let matchRealWorld = 90;
  let userControl = 65; // no cancel / close / back
  let consistencyStandards = 85;
  let errorPrevention = data.hasLabelBug ? 50 : 75; // required attribute only if not hasLabelBug
  let recognitionRecall = 80;
  let flexibilityEfficiency = 70;
  let minimalistDesign = 85;
  let errorRecovery = 75;
  let documentation = 70; // docs link exists in fallback

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
    overallHeuristicScore,
    scores: {
      userControl,
      visibilityStatus
    }
  };
}

function runFullAudit(url) {
  const data = getFallbackAuditData(url);
  const a11yScore = analyzeAccessibility(url, data);
  const cvResult = analyzeComputerVision(data);
  const heurResult = evaluateHeuristics(data);

  const accessibility = a11yScore;
  const visualDesign = cvResult.visualHierarchyScore;
  const navigation = Math.round((heurResult.scores.userControl + heurResult.scores.visibilityStatus) / 2);
  const usability = heurResult.overallHeuristicScore;
  const color = 50; // hardcoded contrast checks always result in 2/4 pass
  const mobile = cvResult.responsiveScore;
  const performance = 96; // 4 links, 1 image -> 100 - 2 - 2 = 96

  const overallScore = Math.round(
    (accessibility * 0.20) +
    (visualDesign * 0.15) +
    (usability * 0.20) +
    (mobile * 0.15) +
    (color * 0.10) +
    (navigation * 0.10) +
    (performance * 0.10)
  );

  return {
    url,
    hash: data.hash,
    hasAltBug: data.hasAltBug,
    hasLabelBug: data.hasLabelBug,
    accessibility,
    visualDesign,
    usability,
    mobile,
    color,
    navigation,
    performance,
    overallScore
  };
}

const testUrls = [
  "https://google.com",
  "https://github.com",
  "https://apple.com",
  "https://microsoft.com",
  "https://wikipedia.org",
  "https://reddit.com",
  "https://amazon.com",
  "https://netflix.com"
];

testUrls.forEach(url => {
  console.log(JSON.stringify(runFullAudit(url)));
});
