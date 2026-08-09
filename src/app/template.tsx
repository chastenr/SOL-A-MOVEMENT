import { PageTransition } from "@/components/layout/PageTransition";

// A template (unlike layout.tsx) remounts on every navigation, which is
// what gives each route change something to animate between — see
// PageTransition.tsx for why this uses the platform View Transitions API
// instead of a JS-driven animation library.
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
