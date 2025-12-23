import type { AiOutcome, TaskChoice } from "./types";

export const resolveSingleTaskOrAsk = (tasks: TaskChoice[]): AiOutcome => {
  if (!tasks || tasks.length === 0) {
    return { kind: "not_found", message: "I couldn’t find a matching task." };
  }

  if (tasks.length === 1) {
    return { kind: "resolved", task: tasks[0] };
  }

  return {
    kind: "ambiguous",
    message: "I found multiple matching tasks. Which one do you mean?",
    choices: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
  };
}
