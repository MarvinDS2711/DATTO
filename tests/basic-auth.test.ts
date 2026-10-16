import { describe, expect, it } from "vitest";
import { checkBasicAuth, safeEqual } from "@/lib/auth/basic-auth";

const header = (user: string, pass: string) => `Basic ${btoa(`${user}:${pass}`)}`;

describe("checkBasicAuth", () => {
  it("accepte le bon identifiant", () => {
    expect(checkBasicAuth(header("support", "mot-de-passe-long"), "support", "mot-de-passe-long")).toBe(true);
  });

  it("accepte un mot de passe contenant « : »", () => {
    expect(checkBasicAuth(header("support", "a:b:c-123456"), "support", "a:b:c-123456")).toBe(true);
  });

  it("refuse les mauvais identifiants et les en-têtes invalides", () => {
    expect(checkBasicAuth(header("support", "faux"), "support", "mot-de-passe-long")).toBe(false);
    expect(checkBasicAuth(header("autre", "mot-de-passe-long"), "support", "mot-de-passe-long")).toBe(false);
    expect(checkBasicAuth(null, "support", "x")).toBe(false);
    expect(checkBasicAuth("Bearer abc", "support", "x")).toBe(false);
    expect(checkBasicAuth("Basic %%%", "support", "x")).toBe(false);
  });

  it("compare en temps constant", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
