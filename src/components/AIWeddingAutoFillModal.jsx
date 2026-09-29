import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { parseWeddingDetailsWithAI } from '../utils/aiWeddingParser.js';
import './AIWeddingAutoFillModal.css';

/* Animated thinking dots */
function ThinkingDots() {
  return (
    <span className="ai-thinking-dots">
      <span /><span /><span />
    </span>
  );
}

/* Scanning lines — the "AI reading" animation shown while text is entered */
function ScanLines({ active }) {
  return (
    <div className={`ai-scan-lines${active ? ' active' : ''}`} aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="ai-scan-line" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

/* Floating particles in header */
function Particles() {
  return (
    <div className="ai-particles" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <span key={i} className="ai-particle" style={{
          left: `${10 + i * 15}%`,
          animationDelay: `${i * 0.4}s`,
          animationDuration: `${2.5 + i * 0.3}s`,
        }} />
      ))}
    </div>
  );
}

const STATUS_STEPS = [
  'Reading invitation…',
  'Extracting names & dates…',
  'Detecting venues & schedule…',
  'Finalising details…',
];

export default function AIWeddingAutoFillModal({ isOpen, onClose, onApplyData, currentFormData }) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('savemeaseat_ai_key') || '' : '')
  );
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && !parsedData) {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasText = inputText.trim().length > 0;

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savemeaseat_ai_key', customApiKey.trim());
      toast.success('API key saved!');
      setShowApiKey(false);
    }
  };

  const handleExtract = async () => {
    if (!inputText.trim()) {
      toast.error('Paste your wedding details first.');
      return;
    }
    setIsProcessing(true);
    setStatusStep(0);

    const stepTimer = setInterval(() => {
      setStatusStep(prev => {
        if (prev < STATUS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 650);

    try {
      const result = await parseWeddingDetailsWithAI({
        text: inputText,
        apiKey: customApiKey.trim()
      });
      clearInterval(stepTimer);
      setParsedData(result);
    } catch (err) {
      clearInterval(stepTimer);
      toast.error(err.message || 'Could not parse details.');
    } finally {
      setIsProcessing(false);
      setStatusStep(0);
    }
  };

  const handleApply = (fillEmptyOnly = false) => {
    if (!parsedData) return;
    let finalData = {};
    if (fillEmptyOnly && currentFormData) {
      finalData = { ...currentFormData };
      Object.keys(parsedData).forEach(key => {
        const currentVal = currentFormData[key];
        const newVal = parsedData[key];
        const isEmpty =
          currentVal === '' || currentVal === null || currentVal === undefined ||
          (Array.isArray(currentVal) && currentVal.length === 0);
        if (isEmpty && newVal !== undefined && newVal !== null && newVal !== '') {
          finalData[key] = newVal;
        }
      });
    } else {
      finalData = { ...currentFormData, ...parsedData };
      if (!parsedData.bridesmaids || parsedData.bridesmaids.length === 0) finalData.bridesmaids = [];
      if (!parsedData.groomsmen || parsedData.groomsmen.length === 0) finalData.groomsmen = [];
    }
    onApplyData(finalData);
    onClose();
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-card" onClick={e => e.stopPropagation()}>

        {/* ── Header with AI animation ── */}
        <div className="ai-modal-header">
          <Particles />
          <div className="ai-header-content">
            <div className="ai-header-icon-wrap">
              <i className="fas fa-wand-magic-sparkles ai-header-icon" />
              <span className="ai-header-ring" />
            </div>
            <div>
              <h2 className="ai-modal-title">AI Auto-Fill</h2>
              <p className="ai-modal-sub">Paste any invite — fills all steps instantly</p>
            </div>
          </div>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close">
            <i className="fas fa-xmark" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ai-modal-body">
          {!parsedData ? (
            <>
              {/* Textarea */}
              <div className={`ai-textarea-box${hasText ? ' has-text' : ''}${isProcessing ? ' parsing' : ''}`}>
                <ScanLines active={hasText && !isProcessing} />
                <textarea
                  ref={textareaRef}
                  className="ai-textarea"
                  placeholder="Paste your wedding invitation or WhatsApp message here…"
                  value={inputText}
                  onChange={e => { setInputText(e.target.value); setParsedData(null); }}
                  rows={8}
                  disabled={isProcessing}
                />
                {hasText && !isProcessing && (
                  <button type="button" className="ai-clear-btn" onClick={() => setInputText('')}>
                    <i className="fas fa-xmark" /> Clear
                  </button>
                )}
                <div className="ai-textarea-meta">
                  {isProcessing ? (
                    <span className="ai-status-text">
                      {STATUS_STEPS[statusStep]}
                      <ThinkingDots />
                    </span>
                  ) : (
                    <span className="ai-char-count">
                      {hasText ? `${inputText.length} characters` : 'Start typing or paste below'}
                    </span>
                  )}
                </div>
              </div>

              {/* API Key */}
              <div className="ai-api-section">
                <button
                  type="button"
                  className="ai-api-toggle"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  <i className="fas fa-key" />
                  <span>Use my own Groq API key</span>
                  <i className={`fas fa-chevron-${showApiKey ? 'up' : 'down'}`} />
                </button>
                {showApiKey && (
                  <div className="ai-api-panel">
                    <input
                      type="password"
                      className="ai-api-input"
                      placeholder="gsk_... (Groq API key)"
                      value={customApiKey}
                      onChange={e => setCustomApiKey(e.target.value)}
                    />
                    <button type="button" className="ai-api-save" onClick={handleSaveApiKey}>
                      Save
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Results */
            <div className="ai-results">
              <div className="ai-results-banner">
                <i className="fas fa-circle-check" />
                <span>Extracted — review and apply to your form</span>
              </div>

              <div className="ai-results-table">
                <ResultRow label="Bride" value={parsedData.bride_name} />
                <ResultRow label="Groom" value={parsedData.groom_name} />
                <ResultRow label="Date" value={parsedData.date} highlight />
                <ResultRow label="Location" value={parsedData.location} />
                <ResultRow label="Ceremony" value={[parsedData.ceremony_venue, parsedData.ceremony_time].filter(Boolean).join('  ·  ')} />
                <ResultRow label="Reception" value={[parsedData.reception_venue, parsedData.reception_time].filter(Boolean).join('  ·  ')} />
                <ResultRow label="Address" value={parsedData.reception_address || parsedData.venue_address} />
                <ResultRow label="RSVP" value={parsedData.rsvp_deadline} />
                <ResultRow label="Dress Code" value={parsedData.dress_code} />
                <div className="ai-result-row">
                  <span className="ai-result-label">Palette</span>
                  <div className="ai-swatches">
                    {(parsedData.theme_colors || []).map((c, i) => (
                      <span key={i} className="ai-swatch" style={{ background: c }} title={c} />
                    ))}
                  </div>
                </div>
                <div className="ai-result-row ai-result-counts">
                  <span className="ai-result-label">Also extracted</span>
                  <span className="ai-result-val">
                    {parsedData.program?.length || 0} schedule items &middot; {parsedData.bridesmaids?.length || 0} bridesmaids &middot; {parsedData.groomsmen?.length || 0} groomsmen &middot; {parsedData.gifts?.length || 0} gifts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="ai-modal-footer">
          {!parsedData ? (
            <>
              <button type="button" className="ai-btn-ghost" onClick={onClose} disabled={isProcessing}>
                Cancel
              </button>
              <button
                type="button"
                className="ai-btn-primary"
                onClick={handleExtract}
                disabled={isProcessing || !hasText}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles" />
                    Extract & Fill
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="ai-footer-review-bar">
              <button type="button" className="ai-btn-ghost" onClick={() => setParsedData(null)}>
                <i className="fas fa-arrow-left" /> Edit
              </button>
              <div className="ai-footer-action-btns">
                <button type="button" className="ai-btn-outline" onClick={() => handleApply(true)}>
                  Fill Empty Only
                </button>
                <button type="button" className="ai-btn-apply" onClick={() => handleApply(false)}>
                  <i className="fas fa-check" /> Apply All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight }) {
  return (
    <div className="ai-result-row">
      <span className="ai-result-label">{label}</span>
      <span className={`ai-result-val${highlight ? ' hl' : ''}${!value ? ' blank' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function StatBadge({ num, label, icon }) {
  return (
    <div className="ai-stat">
      <span className="ai-stat-icon">{icon}</span>
      <span className="ai-stat-num">{num}</span>
      <span className="ai-stat-lbl">{label}</span>
    </div>
  );
}
