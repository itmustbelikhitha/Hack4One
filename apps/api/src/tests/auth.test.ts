import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../server.js";

describe("auth", () => {
  it("logs in demo employee and blocks bad passwords", async () => {
    await request(app).post("/api/v1/auth/login").send({ email: "maya@dayflow.test", password: "wrong" }).expect(401);
    const response = await request(app).post("/api/v1/auth/login").send({ email: "maya@dayflow.test", password: "Dayflow@123", remember: true }).expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.user.role).toBe("EMPLOYEE");
  });
});
