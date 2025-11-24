import crypto from "crypto";

export function generateApiToken() {
  return crypto.randomBytes(24).toString("hex");
}
