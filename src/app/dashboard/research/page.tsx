"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Layers, BarChart, Database, Network, GitFork, Award } from "lucide-react";

export default function ResearchHubPage() {
  const [activeDiagram, setActiveDiagram] = useState<"architecture" | "dfd" | "sequence" | "er" | "class">("architecture");

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans relative pb-20">
      {/* Glow rings */}
      <div className="glow-bg top-[15%] left-[20%]" />
      
      {/* HEADER NAV */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Console
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Research Hub & Academic Specifications
            </h1>
            <span className="text-[10px] text-slate-400 block mt-0.5">FORMAL SYSTEM MODELING AND EVALUATION STANDARDS</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {/* Title */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Academic Engineering Specifications</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
            This module details the formal software architecture, flow schemas, entity mappings, and mathematical performance metrics 
            established for validating the UXVision AI audit platform. Suitable for peer-reviewed publication modeling.
          </p>
        </section>

        {/* MATHEMATICAL MODELS SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Performance formulas */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-primary font-bold text-xs uppercase tracking-wider">
                <BarChart className="w-4.5 h-4.5" /> Classification Evaluation Metrics
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                To evaluate the multi-class neural predictor (Excellent, Good, Average, Poor, Bad), we calculate accuracy, multi-class macro precision, recall, and F1 index.
              </p>
              
              <div className="flex flex-col gap-5 text-xs font-mono">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div className="text-slate-400 mb-2">1. Macro Precision Formula:</div>
                  <div className="text-sm text-white font-bold bg-slate-900 px-3 py-2 rounded">
                    {"P_macro = \\frac{1}{|C|} \\sum_{c \\in C} \\frac{TP_c}{TP_c + FP_c}"}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div className="text-slate-400 mb-2">2. Macro Recall Formula:</div>
                  <div className="text-sm text-white font-bold bg-slate-900 px-3 py-2 rounded">
                    {"R_macro = \\frac{1}{|C|} \\sum_{c \\in C} \\frac{TP_c}{TP_c + FN_c}"}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div className="text-slate-400 mb-2">3. Macro F1 Score Formula:</div>
                  <div className="text-sm text-white font-bold bg-slate-900 px-3 py-2 rounded">
                    {"F_1 = 2 \\times \\frac{P_macro \\times R_macro}{P_macro + R_macro}"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User A/B testing satisfaction equations */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-primary font-bold text-xs uppercase tracking-wider">
                <Award className="w-4.5 h-4.5" /> A/B Testing & Satisfaction modeling
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                We calculate User Satisfaction Score (USS) and conversion rate lifts using standard statistical hypothesis testing equations.
              </p>
              
              <div className="flex flex-col gap-5 text-xs font-mono">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div className="text-slate-400 mb-2">1. User Satisfaction Index (USS):</div>
                  <div className="text-sm text-white font-bold bg-slate-900 px-3 py-2 rounded">
                    {"USS = \\frac{1}{N} \\sum_{i=1}^N \\left( w_1 A_i + w_2 V_i + w_3 U_i \\right)"}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1.5 font-sans">
                    Where A=Accessibility, V=Visual, U=Usability, and w represents weight vectors.
                  </span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div className="text-slate-400 mb-2">2. Statistical Significance Z-Score:</div>
                  <div className="text-sm text-white font-bold bg-slate-900 px-3 py-2 rounded">
                    {"Z = \\frac{p_A - p_B}{\\sqrt{p(1-p)(\\frac{1}{n_A} + \\frac{1}{n_B})}}"}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1.5 font-sans">
                    Utilized to calculate p-value parameters for A/B redesign conversion experiments.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIAGRAMS INTERACTIVE CONSOLE */}
        <section className="glass-panel p-8 rounded-3xl border border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 mb-8 gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Modeling Diagram Console</h3>
              <p className="text-slate-400 text-xs mt-0.5">Toggle to view UML modeling schemas</p>
            </div>
            {/* Nav tabs */}
            <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1 overflow-x-auto max-w-full shrink-0">
              <button 
                onClick={() => setActiveDiagram("architecture")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeDiagram === "architecture" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                Architecture
              </button>
              <button 
                onClick={() => setActiveDiagram("dfd")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeDiagram === "dfd" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                DFD (Level 1)
              </button>
              <button 
                onClick={() => setActiveDiagram("sequence")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeDiagram === "sequence" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                Sequence
              </button>
              <button 
                onClick={() => setActiveDiagram("er")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeDiagram === "er" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                ER Diagram
              </button>
              <button 
                onClick={() => setActiveDiagram("class")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeDiagram === "class" ? "bg-primary text-secondary" : "text-slate-400 hover:text-white"}`}
              >
                Class (UML)
              </button>
            </div>
          </div>

          {/* Diagram Display Box */}
          <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 flex justify-center items-center min-h-[360px] overflow-x-auto select-none">
            
            {/* System Architecture */}
            {activeDiagram === "architecture" && (
              <svg width="640" height="320" viewBox="0 0 640 320" className="text-slate-200">
                {/* User */}
                <rect x="20" y="130" width="100" height="60" rx="8" fill="#1e293b" stroke="var(--primary)" strokeWidth="2" />
                <text x="70" y="165" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">User Client</text>
                
                {/* Arrow */}
                <path d="M 120 160 L 170 160" fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
                
                {/* Next.js 15 Server Console */}
                <rect x="180" y="100" width="140" height="120" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="250" y="125" fill="#3b82f6" fontSize="11" fontWeight="bold" textAnchor="middle">Next.js 15 Server</text>
                <rect x="195" y="145" width="110" height="25" rx="4" fill="#0f172a" />
                <text x="250" y="161" fill="#fff" fontSize="9" textAnchor="middle">API route (/analyze)</text>
                <rect x="195" y="180" width="110" height="25" rx="4" fill="#0f172a" />
                <text x="250" y="196" fill="#fff" fontSize="9" textAnchor="middle">Playwright capture</text>
                
                {/* Arrow */}
                <path d="M 320 160 L 370 160" fill="none" stroke="#64748b" strokeWidth="2" />
                
                {/* Engines Layer */}
                <rect x="380" y="60" width="130" height="200" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                <text x="445" y="85" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">Core Audit Service</text>
                <rect x="395" y="105" width="100" height="20" rx="3" fill="#0f172a" />
                <text x="445" y="118" fill="#fff" fontSize="8" textAnchor="middle">CV Spacing engine</text>
                <rect x="395" y="135" width="100" height="20" rx="3" fill="#0f172a" />
                <text x="445" y="148" fill="#fff" fontSize="8" textAnchor="middle">A11y (WCAG) rules</text>
                <rect x="395" y="165" width="100" height="20" rx="3" fill="#0f172a" />
                <text x="445" y="178" fill="#fff" fontSize="8" textAnchor="middle">NLP Text readability</text>
                <rect x="395" y="195" width="100" height="20" rx="3" fill="#0f172a" />
                <text x="445" y="208" fill="#fff" fontSize="8" textAnchor="middle">Heuristics parser</text>
                <rect x="395" y="225" width="100" height="20" rx="3" fill="#0f172a" />
                <text x="445" y="238" fill="#fff" fontSize="8" textAnchor="middle">ML Scoring classifier</text>

                {/* Arrow */}
                <path d="M 510 160 L 560 160" fill="none" stroke="#64748b" strokeWidth="2" />
                
                {/* Storage */}
                <path d="M 560 130 C 560 110, 620 110, 620 130 L 620 190 C 620 210, 560 210, 560 190 Z" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <text x="590" y="165" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">IndexedDB</text>
              </svg>
            )}

            {/* DFD Level 1 */}
            {activeDiagram === "dfd" && (
              <svg width="600" height="300" viewBox="0 0 600 300">
                <circle cx="80" cy="150" r="40" fill="#1e293b" stroke="var(--primary)" strokeWidth="2" />
                <text x="80" y="154" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">Web Scraper</text>
                
                <path d="M 120 150 L 180 150" fill="none" stroke="#64748b" strokeWidth="2" />
                <text x="150" y="142" fill="#64748b" fontSize="8" textAnchor="middle">HTML/CSS</text>
                
                <circle cx="230" cy="150" r="40" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="230" y="154" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">Audit Pipeline</text>

                <path d="M 270 150 L 330 150" fill="none" stroke="#64748b" strokeWidth="2" />
                <text x="300" y="142" fill="#64748b" fontSize="8" textAnchor="middle">Score vectors</text>

                <circle cx="380" cy="150" r="40" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                <text x="380" y="154" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">ML Classifier</text>

                <path d="M 420 150 L 480 150" fill="none" stroke="#64748b" strokeWidth="2" />
                <text x="450" y="142" fill="#64748b" fontSize="8" textAnchor="middle">Class rating</text>

                <circle cx="520" cy="150" r="40" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <text x="520" y="154" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">Report builder</text>
              </svg>
            )}

            {/* Sequence Diagram */}
            {activeDiagram === "sequence" && (
              <svg width="600" height="300" viewBox="0 0 600 300" className="text-slate-400">
                {/* Headers */}
                <line x1="80" y1="50" x2="80" y2="280" stroke="#334155" strokeDasharray="4 4" />
                <line x1="280" y1="50" x2="280" y2="280" stroke="#334155" strokeDasharray="4 4" />
                <line x1="480" y1="50" x2="480" y2="280" stroke="#334155" strokeDasharray="4 4" />
                
                <rect x="30" y="20" width="100" height="30" rx="4" fill="#1e293b" stroke="var(--primary)" />
                <text x="80" y="38" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">User Client</text>

                <rect x="230" y="20" width="100" height="30" rx="4" fill="#1e293b" stroke="#3b82f6" />
                <text x="280" y="38" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">Next.js API</text>

                <rect x="430" y="20" width="100" height="30" rx="4" fill="#1e293b" stroke="#10b981" />
                <text x="480" y="38" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">Audit Service</text>

                {/* Interactions */}
                <path d="M 80 100 L 280 100" fill="none" stroke="#fff" strokeWidth="1.5" />
                <text x="180" y="92" fill="#fff" fontSize="9" textAnchor="middle">1. Request Audit(url)</text>

                <path d="M 280 130 L 480 130" fill="none" stroke="#fff" strokeWidth="1.5" />
                <text x="380" y="122" fill="#fff" fontSize="9" textAnchor="middle">2. Run capture & Scans()</text>

                <path d="M 480 180 L 280 180" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="380" y="172" fill="#64748b" fontSize="9" textAnchor="middle">3. Return scoring report</text>

                <path d="M 280 220 L 80 220" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="180" y="212" fill="#64748b" fontSize="9" textAnchor="middle">4. Display dashboard</text>
              </svg>
            )}

            {/* ER Diagram */}
            {activeDiagram === "er" && (
              <svg width="600" height="300" viewBox="0 0 600 300">
                {/* User Table */}
                <rect x="60" y="100" width="140" height="100" rx="8" fill="#1e293b" stroke="var(--primary)" strokeWidth="2" />
                <text x="130" y="120" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">User Store</text>
                <text x="75" y="145" fill="#94a3b8" fontSize="9">PK  email (String)</text>
                <text x="75" y="165" fill="#94a3b8" fontSize="9">    name (String)</text>
                <text x="75" y="185" fill="#94a3b8" fontSize="9">    password (Hash)</text>

                {/* Link */}
                <line x1="200" y1="150" x2="360" y2="150" stroke="#64748b" strokeWidth="2" />
                <text x="280" y="142" fill="#64748b" fontSize="8" textAnchor="middle">1 to Many</text>

                {/* Reports Table */}
                <rect x="360" y="70" width="180" height="160" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="450" y="90" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">Reports Store</text>
                <text x="375" y="115" fill="#94a3b8" fontSize="9">PK  id (String)</text>
                <text x="375" y="135" fill="#94a3b8" fontSize="9">FK  userEmail (String)</text>
                <text x="375" y="155" fill="#94a3b8" fontSize="9">    url (String)</text>
                <text x="375" y="175" fill="#94a3b8" fontSize="9">    overallScore (Int)</text>
                <text x="375" y="195" fill="#94a3b8" fontSize="9">    subScores (JSON Object)</text>
                <text x="375" y="215" fill="#94a3b8" fontSize="9">    timestamp (Date)</text>
              </svg>
            )}

            {/* Class Diagram */}
            {activeDiagram === "class" && (
              <svg width="600" height="300" viewBox="0 0 600 300">
                <rect x="180" y="40" width="240" height="220" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                <text x="300" y="60" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">UXVisionDB Class</text>
                <line x1="180" y1="75" x2="420" y2="75" stroke="#334155" />
                
                {/* Attributes */}
                <text x="195" y="95" fill="#94a3b8" fontSize="9">- db: IDBDatabase</text>
                <text x="195" y="110" fill="#94a3b8" fontSize="9">- version: Integer</text>
                <line x1="180" y1="125" x2="420" y2="125" stroke="#334155" />
                
                {/* Methods */}
                <text x="195" y="145" fill="#fff" fontSize="9">+ registerUser(user: User): Promise</text>
                <text x="195" y="165" fill="#fff" fontSize="9">+ loginUser(email, pass): Promise</text>
                <text x="195" y="185" fill="#fff" fontSize="9">+ saveReport(report): Promise</text>
                <text x="195" y="205" fill="#fff" fontSize="9">+ getReport(id): Promise</text>
                <text x="195" y="225" fill="#fff" fontSize="9">+ getAllReports(): Promise</text>
                <text x="195" y="245" fill="#fff" fontSize="9">+ deleteReport(id): Promise</text>
              </svg>
            )}

          </div>
        </section>
      </main>

      {/* SVG definitions */}
      <svg className="hidden">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
