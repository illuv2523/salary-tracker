const STORAGE_KEY = "salary-tracker-transactions";
const THEME_KEY = "salary-tracker-theme";

const CATEGORIES = {
  income: ["Зарплата", "Подработка", "Подарки", "Другое"],
  expense: ["Еда", "Транспорт", "Жильё", "Развлечения", "Здоровье", "Другое"],
};

const PIE_COLORS = ["#c44536", "#e07a3d", "#d4a017", "#2f7d6d", "#3d6cb5", "#7a4ea3"];

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("ru-RU");

const form = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const commentInput = document.getElementById("comment");
const formError = document.getElementById("form-error");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");
const listBody = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");
const table = document.querySelector("table");
const barCanvas = document.getElementById("bar-chart");
const pieCanvas = document.getElementById("pie-chart");
const themeButton = document.getElementById("theme-toggle");

let editingId = null;

function readTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function createTransaction(data) {
  const transactions = readTransactions();
  transactions.push({
    id: crypto.randomUUID(),
    type: data.type,
    amount: data.amount,
    category: data.category,
    date: data.date,
    comment: data.comment,
  });
  saveTransactions(transactions);
}

function updateTransaction(id, data) {
  const transactions = readTransactions().map((item) =>
    item.id === id ? { ...item, ...data } : item
  );
  saveTransactions(transactions);
}

function deleteTransaction(id) {
  saveTransactions(readTransactions().filter((item) => item.id !== id));
}

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function fillCategories(type, selected) {
  categoryInput.replaceChildren();
  CATEGORIES[type].forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    categoryInput.append(option);
  });
  if (selected && CATEGORIES[type].includes(selected)) {
    categoryInput.value = selected;
  }
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
}

function resetForm() {
  editingId = null;
  form.reset();
  dateInput.value = todayISO();
  fillCategories("income");
  formTitle.textContent = "Новая операция";
  submitButton.textContent = "Добавить";
  cancelButton.hidden = true;
  clearError();
}

function readForm() {
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Укажите сумму больше нуля." };
  }
  if (!category) {
    return { error: "Выберите категорию." };
  }
  if (!date) {
    return { error: "Укажите дату." };
  }
  return {
    data: {
      type: typeInput.value,
      amount,
      category,
      date,
      comment: commentInput.value.trim(),
    },
  };
}

function renderSummary(transactions) {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expense;

  document.getElementById("total-income").textContent = money.format(income);
  document.getElementById("total-expense").textContent = money.format(expense);
  document.getElementById("total-balance").textContent = money.format(balance);

  const balanceCard = document.querySelector(".card-balance");
  balanceCard.classList.toggle("is-positive", balance >= 0);
  balanceCard.classList.toggle("is-negative", balance < 0);
}

