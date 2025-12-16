"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "./TaskDashboard";

type Props = {
  tasks: Task[];
  busyId: string | null;
  onUpdate: (id: string, patch: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

const TaskList = ({ tasks, busyId, onUpdate, onDelete }: Props) =>  {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftPriority, setDraftPriority] = useState(0);
  const [draftDue, setDraftDue] = useState("");

  function startEdit(t: Task) {
    setEditingId(t.id);
    setDraftTitle(t.title);
    setDraftDesc(t.description ?? "");
    setDraftPriority(t.priority ?? 0);
    setDraftDue(t.dueDate ? t.dueDate.slice(0, 10) : "");
  }

  async function saveEdit(id: string) {
    await onUpdate(id, {
      title: draftTitle.trim(),
      description: draftDesc.trim() || null,
      priority: Number(draftPriority) || 0,
      dueDate: draftDue || null,
    } as any);
    setEditingId(null);
  }

  if (!tasks.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 px-4 py-10 text-center text-sm text-slate-400">
        No tasks match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
        const isBusy = busyId === task.id;
        const isEditing = editingId === task.id;

        return (
          <article
            key={task.id}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm shadow-sm"
          >
            <header className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    disabled={isBusy}
                  />
                ) : (
                  <h3 className="font-semibold text-slate-100">{task.title}</h3>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={task.status}
                  onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
                  disabled={isBusy || isEditing}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                </select>

                {!isEditing ? (
                  <button
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
                    onClick={() => startEdit(task)}
                    disabled={isBusy}
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      className="rounded-md bg-sky-600 px-3 py-1 text-xs text-white hover:bg-sky-500 disabled:opacity-60"
                      onClick={() => saveEdit(task.id)}
                      disabled={isBusy || !draftTitle.trim()}
                    >
                      Save
                    </button>
                    <button
                      className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <button
                  className="rounded-md border border-red-800 bg-red-950/50 px-3 py-1 text-xs text-red-200 hover:bg-red-950 disabled:opacity-60"
                  onClick={() => onDelete(task.id)}
                  disabled={isBusy}
                >
                  Delete
                </button>
              </div>
            </header>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  rows={3}
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  disabled={isBusy}
                  placeholder="Description…"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-400">Priority</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      value={draftPriority}
                      onChange={(e) => setDraftPriority(Number(e.target.value) || 0)}
                      disabled={isBusy}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Due date</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      value={draftDue}
                      onChange={(e) => setDraftDue(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {task.description && (
                  <p className="mb-2 text-xs text-slate-300">{task.description}</p>
                )}

                <footer className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                    {statusLabels[task.status]}
                  </span>
                  <span>Priority: {task.priority}</span>
                  {due && <span>Due: {due}</span>}
                </footer>
              </>
            )}

            {isBusy && (
              <div className="mt-2 text-[11px] text-slate-400">Saving…</div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default TaskList;