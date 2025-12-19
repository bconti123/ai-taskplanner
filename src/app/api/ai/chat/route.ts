import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/demoUser";

// If your Prisma enum exists, you can import it; otherwise keep status as string union.
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const resolveSingleTaskOrAsk = (tasks: any[]) => {
  if (!tasks || tasks.length === 0) {
    return { type: "not_found" };
  };

  if (tasks.length === 1) {
    return { type: "resolved", tasks: tasks[0] };
  };

  return { 
    type: "ambiguous",
    choices: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
    })),
  }
}

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
        query: { type: "string", description: "Search term to filter tasks by title or description" },
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
  description:   "Update an existing task by id. " + "dueDate accepts YYYY-MM-DD. To clear it, pass dueDate as an empty string ''.",
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
  description:
    "Delete a task by id. If the user provides a title instead of an id, pass it as query. " +
    "If multiple matches, return choices with ids.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string", description: "Task id (preferred)" },
      query: { type: "string", description: "Title/description text to search" },
    },
  },
  strict: false,
  }
];

const runTool = async (name: string, args: any) => {
  // NOTE: this is your “tool executor” — where AI actions become real DB actions.
  switch (name) {

    case "get_tasks": {
      const limit = typeof args?.limit === "number" ? args.limit : 20;
      const query = typeof args?.query === "string" ? args.query.trim() : "";

      const tasks = await prisma.task.findMany({
        where: {
          userId: DEMO_USER_ID,
          ...(query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
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
      const rawId = typeof args?.id === "string" ? args.id.trim() : "";
      const query = typeof args?.query === "string" ? args.query.trim() : "";

      // Helper: detect Prisma cuid-ish ids (your ids look like "cmjcjhar50000l7ktdgzqujhp")
      const looksLikeId = (s: string) => /^c[a-z0-9]{10,}$/.test(s);

      // 1) If it looks like an id, try delete by id
      if (rawId && looksLikeId(rawId)) {
        const existing = await prisma.task.findUnique({
          where: { id_userId: { id: rawId, userId: DEMO_USER_ID } },
        });

        if (!existing) return { ok: false, error: "not_found", id: rawId };

        await prisma.task.delete({
          where: { id_userId: { id: rawId, userId: DEMO_USER_ID } },
        });

        return { ok: true, deletedTaskId: rawId };
      }

      // 2) Otherwise treat as title/query (fallback: if model put title into "id")
      const q = query || rawId;
      if (!q) return { ok: false, error: "missing_query" };

      const tasks = await prisma.task.findMany({
        where: {
          userId: DEMO_USER_ID,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const resolution = resolveSingleTaskOrAsk(tasks);

      if (resolution.type === "not_found") {
        return { ok: false, error: "not_found", query: q };
      }

      if (resolution.type === "ambiguous") {
        return { ok: false, error: "ambiguous", query: q, choices: resolution.choices };
      }

      const id = resolution.tasks.id;

      await prisma.task.delete({
        where: { id_userId: { id, userId: DEMO_USER_ID } },
      });

      return { ok: true, deletedTaskId: id };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Safely parse JSON arguments, defaulting to empty object.
const safeParseArgs = (raw: unknown) => {
  if (typeof raw !== "string") return raw ?? {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// POST /api/ai/chat - Chat with the AI, using tools to interact with the database.
export const POST = async (req: NextRequest) => {
  await ensureDemoUser();

  const body = await req.json();
  const userMessage = typeof body?.message === "string" ? body.message : "";

  if (!userMessage) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

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

  const MAX_TURNS = 6;
  let response: any = null;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    response = await openai.responses.create({
      model: "gpt-4o-mini",
      tools,
      input,
      instructions:
        "Return a brief confirmation of what happened. Do not ask questions.",
    });

    const outputs: any[] = response.output ?? [];
    let didCallTool = false;

    // Append ONLY function_call items (so outputs can be matched), then append outputs.
    for (const item of outputs) {
      if (item?.type === "function_call") {
        didCallTool = true;

        // ✅ IMPORTANT: include the function_call in the next request input
        input.push(item);

        const args = safeParseArgs(item.arguments);
        const result = await runTool(item.name, args);

        // ✅ Matching output
        input.push({
          type: "function_call_output",
          call_id: item.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    // If no tools were called this turn, we’re done; return the text.
    if (!didCallTool) break;
  }

  return NextResponse.json({
    text: response?.output_text || "",
  });
}