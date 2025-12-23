export type TaskChoice = {
  id: string;
  title: string;
  status: "ACTIVE" | "COMPLETED" | string;
};

export type AiOutcome =
  | { kind: "resolved"; task: TaskChoice; message?: string }
  | { kind: "ambiguous"; choices: TaskChoice[]; message?: string }
  | { kind: "not_found"; message?: string }
  | { kind: "error"; message: string; retryable?: boolean };
