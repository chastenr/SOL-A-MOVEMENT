import { redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/auth/require-role";

/**
 * Compatibility destination for every public "Book" CTA. There is no guest
 * booking form: members continue to the real credit-backed schedule, while
 * signed-out visitors must authenticate first.
 */
export default async function BookPage() {
  const user = await getAuthedUser();
  redirect(user ? "/account/book" : "/login?redirectTo=%2Faccount%2Fbook");
}
