import type { paths } from "@/api/generated/schema";
import { meResponseSchema } from "@/features/users/users.schemas";
import { apiRequest } from "@/lib/api-client";

type MeResponse = paths["/me"]["get"]["responses"][200]["content"]["application/json"];

export async function getMe(userId: string) {
  const response = await apiRequest<MeResponse>(
    "/me",
    {
      method: "GET",
    },
    { userId },
  );

  return meResponseSchema.parse(response);
}
