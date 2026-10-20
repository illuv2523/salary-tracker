import { createSession, json, sql, validEmail, verifyPassword } from "../lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Метод не поддерживается." });

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!validEmail(email) || !password) return json(res, 400, { error: "Укажите почту и пароль." });

  const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json(res, 401, { error: "Неверная почта или пароль." });
  }

  await createSession(res, user.id);
  return json(res, 200, { email: user.email });
}
