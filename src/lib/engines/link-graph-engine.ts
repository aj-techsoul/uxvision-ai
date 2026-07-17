/**
 * Link Graph Analysis Engine
 * Builds a directed graph of internal page links and runs scoring algorithms:
 * - Directed adjacency list construction
 * - Simplified PageRank (iterative power method)
 * - Navigation depth scoring (BFS from homepage)
 * - Orphan page detection
 * - Bidirectional link analysis
 */

import { CapturedData } from './playwright-capture';
import { AuditIssue } from '../db';

export interface LinkNode {
  url: string;
  outLinks: string[];    // pages this node links to
  inLinks: string[];     // pages that link to this node
  pageRank: number;      // computed PageRank value
  depth: number;         // BFS depth from homepage (-1 if unreachable)
}

export interface LinkGraphResult {
  nodes: LinkNode[];
  navigationDepthScore: number;  // 0-100: are all pages reachable within 3 clicks?
  orphanPages: string[];          // pages with zero inbound links
  bidirectionalRatio: number;     // ratio of bidirectional connections
  avgPageRank: number;
  maxPageRank: number;
  maxDepth: number;               // deepest BFS level from homepage
  totalInternalLinks: number;
  issues: AuditIssue[];
}

/**
 * Extract internal links from HTML content restricted to same hostname.
 */
function extractLinksFromHTML(html: string, pageUrl: string, validUrls: Set<string>): string[] {
  const links: string[] = [];
  const hrefRegex = /<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["'][^>]*>/gi;
  let match;

  let hostname: string;
  try {
    hostname = new URL(pageUrl).hostname;
  } catch {
    return [];
  }

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.hostname === hostname) {
        const clean = resolved.origin + resolved.pathname.replace(/\/+$/, '');
        // Only count links to pages we actually crawled
        if (validUrls.has(clean)) {
          links.push(clean);
        }
      }
    } catch {}
  }

  return [...new Set(links)];
}

/**
 * Run simplified PageRank algorithm (iterative power method).
 * damping = 0.85, 10 iterations.
 */
function computePageRank(
  nodes: Map<string, { outLinks: string[]; inLinks: string[] }>,
  iterations = 10,
  damping = 0.85
): Map<string, number> {
  const n = nodes.size;
  if (n === 0) return new Map();

  const ranks = new Map<string, number>();
  const baseRank = 1 / n;

  // Initialize uniform distribution
  for (const url of nodes.keys()) {
    ranks.set(url, baseRank);
  }

  // Iterative power method
  for (let iter = 0; iter < iterations; iter++) {
    const newRanks = new Map<string, number>();

    for (const [url, node] of nodes.entries()) {
      let incomingRank = 0;

      for (const inUrl of node.inLinks) {
        const inNode = nodes.get(inUrl);
        if (inNode) {
          const outDegree = inNode.outLinks.length || 1;
          incomingRank += (ranks.get(inUrl) || 0) / outDegree;
        }
      }

      newRanks.set(url, (1 - damping) / n + damping * incomingRank);
    }

    // Update ranks
    for (const [url, rank] of newRanks.entries()) {
      ranks.set(url, rank);
    }
  }

  return ranks;
}

/**
 * BFS from homepage to compute navigation depth of each page.
 */
function computeNavigationDepth(
  homepageUrl: string,
  adjacency: Map<string, string[]>
): Map<string, number> {
  const depths = new Map<string, number>();
  const queue: string[] = [homepageUrl];
  depths.set(homepageUrl, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depths.get(current)!;
    const neighbors = adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      if (!depths.has(neighbor)) {
        depths.set(neighbor, currentDepth + 1);
        queue.push(neighbor);
      }
    }
  }

  return depths;
}

/**
 * Build and analyze the link graph from crawled page data.
 */
