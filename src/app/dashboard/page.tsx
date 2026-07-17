"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db, AuditReport } from "@/lib/db";
import { 
  Plus, Search, Calendar, Award, Trash2, ArrowUpRight, Loader2, 
  HelpCircle, RefreshCw, BarChart2, CheckCircle2, ShieldAlert, LogOut, FileText, Globe
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditStep, setAuditStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load user and past reports
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("uxvision_user");
      if (!storedUser) {
        router.push("/login");
        return;
      }
      setUser(JSON.parse(storedUser));
      fetchHistory();
    }
  }, [router]);

  const fetchHistory = async () => {
    try {
      const history = await db.getAllReports();
      setReports(history);
      
      // If reports are empty, pre-populate a sample report for instantly demonstrating UI excellence
      if (history.length === 0) {
        // Mock a demo report to give immediate preview values
        const demoReport: AuditReport = {
          id: "demo-report",
          url: "https://my-saas-platform.com",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          overallScore: 84,
          subScores: {
            accessibility: 78,
            visualDesign: 85,
            navigation: 80,
            typography: 90,
            consistency: 85,
            usability: 82,
            color: 75,
            mobile: 88,
            performance: 92
          },
          issues: [
            {
              id: "cv-contrast-main-cta",
              category: "visual",
              title: "Low Contrast on Primary Button",
              description: "The contrast ratio of 3.2:1 is below the WCAG 2.2 AA requirement of 4.5:1. Visually impaired users struggle to read it.",
              severity: "critical",
              scoreImpact: 12,
              selector: "#main-cta",
              codeSnippet: '<button class="cta-btn" style="background-color: #84DCC6; color: #FFFFFF;">Explore Console</button>',
              remedy: {
                description: "Change the text color or increase green background brightness to satisfy contrast ratios.",
                fixCode: '<button class="cta-btn" style="background-color: #007A5A; color: #FFFFFF;">Explore Console</button>',
                benefit: "Brings the button into full WCAG AA compliance and raises readability score."
              }
            },
            {
              id: "a11y-img-alt",
              category: "accessibility",
              title: "Missing Alternative Text Descriptor",
              description: "Image tag lacks alternative text attribute. Auditory screen readers cannot convey graphics context to blind users.",
              severity: "critical",
              scoreImpact: 15,
              selector: "img",
              codeSnippet: '<img src="/assets/insight-dashboard.png" />',
              remedy: {
                description: "Append an explicit descriptive 'alt' tag to the image object.",
                fixCode: '<img src="/assets/insight-dashboard.png" alt="SaaS Analytical console showing charts" />',
                benefit: "Satisfies WCAG 2.2 Guideline 1.1.1."
              }
            }
          ],
          recommendations: [
            {
              id: "rec-1",
              issueId: "cv-contrast-main-cta",
              category: "VISUAL",
              problem: "Low Contrast on Primary Button",
              reason: "The contrast ratio of 3.2:1 is below the WCAG 2.2 AA requirement of 4.5:1.",
              solution: "Change text color or background to comply.\n\nCode repair:\n```html\n<button class=\"cta-btn\" style=\"background-color: #007A5A; color: #FFFFFF;\">Explore Console</button>\n```",
              expectedImprovement: "Brings the button into compliance.",
              impactScore: 12
            }
          ],
          mlResult: {
            rating: "Good",
            confidence: 0.86,
            features: [
              { name: "accessibilityScore", value: 78, weight: 0.20 },
              { name: "visualDesignScore", value: 85, weight: 0.25 },
              { name: "typographyScore", value: 90, weight: 0.15 }
            ],
            validationMetrics: {
              accuracy: 0.89,
              precision: 0.87,
              recall: 0.88,
              f1Score: 0.87,
              confusionMatrix: [
                [45,  3,  2,  0,  0],
                [ 2, 58,  4,  1,  0],
                [ 1,  5, 68,  6,  0],
                [ 0,  1,  3, 40,  4],
                [ 0,  0,  1,  2, 14]
              ]
            }
          },
          carousel: [
            { title: "UI/UX Audit: my-saas-platform.com", subtitle: "UX Score: 84/100", points: ["ML Rating: Good", "Found 2 visual critical bugs"], type: "intro" }
          ],
          videoScript: {
            timeline: [
              { sceneId: 1, title: "Overview", durationSeconds: 10, narration: "Audit summary of my-saas-platform.com.", visualCue: "Show site layout" }
            ],
            voiceoverScript: "Overview script details"
          },
          screenshots: {
            desktop: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230F172A"/><text x="40" y="80" fill="%23FFFFFF" font-family="sans-serif" font-size="24" font-weight="bold">Demo Audit Screen</text><rect x="40" y="140" width="180" height="40" fill="%2384DCC6"/><text x="60" y="165" fill="%231E293B" font-family="sans-serif" font-size="14">Explore Console</text><text x="40" y="240" fill="%2394A3B8" font-family="sans-serif" font-size="14">Fails contrast checks against white text.</text></svg>`
          }
        };

        await db.saveReport(demoReport);
        setReports([demoReport]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("uxvision_user");
    router.push("/login");
  };

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setError(null);
    setAuditLoading(true);
    setAuditStep("Initializing Headless Browser...");

    // Simulated step ticks to provide micro-animations and status updates
    const steps = [
      "Loading Chromium sandbox environment...",
      "Capturing desktop screenshots...",
      "Simulating tablet & mobile viewports...",
      "Extracting HTML and style definitions...",
      "Evaluating WCAG 2.2 accessibility rules...",
      "Computing visual contrast and padding maps...",
      "Processing Flesch grade text parameters...",
      "Running Neural network quality prediction...",
      "Synthesizing recommendations code fixes...",
      "Compiling report assets..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setAuditStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput })
      });

      clearInterval(interval);

      if (!res.ok) {
        throw new Error("Audit endpoint failed to return report.");
      }

      const report: AuditReport = await res.json();
      
      // Save report in IndexedDB
      await db.saveReport(report);
      
      setUrlInput("");
      router.push(`/dashboard/audit/${report.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || "Audit pipeline failed. Please verify the URL is valid.");
    } finally {
      setAuditLoading(false);
      setAuditStep("");
    }
  };

  const deleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm("Are you sure you want to delete this report from history?")) {
      await db.deleteReport(id);
      fetchHistory();
    }
  };

  // Filter history
  const filteredReports = reports.filter(r => 
    r.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.mlResult?.rating.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatting chart data
  const chartData = reports
    .slice()
    .reverse()
    .map(r => ({
      name: r.url.replace(/https?:\/\/(www\.)?/, "").split("/")[0],
      score: r.overallScore
    }));

  const totalAudited = reports.length;
  const avgScore = totalAudited > 0 
    ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / totalAudited)
    : 0;
  
  const avgA11y = totalAudited > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.subScores.accessibility, 0) / totalAudited)
    : 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#06090e] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-950/70 border-r border-white/5 p-6 flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-bold text-lg">
              V
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              UXVision <span className="text-primary font-light">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex flex-col gap-2">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 bg-white/5 border border-white/5 text-white font-medium px-4 py-3 rounded-xl transition-all"
            >
              <BarChart2 className="w-4 h-4 text-primary" />
              <span>Console</span>
            </Link>
            <Link 
              href="/dashboard/research" 
              className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-3 rounded-xl transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Research Hub</span>
            </Link>
          </nav>
        </div>

        {/* User Card */}
        <div className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">{user?.name}</h4>
              <span className="text-xs text-slate-500 truncate block">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 justify-center w-full bg-white/5 hover:bg-danger/10 border border-white/5 hover:border-danger/20 text-slate-400 hover:text-danger text-xs font-bold py-2.5 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Top welcome */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Developer Console</h1>
            <p className="text-slate-400 text-sm mt-0.5">Submit URLs to execute layout and WCAG scanners.</p>
          </div>
        </header>

        {/* AUDIT REQUEST CONTAINER */}
        <section className="glass-panel p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden mb-10">
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-start gap-3 mb-6 text-danger text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary animate-pulse" /> Audit New Platform
          </h2>

          <form onSubmit={startAudit} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text"
              required
              disabled={auditLoading}
              placeholder="e.g. https://my-landing-page.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-sm text-white placeholder-slate-600 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={auditLoading}
              className="bg-primary hover:bg-primary-hover text-secondary font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {auditLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  Analyze Website <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* AUDITING LOAD ANIMATION */}
          <AnimatePresence>
            {auditLoading && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 border-t border-white/5 pt-4"
              >
                <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                  <RefreshCw className="w-4.5 h-4.5 text-primary animate-spin" />
                  <span>{auditStep}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: "5%" }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 12, ease: "easeOut" }}
                    className="bg-primary h-1.5 rounded-full" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* HISTORICAL STATS CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Scans</span>
              <h3 className="text-3xl font-black text-white mt-1">{totalAudited}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Avg UX Score</span>
              <h3 className="text-3xl font-black text-white mt-1">{avgScore}<span className="text-xs text-slate-500 font-normal">/100</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Avg Accessibility</span>
              <h3 className="text-3xl font-black text-white mt-1">{avgA11y}<span className="text-xs text-slate-500 font-normal">/100</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* CHART SECTION */}
        {chartData.length > 0 && (
          <section className="glass-panel p-6 rounded-2xl border border-white/5 mb-10">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Historical Audit Scores Timeline</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} 
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* HISTORY LIST TABLE */}
        <section className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Audit History</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary text-white placeholder-slate-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredReports.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No audited platforms found matching your search.
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-5 font-semibold">Website</th>
                    <th className="p-5 font-semibold">Scored Index</th>
                    <th className="p-5 font-semibold">ML Classifier</th>
                    <th className="p-5 font-semibold">Audited Date</th>
                    <th className="p-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReports.map((report) => (
                    <tr 
                      key={report.id}
                      onClick={() => router.push(`/dashboard/audit/${report.id}`)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="p-5">
                        <span className="font-bold text-white text-sm tracking-tight truncate max-w-xs block">
                          {report.url.replace(/https?:\/\/(www\.)?/, "")}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            report.overallScore >= 85 ? "bg-primary/20 text-primary border border-primary/20" :
                            report.overallScore >= 70 ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" :
                            "bg-danger/20 text-danger border border-danger/20"
                          }`}>
                            {report.overallScore}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          report.mlResult?.rating === "Excellent" ? "bg-primary/10 text-primary" :
                          report.mlResult?.rating === "Good" ? "bg-blue-500/10 text-blue-400" :
                          report.mlResult?.rating === "Average" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-danger/10 text-danger"
                        }`}>
                          {report.mlResult?.rating || "Unknown"}
                        </span>
                      </td>
                      <td className="p-5 text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-3">
                          <Link 
                            href={`/dashboard/audit/${report.id}`}
                            className="bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 text-slate-300 hover:text-primary font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1"
                          >
                            <span>Inspect</span> <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <button 
                            onClick={(e) => deleteReport(report.id, e)}
                            className="bg-white/5 hover:bg-danger/10 border border-white/5 hover:border-danger/20 text-slate-400 hover:text-danger p-1.5 rounded-lg transition-all"
                            title="Delete audit report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
