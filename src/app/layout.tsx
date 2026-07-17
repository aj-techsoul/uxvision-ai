import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UXVision AI | AI-Powered Intelligent UI/UX Audit & Recommendation Platform",
  description: "Evaluate your website's user experience instantly. UXVision AI uses Computer Vision, Natural Language Processing, and Usability Heuristics to audit pages and suggest visual redesigns.",
  keywords: ["UX Audit", "UI/UX Analyzer", "Web Accessibility", "WCAG 2.2", "Lighthouse", "Heuristic Evaluation", "Design System Quality"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#06090e] text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
