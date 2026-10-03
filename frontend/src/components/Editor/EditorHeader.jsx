import React, { useState } from 'react';
import { ArrowLeft, Download, ZoomIn, ZoomOut, Eye, EyeOff, FileImage, FileText, Undo2, Redo2, ChevronDown, Sun, Moon } from 'lucide-react';

export default function EditorHeader({
  docName,
  onDocNameChange,
  zoomScale,
  onZoomChange,
  showBackgroundMask,
  onToggleMask,
  onExportPNG,
  onExportPDF,
  onBackToHome,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  theme = 'light',
  onToggleTheme
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const isDark = theme === 'dark';

  return (
    <header className={`min-h-14 py-1.5 px-3 md:px-5 flex flex-wrap items-center justify-between gap-2 relative z-30 shrink-0 select-none font-sans transition-colors ${
      isDark ? 'border-[#242424] bg-[#141414] text-[#f4f1ea]' : 'border-slate-200 bg-white text-slate-900'
    }`}>
      {/* Left Section: Back Button & Editable Document Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBackToHome}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border transition-all cursor-pointer ${
            isDark
              ? 'text-[#b0a99f] hover:text-[#f4f1ea] bg-[#1c1c1c] hover:bg-[#242424] border-[#2a2a2a]'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className={`h-4 w-[1px] ${isDark ? 'bg-[#282828]' : 'bg-slate-300'}`} />

        <input
          type="text"
          value={docName}
          onChange={(e) => onDocNameChange(e.target.value)}
          className={`text-xs font-semibold focus:outline-none px-1.5 py-1 rounded border transition-all max-w-[110px] sm:max-w-xs truncate ${
            isDark
              ? 'bg-transparent text-[#f4f1ea] focus:bg-[#1c1c1c] border-transparent focus:border-[#404040]'
              : 'bg-transparent text-slate-900 focus:bg-slate-100 border-transparent focus:border-slate-300'
          }`}
        />
      </div>

      {/* Middle Section: Undo / Redo & Zoom Controls & Theme Switcher */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Undo / Redo Button Group */}
        <div className={`flex items-center rounded-md p-0.5 border text-xs ${
          isDark ? 'bg-[#0c0c0c] border-[#242424]' : 'bg-slate-100 border-slate-300'
        }`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer transition-colors ${
              isDark
                ? 'text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c] disabled:opacity-30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px] hidden md:inline">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer transition-colors ${
              isDark
                ? 'text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c] disabled:opacity-30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px] hidden md:inline">Redo</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className={`flex items-center rounded-md p-0.5 border text-xs ${
          isDark ? 'bg-[#0c0c0c] border-[#242424]' : 'bg-slate-100 border-slate-300'
        }`}>
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.15))}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className={`px-1.5 font-mono text-[10px] sm:text-[11px] font-medium min-w-[36px] sm:min-w-[45px] text-center ${
            isDark ? 'text-[#b0a99f]' : 'text-slate-700'
          }`}>
            {Math.round(zoomScale * 100)}%
          </span>

          <button
            onClick={() => onZoomChange(Math.min(2.0, zoomScale + 0.15))}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mask Original Background Toggle */}
        <button
          onClick={onToggleMask}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${
            showBackgroundMask
              ? isDark
                ? 'bg-[#1c1c1c] border-[#d97706]/40 text-[#f4f1ea]'
                : 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
              : isDark
                ? 'bg-[#0c0c0c] border-[#242424] text-[#746e65] hover:text-[#b0a99f]'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
          }`}
          title="Toggle background mask"
        >
          {showBackgroundMask ? <Eye className="w-3.5 h-3.5 text-[#d97706]" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="text-[11px] hidden sm:inline">Mask Text</span>
        </button>

        {/* BLACK / WHITE MODE SWITCH BUTTON */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${
            isDark
              ? 'bg-[#1c1c1c] hover:bg-[#282828] border-[#333] text-amber-400'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
          }`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          <span className="text-[11px] font-semibold hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Right Section: Primary Export CTA & Menu */}
      <div className="relative">
        <div className="flex items-center gap-1">
          <button
            onClick={onExportPDF}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-md font-semibold text-xs shadow-sm transition-all cursor-pointer ${
              isDark
                ? 'bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212]'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`p-1.5 rounded-md border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1c1c1c] hover:bg-[#242424] border-[#2a2a2a] text-[#b0a99f] hover:text-[#f4f1ea]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Export Options"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {showExportMenu && (
          <div className={`absolute right-0 mt-2 w-48 border rounded-lg shadow-2xl p-1 z-50 animate-fade-in ${
            isDark ? 'bg-[#1c1c1c] border-[#2e2e2e] text-[#f4f1ea]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportPDF();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-[#242424]' : 'hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-[#d97706]" />
              <span>Export PDF Document</span>
            </button>
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportPNG();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-[#242424] text-[#b0a99f]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <FileImage className="w-4 h-4 text-[#b0a99f]" />
              <span>Export PNG Image</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
