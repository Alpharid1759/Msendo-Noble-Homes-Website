// src/lib/form-state.ts
export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

export const initialFormState: FormState = { status: "idle" };
