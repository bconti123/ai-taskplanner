import type { AiOutcome } from "@/lib/ai/types";
import { toAiError } from "@/lib/ai/errors";

export const runAiCommand = async (userText: string): Promise<AiOutcome> => {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText }),
    });

    // If server responded, parse the AiOutcome it returns (even on 400/503)
    const outcome = (await res.json()) as AiOutcome;
    return outcome;
  } catch (err) {
    // If browser is offline, fetch throws (no response at all)
    return toAiError(err);
  }
}
