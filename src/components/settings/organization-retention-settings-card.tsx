import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/query-state";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import {
  SuccessModal,
  type SuccessModalState,
} from "@/components/shared/success-modal";
import {
  useOrganizationRetentionSettingsQuery,
  useUpdateOrganizationRetentionSettingsMutation,
} from "@/features/organization-settings/organization-settings.query";
import { getErrorMessage } from "@/lib/api-errors";

export function OrganizationRetentionSettingsCard({
  organizationId,
}: {
  organizationId: string;
}) {
  const query = useOrganizationRetentionSettingsQuery(
    organizationId,
    Boolean(organizationId),
  );
  const mutation = useUpdateOrganizationRetentionSettingsMutation();
  const [draftDays, setDraftDays] = useState<number | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalState>(null);

  useEffect(() => {
    if (query.data) {
      setDraftDays(query.data.data.analyticsRawRetentionDays);
    }
  }, [query.data]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Data retention</h2>
        <InfoTooltip
          content={
            "How many days to keep this organization's raw per-PR/commit/deployment data (used by Dashboard charts) before it's deleted for good. Pull Requests and Insights data is unaffected and never expires. If dashboard history goes missing, run \"Start full sync\" (not incremental) on the repository from the Sync tab to pull it back in."
          }
        />
      </div>

      {query.isError ? (
        <ErrorState
          title="Could not load retention settings"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {mutation.isError ? (
        <ErrorState
          title="Could not save retention settings"
          message={getErrorMessage(mutation.error)}
        />
      ) : null}

      {draftDays !== null ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Raw analytics retention (days)
            </span>
            <Input
              type="number"
              min={1}
              value={draftDays}
              onChange={(event) => setDraftDays(event.target.valueAsNumber)}
            />
          </label>
          <Button
            type="button"
            aria-label="Save retention settings"
            disabled={mutation.isPending}
            onClick={() =>
              draftDays !== null &&
              mutation.mutate(
                { organizationId, analyticsRawRetentionDays: draftDays },
                {
                  onSuccess: () =>
                    setSuccessModal({
                      title: "Retention settings saved",
                      message: `Raw analytics will be kept for ${draftDays} days.`,
                    }),
                },
              )
            }
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : null}
      <SuccessModal
        state={successModal}
        onOpenChange={(open) => !open && setSuccessModal(null)}
      />
    </Card>
  );
}
