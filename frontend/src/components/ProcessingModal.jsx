import React from 'react';
import { Loader2, CheckCircle2, Sparkles, Lock } from 'lucide-react';

export default function ProcessingModal({ currentStep, filename }) {
  const steps = [
    { label: "Uploading temporarily...", detail: "Transferring file stream to volatile memory context" },
    { label: "Analyzing document...", detail: "Checking PDF vector layer & image structure" },
    { label: "Detecting text with OCR...", detail: "Extracting bounding boxes, typography & confidence" },
    { label: "Building editable layers...", detail: "Generating interactive canvas document model" },
    { label: "Preparing editor...", detail: "Purging temporary buffers and launching workspace" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0c]/85 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in font-sans">
      <div className="warm-panel w-full max-w-md rounded-xl p-6 border border-[#282828] shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-[#d97706]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f4f1ea]">Processing Document</h3>
            <p className="text-xs text-[#746e65] truncate max-w-[240px] font-mono">{filename || "uploaded_document"}</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-5">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-[#1c1c1c] border-[#d97706]/40 text-[#f4f1ea]'
                    : isDone
                    ? 'bg-[#141414] border-[#242424] text-[#b0a99f]'
                    : 'bg-[#0c0c0c]/40 border-[#1a1a1a] text-[#4d4841]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#d97706]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-[#d97706] animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#2e2e2e] flex items-center justify-center text-[10px] text-[#4d4841] font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-[#f4f1ea]' : ''}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[11px] text-[#746e65] mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 rounded-lg bg-[#181818] border border-[#282828] text-xs text-[#b0a99f] flex items-center gap-2 font-mono">
          <Lock className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
          <span className="text-[11px]">Zero persistent storage: RAM buffers cleared automatically.</span>
        </div>
      </div>
    </div>
  );
}
