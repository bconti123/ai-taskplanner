import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/demoUser";

// If your Prisma enum exists, you can import it; otherwise keep status as string union.
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Tool definitions (JSON Schema)
const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "get_tasks",
    description: "List tasks for the current user. Missing filters are allowed.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: "string", enum: [...TASK_STATUSES] as unknown as string[] },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
    },
    strict: false,
  },
  {
    type: "function",
    name: "create_task",
    description:
      "Create a new task. Missing fields use defaults: description=null, priority=0, dueDate=null.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "integer", minimum: 0, maximum: 10, default: 0 },
        dueDate: { type: "string", description: "ISO date string (optional)" },
      },
      required: ["title"],
    },
    strict: false,
  },
  {
  type: "function",
  name: "update_task",
  description: "Update an existing task by id. Only provided fields are updated.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      priority: { type: "integer", minimum: 0, maximum: 10 },
      dueDate: { type: "string" },
      status: { type: "string", enum: [...TASK_STATUSES] as unknown as string[] },
    },
    required: ["id"],
  },
  strict: false,
  },
  {
    type: "function",
    name: "delete_task",
    description: "Delete a task by id.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    strict: false,
  }
];



async function runTool(name: string, args: any) {
  // NOTE: this is your “tool executor” — where AI actions become real DB actions.
  switch (name) {
    case "get_tasks": {
      const status = args?.status;
      const limit = typeof args?.limit === "number" ? args.limit : 20;

      const tasks = await prisma.task.findMany({
        where: {
          userId: DEMO_USER_ID,
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return { tasks };
    }

    case "create_task": {
      const title = typeof args?.title === "string" ? args.title.trim() : "";
      if (!title) throw new Error("title is required");

      const task = await prisma.task.create({
        data: {
          userId: DEMO_USER_ID,
          title,
          description: typeof args?.description === "string" ? args.description.trim() || null : null,
          priority: typeof args?.priority === "number" ? args.priority : 0,
          dueDate:
            typeof args?.dueDate === "string" && args.dueDate
              ? new Date(args.dueDate)
              : null,
          status: "PENDING",
        },
      });

      return { task };
    }

    case "update_task": {
      const id = typeof args?.id === "string" ? args.id : "";
      if (!id) throw new Error("id is required");

      const data: any = {};
      if (typeof args?.title === "string") data.title = args.title.trim();
      if (typeof args?.description === "string") data.description = args.description.trim() || null;
      if (typeof args?.priority === "number") data.priority = args.priority;

      if (typeof args?.dueDate === "string") {
        data.dueDate = args.dueDate ? new Date(args.dueDate) : null;
      }

      if (typeof args?.status === "string" && TASK_STATUSES.includes(args.status)) {
        data.status = args.status;
      }

      const task = await prisma.task.update({
        where: { id_userId: { id, userId: DEMO_USER_ID } },
        data,
      });

      return { task };
    }

    case "delete_task": {
      const id = typeof args?.id === "string" ? args.id : "";
      if (!id) throw new Error("id is required");

      await prisma.task.delete({
        where: { id_userId: { id, userId: DEMO_USER_ID } },
      });

      return { ok: true };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(req: NextRequest) {
  await ensureDemoUser();

  const body = await req.json();
  const userMessage = typeof body?.message === "string" ? body.message : "";

  if (!userMessage) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  // This “input_list” loop is the standard tool-calling flow:
  // model -> function_call -> we execute -> function_call_output -> model -> final answer. :contentReference[oaicite:2]{index=2}
  const input: any[] = [
    {
      role: "system",
      content:
        "You are a task-planning assistant. " +
        "Use tools to read or modify tasks when needed. " +
        "When creating tasks, assume defaults for missing fields. " +
        "DO NOT ask follow-up questions after completing an action. " +
        "Only ask a question if the action cannot be completed without clarification. " +
        "Be concise.",
    },
    { role: "user", content: userMessage },
  ];

  // 1) Ask model
  let response = await openai.responses.create({
    model: "gpt-4o-mini", // you can switch later; keep as-is for now
    tools,
    input,
  });

  // 2) If model called tools, run them and send outputs back; repeat until done.
  input.push(...response.output);

  for (const item of response.output) {
    if (item.type === "function_call") {
      const args = item.arguments ? JSON.parse(item.arguments) : {};
      const result = await runTool(item.name, args);

      input.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify(result),
      });
    }
  }

  // If any tool calls happened, ask model again with the tool outputs.
  // (You can loop this if you want multi-tool chains; this keeps it simple.)
  if (response.output.some((x: any) => x.type === "function_call")) {
    response = await openai.responses.create({
      model: "gpt-4o-mini",
      tools,
      input,
      instructions: "Respond with a brief confirmation of what was done. " + "Do not ask questions or suggest next steps.",
    });
  }

  return NextResponse.json({
    text: response.output_text,
    // optionally return raw response for debugging:
    // response,
  });
}