function renderTable(transactions) {
  listBody.replaceChildren();
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const isEmpty = sorted.length === 0;
  emptyState.hidden = !isEmpty;
  table.hidden = isEmpty;

  sorted.forEach((item) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = dateFormat.format(new Date(`${item.date}T00:00:00`));

    const typeCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge ${item.type}`;
    badge.textContent = item.type === "income" ? "Доход" : "Расход";
    typeCell.append(badge);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = item.category;

    const commentCell = document.createElement("td");
    commentCell.textContent = item.comment || "—";

    const amountCell = document.createElement("td");
    amountCell.className = `amount ${item.type}`;
    const sign = item.type === "income" ? "+" : "−";
    amountCell.textContent = `${sign}${money.format(item.amount)}`;

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn-edit";
    editButton.textContent = "Изменить";
    editButton.addEventListener("click", () => startEdit(item));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn-delete";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => {
      const label = item.comment || item.category;
      if (window.confirm(`Удалить операцию «${label}»?`)) {
        deleteTransaction(item.id);
        if (editingId === item.id) {
          resetForm();
        }
        render();
      }
    });

    actions.append(editButton, deleteButton);
    actionsCell.append(actions);
    row.append(dateCell, typeCell, categoryCell, commentCell, amountCell, actionsCell);
    listBody.append(row);
  });
}

function startEdit(item) {
  editingId = item.id;
  typeInput.value = item.type;
  fillCategories(item.type, item.category);
  amountInput.value = String(item.amount);
  dateInput.value = item.date;
  commentInput.value = item.comment;
  formTitle.textContent = "Изменение операции";
  submitButton.textContent = "Сохранить";
  cancelButton.hidden = false;
  clearError();
  showTab("form");
}

function prepareCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.floor(width * ratio));
  canvas.height = Math.max(1, Math.floor(height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function syncThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeButton.textContent = dark ? "Светлая тема" : "Тёмная тема";
  themeButton.setAttribute("aria-pressed", String(dark));
}

function drawEmpty(ctx, width, height, message) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cssVar("--muted");
  ctx.font = "15px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, width / 2, height / 2);
}

function monthKey(date) {
  return date.slice(0, 7);
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("ru-RU", {
    month: "short",
    year: "numeric",
  });
  return label.replace(".", "");
}

function drawBarChart(transactions) {
  const { ctx, width, height } = prepareCanvas(barCanvas);
  const buckets = new Map();
  transactions.forEach((item) => {
    const key = monthKey(item.date);
    if (!buckets.has(key)) {
      buckets.set(key, { income: 0, expense: 0 });
    }
    buckets.get(key)[item.type] += item.amount;
  });

  const months = [...buckets.keys()].sort();
  if (months.length === 0) {
    drawEmpty(ctx, width, height, "Нет данных");
    return;
  }

  const maxValue = Math.max(
    ...months.flatMap((key) => [buckets.get(key).income, buckets.get(key).expense]),
    1
  );
  const pad = { top: 48, right: 36, bottom: 46, left: 64 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = cssVar("--line");
  ctx.fillStyle = cssVar("--muted");
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let tick = 0; tick <= 4; tick += 1) {
    const value = (maxValue / 4) * tick;
    const y = pad.top + plotH - (value / maxValue) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(compactMoney(value), pad.left - 8, y);
  }

  const groupW = plotW / months.length;
  const barW = Math.min(28, groupW * 0.3);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  months.forEach((key, index) => {
    const bucket = buckets.get(key);
    const center = pad.left + groupW * index + groupW / 2;
    drawBar(ctx, center - barW - 3, pad.top, plotH, barW, bucket.income, maxValue, "#1f8a4c");
    drawBar(ctx, center + 3, pad.top, plotH, barW, bucket.expense, maxValue, "#c44536");
    ctx.fillStyle = cssVar("--muted");
    ctx.fillText(monthLabel(key), center, height - pad.bottom + 10);
  });

  drawLegend(ctx, [
    { color: "#1f8a4c", label: "Доход" },
    { color: "#c44536", label: "Расход" },
  ], width);
}

function shade(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.min(255, Math.max(0, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function drawBar(ctx, x, plotTop, plotH, barW, value, maxValue, color) {
  if (value <= 0) {
    return;
  }
  const barH = Math.max(2, (value / maxValue) * plotH);
  const y = plotTop + plotH - barH;
  const dx = 9;
  const dy = -7;

  ctx.beginPath();
  ctx.moveTo(x + barW, y);
  ctx.lineTo(x + barW + dx, y + dy);
  ctx.lineTo(x + barW + dx, y + barH + dy);
  ctx.lineTo(x + barW, y + barH);
  ctx.closePath();
  ctx.fillStyle = shade(color, -48);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.lineTo(x + barW + dx, y + dy);
  ctx.lineTo(x + barW, y);
  ctx.closePath();
  ctx.fillStyle = shade(color, 46);
  ctx.fill();

  const face = ctx.createLinearGradient(x, y, x + barW, y);
  face.addColorStop(0, shade(color, 22));
  face.addColorStop(1, shade(color, -24));
  ctx.fillStyle = face;
  ctx.fillRect(x, y, barW, barH);
}

function compactMoney(value) {
  if (value >= 1000) {
    return `${Math.round(value / 100) / 10} тыс.`;
  }
  return String(Math.round(value));
}

function drawLegend(ctx, items, width) {
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  let x = width - 16;
  items.slice().reverse().forEach((item) => {
    const textW = ctx.measureText(item.label).width;
    x -= textW;
    ctx.fillStyle = cssVar("--text");
    ctx.textAlign = "left";
    ctx.fillText(item.label, x, 16);
    x -= 16;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, 11, 10, 10);
    x -= 14;
  });
}

function eachFrontArc(start, sweep, visit) {
  const turn = Math.PI * 2;
  let cursor = start;
  let left = sweep;
  while (left > 0.0001) {
    const angle = ((cursor % turn) + turn) % turn;
    const step = Math.min(left, angle < Math.PI ? Math.PI - angle : turn - angle);
    if (angle < Math.PI) {
      visit(angle, angle + step);
    }
    cursor += step;
    left -= step;
  }
}

function drawPieSide(ctx, cx, cy, rx, ry, depth, side) {
  const steps = Math.max(6, Math.ceil((side.end - side.start) * 14));
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const t = side.start + ((side.end - side.start) * i) / steps;
    ctx.lineTo(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry);
  }
  for (let i = steps; i >= 0; i -= 1) {
    const t = side.start + ((side.end - side.start) * i) / steps;
    ctx.lineTo(cx + Math.cos(t) * rx, cy + depth + Math.sin(t) * ry);
  }
  ctx.closePath();
  ctx.fillStyle = shade(side.color, -58);
  ctx.fill();
}

function drawPieTop(ctx, cx, cy, radius, flat, start, end, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, flat);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, start, end);
  ctx.closePath();
  const gloss = ctx.createRadialGradient(-radius * 0.25, -radius * 0.35, radius * 0.1, 0, 0, radius);
  gloss.addColorStop(0, shade(color, 38));
  gloss.addColorStop(1, color);
  ctx.fillStyle = gloss;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawPieChart(transactions) {
  const { ctx, width, height } = prepareCanvas(pieCanvas);
  const totals = new Map();
  transactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      totals.set(item.category, (totals.get(item.category) || 0) + item.amount);
    });

  const slices = [...totals.entries()].filter(([, value]) => value > 0);
  if (slices.length === 0) {
    drawEmpty(ctx, width, height, "Нет данных");
    return;
  }

  const sum = slices.reduce((total, [, value]) => total + value, 0);
  const narrow = width < 520;
  const radius = narrow ? Math.min(62, (width - 24) / 2) : Math.min(width, height) * 0.26;
  const flat = 0.58;
  const depth = 16;
  const cx = narrow ? width / 2 : Math.min(width * 0.32, radius + 28);
  const cy = narrow ? radius * flat + 12 : height / 2 - depth / 2;
  const sides = [];
  let angle = -Math.PI / 2;

  ctx.clearRect(0, 0, width, height);
  slices.forEach(([, value], index) => {
    const sweep = (value / sum) * Math.PI * 2;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    eachFrontArc(angle, sweep, (start, end) => {
      sides.push({ start, end, color });
    });
    angle += sweep;
  });

  sides
    .sort((a, b) => Math.abs((b.start + b.end) / 2 - Math.PI / 2) - Math.abs((a.start + a.end) / 2 - Math.PI / 2))
    .forEach((side) => drawPieSide(ctx, cx, cy, radius, radius * flat, depth, side));

  angle = -Math.PI / 2;
  slices.forEach(([, value], index) => {
    const sweep = (value / sum) * Math.PI * 2;
    drawPieTop(ctx, cx, cy, radius, flat, angle, angle + sweep, PIE_COLORS[index % PIE_COLORS.length]);
    angle += sweep;
  });

  ctx.font = "13px Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const labels = slices.map(([category, value]) => `${category} · ${money.format(value)}`);
  if (narrow) {
    const lineH = 18;
    const maxText = Math.max(...labels.map((label) => ctx.measureText(label).width));
    let legendX = Math.max(8, (width - (maxText + 18)) / 2);
    let legendY = cy + radius * flat + depth + 18;
    labels.forEach((label, index) => {
      ctx.fillStyle = PIE_COLORS[index % PIE_COLORS.length];
      ctx.fillRect(legendX, legendY - 6, 12, 12);
      ctx.fillStyle = cssVar("--text");
      ctx.fillText(label, legendX + 18, legendY);
      legendY += lineH;
    });
    return;
  }

  const legendX = cx + radius + 28;
  let legendY = Math.max(28, cy - (slices.length * 22) / 2);
  labels.forEach((label, index) => {
    ctx.fillStyle = PIE_COLORS[index % PIE_COLORS.length];
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = cssVar("--text");
    ctx.fillText(label, legendX + 18, legendY);
    legendY += 22;
  });
}

function renderCharts(transactions) {
  drawBarChart(transactions);
  drawPieChart(transactions);
}

function render() {
  const transactions = readTransactions();
  renderSummary(transactions);
  renderTable(transactions);
  renderCharts(transactions);
}

typeInput.addEventListener("change", () => {
  fillCategories(typeInput.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = readForm();
  if (result.error) {
    showError(result.error);
    return;
  }
  if (editingId) {
    updateTransaction(editingId, result.data);
  } else {
    createTransaction(result.data);
  }
  resetForm();
  render();
  showTab("list");
});

cancelButton.addEventListener("click", resetForm);

themeButton.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  if (next === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  localStorage.setItem(THEME_KEY, next);
  syncThemeButton();
  renderCharts(readTransactions());
});

syncThemeButton();

const tabStage = document.querySelector(".tab-stage");
const tabButtons = [...document.querySelectorAll(".tabs button")];

function showTab(name) {
  const current = document.querySelector(".tab-panel.is-active");
  const next = document.querySelector(`[data-panel="${name}"]`);
  if (!next || current === next) {
    return;
  }

  tabButtons.forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  tabStage.style.height = `${current.offsetHeight}px`;
  current.classList.remove("is-active");
  next.classList.add("is-active");
  if (name === "charts") {
    renderCharts(readTransactions());
  }
  requestAnimationFrame(() => {
    tabStage.style.height = `${next.offsetHeight}px`;
  });
}

tabStage.addEventListener("transitionend", (event) => {
  if (event.propertyName === "height" && event.target === tabStage) {
    tabStage.style.height = "";
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});

window.addEventListener("resize", () => {
  renderCharts(readTransactions());
});

resetForm();
render();
