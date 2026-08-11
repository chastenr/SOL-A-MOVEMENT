import { redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/auth/require-role";

/**
 * Compatibility destination for every public "Book" CTA. There is no guest
 * booking form: members continue to the real credit-backed schedule, while
 * signed-out visitors must authenticate first.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; class?: string }>;
}) {
  const user = await getAuthedUser();
  const params = await searchParams;
  const bookingParams = new URLSearchParams();
  if (params.service) bookingParams.set("service", params.service);
  if (params.class) bookingParams.set("class", params.class);

  const query = bookingParams.toString();
  const destination = `/account/book${query ? `?${query}` : ""}`;
  redirect(user ? destination : `/login?redirectTo=${encodeURIComponent(destination)}`);
}
