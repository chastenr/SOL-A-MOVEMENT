import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Semaphore SMS", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SEMAPHORE_API_KEY", "private-key");
    vi.stubEnv("SEMAPHORE_SENDER_NAME", "VEORA");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts a normalized Philippine number without exposing configuration", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ message_id: 42, recipient: "639171234567", status: "Queued" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { isSmsConfigured, sendSms } = await import("@/lib/sms");
    expect(isSmsConfigured).toBe(true);
    await expect(sendSms({ to: "0917 123 4567", body: "Veora booking confirmed." })).resolves.toEqual([
      { messageId: 42, recipient: "639171234567", status: "Queued" },
    ]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as URLSearchParams;
    expect(url).toBe("https://api.semaphore.co/api/v4/messages");
    expect(init.method).toBe("POST");
    expect(form.get("number")).toBe("639171234567");
    expect(form.get("sendername")).toBe("VEORA");
  });

  it("rejects invalid or non-Philippine numbers before calling Semaphore", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendSms } = await import("@/lib/sms");

    await expect(sendSms({ to: "+15551234567", body: "Hello" })).rejects.toThrow(
      "valid Philippine mobile number"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a failed delivery response as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ status: "Failed", message: "Sender name is not active" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    const { sendSms } = await import("@/lib/sms");

    await expect(sendSms({ to: "09171234567", body: "Hello" })).rejects.toThrow(
      "Sender name is not active"
    );
  });
});
