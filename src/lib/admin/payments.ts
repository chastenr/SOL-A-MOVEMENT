import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminPurchaseStatus =
  | "pending_payment"
  | "proof_submitted"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type AdminPurchaseRow = {
  id: string;
  referenceNumber: string;
  customer: { id: string; name: string; email: string };
  packageName: string;
  amountCentavos: number;
  method: string;
  provider: string;
  status: AdminPurchaseStatus;
  hasReceipt: boolean;
  createdAt: string;
  approvedAt: string | null;
};

type PurchaseListRow = {
  id: string;
  reference_number: string;
  user_id: string;
  package_name_snapshot: string;
  total_amount_centavos: number;
  payment_method: string;
  payment_provider: string;
  purchase_status: AdminPurchaseStatus;
  receipt_url: string | null;
  created_at: string;
  approved_at: string | null;
};

type ProfileRow = { id: string; first_name: string; last_name: string; email: string; mobile_number: string };

export async function getAdminPurchases(status?: AdminPurchaseStatus): Promise<AdminPurchaseRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("purchases")
    .select(
      "id, reference_number, user_id, package_name_snapshot, total_amount_centavos, payment_method, payment_provider, purchase_status, receipt_url, created_at, approved_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("purchase_status", status);

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = data as PurchaseListRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profileRows } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, email, mobile_number").in("id", userIds)
    : { data: [] as ProfileRow[] };
  const profileById = new Map((profileRows ?? []).map((profile) => [profile.id, profile as ProfileRow]));

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      id: row.id,
      referenceNumber: row.reference_number,
      customer: {
        id: row.user_id,
        name: profile ? `${profile.first_name} ${profile.last_name}`.trim() || "—" : "—",
        email: profile?.email ?? "—",
      },
      packageName: row.package_name_snapshot,
      amountCentavos: row.total_amount_centavos,
      method: row.payment_method,
      provider: row.payment_provider,
      status: row.purchase_status,
      hasReceipt: Boolean(row.receipt_url),
      createdAt: row.created_at,
      approvedAt: row.approved_at,
    };
  });
}

export type AdminPurchaseDetail = AdminPurchaseRow & {
  customerPhone: string;
  rejectedReason: string | null;
  receiptSignedUrl: string | null;
  receiptMimeType: string | null;
};

export async function getAdminPurchaseDetail(id: string): Promise<AdminPurchaseDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(
      "id, reference_number, user_id, package_name_snapshot, total_amount_centavos, payment_method, payment_provider, purchase_status, receipt_url, created_at, approved_at, rejected_reason"
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const row = data as PurchaseListRow & { rejected_reason: string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, mobile_number")
    .eq("id", row.user_id)
    .single();

  const { data: latestReceipt } = await supabase
    .from("payment_receipts")
    .select("storage_path, mime_type")
    .eq("purchase_id", id)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let receiptSignedUrl: string | null = null;
  if (latestReceipt?.storage_path) {
    const { data: signed } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(latestReceipt.storage_path, 300);
    receiptSignedUrl = signed?.signedUrl ?? null;
  }

  return {
    id: row.id,
    referenceNumber: row.reference_number,
    customer: {
      id: row.user_id,
      name: profile ? `${profile.first_name} ${profile.last_name}`.trim() || "—" : "—",
      email: profile?.email ?? "—",
    },
    customerPhone: profile?.mobile_number ?? "—",
    packageName: row.package_name_snapshot,
    amountCentavos: row.total_amount_centavos,
    method: row.payment_method,
    provider: row.payment_provider,
    status: row.purchase_status,
    hasReceipt: Boolean(row.receipt_url),
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    rejectedReason: row.rejected_reason,
    receiptSignedUrl,
    receiptMimeType: latestReceipt?.mime_type ?? null,
  };
}
