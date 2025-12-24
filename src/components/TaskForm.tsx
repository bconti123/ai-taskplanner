"use client";

import { FormEvent, useState } from "react";

type Props = {
  onCreate: (input: {
    title: string;
    description?: string;
    priority?: number;
    dueDate?: string;
  }) => Promise<void>;
  disabled?: boolean;
};

const TaskForm = ({ onCreate, disabled }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
    });

    setTitle("");
    setDescription("");
    setPriority(0);
    setDueDate("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/70 p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-slate-200">Add a new task</h2>

      <div className="space-y-1">
        <label className="block text-xs text-slate-400">Title</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          placeholder="Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs text-slate-400">Description</label>
        <textarea
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          placeholder="Details, acceptance criteria, notes…"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Priority</label>
          <input
            type="number"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-slate-400">Due date</label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}

export default TaskForm;