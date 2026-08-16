import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ivory/10 bg-ivory p-8">
        <h1 className="font-display text-center text-2xl text-charcoal">Veora Admin</h1>
        <p className="mt-1 text-center text-sm text-charcoal/55">Sign in to manage the studio.</p>
        <div className="mt-8">
          <LoginForm redirectTo="/admin" />
        </div>
      </div>
    </div>
  );
}
