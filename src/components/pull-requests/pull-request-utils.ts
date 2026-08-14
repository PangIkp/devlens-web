import type { PullRequestRiskIndicator } from "@/features/pull-requests/pull-requests.schemas";

export function getPullRequestTone(state: string) {
  if (state === "merged") {
    return "success" as const;
  }

  if (state === "closed") {
    return "danger" as const;
  }

  return "info" as const;
}

export function getRiskTone(level: PullRequestRiskIndicator["level"]) {
  if (level === "high") {
    return "danger" as const;
  }

  if (level === "medium") {
    return "warning" as const;
  }

  return "success" as const;
}

export function getReviewStateTone(state: string) {
  switch (state.toUpperCase()) {
    case "APPROVED":
      return "success" as const;
    case "CHANGES_REQUESTED":
      return "danger" as const;
    case "COMMENTED":
      return "info" as const;
    case "PENDING":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}
