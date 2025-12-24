"use client";

import { useState } from "react";

const AiChat = () => {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function send() {
    const text = message.trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");
    setReply("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (typeof data?.error === "string" && data.error) ||
            `Request failed (${res.status})`
        );
      }

      setReply(typeof data?.text === "string" ? data.text : "");
      setMessage("");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        AI Chat
      </h1>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='Try: "Create task: Task name"'
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "inherit",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={loading}
        />

        <button
          onClick={send}
          disabled={loading || !message.trim()}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "tomato", whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      <pre
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          minHeight: 120,
          whiteSpace: "pre-wrap",
        }}
      >
        {reply || "Response will appear here..."}
      </pre>
    </main>
  );
}

export default AiChat