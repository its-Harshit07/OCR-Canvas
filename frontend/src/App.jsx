import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import ProcessingModal from './components/ProcessingModal';
import PrivacyModal from './components/PrivacyModal';
import EditorHeader from './components/Editor/EditorHeader';
import PageSidebar from './components/Editor/PageSidebar';
import FabricCanvas from './components/Editor/FabricCanvas';
import PropertiesSidebar from './components/Editor/PropertiesSidebar';
import { AlertCircle, X } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit per file

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [showBackgroundMask, setShowBackgroundMask] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingFilename, setProcessingFilename] = useState('');

  // Device local fonts registry
  const [localDeviceFonts, setLocalDeviceFonts] = useState([]);

  // Modals & Notices
  const [showPrivacyAudit, setShowPrivacyAudit] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fabricCanvasRef = useRef(null);

  const currentDocument = documents.find((d) => d.id === activeDocId) || null;

  // Keyboard Shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (!isCmdOrCtrl) return;

      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDocument]);

  // 1. Process one or multiple files
  const handleFilesSelected = async (filesInput) => {
    if (!filesInput || filesInput.length === 0) return;

    const files = Array.from(filesInput);
    const validFiles = [];
    const oversizedFiles = [];

    files.forEach((f) => {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        oversizedFiles.push(f);
      } else {
        validFiles.push(f);
      }
    });

    if (oversizedFiles.length > 0) {
      const overNames = oversizedFiles.map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join(', ');
      setErrorMessage(`Maximum file size is 10 MB per file. Exceeded: ${overNames}`);
    }

    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingStep(0);

    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    const newDocs = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setProcessingFilename(file.name);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errDetail = `Failed to process ${file.name}`;
          try {
            const errJson = await response.json();
            if (errJson.detail) errDetail = errJson.detail;
          } catch (e) {}
          throw new Error(errDetail);
        }

        const docData = await response.json();
        const docId = docData.id || `doc-${Math.random().toString(36).substring(2, 9)}`;

        const initialPages = (docData.pages || []).map((pg, pIdx) => ({
          ...pg,
          id: pg.id || `${docId}-page-${pIdx}`,
        }));

        // DEV-ONLY OCR AUDIT LOGGING
        console.log(`[OCR AUDIT LOG] DOCUMENT ID: ${docId} (${docData.name || file.name})`);
        initialPages.forEach((pg, pIdx) => {
          console.log(
            `  PAGE ID: ${pg.id}\n` +
            `  SOURCE: ${pg.width} × ${pg.height}\n` +
            `  RAW OCR COUNT: ${docData.raw_ocr_count || pg.elements?.length || 0}\n` +
            `  NORMALIZED OCR COUNT: ${docData.normalized_count || pg.elements?.length || 0}\n` +
            `  FINAL RENDERED OCR COUNT: ${pg.elements?.length || 0}`
          );
        });

        newDocs.push({
          id: docId,
          name: docData.name || file.name,
          rawOcrCount: docData.raw_ocr_count || 0,
          normalizedCount: docData.normalized_count || 0,
          pages: initialPages,
          history: [JSON.parse(JSON.stringify(initialPages))],
          historyIndex: 0,
        });
      } catch (err) {
        setErrorMessage(err.message || `Error processing ${file.name}`);
      }
    }

    clearInterval(stepInterval);
    setProcessingStep(4);

    setTimeout(() => {
      if (newDocs.length > 0) {
        setDocuments((prev) => [...prev, ...newDocs]);
        setActiveDocId((prevId) => prevId || newDocs[0].id);
        setActivePageIndex(0);
        setSelectedElementId(null);
      }
      setIsProcessing(false);
    }, 600);
  };

  // 2. Commit pages update to history stack
  const commitPagesUpdate = (newPages) => {
    if (!currentDocument) return;

    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== currentDocument.id) return doc;

        const currentHistory = doc.history || [doc.pages];
        const currentIndex = doc.historyIndex !== undefined ? doc.historyIndex : currentHistory.length - 1;

        // Truncate future redo branch and append new snapshot
        const truncatedHistory = currentHistory.slice(0, currentIndex + 1);
        const nextSnapshot = JSON.parse(JSON.stringify(newPages));

        return {
          ...doc,
          pages: newPages,
          history: [...truncatedHistory, nextSnapshot],
          historyIndex: truncatedHistory.length,
        };
      })
    );
  };

  // 3. Handle Element Edits
  const handleElementChange = (id, updates) => {
    if (!currentDocument) return;

    const newPages = currentDocument.pages.map((p, idx) => {
      if (idx !== activePageIndex) return p;

      const newElements = p.elements.map((el) => {
        if (el.id !== id) return el;
        return { ...el, ...updates, isEdited: true };
      });

      return { ...p, elements: newElements };
    });

    commitPagesUpdate(newPages);
  };

  // 4. Add Text Element
  const handleAddTextElement = () => {
    if (!currentDocument) return;

    const newId = `elem-${Math.random().toString(36).substring(2, 9)}`;
    const newElement = {
      id: newId,
      type: 'text',
      text: 'New Text Box',
      x: 100,
      y: 100,
      width: 180,
      height: 35,
      fontSize: 18,
      fontFamily: 'Inter, Arial, sans-serif',
      fontWeight: 400,
      fontStyle: 'normal',
      color: '#000000',
      bgColor: '#ffffff',
      rotation: 0,
      confidence: 1.0,
      isEdited: true,
      isNew: true,
    };

    const newPages = currentDocument.pages.map((p, idx) => {
      if (idx !== activePageIndex) return p;
      return { ...p, elements: [...p.elements, newElement] };
    });

    commitPagesUpdate(newPages);
    setSelectedElementId(newId);
  };

  // 5. Delete Element
  const handleDeleteElement = () => {
    if (!currentDocument || !selectedElementId) return;

    const newPages = currentDocument.pages.map((p, idx) => {
      if (idx !== activePageIndex) return p;
      return {
        ...p,
        elements: p.elements.filter((e) => e.id !== selectedElementId),
      };
    });

    commitPagesUpdate(newPages);
    setSelectedElementId(null);
  };

  // 6. Undo Handler
  const handleUndo = () => {
    if (!currentDocument) return;

    const currentHistory = currentDocument.history || [];
    const currentIndex = currentDocument.historyIndex || 0;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const restoredPages = JSON.parse(JSON.stringify(currentHistory[newIndex]));

      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          if (doc.id !== currentDocument.id) return doc;
          return {
            ...doc,
            pages: restoredPages,
            historyIndex: newIndex,
          };
        })
      );
      setSelectedElementId(null);
    }
  };

  // 7. Redo Handler
  const handleRedo = () => {
    if (!currentDocument) return;

    const currentHistory = currentDocument.history || [];
    const currentIndex = currentDocument.historyIndex || 0;

    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1;
      const restoredPages = JSON.parse(JSON.stringify(currentHistory[newIndex]));

      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          if (doc.id !== currentDocument.id) return doc;
          return {
            ...doc,
            pages: restoredPages,
            historyIndex: newIndex,
          };
        })
      );
      setSelectedElementId(null);
    }
  };

  // 8. Document Switch & Remove
  const handleSelectDocument = (docId) => {
    setActiveDocId(docId);
    setActivePageIndex(0);
    setSelectedElementId(null);
  };

  const handleRemoveDocument = (docId) => {
    setDocuments((prevDocs) => {
      const filtered = prevDocs.filter((d) => d.id !== docId);
      if (docId === activeDocId) {
        const nextDoc = filtered[0] || null;
        setActiveDocId(nextDoc ? nextDoc.id : null);
        setActivePageIndex(0);
        setSelectedElementId(null);
      }
      return filtered;
    });
  };

  // 9. Export PNG image
  const handleExportPNG = () => {
    const page = currentDocument?.pages?.[activePageIndex];
    if (!page || !page.backgroundImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const nativeW = img.naturalWidth || page.width || 800;
      const nativeH = img.naturalHeight || page.height || 1100;

      const scaleX = nativeW / (page.width || nativeW);
      const scaleY = nativeH / (page.height || nativeH);

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = nativeW;
      exportCanvas.height = nativeH;
      const ctx = exportCanvas.getContext('2d');

      // Draw native high-resolution background image
      ctx.drawImage(img, 0, 0, nativeW, nativeH);

      page.elements?.forEach((el) => {
        const origX = el.originalX !== undefined ? el.originalX : el.x;
        const origY = el.originalY !== undefined ? el.originalY : el.y;
        const origW = el.originalWidth !== undefined ? el.originalWidth : el.width;
        const origH = el.originalHeight !== undefined ? el.originalHeight : el.height;

        const isMoved = Math.abs(el.x - origX) > 1 || Math.abs(el.y - origY) > 1;
        const isContentChanged = el.text !== el.originalText;
        const isEdited = el.isEdited || el.isNew || el.isUserCreated || isMoved || isContentChanged;

        const bgColor = el.bgColor || '#ffffff';

        if (isEdited && !el.isNew) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(origX * scaleX, origY * scaleY, origW * scaleX, origH * scaleY);
        }

        if (isEdited && el.text) {
          const fontSize = (el.fontSize || Math.max(10, origH * 0.85)) * scaleY;
          const fontFamily = el.fontFamily || 'Inter, Arial, sans-serif';
          const normalizedFontWeight = typeof el.fontWeight === 'number'
            ? el.fontWeight
            : (el.fontWeight === 'bold' || el.fontWeight === '700' ? 700 : 400);
          const fontStyle = el.fontStyle || 'normal';

          ctx.font = `${fontStyle} ${normalizedFontWeight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = el.color || '#000000';
          ctx.textBaseline = 'alphabetic';

          const textX = (el.x + 2) * scaleX;
          const textY = (el.y + (el.height || origH || 14) * 0.85) * scaleY;

          ctx.fillText(el.text, textX, textY);
        }
      });

      const dataURL = exportCanvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${currentDocument?.name || 'edited_document'}_page_${activePageIndex + 1}.png`;
      link.href = dataURL;
      link.click();
    };
    img.src = page.backgroundImage;
  };

  // 10. Export PDF document
  const handleExportPDF = async () => {
    if (!currentDocument) return;

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDocument),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF document.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDocument.name.replace(/\.[^/.]+$/, '')}_edited.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to export PDF document.');
    }
  };

  const activePage = currentDocument?.pages?.[activePageIndex];
  const selectedElement = activePage?.elements?.find((e) => e.id === selectedElementId);

  const canUndo = (currentDocument?.historyIndex || 0) > 0;
  const canRedo = (currentDocument?.historyIndex || 0) < ((currentDocument?.history || []).length - 1);

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-sans select-none overflow-hidden ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-950/90 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-medium max-w-md leading-normal">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {isProcessing && (
        <ProcessingModal currentStep={processingStep} filename={processingFilename} />
      )}

      {showPrivacyAudit && (
        <PrivacyModal onClose={() => setShowPrivacyAudit(false)} />
      )}

      {/* Main View Router */}
      {!currentDocument ? (
        <LandingPage
          onFileSelected={handleFilesSelected}
          onShowPrivacyAudit={() => setShowPrivacyAudit(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <div className="h-screen flex flex-col">
          {/* Top Header */}
          <EditorHeader
            docName={currentDocument.name}
            onDocNameChange={(newName) =>
              setDocuments((prev) =>
                prev.map((d) => (d.id === activeDocId ? { ...d, name: newName } : d))
              )
            }
            zoomScale={zoomScale}
            onZoomChange={setZoomScale}
            showBackgroundMask={showBackgroundMask}
            onToggleMask={() => setShowBackgroundMask(!showBackgroundMask)}
            onExportPNG={handleExportPNG}
            onExportPDF={handleExportPDF}
            onBackToHome={() => {
              setDocuments([]);
              setActiveDocId(null);
            }}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Main Editor Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Pages & Multi-Doc Sidebar */}
            <PageSidebar
              documents={documents}
              activeDocId={activeDocId}
              onSelectDocument={handleSelectDocument}
              onRemoveDocument={handleRemoveDocument}
              onAddFilesSelected={handleFilesSelected}
              pages={currentDocument.pages}
              activePageIndex={activePageIndex}
              onSelectPage={(idx) => {
                setActivePageIndex(idx);
                setSelectedElementId(null);
              }}
              onAddTextElement={handleAddTextElement}
              theme={theme}
            />

            {/* Central Canvas Viewport */}
            <main className={`flex-1 overflow-auto flex items-center justify-center p-4 relative transition-colors ${
              theme === 'dark' ? 'bg-slate-950' : 'bg-slate-200'
            }`}>
              {activePage && (
                <FabricCanvas
                  page={activePage}
                  zoomScale={zoomScale}
                  showBackgroundMask={showBackgroundMask}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onElementChange={handleElementChange}
                  fabricCanvasRef={fabricCanvasRef}
                  theme={theme}
                />
              )}
            </main>

            {/* Right Properties Inspector */}
            <PropertiesSidebar
              element={selectedElement}
              onChangeElement={(updates) => handleElementChange(selectedElementId, updates)}
              onDeleteElement={handleDeleteElement}
              localFonts={localDeviceFonts}
              onLocalFontsUpdated={setLocalDeviceFonts}
              theme={theme}
            />
          </div>
        </div>
      )}
    </div>
  );
}
