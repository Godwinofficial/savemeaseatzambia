import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Trash2, Volume2, Send } from "lucide-react";
import { getOfflineSimulationResponse } from "./AIAgentChat";
import { toast } from "sonner";
import { GROQ_API_KEY, GROQ_URL, GROQ_MODEL, LIGHTSTACK_CONTEXT } from "../lib/aiKnowledge";

const sanitizeForDisplay = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export function GlobalAIAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am Aletheia, the AI assistant for Save Me A Seat. How can I assist you with your digital invitations, RSVPs, or event planning today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      synthRef.current = window.speechSynthesis;
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending, isOpen]);

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    let cleanText = text.replace(/[*_`#~]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const stopSpeechSynthesis = () => {
    if (synthRef.current) synthRef.current.cancel();
  };

  const submitQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMessage = { role: "user", content: queryText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);
    stopSpeechSynthesis();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-12);
      history.push({ role: "user", content: queryText });

      const sysPrompt = LIGHTSTACK_CONTEXT;
      const openRouterMessages = [{ role: "system", content: sysPrompt }, ...history];

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: openRouterMessages,
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      let replyContent = "";
      if (!res.ok) {
        replyContent = getOfflineSimulationResponse(queryText);
      } else {
        const data = await res.json();
        replyContent = data.choices?.[0]?.message?.content || getOfflineSimulationResponse(queryText);
      }

      setMessages(prev => [...prev, { role: "assistant", content: replyContent, timestamp: new Date() }]);
    } catch (err) {
      const fallbackReply = getOfflineSimulationResponse(queryText);
      setMessages(prev => [...prev, { role: "assistant", content: fallbackReply, timestamp: new Date() }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetWidgetChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared. How can I assist you with Save Me A Seat today?", timestamp: new Date() }]);
    stopSpeechSynthesis();
  };

  return (
    <>
      <style>{`
        .ai-widget-wrapper {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 9999;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .ai-widget-window {
          width: 360px;
          height: 550px;
          position: absolute;
          bottom: 0;
          right: 0;
        }
        @media (max-width: 600px) {
          .ai-widget-wrapper {
            bottom: 16px;
            right: 16px;
          }
          .ai-widget-window {
            position: fixed;
            bottom: 16px;
            right: 16px;
            left: 16px;
            width: calc(100% - 32px);
            height: 85vh;
            max-height: 600px;
          }
        }
      `}</style>
      <div className="ai-widget-wrapper">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              border: "none", color: "#fff", cursor: "pointer",
              boxShadow: "0 10px 25px rgba(99,102,241,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden", transition: "transform 0.3s ease"
            }}
            title="Chat with AI Assistant"
          >
            <Sparkles size={24} />
          </button>
        )}

        {isOpen && (
          <div className="ai-widget-window" style={{
            backgroundColor: "#fff",
            borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#ffffffff"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#111827" }}>Aletheia</h4>
                  <span style={{ fontSize: "8px", color: "#6b7280", textTransform: "uppercase" }}>Powered by Lightstack Group</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={handleResetWidgetChat} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af" }}>
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#f3f4f6" }}>
              {messages.map((m, idx) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div key={idx} style={{ display: "flex", gap: "12px", justifyContent: isAssistant ? "flex-start" : "flex-end" }}>
                    {isAssistant && (
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold" }}>A</div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "80%" }}>
                      <div style={{
                        padding: "8px 12px", borderRadius: isAssistant ? "12px 12px 12px 4px" : "12px 12px 4px 12px",
                        background: isAssistant ? "#fff" : "#e5e7eb",
                        color: isAssistant ? "#1f2937" : "#111827",
                        fontSize: "12px", lineHeight: "1.3",
                        border: isAssistant ? "1px solid #e5e7eb" : "none",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        wordBreak: "break-word",
                        overflowWrap: "break-word"
                      }}>
                        <div style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "inherit" }}>{sanitizeForDisplay(m.content)}</div>
                      </div>
                      {isAssistant && (
                        <button onClick={() => speakText(m.content)} style={{ alignSelf: "flex-end", background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}>
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {isSending && (
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-start" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold" }}>A</div>
                  <div style={{ padding: "8px 12px", borderRadius: "12px 12px 12px 4px", background: "#fff", border: "1px solid #e5e7eb" }}>
                    <span style={{ color: "#6b7280", fontSize: "9px" }}>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submitQuery(inputText); }}
              style={{ padding: "16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px", background: "#fff", alignItems: "center" }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "20px", border: "1px solid #e5e7eb",
                  fontSize: "12px", outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                style={{
                  width: "40px", height: "40px", borderRadius: "50%", border: "none",
                  background: (isSending || !inputText.trim()) ? "#e5e7eb" : "#6366f1",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: (isSending || !inputText.trim()) ? "not-allowed" : "pointer",
                  transition: "background 0.3s"
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default GlobalAIAgentWidget;
