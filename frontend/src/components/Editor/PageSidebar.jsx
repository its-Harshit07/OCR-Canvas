import React, { useRef, useState } from 'react';
import { Layers, Plus, FileText, CheckCircle, FilePlus, X, FileImage, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PageSidebar({
  documents = [],
  activeDocId,
  onSelectDocument,
  onRemoveDocument,
  onAddFilesSelected,
  pages = [],
  activePageIndex,
  onSelectPage,
  onAddTextElement,
  theme = 'light',
  isOpen = true,
  onToggleOpen
}) {
  const fileInputRef = useRef(null);
  const isDark = theme === 'dark';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0 && onAddFilesSelected) {
      onAddFilesSelected(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  // If collapsed, show only compact floating edge toggle button
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className={`absolute left-3 top-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border shadow-lg text-xs font-semibold cursor-pointer transition-all ${
          isDark
            ? 'bg-[#1c1c1c] hover:bg-[#242424] border-[#2e2e2e] text-[#f4f1ea]'
            : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
        }`}
        title="Open Pages Panel"
      >
        <ChevronRight className="w-4 h-4 text-[#d97706]" />
        <span className="hidden sm:inline">Pages ({pages.length})</span>
      </button>
    );
  }

  return (
    <aside className={`w-60 border-r flex flex-col justify-between shrink-0 select-none font-sans transition-colors z-30 absolute md:relative inset-y-0 left-0 shadow-2xl md:shadow-none ${
      isDark ? 'border-[#242424] bg-[#141414] text-[#f4f1ea]' : 'border-slate-200 bg-white text-slate-900'
    }`}>
      {/* Hidden File Input for Add Files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 1. Sidebar Header with Collapse Button */}
        <div className={`p-2.5 border-b flex items-center justify-between ${isDark ? 'border-[#242424] bg-[#0c0c0c]/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d97706]" />
            <span className="text-xs font-bold uppercase tracking-wider">Pages & Docs</span>
          </div>

          <button
            onClick={onToggleOpen}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border cursor-pointer transition-all ${
              isDark
                ? 'bg-[#1c1c1c] hover:bg-[#242424] border-[#2e2e2e] text-[#b0a99f] hover:text-[#f4f1ea]'
                : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Collapse Pages Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-[11px]">Collapse</span>
          </button>
        </div>

        {/* 2. Multi-Document Collection Panel */}
        <div className={`p-3 border-b ${isDark ? 'border-[#242424] bg-[#0c0c0c]/40' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
              isDark ? 'text-[#b0a99f]' : 'text-slate-600'
            }`}>
              <FileText className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Documents ({documents.length})</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border transition-all cursor-pointer ${
                isDark
                  ? 'text-[#f4f1ea] bg-[#1c1c1c] border-[#2e2e2e] hover:border-[#404040]'
                  : 'text-slate-800 bg-white border-slate-300 hover:border-slate-400'
              }`}
              title="Add more image or PDF files (Max 10 MB per file)"
            >
              <FilePlus className="w-3 h-3 text-[#d97706]" />
              <span>Add</span>
            </button>
          </div>

          {/* Document List */}
          <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
            {documents.map((doc) => {
              const isSelectedDoc = doc.id === activeDocId;
              const isPdf = doc.name.toLowerCase().endsWith('.pdf');

              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`group flex items-center justify-between p-2 rounded-md border text-xs transition-all cursor-pointer ${
                    isSelectedDoc
                      ? isDark
                        ? 'bg-[#1c1c1c] border-[#d97706]/40 text-[#f4f1ea] font-medium shadow-sm'
                        : 'bg-amber-50/80 border-amber-300 text-slate-900 font-semibold shadow-sm'
                      : isDark
                        ? 'bg-[#0c0c0c]/60 border-[#202020] text-[#746e65] hover:border-[#2e2e2e] hover:text-[#b0a99f]'
                        : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isPdf ? (
                      <FileText className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
                    ) : (
                      <FileImage className="w-3.5 h-3.5 text-[#b0a99f] shrink-0" />
                    )}
                    <span className="truncate text-[11px]">{doc.name}</span>
                  </div>

                  {documents.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDocument(doc.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition-all ml-1 ${
                        isDark ? 'text-[#746e65] hover:bg-[#282828]' : 'text-slate-400 hover:bg-slate-200'
                      }`}
                      title="Remove document"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Pages List Header */}
        <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-[#242424]' : 'border-slate-200'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
            isDark ? 'text-[#b0a99f]' : 'text-slate-600'
          }`}>
            <Layers className="w-3.5 h-3.5" />
            <span>Pages ({pages.length})</span>
          </div>

          <button
            onClick={onAddTextElement}
            className={`flex items-center gap-1 py-1 px-2.5 rounded border font-medium text-[11px] transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1c1c1c] hover:bg-[#242424] border-[#2e2e2e] text-[#f4f1ea]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Add Text</span>
          </button>
        </div>

        {/* 4. Pages Thumbnails List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          {pages.map((p, idx) => {
            const isActive = idx === activePageIndex;
            const textCount = p.elements?.filter((e) => e.type === 'text' && !e.isDeleted).length || 0;

            const pageKey = p.id || `${activeDocId || 'doc'}-page-${idx}`;

            return (
              <div
                key={pageKey}
                onClick={() => onSelectPage(idx)}
                className={`group p-2 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-[#1c1c1c] border-[#d97706]/40 shadow-md ring-1 ring-[#d97706]/20'
                      : 'bg-amber-50 border-amber-400 shadow-md ring-1 ring-amber-300'
                    : isDark
                      ? 'bg-[#0c0c0c]/40 border-[#202020] hover:border-[#2e2e2e] hover:bg-[#181818]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-semibold ${
                    isActive ? (isDark ? 'text-[#f4f1ea]' : 'text-slate-900') : (isDark ? 'text-[#b0a99f]' : 'text-slate-600')
                  }`}>
                    Page {idx + 1}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                    isDark ? 'bg-[#141414] text-[#746e65] border-[#242424]' : 'bg-white text-slate-500 border-slate-200'
                  }`}>
                    {textCount} text boxes
                  </span>
                </div>

                {/* Page visual thumbnail preview box */}
                <div className={`w-full h-24 rounded border relative flex items-center justify-center overflow-hidden ${
                  isDark ? 'border-[#242424] bg-[#0c0c0c]' : 'border-slate-300 bg-slate-100'
                }`}>
                  {p.backgroundImage ? (
                    <img
                      src={p.backgroundImage}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <FileText className={`w-6 h-6 ${isDark ? 'text-[#2e2e2e]' : 'text-slate-400'}`} />
                  )}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-[#d97706] text-[#121212] shadow">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className={`p-2.5 border-t text-[10px] flex items-center justify-between shrink-0 font-mono ${
        isDark ? 'border-[#242424] text-[#746e65]' : 'border-slate-200 text-slate-500'
      }`}>
        <span>Max 10 MB per file</span>
      </div>
    </aside>
  );
}
