"use client";

import { useState } from "react";
import type { AiOutcome } from "@/lib/ai/types";
import { runAiCommand } from "@/lib/ai/runAiCommand";

export default function AiBox() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [outcome, setOutcome] = useState<AiOutcome | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userText = input.trim();
    if (!userText || userText === '""') {
      setUiError("Please type a command or request.");
      setOutcome(null);
      return;
    }

    if (isLoading) return;

    setUiError(null);
    setIsLoading(true);
    setOutcome(null);

    try {
      const result = await runAiCommand(userText);
      setOutcome(result);
    } catch {
      setOutcome({
        kind: "error",
        message: "Something went wrong while contacting the AI. Please try again.",
        retryable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="e.g. restart billing task"
          className="border rounded px-3 py-2 w-full"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="border rounded px-3 py-2"
        >
          {isLoading ? "Thinking..." : "Run"}
        </button>
      </form>
      {/* ✅ UI error message */}
      {uiError && <div className="mt-2 text-sm">{uiError}</div>}
      <div className="mt-3">
        {outcome?.kind === "resolved" && (
          <div>✅ {outcome.message}</div>
        )}
        {outcome?.kind === "ambiguous" && (
          <div>❓ {outcome.message}</div>
        )}
        {outcome?.kind === "not_found" && (
          <div>🔎 {outcome.message}</div>
        )}
        {outcome?.kind === "error" && (
          <div>⚠️ {outcome.message}</div>
        )}
      </div>
    </div>
  );
}