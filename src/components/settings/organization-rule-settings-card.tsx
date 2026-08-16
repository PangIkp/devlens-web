import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/query-state";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import {
  SuccessModal,
  type SuccessModalState,
} from "@/components/shared/success-modal";
import {
  useOrganizationRuleSettingsQuery,
  useUpdateOrganizationRuleSettingsMutation,
} from "@/features/organization-settings/organization-settings.query";
import type { OrganizationRuleSettings } from "@/features/organization-settings/organization-settings.schemas";
import { getErrorMessage } from "@/lib/api-errors";

type Draft = Omit<OrganizationRuleSettings, "updatedAt">;

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    </label>
  );
}

function RuleSection({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 p-4">
      <label className="flex items-center justify-between gap-3">
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {enabled ? "Enabled" : "Disabled"}
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
          />
        </span>
      </label>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function OrganizationRuleSettingsCard({
  organizationId,
}: {
  organizationId: string;
}) {
  const query = useOrganizationRuleSettingsQuery(
    organizationId,
    Boolean(organizationId),
  );
  const mutation = useUpdateOrganizationRuleSettingsMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalState>(null);

  useEffect(() => {
    if (query.data) {
      const settings = query.data.data;
      setDraft({
        largePR: settings.largePR,
        slowReview: settings.slowReview,
        hotspot: settings.hotspot,
        deploymentFailure: settings.deploymentFailure,
        reviewConcentration: settings.reviewConcentration,
        bottleneck: settings.bottleneck,
        metrics: settings.metrics,
      });
    }
  }, [query.data]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Insight &amp; metric rules</h2>
        <InfoTooltip content="Adjust the thresholds used to flag issues for this organization. High-severity thresholds always use the platform default." />
      </div>

      {query.isError ? (
        <ErrorState
          title="Could not load rule settings"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {mutation.isError ? (
        <ErrorState
          title="Could not save rule settings"
          message={getErrorMessage(mutation.error)}
        />
      ) : null}

      {draft ? (
        <div className="space-y-4">
          <div className="max-h-96 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/70">
            <RuleSection
              title="Large PR detection"
              enabled={draft.largePR.enabled}
              onToggle={(enabled) =>
                setDraft({ ...draft, largePR: { ...draft.largePR, enabled } })
              }
            >
              <NumberField
                label="Files threshold"
                value={draft.largePR.filesThreshold}
                onChange={(filesThreshold) =>
                  setDraft({
                    ...draft,
                    largePR: { ...draft.largePR, filesThreshold },
                  })
                }
              />
              <NumberField
                label="Total changes threshold"
                value={draft.largePR.totalChangesThreshold}
                onChange={(totalChangesThreshold) =>
                  setDraft({
                    ...draft,
                    largePR: { ...draft.largePR, totalChangesThreshold },
                  })
                }
              />
            </RuleSection>

            <RuleSection
              title="Slow review detection"
              enabled={draft.slowReview.enabled}
              onToggle={(enabled) =>
                setDraft({
                  ...draft,
                  slowReview: { ...draft.slowReview, enabled },
                })
              }
            >
              <NumberField
                label="Wait hours threshold"
                value={draft.slowReview.waitHoursThreshold}
                onChange={(waitHoursThreshold) =>
                  setDraft({
                    ...draft,
                    slowReview: { ...draft.slowReview, waitHoursThreshold },
                  })
                }
              />
            </RuleSection>

            <RuleSection
              title="Hotspot detection"
              enabled={draft.hotspot.enabled}
              onToggle={(enabled) =>
                setDraft({ ...draft, hotspot: { ...draft.hotspot, enabled } })
              }
            >
              <NumberField
                label="Score threshold"
                value={draft.hotspot.scoreThreshold}
                onChange={(scoreThreshold) =>
                  setDraft({
                    ...draft,
                    hotspot: { ...draft.hotspot, scoreThreshold },
                  })
                }
              />
            </RuleSection>

            <RuleSection
              title="Deployment failure trend"
              enabled={draft.deploymentFailure.enabled}
              onToggle={(enabled) =>
                setDraft({
                  ...draft,
                  deploymentFailure: { ...draft.deploymentFailure, enabled },
                })
              }
            >
              <NumberField
                label="Minimum deployments"
                value={draft.deploymentFailure.minimumDeployments}
                onChange={(minimumDeployments) =>
                  setDraft({
                    ...draft,
                    deploymentFailure: {
                      ...draft.deploymentFailure,
                      minimumDeployments,
                    },
                  })
                }
              />
              <NumberField
                label="Failure rate threshold (0-1)"
                step={0.05}
                value={draft.deploymentFailure.failureRateThreshold}
                onChange={(failureRateThreshold) =>
                  setDraft({
                    ...draft,
                    deploymentFailure: {
                      ...draft.deploymentFailure,
                      failureRateThreshold,
                    },
                  })
                }
              />
            </RuleSection>

            <RuleSection
              title="Review concentration"
              enabled={draft.reviewConcentration.enabled}
              onToggle={(enabled) =>
                setDraft({
                  ...draft,
                  reviewConcentration: {
                    ...draft.reviewConcentration,
                    enabled,
                  },
                })
              }
            >
              <NumberField
                label="Minimum review count"
                value={draft.reviewConcentration.minimumReviewCount}
                onChange={(minimumReviewCount) =>
                  setDraft({
                    ...draft,
                    reviewConcentration: {
                      ...draft.reviewConcentration,
                      minimumReviewCount,
                    },
                  })
                }
              />
              <NumberField
                label="Share threshold (0-1)"
                step={0.05}
                value={draft.reviewConcentration.shareThreshold}
                onChange={(shareThreshold) =>
                  setDraft({
                    ...draft,
                    reviewConcentration: {
                      ...draft.reviewConcentration,
                      shareThreshold,
                    },
                  })
                }
              />
            </RuleSection>

            <RuleSection
              title="Bottleneck detection"
              enabled={draft.bottleneck.enabled}
              onToggle={(enabled) =>
                setDraft({
                  ...draft,
                  bottleneck: { ...draft.bottleneck, enabled },
                })
              }
            >
              <NumberField
                label="Minimum merged count"
                value={draft.bottleneck.minimumMergedCount}
                onChange={(minimumMergedCount) =>
                  setDraft({
                    ...draft,
                    bottleneck: { ...draft.bottleneck, minimumMergedCount },
                  })
                }
              />
              <NumberField
                label="Average cycle hours threshold"
                value={draft.bottleneck.averageCycleHoursThreshold}
                onChange={(averageCycleHoursThreshold) =>
                  setDraft({
                    ...draft,
                    bottleneck: {
                      ...draft.bottleneck,
                      averageCycleHoursThreshold,
                    },
                  })
                }
              />
              <NumberField
                label="Stale open count threshold"
                value={draft.bottleneck.staleOpenCountThreshold}
                onChange={(staleOpenCountThreshold) =>
                  setDraft({
                    ...draft,
                    bottleneck: {
                      ...draft.bottleneck,
                      staleOpenCountThreshold,
                    },
                  })
                }
              />
              <NumberField
                label="Stale open age days"
                value={draft.bottleneck.staleOpenAgeDays}
                onChange={(staleOpenAgeDays) =>
                  setDraft({
                    ...draft,
                    bottleneck: { ...draft.bottleneck, staleOpenAgeDays },
                  })
                }
              />
            </RuleSection>

            <div className="space-y-3 p-4">
              <p className="font-medium">Repository metrics</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Default day type
                  </span>
                  <Select
                    value={draft.metrics.defaultDayType}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        metrics: {
                          ...draft.metrics,
                          defaultDayType: value as "calendar" | "business",
                        },
                      })
                    }
                  >
                    <SelectTrigger aria-label="Default day type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calendar">Calendar day</SelectItem>
                      <SelectItem value="business">Business day</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <NumberField
                  label="Hotspot commit weight"
                  step={0.1}
                  value={draft.metrics.hotspotCommitWeight}
                  onChange={(hotspotCommitWeight) =>
                    setDraft({
                      ...draft,
                      metrics: { ...draft.metrics, hotspotCommitWeight },
                    })
                  }
                />
                <NumberField
                  label="Hotspot additions weight"
                  step={0.1}
                  value={draft.metrics.hotspotAdditionsWeight}
                  onChange={(hotspotAdditionsWeight) =>
                    setDraft({
                      ...draft,
                      metrics: { ...draft.metrics, hotspotAdditionsWeight },
                    })
                  }
                />
                <NumberField
                  label="Hotspot deletions weight"
                  step={0.1}
                  value={draft.metrics.hotspotDeletionsWeight}
                  onChange={(hotspotDeletionsWeight) =>
                    setDraft({
                      ...draft,
                      metrics: { ...draft.metrics, hotspotDeletionsWeight },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              aria-label="Save rule settings"
              disabled={mutation.isPending}
              onClick={() =>
                draft &&
                mutation.mutate(
                  { organizationId, payload: draft },
                  {
                    onSuccess: () =>
                      setSuccessModal({
                        title: "Rule settings saved",
                        message:
                          "The updated thresholds are now active for this organization.",
                      }),
                  },
                )
              }
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : null}
      <SuccessModal
        state={successModal}
        onOpenChange={(open) => !open && setSuccessModal(null)}
      />
    </Card>
  );
}
