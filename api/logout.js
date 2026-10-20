import { getUser, hashToken, json, readCookie, sessionCookie, sql } from "../lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Метод не поддерживается." });
  const token = readCookie(req, "session");
  if (token) {
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  await getUser(req);
  res.setHeader("Set-Cookie", sessionCookie("", 0));
  return json(res, 200, { ok: true });
}
