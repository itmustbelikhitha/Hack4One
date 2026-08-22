import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../server.js";

async function token(email: string) {
  const response = await request(app).post("/api/v1/auth/login").send({ email, password: "Dayflow@123" });
  return response.body.accessToken;
}

describe("rbac", () => {
  it("prevents employees from reading all employees", async () => {
    const accessToken = await token("maya@dayflow.test");
    await request(app).get("/api/v1/employees").set("Authorization", `Bearer ${accessToken}`).expect(403);
  });

  it("allows HR to read audit logs", async () => {
    const accessToken = await token("hr@dayflow.test");
    const response = await request(app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
