import { describe, expect, it } from "vitest";
import { classDirectory } from "@/data/schedule";
import { services } from "@/data/services";

describe("class catalog", () => {
  it("keeps the complete 47-class directory with unique identifiers", () => {
    expect(classDirectory).toHaveLength(47);
    expect(new Set(classDirectory.map((classType) => classType.id)).size).toBe(47);
  });

  it("includes every heated and red light Restore class", () => {
    const restoreClasses = classDirectory.filter((classType) => classType.serviceSlug === "recovery-restore");
    const restoreService = services.find((service) => service.slug === "recovery-restore");

    expect(restoreClasses).toHaveLength(28);
    expect(restoreService?.classVariants).toHaveLength(28);
    expect(restoreClasses.filter((classType) => classType.name.startsWith("Heated "))).toHaveLength(14);
    expect(restoreClasses.filter((classType) => classType.name.startsWith("Red Light + "))).toHaveLength(14);
  });

  it("uses the confirmed one-hour duration without inventing Ballet timing", () => {
    const confirmedClasses = classDirectory.filter((classType) => classType.serviceSlug !== "ballet");
    const balletService = services.find((service) => service.slug === "ballet");

    expect(confirmedClasses.every((classType) => classType.duration === "60 min")).toBe(true);
    expect(balletService?.duration).toBe("To be confirmed");
  });
});
