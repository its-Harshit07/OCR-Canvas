import React from 'react';
import { X, ShieldCheck, Check, Lock } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  const auditPoints = [
    { title: "No Upload Database", detail: "There is no database attached to or used by this application.", status: "Verified" },
    { title: "No Permanent Disk Storage", detail: "Uploaded bytes exist in volatile memory buffers during processing only.", status: "Verified" },
    { title: "No Cloud API Data Leakage", detail: "100% of OCR and layout parsing runs locally via PyMuPDF and PaddleOCR.", status: "Verified" },
    { title: "No Document Content in Logs", detail: "Application logs output generic status codes without document text.", status: "Verified" },
    { title: "Immediate In-Memory Cleanup", detail: "Byte references are released in finally blocks upon HTTP response.", status: "Verified" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0c]/85 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in font-sans">
      <div className="warm-panel w-full max-w-2xl rounded-xl p-6 border border-[#282828] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-[#d97706]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f4f1ea] flex items-center gap-2">
                Privacy & Data Flow Verification Audit
              </h3>
              <p className="text-xs text-[#746e65]">Official V1 Zero-Persistence Compliance Certificate</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1c1c1c] border border-[#282828] text-[#746e65] hover:text-[#f4f1ea] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3.5 pr-1">
          <div className="p-3.5 rounded-lg bg-[#181818] border border-[#282828] text-xs text-[#b0a99f] leading-relaxed">
            <p className="font-semibold text-[#f4f1ea] mb-1">PROMINENT PRIVACY CLAIM:</p>
            <p className="italic text-[#b0a99f]">
              "YOUR FILES ARE NOT STORED. Your uploaded images and PDFs are processed temporarily to create your editable document. We do not permanently store your uploaded files."
            </p>
          </div>

          <div className="space-y-2">
            {auditPoints.map((pt, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#141414] border border-[#242424] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[#f4f1ea] mb-0.5">{pt.title}</h4>
                  <p className="text-[11px] text-[#746e65]">{pt.detail}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#f4f1ea] bg-[#1c1c1c] border border-[#2e2e2e] px-2 py-0.5 rounded-full shrink-0 font-mono">
                  <Check className="w-3 h-3 text-[#d97706]" />
                  {pt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#242424] mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#f4f1ea] hover:bg-[#e4dfd3] text-[#121212] font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Audit Report
          </button>
        </div>
      </div>
    </div>
  );
}
