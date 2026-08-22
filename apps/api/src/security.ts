import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { permissions, type Role } from "./data.js";

export type AuthedRequest = Request & {
  user?: { id: string; email: string; role: Role; employeeId: string };
};

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";

export function signAccessToken(user: { id: string; email: string; role: Role; employeeId: string }) {
  return jwt.sign(user, accessSecret, { expiresIn: (process.env.ACCESS_TOKEN_TTL || "15m") as jwt.SignOptions["expiresIn"] });
}

export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } });
  try {
    req.user = jwt.verify(token, accessSecret) as AuthedRequest["user"];
    return next();
  } catch {
    return res.status(401).json({ error: { code: "TOKEN_INVALID", message: "Session expired or invalid." } });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !permissions[role].includes(permission)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } });
    }
    return next();
  };
}

export function canReadEmployee(req: AuthedRequest, employeeId: string) {
  return req.user?.role === "ADMIN" || req.user?.employeeId === employeeId;
}
