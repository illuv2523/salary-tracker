import { createSession, hashPassword, json, sql, validEmail } from "../lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Метод не поддерживается." });

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!validEmail(email)) return json(res, 400, { error: "Укажите корректную почту." });
  if (password.length < 8) return json(res, 400, { error: "Пароль должен быть не короче 8 символов." });

  try {
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${await hashPassword(password)})
      RETURNING id, email
    `;
    await createSession(res, rows[0].id);
    return json(res, 201, { email: rows[0].email });
  } catch (error) {
    if (error.code === "23505" || error.cause?.code === "23505") {
      return json(res, 409, { error: "Такая почта уже зарегистрирована." });
    }
    return json(res, 500, { error: "Не удалось создать аккаунт." });
  }
}
