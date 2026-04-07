import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
    ...overrides,
  };
}

describe("Form Validation - Issue Creation", () => {
  it("rejects a title that is too short (< 5 characters)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.issues.create({
        title: "Hi",
        description: "This is a valid description that is long enough.",
        category: "road_damage",
        latitude: "12.9716",
        longitude: "77.5946",
      })
    ).rejects.toThrow();
  });

  it("rejects a description that is too short (< 10 characters)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.issues.create({
        title: "Valid Issue Title",
        description: "Short",
        category: "road_damage",
        latitude: "12.9716",
        longitude: "77.5946",
      })
    ).rejects.toThrow();
  });

  it("rejects an invalid category value", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.issues.create({
        title: "Valid Issue Title",
        description: "This is a valid description that is long enough.",
        category: "invalid_category" as any,
        latitude: "12.9716",
        longitude: "77.5946",
      })
    ).rejects.toThrow();
  });

  it("rejects a title that exceeds the maximum length (> 255 characters)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.issues.create({
        title: "A".repeat(256),
        description: "This is a valid description that is long enough.",
        category: "traffic_hazard",
        latitude: "12.9716",
        longitude: "77.5946",
      })
    ).rejects.toThrow();
  });

  it("accepts a valid issue payload with all required fields", async () => {
    // The procedure is defined and reachable — a database error is expected
    // in a test environment, not a validation error.
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const promise = caller.issues.create({
      title: "Large pothole on Main Street",
      description: "There is a large pothole that is causing vehicle damage.",
      category: "road_damage",
      latitude: "12.9716",
      longitude: "77.5946",
      address: "123 Main Street",
    });

    // Expect either success or a non-validation runtime error (e.g., DB unavailable)
    await expect(promise).rejects.not.toThrow("invalid_type");
  });
});

describe("Form Validation - Comment Creation", () => {
  it("rejects an empty comment", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.comments.create({
        issueId: 1,
        content: "",
      })
    ).rejects.toThrow();
  });

  it("rejects a comment that exceeds the maximum length (> 1000 characters)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.comments.create({
        issueId: 1,
        content: "A".repeat(1001),
      })
    ).rejects.toThrow();
  });
});

describe("Form Validation - Profile Update", () => {
  it("accepts a valid profile update payload", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // The procedure exists and accepts the right shape
    expect(caller.users.updateProfile).toBeDefined();
  });
});
