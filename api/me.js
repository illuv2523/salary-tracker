import { getUser, json } from "../lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Метод не поддерживается." });
  const user = await getUser(req);
  if (!user) return json(res, 401, { error: "Нужно войти в аккаунт." });
  return json(res, 200, { email: user.email });
}
