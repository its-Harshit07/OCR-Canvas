import React, { useState, useEffect } from 'react';
import { Type, Sliders, Palette, Trash2, Bold, Italic, Layers, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { FONT_CATEGORIES, ALL_FONTS } from '../../utils/fontRegistry';
import { requestLocalDeviceFonts, isLocalFontApiSupported, checkLocalFontPermissionState } from '../../utils/localFontManager';

export default function PropertiesSidebar({
  element,
  onChangeElement,
  onDeleteElement,
  localFonts = [],
  onLocalFontsUpdated
}) {
  const [localFontStatus, setLocalFontStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      if (isLocalFontApiSupported()) {
        const perm = await checkLocalFontPermissionState();
        if (perm === 'granted' && localFonts.length === 0 && onLocalFontsUpdated) {
          const res = await requestLocalDeviceFonts();
          if (res.fonts && res.fonts.length > 0) {
            onLocalFontsUpdated(res.fonts);
            setLocalFontStatus('granted');
          }
        }
      }
    }
    checkPermission();
  }, []);

  if (!element) {
    return (
      <aside className="w-72 border-l border-[#242424] bg-[#141414] p-6 flex flex-col items-center justify-center text-center text-[#746e65] shrink-0 select-none font-sans">
        <div className="w-12 h-12 rounded-xl bg-[#1c1c1c] border border-[#282828] flex items-center justify-center mb-3 text-[#4d4841]">
          <Type className="w-6 h-6 text-[#746e65]" />
        </div>
        <h4 className="text-xs font-semibold text-[#b0a99f] mb-1">No Element Selected</h4>
        <p className="text-[11px] text-[#746e65] max-w-[190px] leading-normal">
          Click any text region on the document canvas to edit text, typography, and positioning.
        </p>
      </aside>
    );
  }

  const presetColors = ['#000000', '#ffffff', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#4b5563'];

  const currentWeight = typeof element.fontWeight === 'number'
    ? element.fontWeight
    : (element.fontWeight === 'bold' || element.fontWeight === '700' ? 700 : 400);

  const handleAllowDeviceFontsClick = async () => {
    setLocalFontStatus('loading');
    const res = await requestLocalDeviceFonts();
    setLocalFontStatus(res.state);
    setStatusMessage(res.message);

    if (res.fonts && res.fonts.length > 0 && onLocalFontsUpdated) {
      onLocalFontsUpdated(res.fonts);
    }
  };

  return (
    <aside className="w-72 border-l border-[#242424] bg-[#141414] p-4 flex flex-col justify-between shrink-0 overflow-y-auto select-none font-sans">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#b0a99f] uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Text Properties</span>
          </div>
          {element.confidence && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1c1c] border border-[#282828] text-[#d97706] font-mono">
              Conf: {Math.round(element.confidence * 100)}%
            </span>
          )}
        </div>

        {/* Text Content Input */}
        <div>
          <label className="block text-[11px] font-medium text-[#b0a99f] mb-1">Text Content</label>
          <textarea
            rows={3}
            value={element.text || ''}
            onChange={(e) => onChangeElement({ text: e.target.value })}
            className="w-full bg-[#0c0c0c] border border-[#242424] rounded-md p-2 text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60 resize-none font-sans leading-relaxed"
            placeholder="Enter text..."
          />
        </div>

        {/* Device Font Access Permission Banner */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f4f1ea]">
              <Sparkles className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
              <span>Use Installed Device Fonts</span>
            </div>
            <button
              onClick={() => setShowPermissionBanner(!showPermissionBanner)}
              className="text-[10px] text-[#b0a99f] hover:text-[#f4f1ea] underline cursor-pointer"
            >
              {showPermissionBanner ? 'Hide' : 'Info'}
            </button>
          </div>

          <p className="text-[11px] text-[#746e65] leading-snug">
            Match original typography using local device font files.
          </p>

          <button
            onClick={handleAllowDeviceFontsClick}
            disabled={localFontStatus === 'loading'}
            className="w-full py-1.5 px-3 rounded-md bg-[#242424] hover:bg-[#2e2e2e] border border-[#333333] text-[#f4f1ea] font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#d97706]" />
            <span>{localFontStatus === 'loading' ? 'Requesting...' : 'Allow Device Fonts'}</span>
          </button>

          {statusMessage && (
            <p className={`text-[10px] ${localFontStatus === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {statusMessage}
            </p>
          )}

          {showPermissionBanner && (
            <div className="pt-2 border-t border-[#242424] text-[10px] text-[#746e65] leading-normal flex items-start gap-1">
              <Lock className="w-3 h-3 text-[#d97706] shrink-0 mt-0.5" />
              <span>
                Local font access runs in browser context. Font files are never transmitted or saved externally.
              </span>
            </div>
          )}
        </div>

        {/* Font Family Selection */}
        <div>
          <label className="block text-[11px] font-medium text-[#b0a99f] mb-1">Font Family</label>
          <select
            value={element.fontFamily || 'Inter, Arial, sans-serif'}
            onChange={(e) => onChangeElement({ fontFamily: e.target.value })}
            className="w-full bg-[#0c0c0c] border border-[#242424] rounded-md p-1.5 text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60"
          >
            {localFonts.length > 0 && (
              <optgroup label={`Installed Device Fonts (${localFonts.length})`}>
                {localFonts.map((f, idx) => (
                  <option key={`${f.family}-${idx}`} value={`"${f.family}", sans-serif`} className="bg-[#141414] text-[#f4f1ea]">
                    {f.fullName || f.family} ({f.style || 'Regular'})
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Standard Document Fonts">
              {FONT_CATEGORIES.DOCUMENT.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#141414] text-[#f4f1ea]">
                  {f.label}
                </option>
              ))}
            </optgroup>

            <optgroup label="Web / Google Fonts">
              {FONT_CATEGORIES.GOOGLE.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#141414] text-[#f4f1ea]">
                  {f.label}
                </option>
              ))}
            </optgroup>

            <optgroup label="Serif">
              {FONT_CATEGORIES.SERIF.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#141414] text-[#f4f1ea]">
                  {f.label}
                </option>
              ))}
            </optgroup>

            <optgroup label="Monospace">
              {FONT_CATEGORIES.MONOSPACE.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#141414] text-[#f4f1ea]">
                  {f.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Font Size & Weight / Style */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-[#b0a99f]">Font Size</label>
            <span className="text-xs font-mono text-[#d97706]">{element.fontSize || 14}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={8}
              max={120}
              value={element.fontSize || 14}
              onChange={(e) => onChangeElement({ fontSize: parseInt(e.target.value) })}
              className="flex-1 accent-[#d97706] cursor-pointer"
            />
            <input
              type="number"
              min={6}
              max={200}
              value={element.fontSize || 14}
              onChange={(e) => onChangeElement({ fontSize: parseInt(e.target.value) || 14 })}
              className="w-14 bg-[#0c0c0c] border border-[#242424] rounded p-1 text-center text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60 font-mono"
            />
          </div>

          {/* Font Weight Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-[#b0a99f]">Font Weight</label>
              <span className="text-xs font-mono text-[#d97706]">{currentWeight}</span>
            </div>
            <select
              value={currentWeight}
              onChange={(e) => onChangeElement({ fontWeight: parseInt(e.target.value) || 400 })}
              className="w-full bg-[#0c0c0c] border border-[#242424] rounded-md p-1.5 text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60 mb-2"
            >
              <option value={100} className="bg-[#141414]">100 - Thin</option>
              <option value={300} className="bg-[#141414]">300 - Light</option>
              <option value={400} className="bg-[#141414]">400 - Normal / Regular</option>
              <option value={500} className="bg-[#141414]">500 - Medium</option>
              <option value={600} className="bg-[#141414]">600 - SemiBold</option>
              <option value={700} className="bg-[#141414]">700 - Bold</option>
              <option value={800} className="bg-[#141414]">800 - ExtraBold</option>
              <option value={900} className="bg-[#141414]">900 - Black</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeElement({ fontWeight: currentWeight >= 700 ? 400 : 700 })}
                className={`flex-1 py-1.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  currentWeight >= 700
                    ? 'bg-[#1c1c1c] border-[#d97706]/50 text-[#f4f1ea]'
                    : 'bg-[#0c0c0c] border-[#242424] text-[#746e65] hover:text-[#f4f1ea]'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
                <span>Bold</span>
              </button>
              <button
                onClick={() => onChangeElement({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`flex-1 py-1.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  element.fontStyle === 'italic'
                    ? 'bg-[#1c1c1c] border-[#d97706]/50 text-[#f4f1ea]'
                    : 'bg-[#0c0c0c] border-[#242424] text-[#746e65] hover:text-[#f4f1ea]'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
                <span>Italic</span>
              </button>
            </div>
          </div>
        </div>

        {/* Text Color & Background Color */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#b0a99f] flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Text Color</span>
              </label>
              <span className="text-[10px] font-mono text-[#746e65] uppercase">{element.color || '#000000'}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.color || '#000000'}
                onChange={(e) => onChangeElement({ color: e.target.value })}
                className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer shrink-0"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => onChangeElement({ color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                      element.color === c ? 'border-[#f4f1ea] ring-2 ring-[#d97706]/50 scale-110' : 'border-[#2e2e2e]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#b0a99f] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#b0a99f]" />
                <span>Background Patch Color</span>
              </label>
              <span className="text-[10px] font-mono text-[#746e65] uppercase">{element.bgColor || '#ffffff'}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.bgColor || '#ffffff'}
                onChange={(e) => onChangeElement({ bgColor: e.target.value })}
                className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer shrink-0"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    key={'bg-' + c}
                    onClick={() => onChangeElement({ bgColor: c })}
                    style={{ backgroundColor: c }}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                      element.bgColor === c ? 'border-[#f4f1ea] ring-2 ring-[#d97706]/50 scale-110' : 'border-[#2e2e2e]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Position & Geometry */}
        <div className="pt-2 border-t border-[#242424] space-y-2">
          <label className="block text-[10px] font-medium text-[#746e65] uppercase tracking-wider">Geometry (px)</label>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="bg-[#0c0c0c] p-1.5 rounded border border-[#242424] flex items-center justify-between">
              <span className="text-[#746e65] pl-1">X:</span>
              <input
                type="number"
                value={element.x ?? 0}
                onChange={(e) => onChangeElement({ x: parseInt(e.target.value) || 0 })}
                className="w-14 bg-[#141414] border border-[#282828] rounded px-1 py-0.5 text-right text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60"
              />
            </div>
            <div className="bg-[#0c0c0c] p-1.5 rounded border border-[#242424] flex items-center justify-between">
              <span className="text-[#746e65] pl-1">Y:</span>
              <input
                type="number"
                value={element.y ?? 0}
                onChange={(e) => onChangeElement({ y: parseInt(e.target.value) || 0 })}
                className="w-14 bg-[#141414] border border-[#282828] rounded px-1 py-0.5 text-right text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60"
              />
            </div>
            <div className="bg-[#0c0c0c] p-1.5 rounded border border-[#242424] flex items-center justify-between">
              <span className="text-[#746e65] pl-1">W:</span>
              <input
                type="number"
                min={10}
                value={element.width ?? 10}
                onChange={(e) => onChangeElement({ width: parseInt(e.target.value) || 10 })}
                className="w-14 bg-[#141414] border border-[#282828] rounded px-1 py-0.5 text-right text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60"
              />
            </div>
            <div className="bg-[#0c0c0c] p-1.5 rounded border border-[#242424] flex items-center justify-between">
              <span className="text-[#746e65] pl-1">H:</span>
              <input
                type="number"
                min={10}
                value={element.height ?? 10}
                onChange={(e) => onChangeElement({ height: parseInt(e.target.value) || 10 })}
                className="w-14 bg-[#141414] border border-[#282828] rounded px-1 py-0.5 text-right text-xs text-[#f4f1ea] focus:outline-none focus:border-[#d97706]/60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Action Button */}
      <div className="pt-4 border-t border-[#242424] mt-4">
        <button
          onClick={onDeleteElement}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#241414] hover:bg-[#331818] border border-red-900/40 text-red-400 font-medium text-xs transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Text Box</span>
        </button>
      </div>
    </aside>
  );
}
