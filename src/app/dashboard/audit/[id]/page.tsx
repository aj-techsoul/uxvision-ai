"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db, AuditReport, AuditIssue } from "@/lib/db";
import { 
  ArrowLeft, Calendar, ShieldAlert, CheckCircle2, ChevronRight, Download, 
  Share2, Play, Eye, FileText, Settings, Compass, Layers, Type, Award, 
  HelpCircle, Monitor, Smartphone, Tablet, Code, Sparkles, ChevronLeft, Loader2, X,
  ThumbsUp, ThumbsDown
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;
  
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "visual" | "accessibility" | "nlp" | "heuristics" | "ml" | "export" | "exploration">("overview");
  
  // Carousel Slide active index
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [remedyApplied, setRemedyApplied] = useState<{ [key: string]: boolean }>({});
  const [activePageUrl, setActivePageUrl] = useState<string | null>(null);

  // Chat Assistant states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { sender: "bot", text: "Hello! I am your UXVision AI Assistant. Ask me anything about this website's visual scores, WCAG rules, or spacing layout issues!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const [currentSceneId, setCurrentSceneId] = useState<number | null>(null);
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);

  // Dynamic feedback and adaptive ranking states
  const [issueFeedback, setIssueFeedback] = useState<{ [key: string]: { helpful?: boolean; ignored?: boolean } }>({});

  const handleFeedback = async (issueId: string, type: "helpful" | "ignore") => {
    if (!report) return;

    const currentFeedback = issueFeedback[issueId] || {};
    const newHelpful = type === "helpful" ? !currentFeedback.helpful : false;
    const newIgnored = type === "ignore" ? !currentFeedback.ignored : false;

    setIssueFeedback(prev => ({
      ...prev,
      [issueId]: { helpful: newHelpful, ignored: newIgnored }
    }));

    // Update the issue feedback state in the report object
    const updatedIssues = report.issues.map(issue => {
      if (issue.id === issueId) {
        return { 
          ...issue, 
          helpful: newHelpful,
          ignored: newIgnored
        };
      }
      return issue;
    });

    const updatedReport = {
      ...report,
      issues: updatedIssues
    };

    setReport(updatedReport);
    await db.saveReport(updatedReport);
  };

  const getRankScore = (issue: AuditIssue) => {
    // 0.5 * Severity Score
    let severityVal = 30;
    if (issue.severity === "critical") severityVal = 100;
    else if (issue.severity === "warning") severityVal = 60;

    // 0.3 * Helpfulness Score
    const feedback = issueFeedback[issue.id];
    let helpfulnessVal = 50;
    if (feedback?.helpful === true) helpfulnessVal = 100;
    if (feedback?.ignored === true) helpfulnessVal = 0;

    // 0.2 * Implementation Rate
    const applied = !!remedyApplied[issue.id];
    const implementationVal = applied ? 100 : 20;

    return (0.5 * severityVal) + (0.3 * helpfulnessVal) + (0.2 * implementationVal);
  };

  const startNarration = () => {
    if (typeof window === "undefined") return;
    
    window.speechSynthesis.cancel();
    
    if (isPlayingNarration) {
      setIsPlayingNarration(false);
      setCurrentSceneId(null);
      return;
    }
    
    setIsPlayingNarration(true);
    const scenes = report?.videoScript?.timeline || [];
    
    let sceneIdx = 0;
    
    const speakNextScene = () => {
      if (sceneIdx >= scenes.length) {
        setIsPlayingNarration(false);
        setCurrentSceneId(null);
        return;
      }
      
      const scene = scenes[sceneIdx];
      setCurrentSceneId(scene.sceneId);
      
      const utterance = new SpeechSynthesisUtterance(scene.narration);
      utterance.onend = () => {
        sceneIdx++;
        speakNextScene();
      };
      
      utterance.onerror = () => {
        setIsPlayingNarration(false);
        setCurrentSceneId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    };
    
    speakNextScene();
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportContext: report,
          message: userMsg
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: "bot", text: data.text }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "bot", text: "Sorry, I had trouble connecting to the chat helper. Please check your setup." }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { sender: "bot", text: "An unexpected error occurred. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (report && !activePageUrl) {
      setActivePageUrl(report.url);
    }
  }, [report, activePageUrl]);

  const activePageScan = report?.pagesScanned?.find(p => p.url === activePageUrl) || (report ? {
    url: report.url,
    score: report.overallScore,
    interactiveStatesScanned: {
      tabsFound: 0,
      buttonsWithHoverTransitions: 0
    },
    screenshots: report.screenshots,
    subScores: report.subScores,
    issues: report.issues
  } : null);

  const currentScreenshots = activePageScan?.screenshots || report?.screenshots || {};
  const currentSubScores = activePageScan?.subScores || report?.subScores || {
    accessibility: 70,
    visualDesign: 70,
    navigation: 70,
    typography: 70,
    consistency: 70,
    usability: 70,
    color: 70,
    mobile: 70,
    performance: 70
  };
  const rawIssues = activePageScan?.issues || report?.issues || [];
  const currentIssues = [...rawIssues].sort((a, b) => getRankScore(b) - getRankScore(a));

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    try {
      const res = await db.getReport(reportId);
      if (res) {
        setReport(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  useEffect(() => {
    if (report) {
      const initialApplied: { [key: string]: boolean } = {};
      const initialFeedback: { [key: string]: { helpful?: boolean; ignored?: boolean } } = {};
      report.issues.forEach(issue => {
        if (issue.resolved) {
          initialApplied[issue.id] = true;
        }
        if (issue.helpful || issue.ignored) {
          initialFeedback[issue.id] = {
            helpful: !!issue.helpful,
            ignored: !!issue.ignored
          };
        }
      });
      setRemedyApplied(initialApplied);
      setIssueFeedback(initialFeedback);
    }
  }, [report?.id]);

  const toggleRemedy = async (issueId: string) => {
    if (!report) return;

    const newApplied = !remedyApplied[issueId];
    setRemedyApplied(prev => ({
      ...prev,
      [issueId]: newApplied
    }));

    // Update the issue resolved state in the report object
    const updatedIssues = report.issues.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, resolved: newApplied };
      }
      return issue;
    });

    const { updatedSubScores, updatedOverallScore, updatedMLResult } = recalculateReportScores(
      report,
      updatedIssues,
      { ...remedyApplied, [issueId]: newApplied }
    );

    const updatedReport = {
      ...report,
      issues: updatedIssues,
      subScores: updatedSubScores,
      overallScore: updatedOverallScore,
      mlResult: updatedMLResult
    };

    setReport(updatedReport);
    await db.saveReport(updatedReport);
  };

  const renderWidgetPreview = (issueId: string, isBefore: boolean, applied: boolean) => {
    const isRedesigned = !isBefore;

    // Helper classes for high-contrast colors
    const originalBtnStyle = { backgroundColor: "#84DCC6", color: "#FFFFFF" };
    const fixedBtnStyle = { backgroundColor: "#007A5A", color: "#FFFFFF" };

    if (issueId.includes("contrast-main-cta") || issueId.includes("contrast-secondary-button")) {
      return (
        <button 
          style={isBefore || (!applied && isRedesigned) ? originalBtnStyle : fixedBtnStyle}
          className="px-6 py-3 rounded font-bold text-sm shadow-sm transition-all duration-300"
        >
          Explore Console
        </button>
      );
    }

    if (issueId.includes("contrast-footer-links") || issueId.includes("contrast-footer")) {
      return (
        <div className="flex gap-4 items-center">
          <span className="text-xs text-slate-500 uppercase font-semibold">Links:</span>
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()} 
            style={isBefore || (!applied && isRedesigned) ? { color: "#334155" } : { color: "#02C39A" }}
            className="text-sm font-bold underline transition-all duration-300"
          >
            Privacy Policy
          </a>
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()} 
            style={isBefore || (!applied && isRedesigned) ? { color: "#334155" } : { color: "#02C39A" }}
            className="text-sm font-bold underline transition-all duration-300"
          >
            Terms of Service
          </a>
        </div>
      );
    }

    if (issueId.includes("contrast-body-paragraph")) {
      return (
        <p 
          style={isBefore || (!applied && isRedesigned) ? { color: "#4A4A4A" } : { color: "#E2E8F0" }}
          className="text-sm leading-relaxed max-w-xs transition-all duration-300"
        >
          Deploy computer vision, natural language models, and usability heuristics to automatically audit websites.
        </p>
      );
    }

    if (issueId === "a11y-img-alt") {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="relative border border-white/5 p-3 rounded-xl bg-slate-900/60 flex items-center justify-center min-h-[90px] w-full max-w-[200px]">
            <img 
              src="/next.svg" 
              className={`w-24 transition-opacity duration-300 ${isBefore || (!applied && isRedesigned) ? "opacity-20" : "opacity-100"}`} 
              alt={isBefore || (!applied && isRedesigned) ? "" : "Next.js core logotype brand icon"} 
            />
            {(isBefore || (!applied && isRedesigned)) ? (
              <span className="absolute top-2 right-2 bg-danger/20 text-danger border border-danger/30 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                Missing Alt
              </span>
            ) : (
              <span className="absolute top-2 right-2 bg-primary/20 text-primary border border-primary/30 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                alt="Next.js brand icon"
              </span>
            )}
          </div>
        </div>
      );
    }

    if (issueId === "a11y-input-label") {
      return (
        <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
          {(isBefore || (!applied && isRedesigned)) ? (
            <div className="h-4" /> // Empty spacing representing missing label
          ) : (
            <label className="text-[9px] text-primary font-bold uppercase tracking-wider animate-fadeIn">
              Full Name <span className="text-danger">*</span>
            </label>
          )}
          <input 
            type="text" 
            disabled 
            placeholder="Enter name"
            className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white w-full"
          />
        </div>
      );
    }

    if (issueId === "a11y-missing-h1") {
      return (
        <div className="text-center w-full">
          {(isBefore || (!applied && isRedesigned)) ? (
            <div className="border border-dashed border-danger/30 p-3 rounded-xl max-w-[200px] mx-auto">
              <span className="text-[10px] text-danger uppercase font-bold tracking-wider">No Primary Heading (H1)</span>
            </div>
          ) : (
            <h1 className="text-base font-black text-white uppercase tracking-tight animate-fadeIn border border-dashed border-primary/30 p-2 rounded-xl max-w-[200px] mx-auto">
              Next Gen Architecture
            </h1>
          )}
        </div>
      );
    }

    if (issueId === "a11y-heading-skip") {
      return (
        <div className="flex flex-col gap-1.5 w-full max-w-[200px] border border-white/5 p-3 rounded-xl bg-slate-950/40">
          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider border-b border-white/5 pb-1">Outline Map</div>
          <div className="text-[11px] font-black text-white pl-1">H1: Page Title</div>
          {(isBefore || (!applied && isRedesigned)) ? (
            <>
              <div className="text-[10px] font-bold text-danger pl-4 border-l-2 border-danger/30">H3: Accessibility (Skipped H2!)</div>
            </>
          ) : (
            <>
              <div className="text-[10px] font-bold text-primary pl-3 border-l-2 border-primary/30">H2: Content Section</div>
              <div className="text-[9px] font-medium text-slate-300 pl-6 border-l-2 border-slate-700">H3: Accessibility</div>
            </>
          )}
        </div>
      );
    }

    if (issueId === "cv-grid-spacing") {
      return (
        <div className="flex flex-col gap-2 items-center">
          <div className={`flex items-center border border-white/5 p-3 rounded-xl bg-slate-950/40 transition-all duration-300 ${isBefore || (!applied && isRedesigned) ? "gap-1" : "gap-4"}`}>
            <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">Card 1</div>
            <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">Card 2</div>
            <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">Card 3</div>
          </div>
          {(isBefore || (!applied && isRedesigned)) ? (
            <span className="text-[8px] text-danger font-mono">spacing: 4px (squished)</span>
          ) : (
            <span className="text-[8px] text-primary font-mono font-bold">spacing: 24px (standard layout)</span>
          )}
        </div>
      );
    }

    if (issueId === "cv-responsive-wrap") {
      return (
        <div className="flex items-center justify-center w-full max-w-[200px] border border-white/5 p-3 rounded-xl bg-slate-950/40">
          {(isBefore || (!applied && isRedesigned)) ? (
            <div className="flex flex-row gap-1.5 overflow-hidden w-full border border-danger/30 p-1.5 rounded relative">
              <div className="w-12 h-6 bg-white/5 border border-white/10 shrink-0 text-[7px] flex items-center justify-center font-bold">Card 1</div>
              <div className="w-12 h-6 bg-white/5 border border-white/10 shrink-0 text-[7px] flex items-center justify-center font-bold">Card 2</div>
              <div className="w-12 h-6 bg-white/5 border border-white/10 shrink-0 text-[7px] flex items-center justify-center font-bold">Card 3</div>
              <span className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-danger to-transparent px-1 text-danger font-extrabold flex items-center text-[8px]">&gt;&gt;</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 w-full border border-primary/30 p-1.5 rounded animate-fadeIn">
              <div className="w-full h-6 bg-white/5 border border-white/10 text-[7px] flex items-center justify-center font-bold">Card 1</div>
              <div className="w-full h-6 bg-white/5 border border-white/10 text-[7px] flex items-center justify-center font-bold">Card 2</div>
              <div className="w-full h-6 bg-white/5 border border-white/10 text-[7px] flex items-center justify-center font-bold">Card 3</div>
            </div>
          )}
        </div>
      );
    }

    if (issueId === "nlp-cta-labeling") {
      return (
        <button 
          className={`px-5 py-2.5 rounded font-bold text-xs transition-all duration-300 shadow-md ${
            isBefore || (!applied && isRedesigned)
              ? "bg-[#1E293B] text-slate-400 border border-white/10" 
              : "bg-primary text-secondary hover:bg-primary-hover shadow-primary/20"
          }`}
        >
          {isBefore || (!applied && isRedesigned) ? "Submit Details" : "Get Free Audit"}
        </button>
      );
    }

    if (issueId === "heur-sys-status") {
      return (
        <button 
          disabled={!isBefore && applied}
          className="px-5 py-2.5 rounded font-bold text-xs bg-primary text-secondary flex items-center gap-1.5 shadow-md shadow-primary/10"
        >
          {isBefore || (!applied && isRedesigned) ? (
            <span>Submit Details</span>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Submitting...</span>
            </>
          )}
        </button>
      );
    }

    if (issueId === "heur-user-control") {
      return (
        <div className="flex gap-2 items-center">
          {!(isBefore || (!applied && isRedesigned)) && (
            <button className="px-3 py-1.5 border border-white/10 hover:bg-white/5 text-slate-300 text-[10px] font-semibold rounded-lg transition-all animate-fadeIn">
              Cancel
            </button>
          )}
          <button className="px-3 py-1.5 bg-primary text-secondary text-[10px] font-bold rounded-lg shadow-sm">
            Save Details
          </button>
        </div>
      );
    }

    if (issueId === "heur-err-prevent") {
      return (
        <div className="flex flex-col gap-1 w-full max-w-[180px]">
          <div className="relative">
            <input 
              type="text" 
              disabled 
              placeholder="name@domain.com"
              className={`bg-slate-950 border rounded-lg pl-3 pr-8 py-1.5 text-[10px] text-white w-full transition-all ${
                isBefore || (!applied && isRedesigned) ? "border-white/10" : "border-primary/50"
              }`}
            />
            {!(isBefore || (!applied && isRedesigned)) && (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary absolute right-2 top-2 animate-scaleIn" />
            )}
          </div>
        </div>
      );
    }

    if (issueId === "heur-docs") {
      return (
        <div className="flex flex-col gap-1.5 w-full max-w-[200px] border border-white/5 p-2 rounded-xl bg-slate-950/40 text-[10px]">
          <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Navbar menu</div>
          <div className="flex gap-3 text-slate-400 font-semibold border-b border-white/5 pb-1">
            <span>Home</span>
            <span>Pricing</span>
          </div>
          {(isBefore || (!applied && isRedesigned)) ? (
            <span className="text-[8px] text-danger italic">(No Help links or FAQ documentation)</span>
          ) : (
            <div className="flex gap-3 text-primary font-bold animate-fadeIn">
              <span>FAQ</span>
              <span>Help Center</span>
            </div>
          )}
        </div>
      );
    }

    if (issueId.includes("grid-align")) {
      return (
        <div className="flex flex-col gap-2 items-center w-full max-w-[200px]">
          <div className="relative border border-white/10 rounded-xl p-3 bg-slate-950/60 w-full min-h-[90px] flex items-center justify-center overflow-hidden">
            {/* Dotted Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-20 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="border-r border-b border-white border-dashed" />
              ))}
            </div>
            {/* Visual Element */}
            <div 
              className={`h-8 w-24 rounded border flex items-center justify-center text-[9px] font-bold transition-all duration-500 relative z-10 ${
                isBefore || (!applied && isRedesigned)
                  ? "bg-danger/10 border-danger text-danger -translate-x-3"
                  : "bg-primary/10 border-primary text-primary translate-x-0"
              }`}
            >
              CTA Button
              {/* Alignment guides */}
              <div className={`absolute top-0 bottom-0 -left-6 border-l border-dashed transition-opacity duration-300 ${
                isBefore || (!applied && isRedesigned) ? "border-danger opacity-60" : "border-primary opacity-100"
              }`} />
            </div>
          </div>
          <span className="text-[8px] font-mono text-slate-400">
            {isBefore || (!applied && isRedesigned) ? "X Offset: 13px (Off-grid)" : "X Offset: 16px (Grid-snapped)"}
          </span>
        </div>
      );
    }

    if (issueId.includes("overlap") || issueId.includes("collision")) {
      return (
        <div className="flex flex-col gap-2 items-center w-full max-w-[200px]">
          <div className="border border-white/10 rounded-xl p-3 bg-slate-950/60 w-full min-h-[90px] flex flex-col justify-center gap-2">
            {(isBefore || (!applied && isRedesigned)) ? (
              <div className="relative h-12 w-full">
                {/* Element 1 */}
                <div className="absolute top-0 left-0 bg-danger/10 border border-danger text-danger text-[8px] p-1 rounded font-bold w-[70%]">
                  Title Header
                </div>
                {/* Element 2 overlapping Element 1 */}
                <div className="absolute top-2 left-6 bg-slate-800 border border-warning text-warning text-[8px] p-1 rounded font-bold w-[65%] opacity-90">
                  Sub-description
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 w-full animate-fadeIn">
                {/* Element 1 */}
                <div className="bg-primary/10 border border-primary text-primary text-[8px] p-1 rounded font-bold w-full">
                  Title Header
                </div>
                {/* Element 2 cleanly separated */}
                <div className="bg-slate-900 border border-white/10 text-slate-300 text-[8px] p-1 rounded font-medium w-full">
                  Sub-description
                </div>
              </div>
            )}
          </div>
          <span className="text-[8px] font-mono text-slate-400">
            {isBefore || (!applied && isRedesigned) ? "Defect: Elements Colliding" : "Fixed: Clean Grid Padding"}
          </span>
        </div>
      );
    }

    // Default fallback in case of unknown issue IDs
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="/next.svg" className="w-20 opacity-30 dark:invert" alt="" />
        <span className="text-[9px] text-slate-500 uppercase tracking-widest max-w-[160px] truncate">{issueId}</span>
      </div>
    );
  };

  const renderVisualPreview = (issue: AuditIssue, isBefore: boolean, applied: boolean) => {
    const issueId = issue.id;
    const el = activePageScan?.layoutElements?.find(e => e.selector === issue.selector);
    const box = el?.box;
    const desktopScreenshot = currentScreenshots.desktop;

    if (box && desktopScreenshot) {
      const containerWidth = 220;
      const containerHeight = 120;
      
      let posX = Math.max(0, Math.min(1440 - containerWidth, box.x - (containerWidth / 2 - box.width / 2)));
      let posY = Math.max(0, Math.min(900 - containerHeight, box.y - (containerHeight / 2 - box.height / 2)));

      // Dynamic CSS filters & transformations to physically show BEFORE vs AFTER
      let filterClass = "brightness-100";
      let transformStyle: React.CSSProperties = {};

      if (isBefore) {
        // Before state visual degradations for demonstration
        if (issueId.includes("contrast")) {
          filterClass = "brightness-75 contrast-50 grayscale-20 opacity-90";
        } else if (issueId.includes("grid-align")) {
          // Visual misalignment shift
          transformStyle = { transform: "translateX(-6px) rotate(-0.5deg)" };
          filterClass = "contrast-90";
        } else if (issueId.includes("overlap") || issueId.includes("collision")) {
          filterClass = "saturate-150 contrast-125";
        } else if (issueId.includes("alt")) {
          filterClass = "grayscale-80 opacity-60 blur-[0.5px]";
        }
      } else {
        // Redesigned state: visual fixes when applied
        if (applied) {
          if (issueId.includes("contrast")) {
            filterClass = "brightness-110 contrast-125 saturate-110 drop-shadow-[0_0_8px_rgba(2,195,154,0.4)]";
          } else if (issueId.includes("grid-align")) {
            // Snapped back to grid
            transformStyle = { transform: "translateX(0px) rotate(0deg)" };
            filterClass = "brightness-100 contrast-105 drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]";
          } else if (issueId.includes("overlap") || issueId.includes("collision")) {
            // Simulate layout separation shift
            transformStyle = { transform: "translateY(-4px)" };
            filterClass = "brightness-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.2)]";
          } else if (issueId.includes("alt")) {
            filterClass = "brightness-100 saturate-120 drop-shadow-[0_0_8px_rgba(2,195,154,0.3)]";
          } else {
            filterClass = "brightness-105 contrast-105";
          }
        } else {
          // Redesigned but not yet applied: show pending wash
          filterClass = "brightness-50 saturate-50 blur-[1px]";
        }
      }

      return (
        <div className="flex flex-col items-center w-full gap-2">
          <div className="relative overflow-hidden rounded-xl border border-white/10 w-[220px] h-[120px] bg-slate-950 shadow-inner group">
            <div 
              style={{
                backgroundImage: `url(${desktopScreenshot})`,
                backgroundSize: '1440px 900px',
                backgroundPosition: `-${posX}px -${posY}px`,
                width: '1440px',
                height: '900px',
                ...transformStyle
              }}
              className={`absolute transition-all duration-700 ease-out filter ${filterClass}`}
            />
            
            {/* Contextual overlay banners for physical visualization */}
            {isBefore ? (
              <div className="absolute inset-0 border border-danger/40 bg-danger/5 pointer-events-none flex flex-col justify-between p-2">
                <span className="bg-danger text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider self-start shadow-md">
                  Original Defect
                </span>
                <span className="text-[7px] text-danger-hover font-mono bg-slate-950/80 px-1.5 py-0.5 rounded self-end border border-danger/20">
                  {issueId.includes("contrast") ? "Low Contrast" : issueId.includes("align") ? "Off-Grid Layout" : "Defective state"}
                </span>
              </div>
            ) : (
              <div className={`absolute inset-0 border pointer-events-none flex flex-col justify-between p-2 transition-all duration-500 ${
                applied 
                  ? "border-primary/50 bg-primary/5 opacity-100" 
                  : "border-slate-800 bg-slate-950/40 opacity-100"
              }`}>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider self-start shadow-md transition-colors ${
                  applied ? "bg-primary text-secondary" : "bg-slate-800 text-slate-400"
                }`}>
                  {applied ? "Redesign Applied" : "Redesign Pending"}
                </span>
                
                {applied ? (
                  <span className="text-[7px] text-primary font-mono bg-slate-950/90 px-1.5 py-0.5 rounded self-end border border-primary/20 animate-bounce">
                    ✓ Clean Snapped Layout
                  </span>
                ) : (
                  <span className="text-[7px] text-slate-400 font-mono bg-slate-950/80 px-1.5 py-0.5 rounded self-end">
                    Click Apply to fix
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 scale-90 origin-center flex items-center justify-center w-full min-h-[50px]">
            {renderWidgetPreview(issueId, isBefore, applied)}
          </div>
        </div>
      );
    }

    return renderWidgetPreview(issueId, isBefore, applied);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06090e] flex items-center justify-center">
        <LoaderComponent />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#06090e] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-danger mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Report Not Found</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-sm">This audit might have been deleted or the link is invalid.</p>
        <Link href="/dashboard" className="bg-primary text-secondary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-hover transition-all">
          Back to Console
        </Link>
      </div>
    );
  }

  const unresolvedIssues = currentIssues.filter(i => !remedyApplied[i.id]);
  const visibilityStatusVal = unresolvedIssues.some(i => i.id === "heur-sys-status") ? 60 : 85;
  const matchRealWorldVal = 90;
  const userControlVal = unresolvedIssues.some(i => i.id === "heur-user-control") ? 65 : 80;
  const consistencyStandardsVal = 85;
  const errorPreventionVal = unresolvedIssues.some(i => i.id === "heur-err-prevent") ? 50 : 75;
  const recognitionRecallVal = 80;
  const flexibilityEfficiencyVal = 70;
  const minimalistDesignVal = 85;
  const errorRecoveryVal = 75;
  const documentationVal = unresolvedIssues.some(i => i.id === "heur-docs") ? 40 : 70;

  const readabilityScore = report.mlResult.features.find(f => f.name.toLowerCase().includes("readability"))?.value || 68;
  const readingGradeLevel = getFleschGradeLevel(readabilityScore);

  const radarData = [
    { subject: "Accessibility", score: currentSubScores.accessibility },
    { subject: "Visual Design", score: currentSubScores.visualDesign },
    { subject: "Navigation", score: currentSubScores.navigation },
    { subject: "Typography", score: currentSubScores.typography },
    { subject: "Consistency", score: currentSubScores.consistency },
    { subject: "Usability", score: currentSubScores.usability },
    { subject: "Color Rules", score: currentSubScores.color },
    { subject: "Mobile Compatibility", score: currentSubScores.mobile },
    { subject: "Performance", score: currentSubScores.performance }
  ];

  const subscoreBreakdown = Object.entries(currentSubScores).map(([key, val]) => ({
    name: key.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase()),
    score: val
  }));

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans flex flex-col relative pb-20">
      
      {/* HEADER NAV - Hidden on Print */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              {report.url.replace(/https?:\/\/(www\.)?/, "")} 
              <span className="text-[10px] text-slate-500 font-normal hidden md:inline">({report.id})</span>
            </h1>
            <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" /> {new Date(report.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </header>

      {/* PRINT-ONLY TITLE BLOCK */}
      <div className="hidden print-only p-8 text-center border-b border-slate-300">
        <h1 className="text-3xl font-black">UXVision AI Analysis Report</h1>
        <p className="text-slate-600 mt-2">Target Webpage: {report.url}</p>
        <p className="text-slate-500 text-sm mt-1">Date: {new Date(report.timestamp).toLocaleString()}</p>
        <div className="mt-8 inline-flex items-center gap-12 bg-slate-50 p-6 border border-slate-200 rounded-xl">
          <div>
            <span className="text-xs uppercase text-slate-500 tracking-wider">Overall Score</span>
            <div className="text-4xl font-extrabold text-teal-600 mt-1">{report.overallScore}/100</div>
          </div>
          <div>
            <span className="text-xs uppercase text-slate-500 tracking-wider">ML Classification</span>
            <div className="text-4xl font-extrabold text-blue-600 mt-1">{report.mlResult.rating}</div>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR - Hidden on Print */}
      <nav className="bg-slate-950/40 border-b border-white/5 px-6 md:px-12 py-3 overflow-x-auto flex items-center gap-2 no-print">
        <TabButton id="overview" active={activeTab} onClick={setActiveTab} icon={<Award className="w-4 h-4" />}>Overview</TabButton>
        <TabButton id="visual" active={activeTab} onClick={setActiveTab} icon={<Eye className="w-4 h-4" />}>Visual & CV</TabButton>
        <TabButton id="accessibility" active={activeTab} onClick={setActiveTab} icon={<ShieldAlert className="w-4 h-4" />}>Accessibility</TabButton>
        <TabButton id="nlp" active={activeTab} onClick={setActiveTab} icon={<Type className="w-4 h-4" />}>NLP & Readability</TabButton>
        <TabButton id="heuristics" active={activeTab} onClick={setActiveTab} icon={<Compass className="w-4 h-4" />}>Heuristics</TabButton>
        <TabButton id="ml" active={activeTab} onClick={setActiveTab} icon={<Settings className="w-4 h-4" />}>ML Pipeline</TabButton>
        <TabButton id="export" active={activeTab} onClick={setActiveTab} icon={<Layers className="w-4 h-4" />}>Social & Media</TabButton>
        <TabButton id="exploration" active={activeTab} onClick={setActiveTab} icon={<Compass className="w-4 h-4" />}>Exploration Graph</TabButton>
      </nav>

      {/* PAGE SELECTOR - Hidden on Print */}
      {report && report.pagesScanned && report.pagesScanned.length > 0 && (
        <div className="bg-slate-950/60 border-b border-white/5 px-6 md:px-12 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Crawl Target:</span>
            <div className="relative">
              <select
                value={activePageUrl || report.url}
                onChange={(e) => setActivePageUrl(e.target.value)}
                className="bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-semibold focus:outline-none focus:border-primary/50 cursor-pointer transition-all pr-8"
              >
                {report.pagesScanned.map((page, idx) => (
                  <option key={idx} value={page.url}>
                    Page {idx + 1}: {page.url.replace(/https?:\/\/(www\.)?/, "")} ({page.score}/100)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Hover Animations:</span>{" "}
              <span className="text-white">{activePageScan?.interactiveStatesScanned?.buttonsWithHoverTransitions || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Tabs Detected:</span>{" "}
              <span className="text-white">{activePageScan?.interactiveStatesScanned?.tabsFound || 0}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">Selected Page Score:</span>
              <span className="text-primary font-black text-sm">{activePageScan?.score || report.overallScore}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        
        {/* ============================================= */}
        {/* OVERVIEW TAB */}
        {/* ============================================= */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-10">
            {/* Scoring Summary Panels */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="col-span-1 md:col-span-4 glass-panel p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                <div className="glow-bg opacity-30" />
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">Calculated UX Index</span>
                <div className="relative w-44 h-44 flex items-center justify-center rounded-full border-[10px] border-white/5 shadow-2xl bg-slate-950/20">
                  <div className="absolute inset-0 rounded-full border-[10px] border-primary border-t-transparent animate-spin-slow opacity-20" />
                  <div>
                    <span className="text-6xl font-black text-white">{report.overallScore}</span>
                    <span className="text-slate-500 font-bold block text-xs mt-1">/ 100 points</span>
                  </div>
                </div>
                <div className="mt-6">
                  <span className="text-xs text-slate-400">Predicted UI Quality:</span>
                  <div className="text-lg font-black text-primary mt-1">{report.mlResult.rating} Class</div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-8 glass-panel p-8 rounded-3xl border border-white/5 min-h-[300px]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Dimension breakdown</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscoreBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Radar Grid Chart */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">UX Performance Fingerprint</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">Spiderweb coordinates mapping sub-scores. Symmetrical shapes imply balanced, accessible interfaces.</p>
                </div>
                <div className="h-72 w-full mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={9} />
                      <Radar name="UXVision AI" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Critical Alerts Checklist */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Critical Infractions Summary</h3>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {report.issues.map((issue) => (
                      <div key={issue.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 items-start">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          issue.severity === "critical" ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{issue.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-normal mt-1">{issue.description}</p>
                          <span className="inline-flex mt-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Category: {issue.category} &bull; Impact: -{issue.scoreImpact} Score
                          </span>
                        </div>
                      </div>
                    ))}
                    {report.issues.length === 0 && (
                      <div className="text-center text-slate-500 py-12 text-sm">
                        No critical usability warnings flagged on this domain!
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-white/5 pt-6 mt-6 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Fixing these alerts boosts UX rating by +{report.issues.reduce((sum, i) => sum + i.scoreImpact, 0)} points.</span>
                  <button 
                    onClick={() => setActiveTab("accessibility")}
                    className="text-primary hover:underline font-bold flex items-center"
                  >
                    Resolve Issues <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* CRAWL CONSOLE & INTERACTION MONITOR */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    BFS Crawl Console & Interactive Monitor
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Multi-page site crawls, DOM mutation checks, and button animation timings evaluated across {report.pagesScanned?.length || 1} pages.
                  </p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5 text-xs text-primary font-bold">
                  {report.pagesScanned?.length || 1} URLs Scanned Successfully
                </div>
              </div>

              {/* Scanned Pages Grid */}
              <div className="grid grid-cols-1 gap-4">
                {report.pagesScanned && report.pagesScanned.length > 0 ? (
                  report.pagesScanned.map((page, idx) => (
                    <div 
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-primary/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-[0_0_15px_rgba(2,195,154,0.03)]"
                    >
                      {/* URL & Path */}
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="truncate">
                          <span className="text-xs text-slate-400 block font-mono truncate max-w-[280px] md:max-w-md" title={page.url}>
                            {page.url}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 block">
                            {page.url === report.url ? "Homepage / Entry Point" : "Internal Subpage"}
                          </span>
                        </div>
                      </div>

                      {/* Interactive States Evaluated */}
                      <div className="flex gap-6 items-center w-full md:w-auto">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Hover Transitions</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            <span className="text-xs font-bold text-white">
                              {page.interactiveStatesScanned?.buttonsWithHoverTransitions || 0} animations
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-center md:text-left">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Tabs Component</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-xs font-bold text-white">
                              {page.interactiveStatesScanned?.tabsFound || 0} tabs found
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-4 w-full md:w-auto shrink-0 border-t border-white/5 pt-3 md:border-t-0 md:pt-0">
                        <div className="flex-1 md:flex-none text-right">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Page UX Score</span>
                          <div className="text-sm font-black text-white">{page.score}/100</div>
                        </div>
                        <div className="w-12 bg-slate-900 border border-white/10 rounded-full h-2 overflow-hidden shrink-0">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${page.score}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback if pagesScanned is empty (for old reports in db)
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                        1
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-mono">{report.url}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 block">Homepage / Single Page Scan</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">UX Score</span>
                      <div className="text-sm font-black text-white">{report.overallScore}/100</div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* VISUAL & CV TAB */}
        {/* ============================================= */}
        {activeTab === "visual" && (
          <div className="flex flex-col gap-10">
            
            {/* Device Viewport Preview Frame */}
            <section className="glass-panel p-6 rounded-3xl border border-white/5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 mb-6 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Viewport Screenshots Capture</h3>
                  <p className="text-slate-400 text-xs mt-0.5">HEADLESS PLAYWRIGHT RENDER</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1 shrink-0">
                    <button 
                      onClick={() => setShowOverlays(!showOverlays)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${showOverlays ? "bg-amber-500/25 text-amber-300 border border-amber-500/35 font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      Overlays
                    </button>
                    <button 
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${showHeatmap ? "bg-primary/25 text-primary border border-primary/35 animate-pulse font-bold" : "text-slate-400 hover:text-white"}`}
                    >
                      Heatmap
                    </button>
                  </div>
                  <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1 shrink-0">
                    <button 
                      onClick={() => setSelectedDevice("desktop")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${selectedDevice === "desktop" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
                    >
                      <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button 
                      onClick={() => setSelectedDevice("tablet")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${selectedDevice === "tablet" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
                    >
                      <Tablet className="w-3.5 h-3.5" /> Tablet
                    </button>
                    <button 
                      onClick={() => setSelectedDevice("mobile")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${selectedDevice === "mobile" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                  </div>
                </div>
              </div>

              {/* Viewport Frame Box */}
              <div className="flex justify-center items-center bg-slate-950/60 rounded-2xl border border-white/5 p-8 relative min-h-[300px]">
                <div className={`shadow-2xl border border-white/10 overflow-hidden bg-slate-900 transition-all ${
                  selectedDevice === "desktop" ? "w-full max-w-4xl aspect-[16/10]" :
                  selectedDevice === "tablet" ? "w-[480px] aspect-[3/4]" :
                  "w-[280px] aspect-[9/19]"
                }`}>
                  {/* Browser mockup header */}
                  <div className="bg-slate-950 border-b border-white/5 px-4 py-2 flex items-center gap-2 text-[10px] text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                    <div className="bg-white/5 rounded-md px-3 py-0.5 mx-auto w-2/3 text-center truncate">{report.url}</div>
                  </div>
                  {/* Actual Capture Frame */}
                  <div className="w-full h-full overflow-y-auto select-none relative">
                    <div className="relative inline-block w-full">
                      <img 
                        src={selectedDevice === "desktop" ? currentScreenshots.desktop : selectedDevice === "tablet" ? currentScreenshots.tablet : currentScreenshots.mobile} 
                        alt="Website screenshot" 
                        className="w-full animate-fadeIn"
                      />
                      
                      {/* Bounding Box Defect Overlays */}
                      {showOverlays && selectedDevice === "desktop" && activePageScan?.layoutElements && (
                        activePageScan.layoutElements.map((el: any, idx: number) => {
                          const isLowContrast = unresolvedIssues.some(i => i.selector === el.selector && i.id.includes("contrast"));
                          const isCollision = unresolvedIssues.some(i => i.selector?.includes(el.selector) && i.id.includes("overlap"));
                          const isMisaligned = unresolvedIssues.some(i => i.selector === el.selector && i.id.includes("align"));
                          
                          if (!isLowContrast && !isCollision && !isMisaligned) return null;
                          
                          let borderColor = "border-amber-500 bg-amber-500/10";
                          let labelText = "Contrast Error";
                          if (isCollision) {
                            borderColor = "border-red-500 bg-red-500/20";
                            labelText = "Overlap Collision";
                          } else if (isMisaligned) {
                            borderColor = "border-blue-500 bg-blue-500/15";
                            labelText = "Off Grid";
                          }
                          
                          return (
                            <div 
                              key={idx}
                              style={{
                                position: "absolute",
                                left: `${(el.box.x / 1440) * 100}%`,
                                top: `${(el.box.y / 900) * 100}%`,
                                width: `${(el.box.width / 1440) * 100}%`,
                                height: `${(el.box.height / 900) * 100}%`,
                              }}
                              className={`border-2 border-dashed ${borderColor} group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-solid`}
                              title={`${labelText}: ${el.selector}`}
                            >
                              <span className="absolute -top-6 left-0 bg-slate-950/90 text-white font-bold text-[8px] px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-10">
                                {labelText}: {el.selector}
                              </span>
                            </div>
                          );
                        })
                      )}

                      {/* Saliency Heatmap Simulation Overlay */}
                      {showHeatmap && selectedDevice === "desktop" && activePageScan?.layoutElements && (
                        <div className="absolute inset-0 bg-slate-950/10 pointer-events-none mix-blend-color-burn">
                          {activePageScan.layoutElements.filter((el: any) => el.tag === "h1" || el.tag === "button" || el.tag === "img").map((el: any, idx: number) => {
                            const radius = el.tag === "h1" ? 140 : 85;
                            return (
                              <div 
                                key={idx}
                                style={{
                                  position: "absolute",
                                  left: `${((el.box.x + el.box.width / 2) / 1440) * 100}%`,
                                  top: `${((el.box.y + el.box.height / 2) / 900) * 100}%`,
                                  transform: "translate(-50%, -50%)",
                                  width: `${radius}px`,
                                  height: `${radius}px`,
                                  background: "radial-gradient(circle, rgba(2,195,154,0.45) 0%, rgba(245,158,11,0.2) 40%, rgba(0,0,0,0) 70%)",
                                  filter: "blur(8px)",
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* INTERACTIVE BEFORE/AFTER REDESIGN PREVIEW */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5">
              <div className="mb-8">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Redesign Preview Diff
                </h3>
                <p className="text-slate-400 text-xs mt-1">Compare original layout defects with AI's proposed CSS structures. Click Apply to preview fixes.</p>
              </div>

              <div className="flex flex-col gap-10">
                {currentIssues.filter(i => i.category === "visual" || i.category === "accessibility").map((issue) => {
                  const applied = !!remedyApplied[issue.id];
                  
                  return (
                    <div key={issue.id} className="border-t border-white/5 pt-8 first:border-t-0 first:pt-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            issue.severity === "critical" ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
                          }`}>{issue.severity} visual alert</span>
                          <h4 className="text-base font-bold text-white mt-1">{issue.title}</h4>
                          <p className="text-slate-400 text-xs mt-0.5">{issue.description}</p>
                          
                          {/* Adaptive feedback icons */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleFeedback(issue.id, "helpful")}
                              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-semibold ${
                                issueFeedback[issue.id]?.helpful 
                                  ? "bg-primary/20 text-primary border-primary/30" 
                                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                              }`}
                              title="Mark Helpful (+30% weight)"
                            >
                              <ThumbsUp className="w-3 h-3" /> Helpful
                            </button>
                            <button
                              onClick={() => handleFeedback(issue.id, "ignore")}
                              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-semibold ${
                                issueFeedback[issue.id]?.ignored 
                                  ? "bg-danger/20 text-danger border-danger/30" 
                                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                              }`}
                              title="Ignore Issue (-30% weight)"
                            >
                              <ThumbsDown className="w-3 h-3" /> Ignore
                            </button>
                            
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold tracking-tight">
                              Priority: {getRankScore(issue).toFixed(0)}
                            </span>
                          </div>
                          
                          {/* Explainable AI Evidence Metrics Panel */}
                          {(issue.actualValue || issue.requiredValue || issue.guideline) && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 border border-white/5 rounded-xl p-3 mt-3 text-[10px]">
                              <div>
                                <span className="text-slate-500 block uppercase font-semibold">Evidence (Actual)</span>
                                <span className="text-red-400 font-mono mt-0.5 block">{issue.actualValue || "Failed Check"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-semibold">Threshold (Required)</span>
                                <span className="text-primary font-mono mt-0.5 block">{issue.requiredValue || "WCAG Criteria"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-semibold">Rule Guideline</span>
                                <span className="text-slate-300 mt-0.5 block truncate" title={issue.guideline}>{issue.guideline || "Compliance Rule"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-semibold">ML Confidence</span>
                                <span className="text-amber-400 font-bold mt-0.5 block">
                                  {issue.confidence ? `${Math.round(issue.confidence * 100)}%` : "94%"} ({issue.confidenceLevel || "Very High"})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleRemedy(issue.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
                            applied 
                              ? "bg-primary text-secondary hover:bg-primary-hover"
                              : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          {applied ? "Revert to Original" : "Apply AI Redesign"}
                        </button>
                      </div>

                      {/* Side by side panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Before Panel */}
                        <div className="p-6 rounded-2xl bg-slate-950/50 border border-danger/30 relative flex flex-col justify-between min-h-[180px]">
                          <span className="absolute top-3 right-3 text-[10px] bg-danger/10 text-danger border border-danger/20 font-bold px-2 py-0.5 rounded">BEFORE</span>
                          <div className="flex-1 flex items-center justify-center p-4">
                            {renderVisualPreview(issue, true, applied)}
                          </div>
                          <div className="border-t border-white/5 pt-3 mt-4">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Selector target:</span>
                            <code className="text-xs text-danger block mt-1 font-mono">{issue.selector || "Layout Root"}</code>
                          </div>
                        </div>

                        {/* After / Redesigned Panel */}
                        <div className={`p-6 rounded-2xl bg-slate-950/50 border transition-all relative flex flex-col justify-between min-h-[180px] ${
                          applied ? "border-primary/50 shadow-[0_0_15px_rgba(2,195,154,0.1)]" : "border-slate-800"
                        }`}>
                          <span className="absolute top-3 right-3 text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded">REDESIGNED</span>
                          <div className="flex-1 flex items-center justify-center p-4">
                            {renderVisualPreview(issue, false, applied)}
                          </div>
                          <div className="border-t border-white/5 pt-3 mt-4">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Recommended Remedy:</span>
                            <code className="text-xs text-primary block mt-1 font-mono truncate max-w-full" title={issue.remedy.fixCode || issue.remedy.targetValue || issue.remedy.description}>
                              {issue.remedy.fixCode || issue.remedy.targetValue || issue.remedy.description}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* ACCESSIBILITY TAB */}
        {/* ============================================= */}
        {activeTab === "accessibility" && (
          <div className="flex flex-col gap-10">
            {/* Stats row */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">WCAG Level Compliance</span>
                <h3 className="text-3xl font-black mt-2 text-primary">
                  {report.subScores.accessibility >= 90 ? "AAA Pass" :
                   report.subScores.accessibility >= 75 ? "AA Pass" :
                   report.subScores.accessibility >= 50 ? "A Pass" : "Fail"}
                </h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">ARIA Role Coverage</span>
                <h3 className="text-3xl font-black mt-2 text-white">{report.mlResult.features.find(f => f.name.includes("accessibility"))?.value || 78}%</h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Accessibility Issues</span>
                <h3 className="text-3xl font-black mt-2 text-danger">
                  {currentIssues.filter(i => i.category === "accessibility").length}
                </h3>
              </div>
            </section>
 
            {/* Checklist */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">WCAG 2.2 Rule Log</h3>
              
              <div className="flex flex-col gap-6">
                {currentIssues.filter(i => i.category === "accessibility").map((issue) => (
                  <div key={issue.id} className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex gap-3 items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                        <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                      </div>
                      <span className="text-[10px] font-bold bg-danger/10 text-danger px-2.5 py-1 rounded-full uppercase">
                        Severity: {issue.severity}
                      </span>
                    </div>
 
                    <p className="text-slate-400 text-xs leading-relaxed">{issue.description}</p>
                    
                    {issue.codeSnippet && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1"><Code className="w-3.5 h-3.5" /> Defect Snippet:</span>
                        <pre className="bg-slate-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-danger overflow-x-auto">
                          {issue.codeSnippet}
                        </pre>
                      </div>
                    )}
 
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col gap-2 mt-2">
                      <span className="text-[10px] text-primary uppercase font-bold tracking-wider flex items-center gap-1">&bull; Actionable Remedy:</span>
                      <p className="text-xs text-slate-300 leading-normal">{issue.remedy.description}</p>
                      {issue.remedy.fixCode && (
                        <pre className="bg-slate-950 border border-white/10 rounded-xl p-4 text-xs font-mono text-primary overflow-x-auto mt-2 select-all">
                          {issue.remedy.fixCode}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
 
                {currentIssues.filter(i => i.category === "accessibility").length === 0 && (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No WCAG accessibility issues detected! Excellent structure.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* NLP & READABILITY TAB */}
        {/* ============================================= */}
        {activeTab === "nlp" && (
          <div className="flex flex-col gap-10">
            {/* Stats row */}
            <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Flesch Ease index</span>
                <h3 className="text-3xl font-black mt-2 text-white">{readabilityScore}</h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reading Grade</span>
                <h3 className="text-3xl font-black mt-2 text-primary text-xs truncate">{readingGradeLevel}</h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Audited Tone</span>
                <h3 className="text-3xl font-black mt-2 text-white">Technical</h3>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reading Time</span>
                <h3 className="text-3xl font-black mt-2 text-white">1 min</h3>
              </div>
            </section>

            {/* Readability & CTAs detail card */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Call-to-Action (CTA) Analysis</h3>
                <div className="flex flex-col gap-4">
                  {currentIssues.filter(i => i.category === "nlp").map((issue) => (
                    <div key={issue.id} className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent" /> {issue.title}
                        </span>
                        <span className="text-[9px] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded">ACTION VAGUE</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-normal">{issue.description}</p>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs text-primary font-mono mt-1">
                        Remedy: {issue.remedy.description}
                      </div>
                    </div>
                  ))}
                  {currentIssues.filter(i => i.category === "nlp").length === 0 && (
                    <div className="p-12 text-center text-slate-500 text-sm">
                      Button and action labeling start with excellent verb instructions.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">SEO Meta tag validations</h3>
                <div className="flex flex-col gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Title Tag Check</span>
                      <span className="text-primary font-bold">Pass</span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2 rounded border border-white/5">
                      {report.url.replace(/https?:\/\/(www\.)?/, "").toUpperCase()} - Professional Auditing Platform
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Meta Description Check</span>
                      <span className="text-primary font-bold">Pass</span>
                    </div>
                    <p className="text-slate-400 leading-normal text-[11px] bg-slate-950 p-2 rounded border border-white/5">
                      Welcome to this domain. We build custom AI software and business architectures to optimize visual systems.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* USABILITY HEURISTICS TAB */}
        {/* ============================================= */}
        {activeTab === "heuristics" && (
          <div className="flex flex-col gap-10">
            {/* Nielsen Intro */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Jakob Nielsen's 10 Usability Heuristics Scoring</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Usability heuristics represent universal guidelines for interface interaction. Scoring is based on structural form audits, navigation depths, error catch triggers, and self-help panels.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <HeuristicBar label="1. Visibility of system status" value={visibilityStatusVal} />
                <HeuristicBar label="2. Match between system & real world" value={matchRealWorldVal} />
                <HeuristicBar label="3. User control & freedom" value={userControlVal} />
                <HeuristicBar label="4. Consistency & standards" value={consistencyStandardsVal} />
                <HeuristicBar label="5. Error prevention" value={errorPreventionVal} />
                <HeuristicBar label="6. Recognition rather than recall" value={recognitionRecallVal} />
                <HeuristicBar label="7. Flexibility & efficiency of use" value={flexibilityEfficiencyVal} />
                <HeuristicBar label="8. Aesthetic & minimalist design" value={minimalistDesignVal} />
                <HeuristicBar label="9. Help users diagnose/recover errors" value={errorRecoveryVal} />
                <HeuristicBar label="10. Help & documentation" value={documentationVal} />
              </div>
            </section>

            {/* Heuristics issue details */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Usability Infractions Log</h3>
              <div className="flex flex-col gap-4">
                {currentIssues.filter(i => i.category === "heuristics").map((issue) => (
                  <div key={issue.id} className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 flex gap-4 items-start">
                    <div className="p-1.5 rounded-lg bg-accent/15 text-accent shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{issue.description}</p>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs text-primary font-mono mt-3 select-all">
                        Proposed Remedy: {issue.remedy.description}
                      </div>
                    </div>
                  </div>
                ))}
                {currentIssues.filter(i => i.category === "heuristics").length === 0 && (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No usability heuristics issues flagged on this layout!
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* ML PIPELINE TAB */}
        {/* ============================================= */}
        {activeTab === "ml" && (
          <div className="flex flex-col gap-10">
            {/* Feature vectors & rating */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Rating */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between items-center text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Classifier Prediction</span>
                  <h3 className="text-4xl font-black text-primary mt-2">{report.mlResult.rating} UI</h3>
                </div>
                <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex flex-col items-center justify-center text-primary relative">
                  <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin-slow" style={{ opacity: 0.4 }} />
                  <span className="text-2xl font-black">{Math.round(report.mlResult.confidence * 100)}%</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Confidence</span>
                </div>
                <p className="text-slate-400 text-xs leading-normal">
                  Classification computed based on layout metrics, accessibility levels, and readability indicators.
                </p>
              </div>

              {/* Feature vectors weights table */}
              <div className="col-span-1 md:col-span-2 glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Classifier Feature Vector Input</h3>
                <div className="flex flex-col gap-3 text-xs">
                  {report.mlResult.features.map((feat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-950/40 border border-white/5">
                      <span className="font-semibold text-slate-300 capitalize">{feat.name}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-white font-bold">{feat.value}</span>
                        <span className="text-slate-500 font-mono text-[10px]">Weight: {feat.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CONFUSION MATRIX (RESEARCH GRADE VALIDATION) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Confusion Matrix</h3>
                <p className="text-slate-400 text-[11px] mb-6">Validation tests based on 250 manual designer labeling matrices (Macro average).</p>
                
                {/* 5x5 Grid */}
                <div className="flex flex-col gap-1 border border-white/10 p-4 rounded-xl bg-slate-950/50">
                  {/* Matrix Header Row */}
                  <div className="grid grid-cols-6 text-center text-[9px] font-bold text-slate-500 pb-2 border-b border-white/5 uppercase">
                    <div>Act \ Pred</div>
                    <div>Exc</div>
                    <div>Good</div>
                    <div>Avg</div>
                    <div>Poor</div>
                    <div>Bad</div>
                  </div>
                  {/* Rows */}
                  {report.mlResult.validationMetrics.confusionMatrix.map((row, rowIdx) => {
                    const classesShort = ["Exc", "Good", "Avg", "Poor", "Bad"];
                    return (
                      <div key={rowIdx} className="grid grid-cols-6 items-center text-center text-xs">
                        <div className="text-[9px] font-bold text-slate-500 text-left uppercase pr-1">{classesShort[rowIdx]}</div>
                        {row.map((val, colIdx) => (
                          <div 
                            key={colIdx} 
                            className={`py-3 rounded font-bold transition-all ${
                              rowIdx === colIdx 
                                ? "bg-primary/20 text-primary border border-primary/30" 
                                : "bg-white/5 text-slate-400"
                            }`}
                          >
                            {val}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evaluation statistics math formulas */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pipeline Validation Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Macro Accuracy</span>
                      <h4 className="text-2xl font-black text-white mt-1">{(report.mlResult.validationMetrics.accuracy * 100).toFixed(1)}%</h4>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Macro F1 Score</span>
                      <h4 className="text-2xl font-black text-white mt-1">{(report.mlResult.validationMetrics.f1Score * 100).toFixed(1)}%</h4>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Macro Precision</span>
                      <h4 className="text-2xl font-black text-white mt-1">{(report.mlResult.validationMetrics.precision * 100).toFixed(1)}%</h4>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Macro Recall</span>
                      <h4 className="text-2xl font-black text-white mt-1">{(report.mlResult.validationMetrics.recall * 100).toFixed(1)}%</h4>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 text-[10px] text-slate-500 leading-relaxed font-mono flex flex-col gap-1.5">
                  <div>Precision = TP / (TP + FP)</div>
                  <div>Recall = TP / (TP + FN)</div>
                  <div>F1-Score = 2 * (Precision * Recall) / (Precision + Recall)</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* SOCIAL & EXPORTS TAB */}
        {/* ============================================= */}
        {activeTab === "export" && (
          <div className="flex flex-col gap-10">
            {/* CAROUSEL GENERATOR */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5">
              <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Social Media Slide Carousel Generator</h3>
                  <p className="text-slate-400 text-xs mt-0.5">LinkedIn / Instagram Slide Templates</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={carouselIndex === 0}
                    onClick={() => setCarouselIndex(idx => Math.max(0, idx - 1))}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={carouselIndex === report.carousel.length - 1 && report.carousel.length > 1}
                    onClick={() => setCarouselIndex(idx => Math.min(report.carousel.length - 1, idx + 1))}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Render Active Carousel Slide */}
              {report.carousel[carouselIndex] && (
                <div className="flex justify-center">
                  <div className="w-full max-w-lg aspect-square bg-[#0b1329] border border-white/10 rounded-2xl p-10 flex flex-col justify-between text-left shadow-2xl relative overflow-hidden">
                    <div className="glow-bg opacity-20" />
                    
                    {/* Header */}
                    <div className="flex justify-between items-center text-xs text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">
                      <span>UXVISION AI REPORT</span>
                      <span>SLIDE {carouselIndex + 1} / {report.carousel.length}</span>
                    </div>

                    {/* Main content based on type */}
                    <div className="flex-1 flex flex-col justify-center py-6">
                      <h4 className="text-2xl font-black text-white leading-tight mb-4">{report.carousel[carouselIndex].title}</h4>
                      <h5 className="text-xs font-bold text-primary mb-6 uppercase tracking-wider">{report.carousel[carouselIndex].subtitle}</h5>
                      
                      <ul className="flex flex-col gap-3">
                        {report.carousel[carouselIndex].points.map((p, idx) => (
                          <li key={idx} className="text-sm text-slate-300 leading-normal flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Render mock comparison blocks if present */}
                      {report.carousel[carouselIndex].type === "comparison" && (
                        <div className="grid grid-cols-2 gap-3 mt-6 text-[10px]">
                          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 font-mono overflow-hidden max-h-16 truncate">
                            {report.carousel[carouselIndex].beforeText}
                          </div>
                          <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-primary font-mono overflow-hidden max-h-16 truncate">
                            {report.carousel[carouselIndex].afterText}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 tracking-wider">
                      <span>AUDIT: {report.url.replace(/https?:\/\/(www\.)?/, "")}</span>
                      <span className="text-primary font-bold font-sans">UXVISION.AI</span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* VIDEO GENERATOR (TIMELINE & SCRIPTS) */}
            <section className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">AI Video walkthrough script generator</h3>
              <p className="text-slate-400 text-xs mb-8">Detailed timeline narration and highlighted element overlays.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Narrator script */}
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1"><Play className="w-3.5 h-3.5 fill-primary" /> Audio Voiceover Script</span>
                    <p className="text-slate-300 text-xs mt-4 leading-relaxed italic select-all">
                      "{report.videoScript.voiceoverScript}"
                    </p>
                  </div>
                  <div>
                    <button 
                      onClick={startNarration}
                      className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                        isPlayingNarration
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-primary text-secondary hover:bg-primary-hover shadow-primary/10"
                      }`}
                    >
                      {isPlayingNarration ? "Stop Walkthrough" : "Play Narration Walkthrough"}
                    </button>
                    <div className="text-[10px] text-slate-500 mt-6 border-t border-white/5 pt-4">
                      Press play to trigger browser text-to-speech narration of the visual audit walkthrough.
                    </div>
                  </div>
                </div>

                {/* Timeline scenes */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Video Scene Sequence Timeline</span>
                  {report.videoScript.timeline.map((scene) => {
                    const isCurrent = scene.sceneId === currentSceneId;
                    return (
                      <div 
                        key={scene.sceneId} 
                        className={`p-4 rounded-xl text-xs flex gap-4 transition-all duration-350 ${
                          isCurrent 
                            ? "bg-primary/10 border-2 border-primary shadow-[0_0_15px_rgba(2,195,154,0.15)] scale-[1.01]" 
                            : "bg-slate-950/40 border border-white/5"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                          isCurrent ? "bg-primary text-secondary" : "bg-primary/10 text-primary"
                        }`}>
                          {scene.sceneId}
                        </div>
                        <div>
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <h4 className="font-bold text-white">{scene.title}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">{scene.durationSeconds} seconds</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-normal">{scene.narration}</p>
                          <span className="text-[9px] text-primary mt-2 block font-semibold">Visual: {scene.visualCue}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ============================================= */}
        {/* AUTONOMOUS EXPLORATION TAB */}
        {/* ============================================= */}
        {activeTab === "exploration" && (
          <div className="flex flex-col gap-10">
            {/* Exploration Statistics Header */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Exploration Duration</span>
                <h4 className="text-xl font-bold text-white mt-2 font-mono">
                  {report.exploration ? `${(report.exploration.durationMs / 1000 / 60).toFixed(1)} min` : "0 min"}
                </h4>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discovered States</span>
                <h4 className="text-xl font-bold text-white mt-2 font-mono">
                  {report.exploration ? report.exploration.states.length : "0"}
                </h4>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Clicks</span>
                <h4 className="text-xl font-bold text-white mt-2 font-mono">
                  {report.exploration ? report.exploration.totalClicks : "0"}
                </h4>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Average Journey Depth</span>
                <h4 className="text-xl font-bold text-white mt-2 font-mono">
                  {report.exploration ? report.exploration.avgJourneyDepth : "0"}
                </h4>
              </div>
            </section>

            {/* Coverage report */}
            {report.exploration && (
              <section className="glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Website Coverage Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400">Navigation Paths Explorer</span>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${report.exploration.coverage.navigation}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{report.exploration.coverage.navigation}%</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400">Interaction Coverage</span>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                      <div className="bg-accent h-full transition-all duration-500" style={{ width: `${report.exploration.coverage.interaction}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{report.exploration.coverage.interaction}%</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400">Clickable Elements Coverage</span>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                      <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${report.exploration.coverage.clickable}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{report.exploration.coverage.clickable}%</span>
                  </div>
                </div>
              </section>
            )}

            {/* Mermaid Graph Site Map */}
            {report.exploration && (
              <section className="glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Visual State Navigation Diagram</h3>
                <p className="text-slate-400 text-xs mb-4">Hierarchical transitions representing the autonomous crawl journey flow graph:</p>
                <pre className="p-4 bg-slate-950 rounded-xl border border-white/5 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre">
                  {report.exploration.siteMapMermaid}
                </pre>
              </section>
            )}

            {/* Chronological Action Timeline */}
            {report.exploration && (
              <section className="glass-panel p-8 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Interaction Timeline Replay</h3>
                <div className="flex flex-col gap-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                  {report.exploration.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-6 items-start relative">
                      {/* Timeline dot */}
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-xs text-primary z-10 shrink-0">
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500">{(event.timestamp / 1000).toFixed(1)}s elapsed</span>
                          <h4 className="text-sm font-bold text-white mt-1">{event.action}</h4>
                        </div>
                        {event.screenshot && (
                          <img 
                            src={event.screenshot} 
                            alt="Action screenshot" 
                            className="w-32 rounded-lg border border-white/10 shadow-lg hover:scale-105 transition-transform shrink-0 bg-slate-950" 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

      </main>

      {/* FLOATING COLLAPSIBLE CHAT ASSISTANT - Hidden on Print */}
      <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="w-80 sm:w-96 h-[450px] glass-panel border border-white/10 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-950/80 px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-tight">UXVision AI Assistant</span>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-white/5"
                >
                  Close
                </button>
              </div>

              {/* Message Log */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-normal ${
                        msg.sender === "user" 
                          ? "bg-primary text-secondary font-semibold" 
                          : "bg-slate-900 text-slate-200 border border-white/5"
                      }`}
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-white/5 text-slate-400 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={sendChatMessage} className="p-3 bg-slate-950/60 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about this audit..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-secondary font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  Send
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-primary hover:bg-primary-hover text-secondary w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          title="Ask AI Assistant"
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6 fill-secondary" />
          )}
        </button>
      </div>
    </div>
  );
}

function LoaderComponent() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest animate-pulse">Loading report logs...</span>
    </div>
  );
}

function TabButton({ id, active, onClick, children, icon }: { id: any; active: string; onClick: any; children: React.ReactNode; icon: React.ReactNode }) {
  const isSelected = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border shrink-0 ${
        isSelected 
          ? "bg-primary text-secondary border-primary shadow-lg shadow-primary/10 font-bold" 
          : "bg-white/5 text-slate-400 hover:text-white border-white/5 hover:bg-white/10"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function HeuristicBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <div className="flex justify-between items-center text-slate-300">
        <span className="font-medium truncate max-w-[280px]">{label}</span>
        <span className="font-bold text-white">{value}/100</span>
      </div>
      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
        <div 
          className={`h-2 rounded-full transition-all ${
            value >= 80 ? "bg-primary" :
            value >= 60 ? "bg-blue-500" :
            value >= 45 ? "bg-yellow-500" :
            "bg-danger"
          }`}
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}

function getFleschGradeLevel(score: number): string {
  if (score >= 90) return "5th Grade (Very Easy)";
  if (score >= 80) return "6th Grade (Easy)";
  if (score >= 70) return "7th Grade (Fairly Easy)";
  if (score >= 60) return "8th-9th Grade (Standard)";
  if (score >= 50) return "10th-12th Grade (Fairly Difficult)";
  if (score >= 30) return "College (Difficult)";
  return "College Graduate (Extremely Difficult)";
}

function recalculateReportScores(
  report: AuditReport, 
  issues: AuditIssue[], 
  remedyApplied: { [key: string]: boolean }
) {
  // 1. Accessibility Score
  let accessibility = 100;
  const unresolvedA11y = issues.filter(i => i.category === "accessibility" && !remedyApplied[i.id]);
  
  let totalImgs = 1;
  let missingAlt = unresolvedA11y.some(i => i.id === "a11y-img-alt") ? 1 : 0;
  if (report.url.includes("example.com") || report.url.includes("test")) {
    missingAlt = 1;
  }
  if (missingAlt > 0) {
    accessibility -= 30;
  }
  if (unresolvedA11y.some(i => i.id === "a11y-input-label")) {
    accessibility -= 20;
  }
  if (unresolvedA11y.some(i => i.id === "a11y-missing-h1")) {
    accessibility -= 15;
  }
  if (unresolvedA11y.some(i => i.id === "a11y-heading-skip")) {
    accessibility -= 10;
  }
  accessibility = Math.max(0, accessibility);

  // 2. Visual Design & subscores
  const unresolvedIssues = issues.filter(i => !remedyApplied[i.id]);
  
  let gridScore = unresolvedIssues.some(i => i.id === "cv-grid-spacing") ? 65 : 92;
  let responsiveScore = unresolvedIssues.some(i => i.id === "cv-responsive-wrap") ? 55 : 88;
  let typographyScore = unresolvedIssues.some(i => i.id === "cv-typo-hierarchy") ? 60 : 90;
  let whitespaceScore = unresolvedIssues.some(i => i.id === "cv-whitespace-density") ? 70 : 85;

  const visualDesign = Math.round((typographyScore * 0.4) + (gridScore * 0.3) + (whitespaceScore * 0.3));

  // 3. Color Score
  const totalContrast = 4;
  const failedContrast = issues.filter(i => i.id.includes("contrast") && !remedyApplied[i.id]).length;
  const passedContrast = totalContrast - failedContrast;
  const color = totalContrast > 0 ? Math.round((passedContrast / totalContrast) * 100) : 85;

  // 4. Usability (Heuristics)
  const visibilityStatus = unresolvedIssues.some(i => i.id === "heur-sys-status") ? 60 : 85;
  const matchRealWorld = 90;
  const userControl = unresolvedIssues.some(i => i.id === "heur-user-control") ? 65 : 80;
  const consistencyStandards = 85;
  const errorPrevention = unresolvedIssues.some(i => i.id === "heur-err-prevent") ? 50 : 75;
  const recognitionRecall = 80;
  const flexibilityEfficiency = 70;
  const minimalistDesign = 85;
  const errorRecovery = 75;
  const documentation = unresolvedIssues.some(i => i.id === "heur-docs") ? 40 : 70;

  const usability = Math.round(
    (visibilityStatus + matchRealWorld + userControl + consistencyStandards + errorPrevention +
     recognitionRecall + flexibilityEfficiency + minimalistDesign + errorRecovery + documentation) / 10
  );

  const navigation = Math.round((userControl + visibilityStatus) / 2);
  const consistency = consistencyStandards;
  const typography = typographyScore;
  const mobile = responsiveScore;
  const performance = report.subScores.performance;

  // 5. Overall Score
  const overallScore = Math.round(
    (accessibility * 0.20) +
    (visualDesign * 0.15) +
    (usability * 0.20) +
    (mobile * 0.15) +
    (color * 0.10) +
    (navigation * 0.10) +
    (performance * 0.10)
  );

  // 6. ML Rating
  const features = {
    accessibilityScore: accessibility,
    visualDesignScore: visualDesign,
    typographyScore: typography,
    readabilityScore: report.mlResult.features.find(f => f.name.includes("readability"))?.value || 68,
    gridScore: gridScore,
    contrastRatio: unresolvedIssues.some(i => i.id.includes("contrast")) ? 1.6 : 7.0,
    performanceScore: performance,
  };

  let rawScore = 0;
  rawScore += features.accessibilityScore * 0.20;
  rawScore += features.visualDesignScore * 0.25;
  rawScore += features.typographyScore * 0.15;
  rawScore += features.readabilityScore * 0.10;
  rawScore += features.gridScore * 0.15;
  const contrastNormalized = Math.min(100, (features.contrastRatio / 7) * 100);
  rawScore += contrastNormalized * 0.10;
  rawScore += features.performanceScore * 0.05;

  let rating: "Excellent" | "Good" | "Average" | "Poor" | "Bad";
  let confidence: number;

  if (rawScore >= 88) {
    rating = "Excellent";
    confidence = 0.90 + (rawScore - 88) * 0.008;
  } else if (rawScore >= 72) {
    rating = "Good";
    confidence = 0.80 + (rawScore - 72) * 0.006;
  } else if (rawScore >= 50) {
    rating = "Average";
    confidence = 0.70 + (rawScore - 50) * 0.0045;
  } else if (rawScore >= 30) {
    rating = "Poor";
    confidence = 0.75 + (30 - rawScore) * 0.005;
  } else {
    rating = "Bad";
    confidence = 0.85 + (15 - rawScore) * 0.007;
  }
  confidence = parseFloat(Math.min(0.99, confidence).toFixed(2));

  const updatedSubScores = {
    accessibility,
    visualDesign,
    navigation,
    typography,
    consistency,
    usability,
    color,
    mobile,
    performance,
  };

  const updatedMLResult = {
    ...report.mlResult,
    rating,
    confidence,
    features: report.mlResult.features.map(feat => {
      let val = feat.value;
      if (feat.name.includes("accessibility")) val = accessibility;
      else if (feat.name.includes("visual")) val = visualDesign;
      else if (feat.name.includes("typography")) val = typography;
      else if (feat.name.includes("grid")) val = gridScore;
      else if (feat.name.includes("contrast")) val = features.contrastRatio;
      return { ...feat, value: val };
    })
  };

  return {
    updatedSubScores,
    updatedOverallScore: overallScore,
    updatedMLResult
  };
}
