import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Scan, 
  Save, 
  Sliders, 
  Type,
  FileCheck,
  Zap,
  Shield
} from 'lucide-react';

export default function LandingPage({ onFileSelected, onShowPrivacyAudit }) {
  const [isDragging, setIsDragging] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files);
    }
  };

  const cloudyBullets = [
    { text: "No Sign-Up Required", icon: Zap, classAnim: "animate-cloudy-rise-1" },
    { text: "Zero Storage Policy", icon: Shield, classAnim: "animate-cloudy-rise-2" },
    { text: "Unlimited Edits", icon: Sparkles, classAnim: "animate-cloudy-rise-3" },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#f4f1ea] flex flex-col justify-between selection:bg-[#d97706]/30 selection:text-[#f4f1ea] relative overflow-hidden font-sans">
      {/* Background Ambient Warm Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-[#d97706]/10 via-[#1c1c1c]/40 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#d97706]/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#d97706]/5 blur-3xl pointer-events-none rounded-full" />

      {/* BACKGROUND LAYER (Z-0 BEHIND ALL CARDS & COMPONENTS) - BIG & BROAD CLOUDY RISING BULLETS */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {cloudyBullets.map((b, idx) => {
          const IconComp = b.icon;
          // Calculate rapid scroll acceleration offset
          const scrollShift = scrollY * 2.8;

          return (
            <div
              key={idx}
              className={`absolute left-1/2 top-[50%] ${b.classAnim} transition-transform ease-out duration-75`}
              style={{
                marginTop: `${-scrollShift}px`,
              }}
            >
              {/* Big, Broad, Bold Pill Container */}
              <div className="flex items-center gap-4 px-8 py-3.5 sm:px-12 sm:py-4.5 rounded-full bg-[#161616]/95 border-2 border-[#333333] shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-xl text-sm sm:text-base font-extrabold text-[#f4f1ea] tracking-wider uppercase whitespace-nowrap shadow-[#d97706]/10">
                <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-[#d97706] animate-pulse shrink-0" />
                <span>{b.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Header / Clean Minimal Navigation */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-30 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-[#f4f1ea] shadow-md shadow-[#d97706]/10">
            <FileText className="w-5 h-5 text-[#d97706]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#f4f1ea] font-heading flex items-center gap-2">
              Document Editor
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onShowPrivacyAudit}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] hover:bg-[#242424] border border-[#2e2e2e] hover:border-[#d97706]/40 text-xs font-semibold text-[#b0a99f] hover:text-[#f4f1ea] transition-all cursor-pointer shadow-sm hover:shadow-lg hover:shadow-[#d97706]/10 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-[#d97706]" />
            <span>Privacy Audit</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-full bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212] font-bold text-xs transition-all shadow-lg shadow-[#f4f1ea]/10 hover:shadow-[#d97706]/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Upload File
          </button>
        </div>
      </header>

      {/* Main Section */}
      <main className="container mx-auto px-4 sm:px-6 py-10 flex flex-col items-center max-w-6xl relative z-20 flex-1">
        {/* Main Headline */}
        <div className="text-center max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-[#2e2e2e] text-[#f4f1ea] text-xs font-semibold mb-6 shadow-md shadow-[#d97706]/5 hover:border-[#d97706]/30 transition-all">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Multi-Pass OCR & Native Layout Preservation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#f4f1ea] mb-4 font-heading uppercase leading-tight">
            EDIT TEXT INSTANTLY
          </h1>
          <p className="text-[#b0a99f] text-base sm:text-xl font-normal leading-relaxed">
            Unlock Text from PDFs & Images with Ease
          </p>
        </div>

        {/* 100% CODE-BASED INTERACTIVE HERO COMPOSITION WITH FLOWING BADGES & HOVER GLOWS */}
        <div className="w-full relative my-6 max-w-5xl z-20">

          {/* FLOWING ANIMATED CHIPS: OCR, PDF, PNG */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -top-5 left-6 sm:left-12 z-30 animate-float-slow flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1c1c1c]/90 border border-[#2e2e2e] hover:border-[#d97706] shadow-xl backdrop-blur-md text-xs font-bold text-[#f4f1ea] font-mono cursor-pointer transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(217,119,6,0.35)] active:scale-95"
          >
            <Scan className="w-3.5 h-3.5 text-[#d97706] animate-pulse" />
            <span>OCR</span>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -top-4 right-20 sm:right-32 z-30 animate-float-reverse flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1c1c1c]/90 border border-[#2e2e2e] hover:border-[#d97706] shadow-xl backdrop-blur-md text-xs font-bold text-[#f4f1ea] font-mono cursor-pointer transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(217,119,6,0.35)] active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-[#d97706]" />
            <span>PDF</span>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-10 -left-4 sm:-left-8 z-30 animate-float-slow flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1c1c1c]/90 border border-[#2e2e2e] hover:border-[#d97706] shadow-xl backdrop-blur-md text-xs font-bold text-[#f4f1ea] font-mono cursor-pointer transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(217,119,6,0.35)] active:scale-95"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#d97706]" />
            <span>PNG</span>
          </div>

          <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
            <span 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-full bg-[#f4f1ea] text-[#121212] font-bold text-xs shadow-xl flex items-center gap-1.5 cursor-pointer hover:bg-[#e4dfd3] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(244,241,234,0.4)] active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-[#121212]" />
              <span>SAVE PDF</span>
            </span>
            <span className="px-4 py-2 rounded-full bg-[#1c1c1c]/90 border border-[#2e2e2e] hover:border-[#d97706]/60 shadow-xl text-xs font-semibold text-[#b0a99f] text-center hover:text-[#f4f1ea] transition-all cursor-pointer">
              RECOGNIZE
            </span>
          </div>

          {/* Hero Composition Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Left Document Card: Draft & Outline */}
            <div className="md:col-span-4 bg-[#141414] border border-[#282828] rounded-3xl p-6 shadow-2xl relative overflow-hidden transform md:-rotate-1 transition-transform hover:rotate-0 duration-300 group hover:border-[#d97706]/40 hover:shadow-[0_0_30px_rgba(217,119,6,0.15)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-3">
                <span className="text-xs font-bold text-[#f4f1ea] tracking-wider uppercase font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#d97706]" />
                  PROJECT PLAN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c1c] text-[#746e65] font-mono border border-[#2e2e2e]">Draft v2</span>
              </div>
              
              <div className="space-y-2.5 text-[11px] text-[#b0a99f] font-mono leading-relaxed">
                <div className="p-2.5 rounded-xl bg-[#1a1a1a] border border-[#282828] group-hover:border-[#d97706]/30 transition-colors">
                  <p className="text-[#f4f1ea] font-semibold mb-1">1. Layout Analysis & Parsing</p>
                  <div className="h-1.5 w-3/4 bg-[#d97706]/40 rounded-full mb-1" />
                  <div className="h-1.5 w-1/2 bg-[#282828] rounded-full" />
                </div>
                <div className="p-2.5 rounded-xl bg-[#1a1a1a] border border-[#282828]">
                  <p className="text-[#b0a99f] mb-1">2. Multi-Pass OCR Detection</p>
                  <div className="h-1.5 w-5/6 bg-[#282828] rounded-full mb-1" />
                  <div className="h-1.5 w-2/3 bg-[#282828] rounded-full" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#242424] flex items-center justify-between text-[10px] text-[#746e65]">
                <span className="flex items-center gap-1">
                  <Scan className="w-3 h-3 text-[#d97706]" />
                  Bounding Box Ready
                </span>
                <span className="font-mono text-[#d97706] font-semibold">99.4% Conf</span>
              </div>
            </div>

            {/* Center Main Editor Window Component */}
            <div className="md:col-span-8 bg-[#181818] border border-[#303030] rounded-3xl shadow-2xl overflow-hidden relative group hover:border-[#d97706]/40 transition-all hover:shadow-[0_0_35px_rgba(217,119,6,0.15)]">
              {/* Editor Window Bar */}
              <div className="bg-[#121212] px-5 py-3 border-b border-[#282828] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <span className="text-xs font-bold text-[#f4f1ea] ml-2 font-mono">Live Document Workspace</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#242424] text-[#f4f1ea] font-semibold border border-[#333333]">
                    EDITING MODE
                  </span>
                </div>
              </div>

              {/* Editor Surface */}
              <div className="p-6 sm:p-8 bg-[#141414] relative min-h-[260px] flex flex-col justify-between">
                {/* Simulated Document Canvas Content */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#f4f1ea] font-heading tracking-tight">
                      EDIT TEXT FROM IMAGES & PDFS
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#1c1c1c] text-[#d97706] border border-[#d97706]/30 font-mono">
                      OCR Layer Active
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#b0a99f] leading-relaxed mb-4">
                    Unlock text from PDFs & images with ease. Click any detected region, modify text content, and export lossless output without layout shift.
                  </p>

                  {/* Active Highlight Bounding Box */}
                  <div className="p-3.5 rounded-xl border-2 border-dashed border-[#d97706] bg-[#d97706]/10 relative my-3 shadow-inner">
                    <div className="absolute -top-2.5 left-4 px-2 py-0.2 rounded-full bg-[#d97706] text-[#121212] font-mono text-[9px] font-bold uppercase shadow">
                      Active Selection
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#f4f1ea] flex items-center gap-1">
                      <span>EDIT TEXT FROM IMAGES & PDFS</span>
                      <span className="w-0.5 h-4 bg-[#f4f1ea] animate-pulse inline-block ml-1" />
                    </p>
                  </div>
                </div>

                {/* Toolbar Controls at bottom of window */}
                <div className="pt-4 border-t border-[#242424] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] text-[#f4f1ea]" title="Text Tool">
                      <Type className="w-4 h-4 text-[#d97706]" />
                    </span>
                    <span className="p-2 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] text-[#b0a99f]" title="Scan Bounds">
                      <Scan className="w-4 h-4" />
                    </span>
                    <span className="p-2 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] text-[#b0a99f]" title="Properties">
                      <Sliders className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212] font-bold text-xs transition-all cursor-pointer shadow-lg shadow-[#f4f1ea]/10 hover:shadow-[#d97706]/20 hover:scale-105 active:scale-95"
                    >
                      Edit Your Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Upload Dropzone Container */}
        <div className="w-full max-w-2xl my-6 z-20">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`warm-panel rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer group shadow-2xl ${
              isDragging
                ? 'border-[#d97706] bg-[#1a1815] scale-[1.01] shadow-[0_0_30px_rgba(217,119,6,0.2)]'
                : 'border-[#282828] hover:border-[#d97706]/50 hover:bg-[#181818] hover:shadow-[0_0_25px_rgba(217,119,6,0.1)]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              multiple
              className="hidden"
            />
            
            <div className="w-14 h-14 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center mb-4 group-hover:border-[#d97706] group-hover:scale-110 transition-all shadow-md">
              <Upload className="w-6 h-6 text-[#d97706]" />
            </div>

            <p className="text-lg font-bold text-[#f4f1ea] mb-1 text-center">
              Drop document(s) here, or <span className="text-[#f4f1ea] underline decoration-[#d97706] underline-offset-4">browse files</span>
            </p>
            <p className="text-[#746e65] text-xs mb-5 text-center font-mono">
              Supports PDF, PNG, JPG, WEBP (Max 10 MB per file)
            </p>

            <button className="px-6 py-3 rounded-full bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212] font-extrabold text-xs transition-all shadow-lg shadow-[#f4f1ea]/10 hover:shadow-[#d97706]/20 hover:scale-105 active:scale-95 flex items-center gap-2">
              <span>Choose Document Files</span>
              <ArrowRight className="w-4 h-4 text-[#121212]" />
            </button>
          </div>
        </div>

        {/* PROMINENT PRIVACY CERTIFICATE CARD */}
        <div className="w-full max-w-2xl bg-[#141414] border border-[#282828] rounded-3xl p-6 shadow-xl relative overflow-hidden my-4 group hover:border-[#d97706]/30 transition-all z-20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] text-[#d97706] shrink-0 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f4f1ea] tracking-tight mb-1 flex items-center gap-2">
                YOUR FILES ARE NOT STORED
              </h3>
              <p className="text-[#b0a99f] text-xs leading-relaxed mb-3">
                Uploaded images and PDFs are processed temporarily in volatile memory buffers solely to extract text layers. No database persistence, logging, or third-party cloud data transmission occurs.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#746e65]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#d97706]" />
                  No Database Storage
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#d97706]" />
                  No Cloud Storage Buckets
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#d97706]" />
                  Immediate Buffer Memory Purge
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-5 border-t border-[#1f1f1f] flex flex-col md:flex-row items-center justify-between text-xs text-[#746e65] relative z-20 font-sans">
        <p>© 2026 Document Editor. Precision typography, OCR detection, and zero-storage privacy.</p>
        <button onClick={onShowPrivacyAudit} className="hover:text-[#b0a99f] transition-colors cursor-pointer mt-2 md:mt-0">
          Verify Compliance & Security Audit
        </button>
      </footer>
    </div>
  );
}
