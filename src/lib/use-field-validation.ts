import { z } from "zod";

function hasValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
}

export function useFieldValidation<Values extends Record<string, unknown>>(
  schema: z.ZodType<unknown, Values>,
  values: Values,
) {
  const result = schema.safeParse(values);
  const errors: Record<string, string> = {};

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) {
        errors[key] = issue.message;
      }
    }
  }

  function fieldError(field: keyof Values & string): string | undefined {
    return hasValue(values[field]) ? errors[field] : undefined;
  }

  return { isValid: result.success, errors, fieldError };
}
