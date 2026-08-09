"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { policyDocuments } from "@/data/policies";
import { Button } from "@/components/ui/Button";

/**
 * Same content as /policies, shown inline instead of navigating there —
 * a full-page nav away from signup unmounted the form and lost everything
 * the customer had already typed.
 */
export function PoliciesModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policies-modal-heading"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-ivory shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-charcoal/10 px-6 py-5 sm:px-8">
          <h2 id="policies-modal-heading" className="font-display text-xl text-charcoal">
            Terms &amp; Privacy Policy
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-charcoal/40 hover:bg-charcoal/5 hover:text-charcoal"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <div className="space-y-10">
            {policyDocuments.map((doc) => (
              <div key={doc.slug}>
                <h3 className="font-display text-lg text-charcoal">{doc.title}</h3>
                <div className="mt-4 space-y-5">
                  {doc.sections.map((section) => (
                    <div key={section.heading}>
                      <h4 className="text-xs font-medium uppercase tracking-[0.08em] text-charcoal/50">
                        {section.heading}
                      </h4>
                      <div className="mt-1.5 space-y-2">
                        {section.paragraphs.map((paragraph, index) => (
                          <p key={index} className="text-sm leading-relaxed text-charcoal/70">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-charcoal/10 px-6 py-4 sm:px-8">
          <Button type="button" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
