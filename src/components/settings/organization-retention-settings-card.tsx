import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/query-state";
import {
  useOrganizationRetentionSettingsQuery,
  useUpdateOrganizationRetentionSettingsMutation,
} from "@/features/organization-settings/organization-settings.query";
import { getErrorMessage } from "@/lib/api-errors";
import { formatDateTime } from "@/components/repositories/repository-utils";

export function OrganizationRetentionSettingsCard({ organizationId }: { organizationId: string }) {
  const query = useOrganizationRetentionSettingsQuery(organizationId, Boolean(organizationId));
  const mutation = useUpdateOrganizationRetentionSettingsMutation();
  const [draftDays, setDraftDays] = useState<number | null>(null);

  useEffect(() => {
    if (query.data) {
      setDraftDays(query.data.data.analyticsRawRetentionDays);
    }
  }, [query.data]);

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Data retention</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          How many days of raw analytics data to keep for this organization.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Not enforced yet: the backend still purges data on a single global schedule shared by all organizations. This
        value is saved for the backend team to build enforcement against later — changing it does not delete or
        preserve any data right now.
      </div>

      {query.isError ? (
        <ErrorState
          title="Could not load retention settings"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {mutation.isError ? (
        <ErrorState title="Could not save retention settings" message={getErrorMessage(mutation.error)} />
      ) : null}

      {draftDays !== null ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Raw analytics retention (days)</span>
            <Input
              type="number"
              min={1}
              value={draftDays}
              onChange={(event) => setDraftDays(event.target.valueAsNumber)}
            />
          </label>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() =>
              draftDays !== null &&
              mutation.mutate({ organizationId, analyticsRawRetentionDays: draftDays })
            }
          >
            {mutation.isPending ? "Saving..." : "Save retention settings"}
          </Button>
          {query.data?.data.updatedAt ? (
            <span className="text-xs text-muted-foreground">
              Last updated {formatDateTime(query.data.data.updatedAt)}
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
