import { requireAdmin } from "@/lib/auth/require-role";
import { logoutAction } from "@/lib/auth/actions";

// Every page under this group calls requireAdmin() here — Server Component
// pages re-execute per navigation even under a shared layout, but this is
// still the first, cheap layer; every admin page/action re-checks itself too
// (defense in depth — see src/lib/auth/require-role.ts).
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-cream/40">
      <header className="flex items-center justify-between border-b border-charcoal/10 bg-ivory px-6 py-4 sm:px-8">
        <p className="font-display text-lg text-charcoal">Veora Admin</p>
        <div className="flex items-center gap-4 text-sm text-charcoal/60">
          <span>
            {admin.email} · <span className="uppercase tracking-[0.08em]">{admin.role}</span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="underline underline-offset-2 hover:text-charcoal">
              Log Out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">{children}</main>
    </div>
  );
}
