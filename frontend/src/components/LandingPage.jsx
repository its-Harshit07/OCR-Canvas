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
  Shield,
  Sun,
  Moon
} from 'lucide-react';

export default function LandingPage({ 
  onFileSelected, 
  onShowPrivacyAudit, 
  theme = 'light', 
  onToggleTheme,
  hasConsented = false,
  onConsentChange,
  setErrorMessage
}) {
  const isDark = theme === 'dark';
  const [isDragging, setIsDragging] = useState(false);
  const [attemptedWithoutConsent, setAttemptedWithoutConsent] = useState(false);
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

  const requireConsentFirst = (actionCallback) => {
    if (!hasConsented) {
      setAttemptedWithoutConsent(true);
      if (setErrorMessage) {
        setErrorMessage("Please read and acknowledge the User Responsibility & Usage Notice before uploading a document.");
      }
      const consentElem = document.getElementById('mandatory-consent-box');
      if (consentElem) {
        consentElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    setAttemptedWithoutConsent(false);
    if (actionCallback) actionCallback();
    return true;
  };

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
    if (!requireConsentFirst()) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (!requireConsentFirst()) {
      e.target.value = '';
      return;
    }
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
    <div className={`min-h-screen flex flex-col justify-between selection:bg-[#d97706]/30 relative overflow-hidden font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0c0c0c] text-[#f4f1ea] selection:text-[#f4f1ea]' : 'bg-slate-50 text-slate-900 selection:text-slate-900'
    }`}>
      {/* Background Ambient Warm Glows */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-[#d97706]/10 ${
        isDark ? 'via-[#1c1c1c]/40' : 'via-amber-100/40'
      } to-transparent blur-3xl pointer-events-none rounded-full`} />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#d97706]/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#d97706]/5 blur-3xl pointer-events-none rounded-full" />

      {/* BACKGROUND LAYER (Z-0 BEHIND ALL CARDS & COMPONENTS) - BIG & BROAD CLOUDY RISING BULLETS */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {cloudyBullets.map((b, idx) => {
          const IconComp = b.icon;
          const scrollShift = scrollY * 2.8;

          return (
            <div
              key={idx}
              className={`absolute left-1/2 top-[50%] ${b.classAnim} transition-transform ease-out duration-75`}
              style={{
                marginTop: `${-scrollShift}px`,
              }}
            >
              <div className={`flex items-center gap-4 px-8 py-3.5 sm:px-12 sm:py-4.5 rounded-full border-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl text-sm sm:text-base font-extrabold tracking-wider uppercase whitespace-nowrap ${
                isDark 
                  ? 'bg-[#161616]/95 border-[#333333] text-[#f4f1ea] shadow-[#d97706]/10' 
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40'
              }`}>
                <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-[#d97706] animate-pulse shrink-0" />
                <span>{b.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Header / Clean Minimal Navigation */}
      <header className={`container mx-auto px-6 py-6 flex items-center justify-between relative z-30 border-b ${
        isDark ? 'border-[#1f1f1f]' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
            isDark ? 'bg-[#1c1c1c] border border-[#2e2e2e] text-[#f4f1ea] shadow-[#d97706]/10' : 'bg-white border border-slate-200 text-slate-900'
          }`}>
            <FileText className="w-5 h-5 text-[#d97706]" />
          </div>
          <div>
            <h1 className={`text-lg font-bold tracking-tight font-heading flex items-center gap-2 ${
              isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
            }`}>
              Document Editor
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BLACK / WHITE MODE SWITCH BUTTON */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${
              isDark
                ? 'bg-[#181818] hover:bg-[#242424] border-[#2e2e2e] text-amber-400 hover:text-amber-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-slate-200'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={onShowPrivacyAudit}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${
              isDark
                ? 'bg-[#181818] hover:bg-[#242424] border-[#2e2e2e] hover:border-[#d97706]/40 text-[#b0a99f] hover:text-[#f4f1ea]'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#d97706]" />
            <span>Privacy Audit</span>
          </button>
          
          <button
            onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${
              !hasConsented ? 'opacity-80' : ''
            } ${
              isDark
                ? 'bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212] shadow-[#f4f1ea]/10'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-400/30'
            }`}
          >
            Upload File
          </button>
        </div>
      </header>

      {/* Main Section */}
      <main className="container mx-auto px-4 sm:px-6 py-10 flex flex-col items-center max-w-6xl relative z-20 flex-1">
        {/* Main Headline */}
        <div className="text-center max-w-3xl mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold mb-6 shadow-md ${
            isDark
              ? 'bg-[#181818] border-[#2e2e2e] text-[#f4f1ea] shadow-[#d97706]/5'
              : 'bg-white border-slate-200 text-slate-800 shadow-slate-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Multi-Pass OCR & Native Layout Preservation</span>
          </div>

          <h1 className={`text-4xl sm:text-6xl font-black tracking-tight mb-4 font-heading uppercase leading-tight ${
            isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
          }`}>
            EDIT TEXT INSTANTLY
          </h1>
          <p className={`text-base sm:text-xl font-normal leading-relaxed ${
            isDark ? 'text-[#b0a99f]' : 'text-slate-600'
          }`}>
            Unlock Text from PDFs & Images with Ease
          </p>
        </div>

        {/* 100% CODE-BASED INTERACTIVE HERO COMPOSITION */}
        <div className="w-full relative my-6 max-w-5xl z-20">

          {/* FLOWING ANIMATED CHIPS: OCR, PDF, PNG */}
          <div 
            onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
            className={`absolute -top-5 left-6 sm:left-12 z-30 animate-float-slow flex items-center gap-1.5 px-4 py-2 rounded-full border shadow-xl backdrop-blur-md text-xs font-bold font-mono cursor-pointer transition-all hover:scale-110 active:scale-95 ${
              isDark ? 'bg-[#1c1c1c]/90 border-[#2e2e2e] text-[#f4f1ea]' : 'bg-white/95 border-slate-300 text-slate-900'
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-[#d97706] animate-pulse" />
            <span>OCR</span>
          </div>

          <div 
            onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
            className={`absolute -top-4 right-20 sm:right-32 z-30 animate-float-reverse flex items-center gap-1.5 px-4 py-2 rounded-full border shadow-xl backdrop-blur-md text-xs font-bold font-mono cursor-pointer transition-all hover:scale-110 active:scale-95 ${
              isDark ? 'bg-[#1c1c1c]/90 border-[#2e2e2e] text-[#f4f1ea]' : 'bg-white/95 border-slate-300 text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#d97706]" />
            <span>PDF</span>
          </div>

          <div 
            onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
            className={`absolute bottom-10 -left-4 sm:-left-8 z-30 animate-float-slow flex items-center gap-1.5 px-4 py-2 rounded-full border shadow-xl backdrop-blur-md text-xs font-bold font-mono cursor-pointer transition-all hover:scale-110 active:scale-95 ${
              isDark ? 'bg-[#1c1c1c]/90 border-[#2e2e2e] text-[#f4f1ea]' : 'bg-white/95 border-slate-300 text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#d97706]" />
            <span>PNG</span>
          </div>

          <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
            <span 
              onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
              className={`px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                isDark ? 'bg-[#f4f1ea] text-[#121212] hover:bg-[#e4dfd3]' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>SAVE PDF</span>
            </span>
            <span className={`px-4 py-2 rounded-full border shadow-xl text-xs font-semibold text-center transition-all cursor-pointer ${
              isDark ? 'bg-[#1c1c1c]/90 border-[#2e2e2e] text-[#b0a99f] hover:text-[#f4f1ea]' : 'bg-white/90 border-slate-300 text-slate-600 hover:text-slate-900'
            }`}>
              RECOGNIZE
            </span>
          </div>

          {/* Hero Composition Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Left Document Card: Draft & Outline */}
            <div className={`md:col-span-4 rounded-3xl p-6 shadow-2xl relative overflow-hidden transform md:-rotate-1 transition-transform hover:rotate-0 duration-300 group border ${
              isDark ? 'bg-[#141414] border-[#282828] hover:border-[#d97706]/40' : 'bg-white border-slate-200 hover:border-amber-400'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isDark ? 'border-[#242424]' : 'border-slate-100'}`}>
                <span className={`text-xs font-bold tracking-wider uppercase font-mono flex items-center gap-1.5 ${isDark ? 'text-[#f4f1ea]' : 'text-slate-800'}`}>
                  <FileText className="w-3.5 h-3.5 text-[#d97706]" />
                  PROJECT PLAN
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isDark ? 'bg-[#1c1c1c] text-[#746e65] border-[#2e2e2e]' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>Draft v2</span>
              </div>
              
              <div className="space-y-2.5 text-[11px] font-mono leading-relaxed">
                <div className={`p-2.5 rounded-xl border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#282828]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`font-semibold mb-1 ${isDark ? 'text-[#f4f1ea]' : 'text-slate-900'}`}>1. Layout Analysis & Parsing</p>
                  <div className="h-1.5 w-3/4 bg-[#d97706]/40 rounded-full mb-1" />
                  <div className={`h-1.5 w-1/2 rounded-full ${isDark ? 'bg-[#282828]' : 'bg-slate-200'}`} />
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1a1a1a] border-[#282828]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`mb-1 ${isDark ? 'text-[#b0a99f]' : 'text-slate-600'}`}>2. Multi-Pass OCR Detection</p>
                  <div className={`h-1.5 w-5/6 rounded-full mb-1 ${isDark ? 'bg-[#282828]' : 'bg-slate-200'}`} />
                  <div className={`h-1.5 w-2/3 rounded-full ${isDark ? 'bg-[#282828]' : 'bg-slate-200'}`} />
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-[#242424] text-[#746e65]' : 'border-slate-100 text-slate-500'}`}>
                <span className="flex items-center gap-1">
                  <Scan className="w-3 h-3 text-[#d97706]" />
                  Bounding Box Ready
                </span>
                <span className="font-mono text-[#d97706] font-semibold">99.4% Conf</span>
              </div>
            </div>

            {/* Center Main Editor Window Component */}
            <div className={`md:col-span-8 rounded-3xl shadow-2xl overflow-hidden relative group border transition-all ${
              isDark ? 'bg-[#181818] border-[#303030] hover:border-[#d97706]/40' : 'bg-white border-slate-200 hover:border-amber-400'
            }`}>
              {/* Editor Window Bar */}
              <div className={`px-5 py-3 border-b flex items-center justify-between ${
                isDark ? 'bg-[#121212] border-[#282828]' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className={`text-xs font-bold ml-2 font-mono ${isDark ? 'text-[#f4f1ea]' : 'text-slate-800'}`}>Live Document Workspace</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    isDark ? 'bg-[#242424] text-[#f4f1ea] border-[#333333]' : 'bg-white text-slate-800 border-slate-300'
                  }`}>
                    EDITING MODE
                  </span>
                </div>
              </div>

              {/* Editor Surface */}
              <div className={`p-6 sm:p-8 relative min-h-[260px] flex flex-col justify-between ${
                isDark ? 'bg-[#141414]' : 'bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg sm:text-xl font-extrabold font-heading tracking-tight ${
                      isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
                    }`}>
                      EDIT TEXT FROM IMAGES & PDFS
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/30 font-mono">
                      OCR Layer Active
                    </span>
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                    isDark ? 'text-[#b0a99f]' : 'text-slate-600'
                  }`}>
                    Unlock text from PDFs & images with ease. Click any detected region, modify text content, and export lossless output without layout shift.
                  </p>

                  <div className="p-3.5 rounded-xl border-2 border-dashed border-[#d97706] bg-[#d97706]/10 relative my-3 shadow-inner">
                    <div className="absolute -top-2.5 left-4 px-2 py-0.2 rounded-full bg-[#d97706] text-[#121212] font-mono text-[9px] font-bold uppercase shadow">
                      Active Selection
                    </div>
                    <p className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${
                      isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
                    }`}>
                      <span>EDIT TEXT FROM IMAGES & PDFS</span>
                      <span className="w-0.5 h-4 bg-[#d97706] animate-pulse inline-block ml-1" />
                    </p>
                  </div>
                </div>

                <div className={`pt-4 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-[#242424]' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-[#1c1c1c] border-[#2e2e2e]' : 'bg-white border-slate-300'}`} title="Text Tool">
                      <Type className="w-4 h-4 text-[#d97706]" />
                    </span>
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-[#1c1c1c] border-[#2e2e2e] text-[#b0a99f]' : 'bg-white border-slate-300 text-slate-500'}`} title="Scan Bounds">
                      <Scan className="w-4 h-4" />
                    </span>
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-[#1c1c1c] border-[#2e2e2e] text-[#b0a99f]' : 'bg-white border-slate-300 text-slate-500'}`} title="Properties">
                      <Sliders className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
                      className={`px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                        isDark ? 'bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212]' : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Edit Your Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* MANDATORY CONSENT CHECKBOX & UPLOAD SECTION */}
        <div className="w-full max-w-2xl my-6 z-20 flex flex-col items-center">
          
          {/* MANDATORY CONSENT CHECKBOX BOX */}
          <div
            id="mandatory-consent-box"
            className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 shadow-xl mb-4 ${
              attemptedWithoutConsent && !hasConsented
                ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/40 animate-pulse'
                : hasConsented
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-emerald-50/80 border-emerald-300'
                  : isDark
                    ? 'bg-[#141414] border-[#2e2e2e]'
                    : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="user-consent-checkbox"
                checked={hasConsented}
                onChange={(e) => {
                  onConsentChange?.(e.target.checked);
                  if (e.target.checked) setAttemptedWithoutConsent(false);
                }}
                className="mt-0.5 w-4.5 h-4.5 rounded border-slate-400 text-[#d97706] focus:ring-[#d97706] cursor-pointer shrink-0"
              />
              <label htmlFor="user-consent-checkbox" className={`text-xs sm:text-sm font-medium leading-relaxed cursor-pointer select-none ${
                isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
              }`}>
                I have read and understood the{' '}
                <a
                  href="#responsibility-notice"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('responsibility-notice')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="underline text-[#d97706] font-bold hover:text-amber-500"
                >
                  User Responsibility & Usage Notice
                </a>{' '}
                below and agree to proceed.
              </label>
            </div>
            
            {attemptedWithoutConsent && !hasConsented && (
              <p className="text-xs font-semibold text-red-400 mt-2.5 ml-7 flex items-center gap-1.5 animate-fade-in">
                <span>⚠️ Please check this box to acknowledge the Usage Notice before uploading a document.</span>
              </p>
            )}
          </div>

          {/* Upload Dropzone Container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => requireConsentFirst(() => fileInputRef.current?.click())}
            className={`w-full rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer group shadow-2xl ${
              !hasConsented ? 'opacity-90' : ''
            } ${
              isDragging
                ? 'border-[#d97706] bg-[#d97706]/10 scale-[1.01] shadow-[0_0_30px_rgba(217,119,6,0.2)]'
                : isDark
                  ? 'bg-[#141414] border-[#282828] hover:border-[#d97706]/50 hover:bg-[#181818] shadow-black/50'
                  : 'bg-white border-slate-300 hover:border-amber-500 hover:bg-amber-50/20 shadow-slate-200'
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
            
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 group-hover:border-[#d97706] group-hover:scale-110 transition-all shadow-md ${
              isDark ? 'bg-[#1c1c1c] border-[#2e2e2e]' : 'bg-amber-50 border-amber-200'
            }`}>
              <Upload className="w-6 h-6 text-[#d97706]" />
            </div>

            <p className={`text-lg font-bold mb-1 text-center ${isDark ? 'text-[#f4f1ea]' : 'text-slate-900'}`}>
              Drop document(s) here, or <span className="underline decoration-[#d97706] underline-offset-4">browse files</span>
            </p>
            <p className={`text-xs mb-5 text-center font-mono ${isDark ? 'text-[#746e65]' : 'text-slate-500'}`}>
              Supports PDF, PNG, JPG, WEBP (Max 10 MB per file)
            </p>

            <button 
              type="button"
              className={`px-6 py-3 rounded-full font-extrabold text-xs transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 ${
                isDark ? 'bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212]' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <span>Choose Document Files</span>
              <ArrowRight className="w-4 h-4 text-[#d97706]" />
            </button>
          </div>
        </div>

        {/* PROMINENT PRIVACY CERTIFICATE CARD */}
        <div className={`w-full max-w-2xl rounded-3xl p-6 shadow-xl relative overflow-hidden my-4 border transition-all z-20 ${
          isDark ? 'bg-[#141414] border-[#282828] hover:border-[#d97706]/30' : 'bg-white border-slate-200 hover:border-amber-400'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl border text-[#d97706] shrink-0 shadow-inner ${
              isDark ? 'bg-[#1c1c1c] border-[#2a2a2a]' : 'bg-amber-50 border-amber-200'
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold tracking-tight mb-1 flex items-center gap-2 ${
                isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
              }`}>
                YOUR FILES ARE NOT STORED
              </h3>
              <p className={`text-xs leading-relaxed mb-3 ${
                isDark ? 'text-[#b0a99f]' : 'text-slate-600'
              }`}>
                Uploaded images and PDFs are processed temporarily in volatile memory buffers solely to extract text layers. No database persistence, logging, or third-party cloud data transmission occurs.
              </p>
              <div className={`flex flex-wrap items-center gap-4 text-[11px] font-medium ${
                isDark ? 'text-[#746e65]' : 'text-slate-500'
              }`}>
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

        {/* USER RESPONSIBILITY & USAGE NOTICE SECTION AT BOTTOM OF LANDING PAGE */}
        <section id="responsibility-notice" className="w-full max-w-4xl my-10 z-20 font-sans">
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
            isDark ? 'bg-[#141414] border-[#282828]' : 'bg-white border-slate-200 shadow-slate-200'
          }`}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-500/20">
              <div className={`p-2.5 rounded-2xl border text-[#d97706] ${
                isDark ? 'bg-[#1c1c1c] border-[#2e2e2e]' : 'bg-amber-50 border-amber-200'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight font-heading ${
                  isDark ? 'text-[#f4f1ea]' : 'text-slate-900'
                }`}>
                  User Responsibility & Usage Notice
                </h2>
                <p className={`text-xs ${isDark ? 'text-[#b0a99f]' : 'text-slate-600'}`}>
                  Please read carefully before using this document editing utility.
                </p>
              </div>
            </div>

            {/* Notice Cards Container */}
            <div className="space-y-4 text-xs leading-relaxed">
              
              {/* 1. General Responsibility & Authorization */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#181818] border-[#242424]' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className={`font-bold text-xs mb-2 flex items-center gap-2 ${isDark ? 'text-[#f4f1ea]' : 'text-slate-900'}`}>
                  <FileText className="w-4 h-4 text-[#d97706]" />
                  Document Ownership & Usage Authorization
                </h3>
                <ul className={`list-disc list-inside space-y-2 pl-1 ${isDark ? 'text-[#b0a99f]' : 'text-slate-600'}`}>
                  <li>This tool is provided as an editing utility. Any document you upload, edit, modify, or export is entirely your responsibility.</li>
                  <li>You are solely responsible for ensuring that you have the right, permission, or legal authorization to upload and edit any document you use with this tool.</li>
                  <li>The developer/operator of this tool is not responsible for the content of documents uploaded or edited by users, or for any consequences resulting from the use, modification, misrepresentation, submission, or distribution of edited documents.</li>
                  <li><strong className="text-amber-500 font-bold">Prohibited Use:</strong> Do not use this tool to alter, falsify, misrepresent, or fraudulently modify documents.</li>
                </ul>
              </div>

              {/* 2. Sensitive & Confidential Documents Warning */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/80 border-amber-300'
              }`}>
                <h3 className="font-bold text-xs mb-2 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Caution Regarding Sensitive & Confidential Documents
                </h3>
                <p className={`mb-2 text-xs ${isDark ? 'text-[#f4f1ea]' : 'text-slate-800'}`}>
                  Use particular caution with sensitive, confidential, or legal documents, including but not limited to:
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    'Bank details',
                    'Financial documents',
                    'Examination results',
                    'Academic records',
                    'Identity documents',
                    'Certificates',
                    'Employment records',
                    'Medical documents',
                    'Legal documents',
                    'Personal information'
                  ].map((item, idx) => (
                    <span key={idx} className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      isDark ? 'bg-[#1c1c1c] border-amber-500/30 text-amber-300' : 'bg-white border-amber-300 text-amber-900 shadow-xs'
                    }`}>
                      {item}
                    </span>
                  ))}
                </div>
                <p className={`text-[11px] ${isDark ? 'text-[#b0a99f]' : 'text-slate-600'}`}>
                  You are responsible for determining whether a document is appropriate to upload and edit and whether you are authorized to do so.
                </p>
              </div>

              {/* 3. Computer-Written vs Handwriting & English Optimization */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#181818] border-[#242424]' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className={`font-bold text-xs mb-2 flex items-center gap-2 ${isDark ? 'text-[#f4f1ea]' : 'text-slate-900'}`}>
                  <Scan className="w-4 h-4 text-[#d97706]" />
                  OCR Compatibility & Recognition Limitations
                </h3>
                <ul className={`list-disc list-inside space-y-2 pl-1 ${isDark ? 'text-[#b0a99f]' : 'text-slate-600'}`}>
                  <li><strong>Digital & Computer-Generated Text:</strong> This tool is designed primarily for digitally generated / machine-readable documents and works best with computer-written text.</li>
                  <li><strong>Handwriting Notice:</strong> Handwritten text is not supported as a reliable OCR input and may not be detected or edited accurately.</li>
                  <li><strong>English Optimization:</strong> The tool is currently optimized primarily for English-language documents. OCR accuracy may be significantly lower for other languages, non-Latin scripts, or mixed-language documents.</li>
                  <li><strong>Layout & Verification Disclaimer:</strong> OCR and document reconstruction are not guaranteed to reproduce every piece of text, formatting, font, spacing, layout, or visual detail perfectly. Always review the final exported document carefully against the original before using, submitting, sharing, printing, or relying on it.</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`container mx-auto px-6 py-5 border-t flex flex-col md:flex-row items-center justify-between text-xs relative z-20 font-sans ${
        isDark ? 'border-[#1f1f1f] text-[#746e65]' : 'border-slate-200 text-slate-500'
      }`}>
        <p>© 2026 Document Editor. Precision typography, OCR detection, and zero-storage privacy.</p>
        <button onClick={onShowPrivacyAudit} className={`transition-colors cursor-pointer mt-2 md:mt-0 ${
          isDark ? 'hover:text-[#b0a99f]' : 'hover:text-slate-800'
        }`}>
          Verify Compliance & Security Audit
        </button>
      </footer>
    </div>
  );
}
