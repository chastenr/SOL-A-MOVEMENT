import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminMembershipPayment = {
  id: string;
  purchaseId: string | null;
  amountCentavos: number;
  dueDate: string;
  status: string;
  paymentReference: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
};

export type AdminMembership = {
  id: string;
  customer: { id: string; name: string; email: string };
  membershipName: string;
  startsAt: string;
  commitmentEndsAt: string;
  monthlyFeeCentavos: number;
  status: string;
  paymentStatus: string;
  lastPaymentAt: string | null;
  nextPaymentDue: string | null;
  actionNeeded: string | null;
  payments: AdminMembershipPayment[];
};

type MembershipRow = {
  id: string;
  user_id: string;
  membership_name_snapshot: string;
  starts_at: string;
  commitment_ends_at: string;
  monthly_fee_centavos: number;
  status: string;
  payment_status: string;
  last_payment_at: string | null;
  next_payment_due: string | null;
};

export async function getAdminMemberships(): Promise<AdminMembership[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customer_memberships")
    .select("id, user_id, membership_name_snapshot, starts_at, commitment_ends_at, monthly_fee_centavos, status, payment_status, last_payment_at, next_payment_due")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error || !data) {
    if (error) console.error("[getAdminMemberships] membership query failed", error);
    return [];
  }

  const rows = data as MembershipRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const membershipIds = rows.map((row) => row.id);
  const [{ data: profiles }, { data: payments }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds)
      : Promise.resolve({ data: [] }),
    membershipIds.length
      ? supabase
          .from("membership_payments")
          .select("id, membership_id, purchase_id, amount_centavos, due_date, status, payment_reference, reviewed_at, admin_notes")
          .in("membership_id", membershipIds)
          .order("due_date", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const paymentsByMembership = new Map<string, AdminMembershipPayment[]>();
  for (const payment of payments ?? []) {
    const current = paymentsByMembership.get(payment.membership_id) ?? [];
    current.push({
      id: payment.id,
      purchaseId: payment.purchase_id,
      amountCentavos: payment.amount_centavos,
      dueDate: payment.due_date,
      status: payment.status,
      paymentReference: payment.payment_reference,
      reviewedAt: payment.reviewed_at,
      adminNotes: payment.admin_notes,
    });
    paymentsByMembership.set(payment.membership_id, current);
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    const due = row.next_payment_due && row.next_payment_due <= today;
    const actionNeeded = row.payment_status === "failed"
      ? "Payment failed"
      : row.status === "past_due" || (due && row.next_payment_due! < today)
        ? "Payment past due"
        : due
          ? "Membership payment due"
        : row.status === "suspended"
          ? "Membership requires review"
          : row.payment_status === "pending_verification"
            ? "Review payment proof"
            : null;

    return {
      id: row.id,
      customer: {
        id: row.user_id,
        name: profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email : "—",
        email: profile?.email ?? "—",
      },
      membershipName: row.membership_name_snapshot,
      startsAt: row.starts_at,
      commitmentEndsAt: row.commitment_ends_at,
      monthlyFeeCentavos: row.monthly_fee_centavos,
      status: row.status,
      paymentStatus: row.payment_status,
      lastPaymentAt: row.last_payment_at,
      nextPaymentDue: row.next_payment_due,
      actionNeeded,
      payments: paymentsByMembership.get(row.id) ?? [],
    };
  });
}
