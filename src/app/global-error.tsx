"use client";

// Next.js requires global-error.tsx to render its own <html>/<body> — it
// replaces the entire root layout (including our normal Navbar/Footer) when
// an error escapes the root layout itself. Kept deliberately minimal and
// dependency-free so it can render even if the failure is upstream of
// everything else. Never shows the actual error message/stack to the
// visitor — that's for server logs, not the browser.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#faf7f2",
          color: "#221f1c",
        }}
      >
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#a97456" }}>
          Something went wrong
        </p>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>We hit an unexpected error.</h1>
        <p style={{ color: "rgba(34,31,28,0.65)", maxWidth: "28rem" }}>
          Please try again, or come back in a moment. If this keeps happening, reach out and let us know.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "0.5rem",
            borderRadius: "9999px",
            border: "1px solid rgba(34,31,28,0.3)",
            padding: "0.65rem 1.5rem",
            fontSize: "0.72rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
