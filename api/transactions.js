import { json, readTransaction, requireUser, sql } from "../lib/server.js";

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    date: String(row.date).slice(0, 10),
    comment: row.comment || "",
  };
}

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const rows = await sql`
      SELECT id, type, amount, category, date::text AS date, comment
      FROM transactions
      WHERE user_id = ${user.id}
      ORDER BY date DESC, id DESC
    `;
    return json(res, 200, rows.map(mapRow));
  }

  if (req.method === "POST") {
    const parsed = readTransaction(req.body);
    if (parsed.error) return json(res, 400, { error: parsed.error });
    const item = parsed.data;
    const rows = await sql`
      INSERT INTO transactions (user_id, type, amount, category, date, comment)
      VALUES (${user.id}, ${item.type}, ${item.amount}, ${item.category}, ${item.date}, ${item.comment})
      RETURNING id, type, amount, category, date::text AS date, comment
    `;
    return json(res, 201, mapRow(rows[0]));
  }

  if (req.method === "PUT") {
    const id = String(req.body?.id || "");
    const parsed = readTransaction(req.body);
    if (!id) return json(res, 400, { error: "Не найдена операция." });
    if (parsed.error) return json(res, 400, { error: parsed.error });
    const item = parsed.data;
    const rows = await sql`
      UPDATE transactions
      SET type = ${item.type}, amount = ${item.amount}, category = ${item.category},
          date = ${item.date}, comment = ${item.comment}
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id, type, amount, category, date::text AS date, comment
    `;
    if (!rows[0]) return json(res, 404, { error: "Операция не найдена." });
    return json(res, 200, mapRow(rows[0]));
  }

  if (req.method === "DELETE") {
    const id = String(req.body?.id || "");
    if (!id) return json(res, 400, { error: "Не найдена операция." });
    const rows = await sql`
      DELETE FROM transactions
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;
    if (!rows[0]) return json(res, 404, { error: "Операция не найдена." });
    return json(res, 200, { ok: true });
  }

  return json(res, 405, { error: "Метод не поддерживается." });
}
