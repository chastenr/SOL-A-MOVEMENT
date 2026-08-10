import { NextResponse } from "next/server";
import { requireUserApi, AuthError } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";
import { isUuid } from "@/lib/utils";
import { isHeic, convertHeicToJpeg } from "@/lib/heic";

// Vercel serverless functions cap request bodies well under 4.5MB — stay
// comfortably below that rather than an arbitrary "8MB is fine" guess.
const MAX_BYTES = 4 * 1024 * 1024;

function sniffMimeType(bytes: Uint8Array): "image/jpeg" | "image/png" | "application/pdf" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  return null;
}

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUserApi();
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }

  const { id: purchaseId } = await params;
  if (!isUuid(purchaseId)) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  const rateLimitKey = `${getClientKey(request, "receipt-upload")}:${user.id}`;
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return NextResponse.json({ message: "Too many uploads. Please try again in a few minutes." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Please choose a file to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "File is too large. Please upload a file under 4MB." }, { status: 413 });
  }

  let bytes = new Uint8Array(await file.arrayBuffer());
  // Never trust the client-supplied Content-Type — only the file's own magic bytes.
  let sniffed = sniffMimeType(bytes);

  // A phone screenshot/photo of a receipt saved or shared with a ".jpg"/
  // ".png" name is very often still actually HEIC underneath — convert
  // rather than reject, since asking a customer mid-checkout to go find a
  // JPEG-export option is real friction for something this common.
  if (!sniffed && isHeic(bytes)) {
    try {
      bytes = await convertHeicToJpeg(bytes);
      sniffed = "image/jpeg";
    } catch {
      return NextResponse.json(
        { message: "That photo couldn't be converted. Please try a different one, or export it as a JPEG first." },
        { status: 400 }
      );
    }
  }

  if (!sniffed) {
    return NextResponse.json(
      { message: "Unsupported file type. Please upload a JPEG, PNG or PDF." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .select("id, user_id")
    .eq("id", purchaseId)
    .single();

  if (purchaseError || !purchase || purchase.user_id !== user.id) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  const path = `${user.id}/${purchaseId}/${crypto.randomUUID()}.${EXTENSION[sniffed]}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(path, bytes, { contentType: sniffed });
  if (uploadError) {
    return NextResponse.json({ message: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("payment_receipts").insert({
    purchase_id: purchaseId,
    user_id: user.id,
    storage_path: path,
    file_name: file.name.slice(0, 200),
    mime_type: sniffed,
    file_size_bytes: bytes.byteLength,
  });
  if (insertError) {
    return NextResponse.json({ message: "Something went wrong saving your receipt." }, { status: 500 });
  }

  // Denormalized pointer to the latest receipt for quick admin-list display
  // — holds the private Storage PATH, never a public URL (the bucket has no
  // public access; admins view it via a short-lived signed URL).
  //
  // Checked for both an error AND a matching row (not just fire-and-forget):
  // an RLS policy that rejects this update fails silently — zero rows
  // updated, no error — which is exactly the bug that shipped here once
  // already (see migration 0015). The file is already durably in Storage
  // and payment_receipts by this point, so this failing doesn't lose the
  // upload — but the customer must be told "I Have Paid" won't work yet
  // rather than seeing a false "Uploaded".
  const { data: updated, error: updateError } = await supabase
    .from("purchases")
    .update({ receipt_url: path })
    .eq("id", purchaseId)
    .eq("user_id", user.id)
    .select("id");

  if (updateError || !updated || updated.length === 0) {
    return NextResponse.json(
      { message: "Your file was saved, but couldn't be attached to this order. Please contact us with your reference number." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
