import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/demoUser";

// GET /api/tasks - Retrieve all tasks for the demo user
export const GET = async () => {
  await ensureDemoUser();

  const tasks = await prisma.task.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}
// POST /api/tasks - Create a new task for the demo user
export const POST = async (req: NextRequest) => {
  await ensureDemoUser();

  const body = await req.json();
  const { title, description, priority, dueDate } = body ?? {};

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      priority: typeof priority === "number" ? priority : 0,
      dueDate: typeof dueDate === "string" && dueDate ? new Date(dueDate) : null,
      status: "PENDING",
      userId: DEMO_USER_ID,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}