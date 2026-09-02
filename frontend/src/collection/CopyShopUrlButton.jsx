import { useState } from "react";

export default function CopyShopUrlButton({ style }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/add-shop`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy URL. Please try again.");
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "11px 20px",
        background: copied ? "rgba(12,64,68,0.12)" : "#FDFDFC",
        border: `1px solid ${copied ? "rgba(12,64,68,0.4)" : "rgba(12,64,68,0.22)"}`,
        borderRadius: "999px",
        fontWeight: 800,
        color: "#0C4044",
        fontSize: "14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 12px 26px rgba(7,59,63,0.06)",
        ...style,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}