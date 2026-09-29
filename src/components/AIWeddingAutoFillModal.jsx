import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  parseWeddingDetailsWithAI,
  SAMPLE_WEDDING_PROMPTS
} from '../utils/aiWeddingParser.js';
import './AIWeddingAutoFillModal.css';

export default function AIWeddingAutoFillModal({ isOpen, onClose, onApplyData, currentFormData }) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem('savemeaseat_ai_key') || "" : "")
  );

  if (!isOpen) return null;

  const handleSelectSample = (sampleText) => {
    setInputText(sampleText);
    setParsedData(null);
  };

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem('savemeaseat_ai_key', customApiKey.trim());
      toast.success("AI API Key saved to browser storage!");
    }
  };

  const handleExtract = async () => {
    if (!inputText.trim()) {
      toast.error("Please paste or type wedding details first.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("🔍 Analyzing wedding text and dates...");

    try {
      setTimeout(() => setStatusMessage("💍 Extracting couple names, venues & schedule..."), 300);
      setTimeout(() => setStatusMessage("🎨 Formatting colors, bridal party & timeline..."), 700);

      const result = await parseWeddingDetailsWithAI({
        text: inputText,
        apiKey: customApiKey.trim()
      });

      setParsedData(result);
      toast.success("✨ Wedding details successfully extracted!");
    } catch (err) {
      console.error("AI Auto-fill error:", err);
      toast.error(err.message || "Could not parse wedding details.");
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
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
          currentVal === "" ||
          currentVal === null ||
          currentVal === undefined ||
          (Array.isArray(currentVal) && currentVal.length === 0);

        if (isEmpty && newVal !== undefined && newVal !== null && newVal !== "") {
          finalData[key] = newVal;
        }
      });
    } else {
      finalData = {
        ...currentFormData,
        ...parsedData
      };

      // If there are no bridesmaids in the text, do NOT add any dummy items
      if (!parsedData.bridesmaids || parsedData.bridesmaids.length === 0) {
        finalData.bridesmaids = [];
      }
      // If there are no groomsmen in the text, do NOT add any dummy items
      if (!parsedData.groomsmen || parsedData.groomsmen.length === 0) {
        finalData.groomsmen = [];
      }
    }

    onApplyData(finalData);
    toast.success("All form steps populated with wedding details!");
    onClose();
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-title-group">
            <div className="ai-modal-sparkle-icon">
              <i className="fas fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h2 className="ai-modal-title">AI Wedding Auto-Fill</h2>
              <p className="ai-modal-subtitle">
                Paste any wedding invitation card, WhatsApp text, or notes — AI fills all 4 steps instantly.
              </p>
            </div>
          </div>
          <button className="ai-modal-close-btn" onClick={onClose} title="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="ai-modal-body">
          {!parsedData ? (
            <>
              {/* Quick Sample Prompts */}
              <div className="ai-samples-bar">
                <span className="ai-samples-label">
                  <i className="fas fa-bolt"></i> Try Quick Samples:
                </span>
                <div className="ai-sample-chips">
                  {SAMPLE_WEDDING_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="ai-chip-btn"
                      onClick={() => handleSelectSample(sample.text)}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div className="ai-textarea-wrapper">
                <textarea
                  className="ai-textarea"
                  placeholder="Paste wedding message here... e.g.&#10;&#10;Save The Date! We, Chileshe Mwape & Kondwani Phiri, joyfully invite you to our wedding on 14th November 2026 in Lusaka. Ceremony at Cathedral of Child Jesus at 9:30 AM. Reception at Urban Hotel Gardens at 3 PM. Dress Code: Formal with Emerald Green & Gold. RSVP by Oct 20th."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  disabled={isProcessing}
                />
                <div className="ai-textarea-footer">
                  <span>{inputText.length} characters</span>
                  {inputText && (
                    <button
                      type="button"
                      className="ai-text-clear"
                      onClick={() => setInputText("")}
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Settings for API Key */}
              <div className="ai-settings-toggle">
                <button
                  type="button"
                  className="ai-toggle-btn"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <i className="fas fa-cog"></i>
                  <span>AI Engine & API Settings</span>
                  <i className={`fas fa-chevron-${showSettings ? 'up' : 'down'}`}></i>
                </button>

                {showSettings && (
                  <div className="ai-settings-panel">
                    <p className="ai-settings-info">
                      Built-in Dual Engine: Uses high-performance Groq LLaMA-3.3 + Instant Fallback Smart Rule Parser. You can also provide your own custom Groq or Gemini API key below:
                    </p>
                    <div className="ai-api-input-row">
                      <input
                        type="password"
                        className="ai-api-input"
                        placeholder="Optional: gsk_... (Groq API Key)"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        className="ai-api-save-btn"
                        onClick={handleSaveApiKey}
                      >
                        Save Key
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Review & Preview of Extracted Data */
            <div className="ai-review-container">
              <div className="ai-review-banner">
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>Extraction Complete!</strong>
                  <p>Review the details detected below. You can apply them directly to your event.</p>
                </div>
              </div>

              <div className="ai-review-grid">
                {/* Couple Card */}
                <div className="ai-review-card">
                  <div className="ai-card-title">
                    <i className="fas fa-heart"></i> The Couple
                  </div>
                  <div className="ai-card-content">
                    <div className="ai-field-row">
                      <span className="ai-field-label">Bride:</span>
                      <strong className="ai-field-val">{parsedData.bride_name || "— (Blank)"}</strong>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Groom:</span>
                      <strong className="ai-field-val">{parsedData.groom_name || "— (Blank)"}</strong>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Tagline:</span>
                      <span className="ai-field-val">{parsedData.tagline || "— (Blank)"}</span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Photos:</span>
                      <span className="ai-field-val" style={{ color: '#d4af37', fontStyle: 'italic' }}>Skipped (Add manually)</span>
                    </div>
                  </div>
                </div>

                {/* Date & Location Card */}
                <div className="ai-review-card">
                  <div className="ai-card-title">
                    <i className="fas fa-calendar-alt"></i> Date & Location
                  </div>
                  <div className="ai-card-content">
                    <div className="ai-field-row">
                      <span className="ai-field-label">Event Date:</span>
                      <strong className="ai-field-val highlight">{parsedData.date || "— (Blank)"}</strong>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Location:</span>
                      <span className="ai-field-val">{parsedData.location || "— (Blank)"}</span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">RSVP Deadline:</span>
                      <span className="ai-field-val">{parsedData.rsvp_deadline || "— (Blank)"}</span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Max Guests:</span>
                      <span className="ai-field-val">
                        {parsedData.allowed_guests?.includes('2') ? 'Allow Plus One (Couple)' : 'Strictly 1 Guest'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ceremony & Reception Card */}
                <div className="ai-review-card">
                  <div className="ai-card-title">
                    <i className="fas fa-church"></i> Venues & Times
                  </div>
                  <div className="ai-card-content">
                    <div className="ai-field-row">
                      <span className="ai-field-label">Ceremony:</span>
                      <span className="ai-field-val">
                        {parsedData.ceremony_venue || "— (Blank)"} {parsedData.ceremony_time ? `(${parsedData.ceremony_time})` : ''}
                      </span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Reception:</span>
                      <span className="ai-field-val">
                        {parsedData.reception_venue || "— (Blank)"} {parsedData.reception_time ? `(${parsedData.reception_time})` : ''}
                      </span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Address:</span>
                      <span className="ai-field-val">{parsedData.reception_address || parsedData.venue_address || "— (Blank)"}</span>
                    </div>
                  </div>
                </div>

                {/* Theme & Colors Card */}
                <div className="ai-review-card">
                  <div className="ai-card-title">
                    <i className="fas fa-palette"></i> Theme & Attire
                  </div>
                  <div className="ai-card-content">
                    <div className="ai-field-row">
                      <span className="ai-field-label">Dress Code:</span>
                      <span className="ai-field-val">{parsedData.dress_code || "— (Blank)"}</span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Pass Card Note:</span>
                      <span className="ai-field-val">{parsedData.extra_card_text || "— (Blank)"}</span>
                    </div>
                    <div className="ai-field-row">
                      <span className="ai-field-label">Theme Palette:</span>
                      <div className="ai-color-swatches">
                        {(parsedData.theme_colors || []).map((c, i) => (
                          <span
                            key={i}
                            className="ai-color-pill"
                            style={{ background: c }}
                            title={`Color ${i+1}: ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Party & Schedule Stats */}
                <div className="ai-review-card full-width">
                  <div className="ai-card-title">
                    <i className="fas fa-list-check"></i> Party & Schedule Summary
                  </div>
                  <div className="ai-stats-row">
                    <div className="ai-stat-box">
                      <span className="ai-stat-num">{parsedData.program?.length || 0}</span>
                      <span className="ai-stat-label">Program Parts</span>
                    </div>
                    <div className="ai-stat-box">
                      <span className="ai-stat-num">{parsedData.bridesmaids?.length || 0}</span>
                      <span className="ai-stat-label">
                        Bridesmaids {(!parsedData.bridesmaids || parsedData.bridesmaids.length === 0) ? '(None added)' : ''}
                      </span>
                    </div>
                    <div className="ai-stat-box">
                      <span className="ai-stat-num">{parsedData.groomsmen?.length || 0}</span>
                      <span className="ai-stat-label">
                        Groomsmen {(!parsedData.groomsmen || parsedData.groomsmen.length === 0) ? '(None added)' : ''}
                      </span>
                    </div>
                    <div className="ai-stat-box">
                      <span className="ai-stat-num">{parsedData.gifts?.length || 0}</span>
                      <span className="ai-stat-label">Gift Options</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="ai-modal-footer">
          {!parsedData ? (
            <>
              <button
                type="button"
                className="ai-btn-secondary"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ai-btn-primary"
                onClick={handleExtract}
                disabled={isProcessing || !inputText.trim()}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>{statusMessage || "Parsing Details..."}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>Extract & Auto-Fill</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ai-btn-secondary"
                onClick={() => setParsedData(null)}
              >
                <i className="fas fa-arrow-left"></i> Edit Text
              </button>
              <button
                type="button"
                className="ai-btn-outline"
                onClick={() => handleApply(true)}
              >
                Fill Missing Only
              </button>
              <button
                type="button"
                className="ai-btn-primary apply"
                onClick={() => handleApply(false)}
              >
                <i className="fas fa-check"></i>
                <span>Apply All to Event Form</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
