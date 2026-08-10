import { describe, expect, it } from "vitest";
import {
  signUpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations";

const validSignUp = {
  firstName: "Jane",
  lastName: "Dela Cruz",
  email: "jane@example.com",
  mobileNumber: "+63 917 000 0000",
  birthday: "",
  password: "password1",
  confirmPassword: "password1",
  consent: true,
};

describe("signUpSchema", () => {
  it("accepts a fully valid payload", () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: "different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a password with no digit", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, password: "onlyletters", confirmPassword: "onlyletters" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, password: "pw1", confirmPassword: "pw1" });
    expect(result.success).toBe(false);
  });

  it("rejects when consent is not given", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts email + non-empty password", () => {
    expect(loginSchema.safeParse({ email: "jane@example.com", password: "anything" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "jane@example.com", password: "" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "jane@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching strong passwords", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "password1", confirmPassword: "password1" }).success
    ).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "password1", confirmPassword: "password2" }).success
    ).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a current password plus matching strong new passwords", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "oldpassword1",
        password: "password1",
        confirmPassword: "password1",
      }).success
    ).toBe(true);
  });

  it("rejects an empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["currentPassword"]);
    }
  });

  it("rejects mismatched new passwords", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "oldpassword1",
        password: "password1",
        confirmPassword: "password2",
      }).success
    ).toBe(false);
  });
});
