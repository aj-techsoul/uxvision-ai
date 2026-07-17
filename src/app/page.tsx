"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Tv, Eye, Activity, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, 
  HelpCircle, Star, ArrowRight, Layers, FileText, Search, Menu, X, Code, Check
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activePlan, setActivePlan] = useState<"monthly" | "yearly">("monthly");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const features = [
    {
      icon: <Eye className="w-6 h-6 text-primary" />,
      title: "Computer Vision Layout Audits",
      desc: "Our machine vision models detect margin defects, spacing alignment anomalies, overlapping layers, and responsive typography flow breaks."
    },
    {
      icon: <Activity className="w-6 h-6 text-primary" />,
      title: "WCAG 2.2 Accessibility Engine",
      desc: "Instantly check contrast luminance ratios, ARIA role mappings, alt-text descriptors, and keyboard tab structures."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "AI Redesign Recommendations",
      desc: "Leverage Large Language Models (LLMs) to construct drop-in HTML/CSS code corrections with expected UX impact ratings."
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-primary" />,
      title: "Nielsen's 10 Usability Heuristics",
      desc: "Systematically score design patterns against Visibility of system status, User control, and Error prevention principles."
    },
    {
      icon: <Tv className="w-6 h-6 text-primary" />,
      title: "AI Video Walkthrough Creator",
      desc: "Generate full scene timelines, element highlights, and narration voiceover scripts ready for production."
    },
    {
      icon: <Layers className="w-6 h-6 text-primary" />,
      title: "Social Media Carousel Builder",
      desc: "Automatically compile Instagram, LinkedIn, and PDF presentation slides showing visual audits and Before/After metrics."
    }
  ];

  const steps = [
    { num: "01", title: "Submit Website URL", desc: "Paste your webpage target. The pipeline spins up headless Playwright modules to capture multi-device screenshots." },
    { num: "02", title: "Multimodal Deep Scan", desc: "Our unified CV, NLP, and accessibility rule engines process layouts, code selectors, text, and semantic branches." },
    { num: "03", title: "Predict & Remediate", desc: "We run TypeScript classifiers to predict UX scores and invoke LLMs to draft step-by-step code remedies." },
    { num: "04", title: "Generate Interactive Reports", desc: "Explore reports, download PDF files, review AI narration videos, and copy CSS code layouts." }
  ];

  const faqs = [
    {
      q: "How does the Computer Vision analysis detect layout errors?",
      a: "Our CV models check element bounding coordinates extracted through our scraper, cross-checking elements against an 8px layout grid. It computes horizontal/vertical overlaps, contrast luminance, and alignment imbalances."
    },
    {
      q: "Can I run reports on local staging websites or portals?",
      a: "Yes! Since the platform uses browser-level persistence and carries simulated fallbacks, you can audit structures, test HTML mock files, and run code analyses without network restrictions."
    },
    {
      q: "Which accessibility guidelines does the platform follow?",
      a: "We fully validate elements against the WCAG 2.2 specifications (levels A, AA, and AAA), checking contrast, keyboard focus rings, semantic layouts, and screen reader labels."
    },
    {
      q: "Is it possible to download reports for clients?",
      a: "Absolutely! The report detail dashboard provides custom styling for PDF exports, print outputs, social carousels, and script timelines."
    }
  ];

  const plans = {
    monthly: [
      { name: "Starter", price: "$29", desc: "Essential tools for indie hackers and makers.", features: ["5 audits per month", "Standard WCAG checklist", "Before/After code mocks", "Social carousels", "IndexedDB history"] },
      { name: "Pro", price: "$79", desc: "Advanced audits for marketing agencies.", features: ["30 audits per month", "Full CV grid spacing analysis", "ML rating predictions", "AI Voiceover scripts", "PDF downloads", "Priority support"], recommended: true },
      { name: "Enterprise", price: "$199", desc: "Custom features for large applications.", features: ["Unlimited audits", "Custom heuristic weights", "Multi-user shared history", "Advanced API endpoints", "Dedicated account management"] }
    ],
    yearly: [
      { name: "Starter", price: "$19", desc: "Essential tools for indie hackers and makers.", features: ["5 audits per month", "Standard WCAG checklist", "Before/After code mocks", "Social carousels", "IndexedDB history"] },
      { name: "Pro", price: "$59", desc: "Advanced audits for marketing agencies.", features: ["30 audits per month", "Full CV grid spacing analysis", "ML rating predictions", "AI Voiceover scripts", "PDF downloads", "Priority support"], recommended: true },
      { name: "Enterprise", price: "$149", desc: "Custom features for large applications.", features: ["Unlimited audits", "Custom heuristic weights", "Multi-user shared history", "Advanced API endpoints", "Dedicated account management"] }
    ]
  };

  const testimonials = [
    { name: "Sarah Jenkins", role: "Principal Product Designer", company: "Designflow", text: "UXVision AI slashed our design system review times. We instantly found WCAG failures that saved us from compliance fees.", rating: 5 },
    { name: "Marcus Thorne", role: "VP of Product", company: "SaaSify", text: "The ML UI quality scoring is shockingly accurate. The generated carousels are a killer feature for presenting to stakeholders.", rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans relative overflow-hidden">
      {/* Decorative background glow rings */}
      <div className="glow-bg top-[10%] left-[5%]" />
      <div className="glow-bg top-[60%] right-[5%]" />

      {/* HEADER NAV */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-bold text-lg shadow-[0_0_15px_rgba(2,195,154,0.4)]">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            UXVision <span className="text-primary font-light">AI</span>
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          <Link href="/dashboard/research" className="hover:text-primary transition-colors flex items-center gap-1">
            <FileText className="w-4 h-4" /> Research Hub
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-primary hover:bg-primary-hover text-secondary font-bold text-sm px-5 py-2.5 rounded-lg shadow-lg hover:shadow-primary/20 transition-all">
            Start Free Audit
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[73px] z-40 glass-panel border-b border-white/10 p-6 flex flex-col gap-6 md:hidden"
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors">How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors">FAQ</a>
            <Link href="/dashboard/research" onClick={() => setMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-2">
              <FileText className="w-5 h-5" /> Research Hub
            </Link>
            <div className="h-px bg-white/10 w-full" />
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 bg-primary text-secondary font-bold rounded-lg hover:bg-primary-hover transition-all">
                Start Free Audit
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 md:px-12 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-semibold text-primary mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen UI/UX Scanners
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            An AI-Powered Intelligent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
              UI/UX Audit & Recommendation
            </span> Platform
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Deploy computer vision, natural language models, and usability heuristics to automatically audit websites. 
            Identify defects, explain <span className="text-white font-semibold">why</span> they occur, and grab copy-paste 
            remedy code to boost conversion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-secondary font-extrabold px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(2,195,154,0.3)] hover:shadow-primary/45 transition-all flex items-center justify-center gap-2 group text-base">
              Analyze Website Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard/research" className="w-full sm:w-auto glass-panel hover:bg-white/5 border-white/10 px-8 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all">
              <Code className="w-5 h-5 text-primary" /> View Research Spec
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Mockup Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-16 rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl shadow-primary/5 bg-[#0b1329]/80 aspect-video glass-panel p-4"
        >
          {/* Browser Bar */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg px-4 py-1 text-xs w-1/2 text-center text-slate-400">
              https://uxvision.ai/dashboard/audit/demo-report
            </div>
            <div className="w-10" />
          </div>
          {/* Simulated content */}
          <div className="grid grid-cols-12 gap-4 text-left h-full">
            <div className="col-span-3 border-r border-white/5 pr-4 flex flex-col gap-3">
              <div className="h-6 w-3/4 bg-white/10 rounded" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
              <div className="h-4 w-5/6 bg-white/5 rounded" />
              <div className="h-4 w-2/3 bg-white/5 rounded" />
            </div>
            <div className="col-span-9 flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center font-bold text-2xl text-primary bg-primary/10">
                  88
                </div>
                <div>
                  <div className="h-6 w-48 bg-white/10 rounded mb-2" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-white/5 rounded border border-white/5 p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Accessibility</span>
                  <span className="text-lg font-bold text-white">92%</span>
                </div>
                <div className="h-20 bg-white/5 rounded border border-white/5 p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Visual Layout</span>
                  <span className="text-lg font-bold text-white">85%</span>
                </div>
                <div className="h-20 bg-white/5 rounded border border-white/5 p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">Usability Heuristics</span>
                  <span className="text-lg font-bold text-white">80%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete UI/UX Audit Core Systems</h2>
          <p className="text-slate-400">Six analysis pipelines run in parallel to review structural DOM layouts, contrast variables, reading levels, and user escape paths.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-primary/20 transition-all flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Automated Audit Workflow</h2>
            <p className="text-slate-400">Four transparent steps coordinate headless scrapers and cognitive engines to generate redesign drafts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st, idx) => (
              <div key={idx} className="flex flex-col gap-4 relative">
                <span className="text-5xl font-black text-primary/10 tracking-tight">{st.num}</span>
                <h3 className="text-lg font-bold text-white">{st.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Loved by Founders and UX Teams</h2>
          <p className="text-slate-400">See how companies optimize readability and double their landing page conversion rates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-2xl flex flex-col justify-between gap-6 border border-white/5">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4.5 h-4.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="italic text-slate-300 leading-relaxed text-sm">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{t.name}</h4>
                  <span className="text-xs text-slate-400">{t.role}, {t.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 md:px-12 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible, Value-Focused Pricing</h2>
            <p className="text-slate-400">Start auditing for free, upgrade as you scale your design review pipelines.</p>
            
            {/* Monthly/Yearly toggle */}
            <div className="inline-flex bg-slate-900 border border-white/10 rounded-full p-1 mt-6">
              <button 
                onClick={() => setActivePlan("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activePlan === "monthly" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                Monthly billing
              </button>
              <button 
                onClick={() => setActivePlan("yearly")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activePlan === "yearly" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans[activePlan].map((p, idx) => (
              <div 
                key={idx}
                className={`glass-panel p-8 rounded-2xl border flex flex-col justify-between relative ${p.recommended ? "border-primary/50 bg-[#0c1c29]/60 shadow-[0_0_20px_rgba(2,195,154,0.1)]" : "border-white/5"}`}
              >
                {p.recommended && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-secondary font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-slate-400 text-xs mb-6">{p.desc}</p>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-white">{p.price}</span>
                    <span className="text-slate-400 text-xs">/{activePlan === "monthly" ? "mo" : "mo, billed yearly"}</span>
                  </div>

                  <div className="h-px bg-white/5 mb-8" />

                  <ul className="flex flex-col gap-3.5 mb-8">
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href="/register" 
                  className={`w-full text-center py-3 rounded-xl font-bold transition-all text-sm ${p.recommended ? "bg-primary text-secondary hover:bg-primary-hover shadow-lg hover:shadow-primary/20" : "bg-white/5 text-white hover:bg-white/10 border border-white/10"}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-6 md:px-12 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-400">Got questions about the pipelines or reports? Find answers here.</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-6 flex items-center justify-between font-semibold hover:text-primary transition-colors text-sm md:text-base"
              >
                <span>{f.q}</span>
                <HelpCircle className={`w-5 h-5 text-slate-500 transition-transform ${activeFaq === idx ? "rotate-180 text-primary" : ""}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-slate-400 text-sm leading-relaxed border-t border-white/5 bg-slate-950/20">
                      {f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* RESEARCH & CONTACT */}
      <section className="py-24 px-6 md:px-12 bg-slate-950/60 border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Audit Your Design System?</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Create an account to test our ML-based grading tools and download WCAG accessibility summaries.
          </p>

          {contactSubmitted ? (
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-primary font-medium max-w-md mx-auto"
            >
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
              Thank you! We will update you with technical reports soon.
            </motion.div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (contactEmail.trim()) setContactSubmitted(true);
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input 
                type="email" 
                required
                placeholder="Enter email to get updates" 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 px-5 py-3 rounded-xl focus:outline-none focus:border-primary text-sm"
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover text-secondary font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5"
              >
                Join Waitlist <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-12">
            <Link href="/dashboard/research" className="inline-flex items-center gap-2 text-primary hover:underline font-semibold text-sm">
              Explore our System Design, Flowcharts & Academic Models <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5 text-center text-slate-500 text-xs flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">V</div>
          <span className="font-semibold text-slate-300">UXVision AI</span>
        </div>
        <p>&copy; 2026 UXVision AI Platform. Built to academic validation specifications. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
