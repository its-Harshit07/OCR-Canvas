# PRIVACY AUDIT & DATA FLOW VERIFICATION

**Document Version**: V1.0  
**Audit Date**: September 2026  
**Status**: VERIFIED PRIVACY-COMPLIANT (ZERO PERSISTENT STORAGE)

---

## 1. Executive Summary

This application complies with strict zero-persistence document privacy requirements. All uploaded files (PNG, JPG, WEBP, PDF) are processed transiently in volatile memory (or OS temporary directories) and are immediately garbage-collected and destroyed upon HTTP request completion. No persistent database, cloud bucket, or local disk upload folder is created or accessed.

---

## 2. Privacy Audit Checklist

| Audit Question | Verification Status | Implementation & Code Evidence |
| :--- | :---: | :--- |
| **Is any uploaded image saved permanently?** | **NO** | Upload stream `contents` is handled in memory via `io.BytesIO`. Reference is deleted (`del contents`) in `finally` block. |
| **Is any PDF saved permanently?** | **NO** | `fitz.open(stream=pdf_bytes, filetype="pdf")` parses PDFs directly from byte streams in memory. `doc.close()` releases memory. |
| **Is anything being sent to a third-party API?** | **NO** | 100% of OCR and PDF layout parsing runs locally via open-source libraries (`PyMuPDF`, `PaddleOCR`). No external LLM or vision cloud APIs are called. |
| **Are temporary files deleted?** | **YES** | OS temp buffers use python `tempfile.TemporaryDirectory` wrapper with mandatory `finally` block deletion. |
| **Are logs containing document content?** | **NO** | Application logs contain only high-level exception class names (e.g. `ValueError`, `HTTPException`) and zero document text, file names, or image data. |
| **Does the browser retain the source file unnecessarily?** | **NO** | Client holds transient react state during active session. Refreshing the browser resets state and purges local document data. |
| **Does the database contain uploaded files?** | **N/A** | There is **NO DATABASE** attached to or used by this application. |
| **Does the application create hidden upload directories?** | **NO** | No `./uploads`, `./data`, or persistent filesystem storage folders exist in the codebase. |

---

## 3. Actual Data Flow Diagram

```text
1. CLIENT BROWSER
   │  User selects PNG / JPG / PDF file
   │  POST /api/process (HTTP multipart stream)
   ▼
2. VOLATILE MEMORY CONTEXT (FastAPI / PyMuPDF / PaddleOCR)
   │  - Read stream into volatile byte buffer
   │  - Extract native PDF text or run local PaddleOCR
   │  - Render layout background base64
   │  - Construct structured Document JSON model
   │  - Release byte stream reference (del contents & doc.close())
   ▼
3. HTTP RESPONSE
   │  Returns JSON document model + base64 background to Client
   ▼
4. CLIENT CANVAS EDITOR (Fabric.js)
   │  Renders interactive text boxes over canvas
   │  User modifies text content, typography, position
   │  Exports result to PNG / PDF
   ▼
5. SESSION TERMINATION
   │  Navigating away clears client browser state
```

---

## 4. Conclusion & Certification

The application adheres strictly to the privacy guarantee prominently displayed on the landing page:

> **"YOUR FILES ARE NOT STORED."**  
> *"Your uploaded images and PDFs are processed temporarily to create your editable document. We do not permanently store your uploaded files."*
