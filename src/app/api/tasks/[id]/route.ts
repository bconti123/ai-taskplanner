import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID, ensureDemoUser } from "@/lib/demoUser";
import { TaskStatus } from "@/generated/enums"; // adjust if your enum import differs

type Ctx = { params: Promise<{ id: string }> | { id: string } };

export const getId = async (ctx: Ctx) => {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

export const PATCH = async (req: NextRequest, ctx: Ctx) => {
  await ensureDemoUser();
  const id = await getId(ctx);

  const body = await req.json();
  const { title, description, priority, dueDate, status } = body ?? {};

  const existing = await prisma.task.findUnique({
    where: { id_userId: { id, userId: DEMO_USER_ID } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const normalizedStatus = typeof status === "string" ? status.toUpperCase() : null;

  const updated = await prisma.task.update({
    where: { id_userId: { id, userId: DEMO_USER_ID } },
    data: {
      title: typeof title === "string" ? title.trim() : existing.title,
      description:
        typeof description === "string" ? description.trim() || null : existing.description,
      priority: typeof priority === "number" ? priority : existing.priority,
      dueDate:
        typeof dueDate === "string" ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
      status:
        normalizedStatus &&
        Object.values(TaskStatus).includes(normalizedStatus as TaskStatus)
          ? (normalizedStatus as TaskStatus)
          : existing.status,
    },
  });

  return NextResponse.json({ task: updated });
}

export const DELETE = async (_req: NextRequest, ctx: Ctx) => {
  await ensureDemoUser();
  const id = await getId(ctx);

  await prisma.task.delete({
    where: { id_userId: { id, userId: DEMO_USER_ID } },
  });

  return NextResponse.json({ ok: true });
}
