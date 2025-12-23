import type { AiOutcome } from "./types";

export const toAiError = (err: unknown): AiOutcome => {
    const msg =
    err instanceof Error && err.message
        ? err.message
        : String(err ?? "Unknown error while calling the AI.");

  // Common OpenAI / fetch patterns (keep it simple + safe)
  const lower = msg.toLowerCase();
  const isRateLimit =
    lower.includes("429") || lower.includes("rate limit") || lower.includes("too many requests");

  if (isRateLimit) {
    return {
      kind: "error",
      message: "The AI is busy right now (rate limit). Please try again in a moment.",
      retryable: true,
    };
  }

  return {
    kind: "error",
    message: "Something went wrong while contacting the AI. Please try again.",
    retryable: true,
  };
}
