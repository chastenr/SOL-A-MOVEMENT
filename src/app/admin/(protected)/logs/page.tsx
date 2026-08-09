import type { Metadata } from "next";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAuditLogs, getAuditLogActions } from "@/lib/admin/audit-logs";
import { fieldInputClasses } from "@/components/ui/Field";

export const metadata: Metadata = {
  title: "Activity Log",
  robots: { index: false, follow: false },
};

type SearchParams = { search?: string; action?: string };

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  if (admin.role !== "super_admin") {
    return (
      <div>
        <h1 className="font-display text-2xl text-charcoal">Activity Log</h1>
        <p className="mt-4 max-w-md text-charcoal/60">
          Only super admins can view the activity log.
        </p>
      </div>
    );
  }

  const [logs, actions] = await Promise.all([
    getAuditLogs({ search: params.search, action: params.action }),
    getAuditLogActions(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Activity Log</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Every sensitive action taken by staff — role changes, payment approvals, booking cancellations and more.
        Most recent 200 events.
      </p>

      <form method="GET" className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Search by staff email or action"
          className={`${fieldInputClasses} max-w-xs`}
        />
        <select name="action" defaultValue={params.action ?? ""} className={`${fieldInputClasses} w-auto appearance-none`}>
          <option value="">All Actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-charcoal px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ivory"
        >
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No activity matches these filters yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-charcoal/5 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">
                    {format(new Date(log.createdAt), "MMM d, yyyy · h:mm a")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-charcoal">{log.actorEmail}</p>
                    {log.actorRole && (
                      <p className="text-xs uppercase tracking-[0.06em] text-charcoal/40">
                        {log.actorRole.replace("_", " ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-charcoal">{log.action}</td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {log.entityType}
                    {log.entityId && <p className="text-xs text-charcoal/40">{log.entityId}</p>}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    {Object.keys(log.metadata).length > 0 && (
                      <code
                        className="block truncate text-xs text-charcoal/50"
                        title={JSON.stringify(log.metadata, null, 2)}
                      >
                        {JSON.stringify(log.metadata)}
                      </code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
