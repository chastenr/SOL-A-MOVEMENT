"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = new Set<HTMLElement>();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.add("text-reveal-visible");
          intersectionObserver.unobserve(target);
        }
      },
      { threshold: 0.05, rootMargin: "0px" }
    );

    function register(root: ParentNode) {
      const candidates: Element[] = [];
      if (root instanceof Element && root.matches(TEXT_ELEMENT_SELECTOR)) candidates.push(root);
      candidates.push(...root.querySelectorAll(TEXT_ELEMENT_SELECTOR));

      for (const element of candidates) {
        if (!shouldReveal(element) || element.dataset.textRevealReady === "true") continue;

        element.dataset.textRevealReady = "true";
        element.classList.add("text-reveal-target");
        targets.add(element);
        intersectionObserver.observe(element);
      }
    }

    function unregister(root: ParentNode) {
      const candidates: Element[] = [];
      if (root instanceof HTMLElement && root.dataset.textRevealReady === "true") candidates.push(root);
      candidates.push(...root.querySelectorAll("[data-text-reveal-ready='true']"));

      for (const element of candidates) {
        if (!(element instanceof HTMLElement)) continue;
        intersectionObserver.unobserve(element);
        targets.delete(element);
      }
    }

    register(document.body);

    // App Router navigations can stream new server-rendered nodes into the
    // existing layout before React has hydrated that subtree. Mutating those
    // nodes immediately causes a hydration mismatch, so registration waits
    // until two animation frames have passed and hydration has settled.
    const pendingRoots = new Set<Element>();
    let registrationFrame: number | undefined;

    function scheduleRegistration(root: Element) {
      pendingRoots.add(root);
      if (registrationFrame !== undefined) return;

      registrationFrame = requestAnimationFrame(() => {
        registrationFrame = requestAnimationFrame(() => {
          registrationFrame = undefined;
          for (const pendingRoot of pendingRoots) register(pendingRoot);
          pendingRoots.clear();
        });
      });
    }

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) scheduleRegistration(node);
        }
        for (const node of mutation.removedNodes) {
          if (node instanceof Element) unregister(node);
        }
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      if (registrationFrame !== undefined) cancelAnimationFrame(registrationFrame);
      pendingRoots.clear();
      for (const target of targets) {
        target.classList.remove("text-reveal-target", "text-reveal-visible");
        delete target.dataset.textRevealReady;
      }
    };
  }, []);

  return null;
}
