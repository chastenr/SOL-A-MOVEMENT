"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ExpandableDescriptionProps = {
  shortDescription: string;
  description: string;
};

export function ExpandableDescription({
  shortDescription,
  description,
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionId = useId();

  return (
    <div className="mt-4">
      <p id={descriptionId} className="text-base leading-[1.7] text-charcoal/75">
        {isExpanded ? description : shortDescription}
      </p>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={descriptionId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-sm text-xs font-semibold uppercase tracking-[0.12em] text-clay transition-colors hover:text-walnut focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
      >
        {isExpanded ? "View less" : "View more"}
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-300", isExpanded && "rotate-180")}
          aria-hidden
        />
      </button>
    </div>
  );
}
