import express from "express";
import request from "supertest";
import router from "../../routes/index";

describe("Routes Index", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", router);
  });

  describe("Route Mounting", () => {
    it("should mount auth routes at /api/auth", async () => {
      // Auth routes should be accessible
      const response = await request(app).get("/api/auth/me");

      // Should get 401 (unauthorized) not 404 (not found)
      // This confirms the route exists
      expect(response.status).not.toBe(404);
    });

    it("should mount topics routes at /api/topics", async () => {
      const response = await request(app).get("/api/topics");

      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    it("should mount subtopics routes at /api/subtopics", async () => {
      const response = await request(app).patch("/api/subtopics/1/1/progress");

      // Should get 401 or 400, not 404
      expect(response.status).not.toBe(404);
    });

    it("should mount users routes at /api/users", async () => {
      const response = await request(app).get("/api/users/me/last-session");

      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    it("should mount chat routes at /api/chat", async () => {
      const response = await request(app).get("/api/chat/history");

      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    it("should mount onboarding routes at /api/onboarding", async () => {
      const response = await request(app).get("/api/onboarding/status");

      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    it("should mount Google auth routes at /api/auth", async () => {
      const response = await request(app).post("/api/auth/google/onetap");

      // Should not be 404
      expect(response.status).not.toBe(404);
    });
  });

  describe("Route Conflicts", () => {
    it("should handle both auth routes and google auth routes at /api/auth", async () => {
      // Both should work without conflicts
      const authResponse = await request(app).get("/api/auth/me");
      const googleResponse = await request(app).post("/api/auth/google/onetap");

      expect(authResponse.status).not.toBe(404);
      expect(googleResponse.status).not.toBe(404);
    });
  });

  describe("Invalid Routes", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent");

      expect(response.status).toBe(404);
    });

    it("should return 404 for invalid nested routes", async () => {
      const response = await request(app).get(
        "/api/topics/invalid/nested/route"
      );

      expect(response.status).toBe(404);
    });
  });

  describe("Router Export", () => {
    it("should export a valid Express router", () => {
      expect(router).toBeDefined();
      expect(typeof router).toBe("function");
      expect(router.stack).toBeDefined(); // Express router has a stack property
    });

    it("should have all route handlers mounted", () => {
      // Check that the router has multiple layers (one for each route)
      expect(router.stack.length).toBeGreaterThan(5);
    });
  });

  describe("Route Paths", () => {
    it("should have correct route paths configured", () => {
      const routePaths = router.stack
        .filter(
          (layer: any) => layer.route === undefined && layer.name === "router"
        )
        .map((layer: any) => layer.regexp.toString());

      // Should have routes configured
      expect(routePaths.length).toBeGreaterThan(0);
    });
  });

  describe("HTTP Methods", () => {
    it("should support GET requests on appropriate routes", async () => {
      const routes = ["/api/topics", "/api/auth/me", "/api/onboarding/status"];

      for (const route of routes) {
        const response = await request(app).get(route);
        // Should not be 405 (Method Not Allowed) or 404
        expect(response.status).not.toBe(405);
        expect(response.status).not.toBe(404);
      }
    });

    it("should support POST requests on appropriate routes", async () => {
      const routes = ["/api/chat/message", "/api/auth/google/onetap"];

      for (const route of routes) {
        const response = await request(app).post(route);
        // Should not be 405 or 404
        expect(response.status).not.toBe(405);
        expect(response.status).not.toBe(404);
      }
    });

    it("should support PATCH requests on appropriate routes", async () => {
      const response = await request(app).patch("/api/onboarding/update");

      // Should not be 405 or 404
      expect(response.status).not.toBe(405);
      expect(response.status).not.toBe(404);
    });

    it("should support DELETE requests on appropriate routes", async () => {
      const response = await request(app).delete("/api/chat/history");

      // Should not be 405 or 404
      expect(response.status).not.toBe(405);
      expect(response.status).not.toBe(404);
    });
  });
});
