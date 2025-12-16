import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/demoUser";
import { TaskStatus } from "@/generated/enums";

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

// UPDATE /api/tasks/:id - Update a task by ID
export const PUT = async (req: NextRequest, { params }: { params: { id: string } }) => {
  await ensureDemoUser();

  const body = await req.json();
  const { title, description, priority, dueDate, status } = body ?? {};

  const existing = await prisma.task.findUnique({
    where: { id: params.id, userId: DEMO_USER_ID },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: typeof title === "string" ? title.trim() : existing.title,
      description: typeof description === "string" ? description.trim() || null : existing.description,
      priority: typeof priority === "number" ? priority : existing.priority,
      dueDate: typeof dueDate === "string" && dueDate ? new Date(dueDate) : existing.dueDate,
      status:
      typeof status === "string" && Object.values(TaskStatus).includes(status as TaskStatus)
        ? (status as TaskStatus)
        : existing.status,
    },
  });

  return NextResponse.json({ task: updated });
}

// DELETE /api/tasks/:id - Delete a task by ID
export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  await ensureDemoUser();

  const existing = await prisma.task.findUnique({
    where: { id: params.id, userId: DEMO_USER_ID },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Task deleted" });
}