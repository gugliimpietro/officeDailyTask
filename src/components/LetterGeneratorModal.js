// src/components/LetterGeneratorModal.js
import React, { useEffect, useRef } from "react";

export default function LetterGeneratorModal({ onClose }) {
  const iframeRef = useRef(null);

  // Optional: close on ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Optional: if you want to reset form state each time modal opens,
  // you can clear localStorage inside the iframe after it loads.
  const handleIframeLoad = () => {
    try {
      const w = iframeRef.current?.contentWindow;
      // Comment this out if you WANT auto-restore draft behavior from main.js
      // (main.js uses localStorage key "letterFormState"). :contentReference[oaicite:7]{index=7}
      // w?.localStorage?.removeItem("letterFormState");
    } catch {
      // ignore cross-origin issues (should not happen since it's same-origin public/)
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        // click outside to close
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          height: "min(92vh, 900px)",
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 700 }}>Letter Generator</div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <iframe
            ref={iframeRef}
            title="Letter Generator"
            src="/letterGen/index.html"
            onLoad={handleIframeLoad}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
