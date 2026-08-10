"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TEXT_ELEMENT_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "a",
  "button",
  "label",
  "legend",
  "li",
  "dt",
  "dd",
  "th",
  "td",
  "summary",
  "span",
  "small",
].join(",");

function hasOwnVisibleText(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
  );
}

function shouldReveal(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !hasOwnVisibleText(element)) return false;
  if (element.closest("[data-no-text-reveal], [aria-hidden='true'], .sr-only")) return false;

  // Existing Framer Motion sections already provide the same fade-up
  // treatment. Leaving their children alone avoids stacking two opacity and
  // movement animations on the same copy.
  if (element.closest("[style*='opacity']")) return false;

  return true;
}

/**
 * Adds a lightweight, viewport-triggered fade-up to text that is not already
 * covered by the site's Framer Motion section reveals. One IntersectionObserver
 * handles the entire page, while a MutationObserver picks up text introduced by
 * dialogs and other conditional UI.
 */
export function TextRevealController() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = new Set<HTMLElement>();
    let revealIndex = 0;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.add("text-reveal-visible");
          intersectionObserver.unobserve(target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6%" }
    );

    function register(root: ParentNode) {
      const candidates: Element[] = [];
      if (root instanceof Element && root.matches(TEXT_ELEMENT_SELECTOR)) candidates.push(root);
      candidates.push(...root.querySelectorAll(TEXT_ELEMENT_SELECTOR));

      for (const element of candidates) {
        if (!shouldReveal(element) || element.dataset.textRevealReady === "true") continue;

        element.dataset.textRevealReady = "true";
        element.style.setProperty("--text-reveal-delay", `${(revealIndex % 5) * 45}ms`);
        element.classList.add("text-reveal-target");
        targets.add(element);
        intersectionObserver.observe(element);
        revealIndex += 1;
      }
    }

    register(document.body);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) register(node);
        }
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      for (const target of targets) {
        target.classList.remove("text-reveal-target", "text-reveal-visible");
        target.style.removeProperty("--text-reveal-delay");
        delete target.dataset.textRevealReady;
      }
    };
  }, [pathname]);

  return null;
}