export function analyzeLinkGraph(crawledPages: CapturedData[]): LinkGraphResult {
  const issues: AuditIssue[] = [];

  if (crawledPages.length === 0) {
    return {
      nodes: [],
      navigationDepthScore: 0,
      orphanPages: [],
      bidirectionalRatio: 0,
      avgPageRank: 0,
      maxPageRank: 0,
      maxDepth: 0,
      totalInternalLinks: 0,
      issues: [],
    };
  }

  // Build the set of valid crawled URLs
  const validUrls = new Set(crawledPages.map(p => p.url));
  const homepageUrl = crawledPages[0].url;

  // ─── 1. Build Adjacency Lists ───
  const nodeData = new Map<string, { outLinks: string[]; inLinks: string[] }>();

  // Initialize all nodes
  for (const page of crawledPages) {
    nodeData.set(page.url, { outLinks: [], inLinks: [] });
  }

  // Extract links and build directed edges
  let totalInternalLinks = 0;
  for (const page of crawledPages) {
    const outLinks = extractLinksFromHTML(page.html, page.url, validUrls);
    const node = nodeData.get(page.url)!;
    node.outLinks = outLinks.filter(link => link !== page.url); // no self-links
    totalInternalLinks += node.outLinks.length;

    // Register inbound links on target nodes
    for (const target of node.outLinks) {
      const targetNode = nodeData.get(target);
      if (targetNode) {
        targetNode.inLinks.push(page.url);
      }
    }
  }

  // ─── 2. PageRank ───
  const pageRanks = computePageRank(nodeData);

  // ─── 3. Navigation Depth (BFS from homepage) ───
  const outAdjacency = new Map<string, string[]>();
  for (const [url, node] of nodeData.entries()) {
    outAdjacency.set(url, node.outLinks);
  }
  const navDepths = computeNavigationDepth(homepageUrl, outAdjacency);

  // ─── 4. Assemble LinkNode results ───
  const nodes: LinkNode[] = [];
  let maxPageRank = 0;
  let totalPageRank = 0;
  let maxDepth = 0;

  for (const [url, data] of nodeData.entries()) {
    const pr = pageRanks.get(url) || 0;
    const depth = navDepths.has(url) ? navDepths.get(url)! : -1;

    maxPageRank = Math.max(maxPageRank, pr);
    totalPageRank += pr;
    if (depth >= 0) maxDepth = Math.max(maxDepth, depth);

    nodes.push({
      url,
      outLinks: data.outLinks,
      inLinks: data.inLinks,
      pageRank: parseFloat(pr.toFixed(6)),
      depth,
    });
  }

  const avgPageRank = nodes.length > 0 ? totalPageRank / nodes.length : 0;

  // ─── 5. Orphan Page Detection ───
  const orphanPages = nodes
    .filter(n => n.inLinks.length === 0 && n.url !== homepageUrl)
    .map(n => n.url);

  if (orphanPages.length > 0) {
    issues.push({
      id: 'link-orphan-pages',
      category: 'heuristics',
      title: `Orphan Pages Detected (${orphanPages.length})`,
      description: `${orphanPages.length} page(s) have no inbound links from other crawled pages: ${orphanPages.join(', ')}. These pages are unreachable through internal navigation.`,
      severity: orphanPages.length > 2 ? 'critical' : 'warning',
      scoreImpact: 6,
      remedy: {
        description: 'Add navigation links or breadcrumbs pointing to these pages from the main navigation or related content areas.',
        benefit: 'Ensures all content is discoverable and improves SEO crawl coverage.',
      },
    });
  }

  // ─── 6. Navigation Depth Score ───
  // Ideal: all pages reachable within 3 clicks
  const unreachable = nodes.filter(n => n.depth === -1 && n.url !== homepageUrl);
  const deepPages = nodes.filter(n => n.depth > 3);
  
  let navigationDepthScore = 100;
  if (unreachable.length > 0) {
    navigationDepthScore -= unreachable.length * 15;
    issues.push({
      id: 'link-unreachable',
      category: 'heuristics',
      title: `Unreachable Pages from Homepage (${unreachable.length})`,
      description: `${unreachable.length} page(s) cannot be reached by following links from the homepage. This creates navigation dead-ends.`,
      severity: 'critical',
      scoreImpact: 10,
      remedy: {
        description: 'Ensure all important pages are linked from the main navigation or sitemap.',
        benefit: 'Users and search engines can discover all content.',
      },
    });
  }
  if (deepPages.length > 0) {
    navigationDepthScore -= deepPages.length * 5;
  }
  navigationDepthScore = Math.max(0, Math.min(100, navigationDepthScore));

  // ─── 7. Bidirectional Link Ratio ───
  let bidirectionalCount = 0;
  let totalDirectedEdges = 0;
  
  for (const node of nodes) {
    for (const outLink of node.outLinks) {
      totalDirectedEdges++;
      const targetNode = nodes.find(n => n.url === outLink);
      if (targetNode && targetNode.outLinks.includes(node.url)) {
        bidirectionalCount++;
      }
    }
  }

  const bidirectionalRatio = totalDirectedEdges > 0
    ? parseFloat((bidirectionalCount / totalDirectedEdges).toFixed(4))
    : 0;

  return {
    nodes,
    navigationDepthScore,
    orphanPages,
    bidirectionalRatio,
    avgPageRank: parseFloat(avgPageRank.toFixed(6)),
    maxPageRank: parseFloat(maxPageRank.toFixed(6)),
    maxDepth,
    totalInternalLinks,
    issues,
  };
}
