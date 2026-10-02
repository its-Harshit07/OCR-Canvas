import React, { useState } from 'react';
import { ArrowLeft, Download, ZoomIn, ZoomOut, Eye, EyeOff, FileImage, FileText, Undo2, Redo2, ChevronDown } from 'lucide-react';

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
  onRedo
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 border-b border-[#242424] bg-[#141414] px-5 flex items-center justify-between relative z-30 shrink-0 select-none font-sans">
      {/* Left Section: Back Button & Editable Document Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-medium text-[#b0a99f] hover:text-[#f4f1ea] px-2.5 py-1.5 rounded-md bg-[#1c1c1c] hover:bg-[#242424] border border-[#2a2a2a] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="h-4 w-[1px] bg-[#282828]" />

        <input
          type="text"
          value={docName}
          onChange={(e) => onDocNameChange(e.target.value)}
          className="bg-transparent text-xs font-semibold text-[#f4f1ea] focus:outline-none focus:bg-[#1c1c1c] px-2 py-1 rounded border border-transparent focus:border-[#404040] max-w-xs truncate"
        />
      </div>

      {/* Middle Section: Undo / Redo & Zoom Controls */}
      <div className="flex items-center gap-2.5">
        {/* Undo / Redo Button Group */}
        <div className="flex items-center bg-[#0c0c0c] rounded-md p-0.5 border border-[#242424] text-xs">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 rounded text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 rounded text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Redo</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#0c0c0c] rounded-md p-0.5 border border-[#242424] text-xs">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.15))}
            className="p-1 rounded text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2.5 font-mono text-[#b0a99f] text-[11px] font-medium min-w-[45px] text-center">
            {Math.round(zoomScale * 100)}%
          </span>

          <button
            onClick={() => onZoomChange(Math.min(2.0, zoomScale + 0.15))}
            className="p-1 rounded text-[#b0a99f] hover:text-[#f4f1ea] hover:bg-[#1c1c1c] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mask Original Background Toggle */}
        <button
          onClick={onToggleMask}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer ${
            showBackgroundMask
              ? 'bg-[#1c1c1c] border-[#d97706]/40 text-[#f4f1ea]'
              : 'bg-[#0c0c0c] border-[#242424] text-[#746e65] hover:text-[#b0a99f]'
          }`}
          title="Toggle white background box behind text elements to mask original underlying text"
        >
          {showBackgroundMask ? <Eye className="w-3.5 h-3.5 text-[#d97706]" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="text-[11px]">Mask Text</span>
        </button>
      </div>

      {/* Right Section: Primary Export CTA & Menu */}
      <div className="relative">
        <div className="flex items-center gap-1">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212] font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#121212]" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-1.5 rounded-md bg-[#1c1c1c] hover:bg-[#242424] border border-[#2a2a2a] text-[#b0a99f] hover:text-[#f4f1ea] transition-all cursor-pointer"
            title="Export Options"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {showExportMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg shadow-2xl p-1 z-50 animate-fade-in">
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportPDF();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#f4f1ea] hover:bg-[#242424] transition-colors"
            >
              <FileText className="w-4 h-4 text-[#d97706]" />
              <span>Export PDF Document</span>
            </button>
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportPNG();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#b0a99f] hover:bg-[#242424] hover:text-[#f4f1ea] transition-colors"
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
