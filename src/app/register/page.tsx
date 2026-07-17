"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "@/lib/db";
import { Lock, Mail, User, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("uxvision_user")) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const userPayload = {
        name,
        email,
        password, // stored securely in local browser db sandbox
        createdAt: new Date().toISOString()
      };

      // Add to IndexedDB
      await db.registerUser(userPayload);
      
      // Auto login user after successful signup
      const { password: _, ...safeUser } = userPayload;
      localStorage.setItem("uxvision_user", JSON.stringify(safeUser));
      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err?.toString() || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow rings */}
      <div className="glow-bg top-[15%] right-[20%]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-bold text-lg shadow-[0_0_15px_rgba(2,195,154,0.4)]">
              V
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              UXVision <span className="text-primary font-light">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Get started</h2>
          <p className="text-slate-400 text-sm mt-1">Join professional designers and audit your platforms.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden"
        >
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-start gap-3 mb-6 text-danger text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mb-6 text-primary text-sm">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Registration completed! Logging in...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-slate-600"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || success}
              className="w-full bg-primary hover:bg-primary-hover text-secondary font-bold py-3.5 rounded-xl shadow-lg hover:shadow-primary/10 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-sm"
            >
              {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="h-px bg-white/5 my-6" />

          <p className="text-center text-slate-400 text-xs">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
