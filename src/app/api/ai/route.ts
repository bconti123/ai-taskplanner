import { NextResponse } from "next/server";
import type { AiOutcome } from "@/lib/ai/types";
import { toAiError } from "@/lib/ai/errors";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

type AiRequestBody = {
  userText: string;
};

export const POST = async (req: Request) => {

  if (!openai) {
    const outcome: AiOutcome = {
      kind: "error",
      message: "Server is missing OPENAI_API_KEY.",
      retryable: false,
    };
    return NextResponse.json(outcome, { status: 500 });
  }

  let body: AiRequestBody | null = null;

  try {
    body = (await req.json()) as AiRequestBody;
  } catch {
    const outcome: AiOutcome = {
      kind: "error",
      message: "Invalid request body.",
      retryable: false,
    };
    return NextResponse.json(outcome, { status: 400 });
  }

  const userText = body?.userText?.trim();
  if (!userText) {
    const outcome: AiOutcome = {
      kind: "error",
      message: "Please type a command or request.",
      retryable: false,
    };
    return NextResponse.json(outcome, { status: 400 });
  }

  try {

    const outcome: AiOutcome = {
      kind: "resolved",
      task: { id: "demo", title: `Echo: ${userText}`, status: "ACTIVE" },
      message: "Starter route is wired up. Replace this with your tool-calling logic.",
    };

    return NextResponse.json(outcome, { status: 200 });
  } catch (err) {
    const outcome = toAiError(err);
    return NextResponse.json(outcome, { status: 503 });
  }
}
