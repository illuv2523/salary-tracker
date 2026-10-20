import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export const sql = neon(process.env.DATABASE_URL);

export const CATEGORIES = {
  income: ["Зарплата", "Подработка", "Подарки", "Другое"],
  expense: ["Еда", "Транспорт", "Жильё", "Развлечения", "Здоровье", "Другое"],
};

export function json(res, status, body) {
  res.status(status).json(body);
}

export function readCookie(req, name) {
  const header = req.headers.cookie || "";
  const part = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const derived = Buffer.from(await scryptAsync(password, salt, 64));
  const saved = Buffer.from(hash, "hex");
  if (saved.length !== derived.length) return false;
  return timingSafeEqual(saved, derived);
}

export function sessionCookie(token, maxAge) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function createSession(res, userId) {
  const token = randomBytes(32).toString("hex");
  const maxAge = 60 * 60 * 24 * 30;
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashToken(token)}, now() + interval '30 days')
  `;
  res.setHeader("Set-Cookie", sessionCookie(token, maxAge));
}

export async function getUser(req) {
  const token = readCookie(req, "session");
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `;
  return rows[0] || null;
}

export async function requireUser(req, res) {
  const user = await getUser(req);
  if (!user) {
    json(res, 401, { error: "Нужно войти в аккаунт." });
    return null;
  }
  return user;
}

export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

export function readTransaction(body) {
  const type = body?.type;
  const amount = Number(body?.amount);
  const category = String(body?.category || "");
  const date = String(body?.date || "");
  const comment = String(body?.comment || "").trim().slice(0, 120);
  if (type !== "income" && type !== "expense") return { error: "Выберите тип операции." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Укажите сумму больше нуля." };
  if (!CATEGORIES[type].includes(category)) return { error: "Выберите категорию." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Укажите дату." };
  return { data: { type, amount, category, date, comment } };
}
