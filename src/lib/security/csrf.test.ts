import { readCookie, validateCsrf, CSRF_COOKIE, CSRF_HEADER } from "./csrf";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/test", { method: "POST", headers });
}

describe("readCookie", () => {
  it("lê o valor de um cookie específico entre vários", () => {
    const req = makeRequest({ cookie: `foo=bar; ${CSRF_COOKIE}=abc123; other=1` });
    expect(readCookie(req, CSRF_COOKIE)).toBe("abc123");
  });

  it("devolve null quando não há header cookie", () => {
    const req = makeRequest({});
    expect(readCookie(req, CSRF_COOKIE)).toBeNull();
  });

  it("devolve null quando o cookie não existe entre os presentes", () => {
    const req = makeRequest({ cookie: "foo=bar" });
    expect(readCookie(req, CSRF_COOKIE)).toBeNull();
  });
});

describe("validateCsrf (double submit cookie)", () => {
  it("aceita quando o header e o cookie coincidem", () => {
    const req = makeRequest({
      cookie: `${CSRF_COOKIE}=token-123`,
      [CSRF_HEADER]: "token-123"
    });
    expect(validateCsrf(req)).toBeNull();
  });

  it("rejeita quando o header está ausente", () => {
    const req = makeRequest({ cookie: `${CSRF_COOKIE}=token-123` });
    const result = validateCsrf(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it("rejeita quando o cookie está ausente", () => {
    const req = makeRequest({ [CSRF_HEADER]: "token-123" });
    expect(validateCsrf(req)?.status).toBe(403);
  });

  it("rejeita quando o header e o cookie não coincidem (pedido forjado)", () => {
    const req = makeRequest({
      cookie: `${CSRF_COOKIE}=token-real`,
      [CSRF_HEADER]: "token-adivinhado"
    });
    expect(validateCsrf(req)?.status).toBe(403);
  });
});
