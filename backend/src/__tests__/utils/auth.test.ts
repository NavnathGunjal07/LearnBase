import { generateToken, verifyToken, JwtPayload } from "../../utils/auth";
import jwt from "jsonwebtoken";

describe("Auth Utilities", () => {
  const testPayload: JwtPayload = {
    userId: "test-user-123",
    email: "test@example.com",
  };

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const token = generateToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different payloads", () => {
      const payload1: JwtPayload = {
        userId: "user-1",
        email: "user1@example.com",
      };
      const payload2: JwtPayload = {
        userId: "user-2",
        email: "user2@example.com",
      };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it("should include userId and email in the token", () => {
      const token = generateToken(testPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });
  });

  describe("verifyToken", () => {
    it("should verify and decode a valid token", () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it("should throw an error for invalid tokens", () => {
      expect(() => verifyToken("invalid-token")).toThrow();
    });

    it("should throw an error for tampered tokens", () => {
      const token = generateToken(testPayload);
      const tamperedToken = token.slice(0, -5) + "xxxxx";

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it("should throw an error for empty token", () => {
      expect(() => verifyToken("")).toThrow();
    });
  });

  describe("Token lifecycle", () => {
    it("should generate and verify token successfully", () => {
      const originalPayload: JwtPayload = {
        userId: "lifecycle-test-user",
        email: "lifecycle@test.com",
      };

      const token = generateToken(originalPayload);
      const verifiedPayload = verifyToken(token);

      expect(verifiedPayload.userId).toBe(originalPayload.userId);
      expect(verifiedPayload.email).toBe(originalPayload.email);
    });
  });
});
