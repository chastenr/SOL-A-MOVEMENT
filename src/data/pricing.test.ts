import { describe, expect, it } from "vitest";
import { launchPricing } from "./pricing";

describe("launch pricing", () => {
  it("keeps the client-confirmed package names, prices, and class counts", () => {
    expect(launchPricing.packages).toMatchObject([
      { name: "Veora Essence", price: "₱3,000", sessions: 6 },
      { name: "Veora Flow", price: "₱5,400", sessions: 3 },
    ]);
    expect(launchPricing.memberships).toMatchObject([
      { name: "Veora Unlimited", price: "₱9,000/month" },
      {
        name: "Veora Signature",
        price: "₱7,000/month",
        originalPrice: "₱8,000/month",
      },
      {
        name: "Veora Prestige",
        price: "₱7,000/month",
        originalPrice: "₱10,000/month",
      },
      { name: "Infratone Unlimited", price: "₱15,499" },
    ]);
  });
});
