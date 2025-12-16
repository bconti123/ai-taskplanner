"use client";

import { useEffect, useMemo, useState } from "react";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

const TaskDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [q, setQ] = useState("");

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function createTask(input: {
    title: string;
    description?: string;
    priority?: number;
    dueDate?: string;
  }) {
    try {
      setError(null);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task.");
      }

      const data = await res.json();
      setTasks((prev) => [data.task, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    }
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const prev = tasks;

    // Optimistic update
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setBusyId(id);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task.");
      }

      const data = await res.json();
      setTasks((t) => t.map((x) => (x.id === id ? data.task : x)));
    } catch (err: any) {
      console.error(err);
      setTasks(prev); // rollback
      setError(err.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(id: string) {
    const prev = tasks;

    // Optimistic remove
    setTasks((t) => t.filter((x) => x.id !== id));
    setBusyId(id);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete task.");
      }
    } catch (err: any) {
      console.error(err);
      setTasks(prev); // rollback
      setError(err.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesStatus = statusFilter === "ALL" ? true : t.status === statusFilter;
      const matchesQ =
        !query ||
        t.title.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query) ?? false);
      return matchesStatus && matchesQ;
    });
  }, [tasks, statusFilter, q]);

  return (
    <section className="space-y-6">
      <TaskForm onCreate={createTask} disabled={false} />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Status</label>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Search</label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-sm sm:w-64"
            placeholder="title or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-950/60 px-3 py-2 text-sm text-red-200">{error}</div>
      )}

      {loading ? (
        <div className="rounded-md border border-slate-800 bg-slate-900 px-4 py-6 text-sm text-slate-300">
          Loading tasks…
        </div>
      ) : (
        <TaskList
          tasks={filtered}
          busyId={busyId}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </section>
  );
}

export default TaskDashboard;