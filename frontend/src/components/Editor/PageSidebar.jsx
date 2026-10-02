import React, { useRef } from 'react';
import { Layers, Plus, FileText, CheckCircle, FilePlus, X, FileImage } from 'lucide-react';

export default function PageSidebar({
  documents = [],
  activeDocId,
  onSelectDocument,
  onRemoveDocument,
  onAddFilesSelected,
  pages = [],
  activePageIndex,
  onSelectPage,
  onAddTextElement
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0 && onAddFilesSelected) {
      onAddFilesSelected(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <aside className="w-60 border-r border-[#242424] bg-[#141414] flex flex-col justify-between shrink-0 select-none overflow-hidden font-sans">
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
        {/* 1. Multi-Document Collection Panel */}
        <div className="p-3 border-b border-[#242424] bg-[#0c0c0c]/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#b0a99f] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Documents ({documents.length})</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[11px] font-medium text-[#f4f1ea] hover:text-white px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#2e2e2e] hover:border-[#404040] transition-all cursor-pointer"
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
                      ? 'bg-[#1c1c1c] border-[#d97706]/40 text-[#f4f1ea] font-medium shadow-sm'
                      : 'bg-[#0c0c0c]/60 border-[#202020] text-[#746e65] hover:border-[#2e2e2e] hover:text-[#b0a99f]'
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
                      className="opacity-0 group-hover:opacity-100 text-[#746e65] hover:text-red-400 p-0.5 rounded hover:bg-[#282828] transition-all ml-1"
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

        {/* 2. Pages List Header */}
        <div className="p-3 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#b0a99f] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#b0a99f]" />
            <span>Pages ({pages.length})</span>
          </div>

          <button
            onClick={onAddTextElement}
            className="flex items-center gap-1 py-1 px-2.5 rounded bg-[#1c1c1c] hover:bg-[#242424] border border-[#2e2e2e] text-[#f4f1ea] font-medium text-[11px] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Add Text</span>
          </button>
        </div>

        {/* 3. Pages Thumbnails List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          {pages.map((p, idx) => {
            const isActive = idx === activePageIndex;
            const textCount = p.elements?.filter((e) => e.type === 'text').length || 0;

            const pageKey = p.id || `${activeDocId || 'doc'}-page-${idx}`;

            return (
              <div
                key={pageKey}
                onClick={() => onSelectPage(idx)}
                className={`group p-2 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1c1c1c] border-[#d97706]/40 shadow-md ring-1 ring-[#d97706]/20'
                    : 'bg-[#0c0c0c]/40 border-[#202020] hover:border-[#2e2e2e] hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-[#f4f1ea]' : 'text-[#b0a99f]'}`}>
                    Page {idx + 1}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#141414] text-[#746e65] font-mono border border-[#242424]">
                    {textCount} text boxes
                  </span>
                </div>

                {/* Page visual thumbnail preview box */}
                <div className="w-full h-24 rounded border border-[#242424] bg-[#0c0c0c] relative flex items-center justify-center overflow-hidden">
                  {p.backgroundImage ? (
                    <img
                      src={p.backgroundImage}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-[#2e2e2e]" />
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
      <div className="p-2.5 border-t border-[#242424] text-[10px] text-[#746e65] flex items-center justify-between shrink-0 font-mono">
        <span>Max 10 MB per file</span>
      </div>
    </aside>
  );
}
