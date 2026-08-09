import type { Metadata } from "next";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { getAdminUsers, type AdminUserRole } from "@/lib/admin/users";
import { fieldInputClasses } from "@/components/ui/Field";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { InviteStaffForm } from "@/components/admin/InviteStaffForm";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

const ROLE_OPTIONS: { value: AdminUserRole | ""; label: string }[] = [
  { value: "", label: "All Roles" },
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_BADGE: Record<AdminUserRole, string> = {
  customer: "bg-charcoal/10 text-charcoal/50",
  admin: "bg-clay/10 text-clay",
  super_admin: "bg-charcoal text-ivory",
};

type SearchParams = { search?: string; role?: AdminUserRole };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  if (admin.role !== "super_admin") {
    return (
      <div>
        <h1 className="font-display text-2xl text-charcoal">Users</h1>
        <p className="mt-4 max-w-md text-charcoal/60">
          Only super admins can view or manage account roles. If you need access, ask an existing super admin
          to promote your account from this page.
        </p>
      </div>
    );
  }

  const users = await getAdminUsers({ search: params.search, role: params.role });

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Users</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Every account in the system. Changing a role takes effect immediately and is written to the audit log.
      </p>

      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-ivory p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Invite Staff</p>
        {isSupabaseConfigured ? (
          <div className="mt-4">
            <InviteStaffForm />
          </div>
        ) : (
          <p className="mt-2 text-sm text-charcoal/60">
            Not available yet — this needs <code className="text-charcoal">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            configured. Until then, ask staff to sign up at <code className="text-charcoal">/signup</code> and set
            their role in the table below.
          </p>
        )}
      </div>

      <form method="GET" className="mt-8 flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Search name or email"
          className={`${fieldInputClasses} max-w-xs`}
        />
        <select name="role" defaultValue={params.role ?? ""} className={`${fieldInputClasses} w-auto appearance-none`}>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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

      {users.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No accounts match these filters yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-charcoal">
                    {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : "—"}
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{user.email}</td>
                  <td className="px-4 py-3 text-charcoal/70">{format(new Date(user.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.06em] ${ROLE_BADGE[user.role]}`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={user.id} currentRole={user.role} disabled={user.id === admin.id} />
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
