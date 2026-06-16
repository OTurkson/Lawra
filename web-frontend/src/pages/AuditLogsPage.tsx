import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { exportAuditLogsCsv, exportAuditLogsPdf, fetchAuditLogs, type AuditLogPage, type AuditLogSummary } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";

const ACTION_OPTIONS = [
  "USER_CREATE",
  "USER_PROVISION",
  "USER_INVITE",
  "USER_UPDATE",
  "USER_BALANCE_TOP_UP",
  "USER_DELETE",
  "TENANT_CREATE",
  "TENANT_UPDATE",
  "TENANT_DELETE",
  "VIRTUAL_BANK_CREATE",
  "VIRTUAL_BANK_UPDATE",
  "VIRTUAL_BANK_TOP_UP",
  "VIRTUAL_BANK_DELETE",
  "LOAN_PACKAGE_CREATE",
  "LOAN_PACKAGE_UPDATE",
  "LOAN_PACKAGE_DELETE",
  "LOAN_CREATE",
  "LOAN_STATUS_UPDATE",
  "AUTH_LOGIN",
  "PASSWORD_RESET_REQUEST",
  "PASSWORD_RESET_COMPLETE",
];

const RESOURCE_TYPE_OPTIONS = ["USER", "TENANT", "VIRTUAL_BANK", "LOAN_PACKAGE", "LOAN", "AUTH"];

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function toIsoOrUndefined(value: string) {
  if (!value) return undefined;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

const AuditLogsPage = () => {
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const isTenantAdmin = user?.role === "PAYMASTER" || user?.role === "ADMIN";

  const [page, setPage] = useState(0);
  const [size] = useState(25);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [action, setAction] = useState<string>("");
  const [resourceType, setResourceType] = useState<string>("");
  const [resourceId, setResourceId] = useState<string>("");

  const filters = useMemo(
    () => ({
      fromIso: toIsoOrUndefined(from),
      toIso: toIsoOrUndefined(to),
      actorEmail: actorEmail.trim() || undefined,
      action: action.trim() || undefined,
      resourceType: resourceType.trim() || undefined,
      resourceId: resourceId.trim() || undefined,
    }),
    [from, to, actorEmail, action, resourceType, resourceId]
  );

  const query = useQuery<AuditLogPage>({
    queryKey: ["audit-logs", page, size, filters],
    enabled: isTenantAdmin,
    queryFn: async () => {
      return fetchAuditLogs({
        page,
        size,
        from: filters.fromIso,
        to: filters.toIso,
        actorEmail: filters.actorEmail,
        action: filters.action,
        resourceType: filters.resourceType,
        resourceId: filters.resourceId,
      });
    },
  });

  const rows = query.data?.content ?? [];

  const [exporting, setExporting] = useState<null | "csv" | "pdf">(null);

  if (!isTenantAdmin) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-3">
        <h2 className="text-lg font-light text-foreground">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">This section is available to paymaster and admin accounts only.</p>
      </div>
    );
  }

  const totalPages = query.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-light text-foreground">Audit Logs</h2>
          <p className="text-xs text-muted-foreground mt-1">Logs retained for 1 year. Export from this page for audit purposes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">From</label>
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-2 rounded-full border border-primary/20 bg-card text-foreground" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">To</label>
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-2 rounded-full border border-primary/20 bg-card text-foreground" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Actor email</label>
            <input value={actorEmail} onChange={(e) => setActorEmail(e.target.value)} placeholder="email@tenant.com" className="w-full px-4 py-2 rounded-full border border-primary/20 bg-card text-foreground" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Resource ID</label>
            <input value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="(optional)" className="w-full px-4 py-2 rounded-full border border-primary/20 bg-card text-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full px-4 py-2 rounded-full border border-primary/20 bg-card text-foreground">
              <option value="">All</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Resource type</label>
            <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full px-4 py-2 rounded-full border border-primary/20 bg-card text-foreground">
              <option value="">All</option>
              {RESOURCE_TYPE_OPTIONS.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end gap-3">
            <button
              className="px-6 py-2 rounded-full border border-border text-foreground text-sm font-semibold hover:bg-muted/30 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={exporting !== null}
              onClick={async () => {
                try {
                  setExporting("csv");
                  await exportAuditLogsCsv({
                    from: filters.fromIso,
                    to: filters.toIso,
                    actorEmail: filters.actorEmail,
                    action: filters.action,
                    resourceType: filters.resourceType,
                    resourceId: filters.resourceId,
                    maxRows: 50000,
                  });
                } catch (e: any) {
                  toast({ title: "CSV export failed", description: e?.message ?? "Unable to export." });
                } finally {
                  setExporting(null);
                }
              }}
            >
              {exporting === "csv" ? <Spinner size="sm" /> : "Export CSV"}
            </button>

            <button
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={exporting !== null}
              onClick={async () => {
                try {
                  setExporting("pdf");
                  await exportAuditLogsPdf({
                    from: filters.fromIso,
                    to: filters.toIso,
                    actorEmail: filters.actorEmail,
                    action: filters.action,
                    resourceType: filters.resourceType,
                    resourceId: filters.resourceId,
                    maxRows: 20000,
                  });
                } catch (e: any) {
                  toast({ title: "PDF export failed", description: e?.message ?? "Unable to export." });
                } finally {
                  setExporting(null);
                }
              }}
            >
              {exporting === "pdf" ? <Spinner size="sm" /> : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 pb-2 border-b border-border">
          <h2 className="text-lg font-light text-foreground">Results</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {query.data ? `Page ${query.data.number + 1} of ${query.data.totalPages}` : "Loading..."}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-3 py-3 text-left">Time</th>
                <th className="px-3 py-3 text-left">Actor</th>
                <th className="px-3 py-3 text-left">Action</th>
                <th className="px-3 py-3 text-left">Resource</th>
                <th className="px-3 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size="sm" />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              )}

              {query.isError && !query.isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-destructive">
                    {(query.error as Error)?.message ?? "Unable to load audit logs."}
                  </td>
                </tr>
              )}

              {!query.isLoading && !query.isError && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                    No audit logs found for the selected filters.
                  </td>
                </tr>
              )}

              {!query.isLoading &&
                !query.isError &&
                rows.map((row: AuditLogSummary) => (
                  <tr key={row.id} className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(row.timestamp)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.actorEmail ?? row.actorId ?? "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.action}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.resourceType}:{row.resourceId ?? "-"}
                      <div className="text-xs opacity-70 mt-1">
                        {row.httpMethod} {row.path}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.statusCode ?? "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {query.data && query.data.totalElements > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Showing {page * size + 1}-{Math.min((page + 1) * size, query.data.totalElements)} of {query.data.totalElements}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded-md border bg-card text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Prev
              </button>
              <div className="text-sm text-muted-foreground">
                Page {page + 1} / {Math.max(1, totalPages)}
              </div>
              <button
                className="px-3 py-1 rounded-md border bg-card text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.min((totalPages ?? 1) - 1, p + 1))}
                disabled={page + 1 >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;

