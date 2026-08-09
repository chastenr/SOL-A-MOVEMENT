"use client";

import { ViewTransition } from "react";

// Browser-native View Transitions (React's <ViewTransition>, integrated
// with the platform View Transitions API — see
// node_modules/next/dist/docs/01-app/02-guides/view-transitions.md).
// Deliberately NOT a framer-motion AnimatePresence wrapper: that approach
// keeps both the outgoing and incoming page mounted in the DOM at once and
// drives the crossfade with JS/RAF, which is real, measurable extra work on
// every navigation — the opposite of what was asked for ("make the page
// faster when moving between pages"). The browser's own compositor handles
// this animation off the main thread, and on unsupported browsers it's a
// complete no-op (instant swap, today's exact behavior) rather than a
// degraded experience.
//
// This lives in app/template.tsx (not individual page.tsx files): templates
// remount on every navigation the way layouts don't, which is what gives
// each route change a fresh enter/exit pair to animate between.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
