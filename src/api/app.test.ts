import supertest from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("AAPI HTTP boundary", () => {
  it("publishes health and the generated documentation path", async () => {
    const response = await supertest(createApp()).get("/api/v0/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "aapi",
      documentationPath: "/docs",
    });
  });

  it("rejects request fields outside the generated contract with HTTP 422", async () => {
    const response = await supertest(createApp())
      .post("/api/v0/workspaces/workspace-1/decisions/evaluate")
      .send({
        actor: { id: "agent-1", workspaceId: "workspace-1" },
        resource: {
          id: "context-1",
          workspaceId: "workspace-1",
          visibility: "workspace",
        },
        capabilityId: "context.read",
        purpose: "Read governed workspace context.",
        idempotencyKey: "http-request-1",
        surprise: true,
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("keeps contract proposals model-neutral when no provider is configured", async () => {
    const response = await supertest(createApp())
      .post("/api/v0/contracts/proposals")
      .send({ description: "Draft an agent that reads workspace context." });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      code: "PROPOSAL_PROVIDER_UNAVAILABLE",
    });
  });
});
