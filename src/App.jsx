import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

function rub(v) {
  return Number(v || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

const LS = {
  googleRate: "playerok_googleRate",
  playerokRate: "playerok_playerokRate",
  workerShares: "playerok_workerShares",
  dailyCounts: "playerok_dailyCounts",
  workDays: "playerok_workDays",
};

const ls = (k, fb = null) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fb;
  } catch {
    return fb;
  }
};

const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString("ru-RU");
const fmtF = (n, d = 2) => Number(n || 0).toFixed(d);
const todayKey = () => new Date().toISOString().slice(0, 10);
const toRuDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("ru-RU");
  } catch {
    return iso;
  }
};

const toRuTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const SALE_TARIFFS = {
  10: [
    { min: 90, max: 499, listing: 19, bump: 9 },
    { min: 500, max: 999, listing: 25, bump: 13 },
    { min: 1000, max: 2499, listing: 37, bump: 19 },
    { min: 2500, max: 4999, listing: 49, bump: 25 },
    { min: 5000, max: 9999, listing: 75, bump: 37 },
    { min: 10000, max: Infinity, listing: 99, bump: 49 },
  ],
  20: [
    { min: 90, max: 499, listing: 25, bump: 13 },
    { min: 500, max: 999, listing: 37, bump: 19 },
    { min: 1000, max: 2499, listing: 49, bump: 25 },
    { min: 2500, max: 4999, listing: 75, bump: 37 },
    { min: 5000, max: 9999, listing: 99, bump: 49 },
    { min: 10000, max: Infinity, listing: 149, bump: 75 },
  ],
};

function getTariffByPrice(price, saleCommission) {
  const comm = Number(saleCommission) === 20 ? 20 : 10;
  const p = Number(price || 0);
  const row = SALE_TARIFFS[comm].find((r) => p >= r.min && p <= r.max);
  return row || { listing: 0, bump: 0 };
}

function calcProfit({ salePrice, buyUsd, playerokRate, saleCommission }) {
  const sale = Number(salePrice || 0);
  const buy = Number(buyUsd || 0);
  const rate = Number(playerokRate || 88);
  const commPercent = Number(saleCommission) === 20 ? 20 : 10;
  const commAmount = Math.round((sale * commPercent) / 100);
  return sale - commAmount - buy * rate;
}

async function fetchGoogleRateReal() {
  try {
    const r = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
    );
    const d = await r.json();
    const v = d?.usd?.rub;
    if (v && v > 50 && v < 200) return Math.round(v * 100) / 100;
  } catch {}
  try {
    const r2 = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const d2 = await r2.json();
    const v2 = d2?.rates?.RUB;
    if (v2 && v2 > 50) return Math.round(v2 * 100) / 100;
  } catch {}
  return null;
}

const P = {
  dashboard:
    "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  workdays:
    "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-9h-2v3H7v2h3v3h2v-3h3v-2h-3z",
  calc:
    "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  rate:
    "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  catalog: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
  admin:
    "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  x: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  logout:
    "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  refresh:
    "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
  edit:
    "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  folder:
    "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
  trash:
    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm3.46-7.12 1.41-1.41L12 11.59l1.12-1.12 1.41 1.41L13.41 13l1.12 1.12-1.41 1.41L12 14.41l-1.12 1.12-1.41-1.41L10.59 13l-1.13-1.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z",
  eye:
    "M12 6.5c-5 0-9.27 3.11-11 7.5 1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
};

const Icon = ({ name, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={P[name] || P.dashboard} />
  </svg>
);

const Lbl = ({ children }) => (
  <label
    style={{
      display: "block",
      fontSize: 10.5,
      color: "var(--text3)",
      marginBottom: 5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    }}
  >
    {children}
  </label>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 13 }}>
    <Lbl>{label}</Lbl>
    {children}
  </div>
);

const FI = ({ label, ...p }) => (
  <Field label={label}>
    <input className="fi" {...p} />
  </Field>
);

const FS = ({ label, options, ...p }) => (
  <Field label={label}>
    <select className="fi" style={{ cursor: "pointer" }} {...p}>
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </Field>
);

function Badge({ status }) {
  const map = {
    sold: ["Продано", "#efe9ff", "rgba(168,85,247,.16)"],
    open: ["Открыт", "#efe9ff", "rgba(168,85,247,.16)"],
    closed: ["Закрыт", "#b8b0cc", "rgba(255,255,255,.04)"],
    active: ["Активен", "#efe9ff", "rgba(168,85,247,.16)"],
    inactive: ["Неактивен", "#8f88a2", "rgba(255,255,255,.03)"],
  };
  const [label, color, bg] = map[status] || [status, "#d4d4d8", "rgba(255,255,255,.05)"];
  return (
    <span
      className="badge"
      style={{
        color,
        background: bg,
        border: "1px solid rgba(168,85,247,.18)",
      }}
    >
      {label}
    </span>
  );
}

function Modal({ open, onClose, title, children, width = 460 }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        animation: "fadeIn .18s ease",
      }}
    >
      <div
        style={{
          width,
          maxWidth: "94vw",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--card)",
          border: "1px solid var(--border2)",
          borderRadius: 18,
          padding: "24px 24px 18px",
          boxShadow: "0 30px 90px rgba(0,0,0,.65)",
          animation: "scaleIn .2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{title}</div>
          <button className="btn-i" onClick={onClose}>
            <Icon name="x" size={12} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const MFoot = ({ onClose, onSubmit, label = "Сохранить" }) => (
  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
    <button className="btn-g" onClick={onClose}>Отмена</button>
    <button className="btn-p" onClick={onSubmit}>{label}</button>
  </div>
);

function useToast() {
  const [t, setT] = useState(null);
  const ref = useRef();

  const show = useCallback((msg, type = "ok") => {
    setT({ msg, type });
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setT(null), 2600);
  }, []);

  return { toast: t, show };
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        background: "rgba(18,12,24,.96)",
        border: "1px solid rgba(168,85,247,.24)",
        color: "var(--text)",
        borderRadius: 12,
        padding: "11px 15px",
        zIndex: 5000,
        boxShadow: "0 14px 40px rgba(0,0,0,.45)",
        animation: "slideR .2s ease",
        fontSize: 13,
      }}
    >
      {toast.type === "err" ? "✕" : "✓"} {toast.msg}
    </div>
  );
}

function MetricCard({ label, value, sub, delay = 0 }) {
  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        animation: `fadeUp .3s ease ${delay}s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -18,
          top: -18,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(168,85,247,.08)",
        }}
      />
      <div style={{ fontSize: 10.5, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", lineHeight: 1.1, letterSpacing: "-.03em" }}>
        {value}
      </div>
      {sub && <div style={{ marginTop: 5, fontSize: 11, color: "var(--text3)" }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 82 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4, height: "100%" }}>
          <div
            title={`${d.l}: ${fmt(d.v)} ₽`}
            style={{
              width: "100%",
              minHeight: 3,
              height: `${Math.max((d.v / max) * 62, 3)}px`,
              borderRadius: "4px 4px 0 0",
              background: i === data.length - 1 ? "#a855f7" : "rgba(168,85,247,.28)",
              transition: "height .18s ease",
            }}
          />
          <div style={{ fontSize: 9.5, color: "var(--text3)" }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerKey, setWorkerKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (supabase) {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      onLogin({ user: data.user, role: prof?.role || "admin", session: data.session });
    } else {
      if (email === "admin@playerok.ru" && password === "admin123") {
        onLogin({ user: { id: "demo-admin" }, role: "admin" });
      } else {
        setError("Демо: admin@playerok.ru / admin123");
      }
    }

    setLoading(false);
  };

  const handleWorker = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (supabase) {
      const { data: wk, error: err } = await supabase.from("worker_keys").select("*").eq("key", workerKey).single();
      if (err || !wk) {
        setError("Неверный ключ воркера");
        setLoading(false);
        return;
      }
      onLogin({ user: { id: `w-${wk.id}` }, role: "worker", workerData: wk });
    } else {
      if (workerKey === "worker-demo") {
        onLogin({
          user: { id: "demo-worker" },
          role: "worker",
          workerData: { id: 1, name: "Артём", key: "worker-demo", share: 50 },
        });
      } else {
        setError("Демо ключ: worker-demo");
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <style>{GLOBAL_STYLES}</style>
      <div className="auth-glow" />
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div className="logo-box">◼</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>
            Playerok Tracker
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
            Учёт продаж · Доходы · Аналитика
          </div>
        </div>

        <div className="switcher">
          {[
            ["admin", "Admin"],
            ["worker", "Worker"],
          ].map(([m, l]) => (
            <button
              key={m}
              className={mode === m ? "switcher-btn active" : "switcher-btn"}
              onClick={() => {
                setMode(m);
                setError("");
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={mode === "admin" ? handleAdmin : handleWorker}>
          {mode === "admin" ? (
            <>
              <FI label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@playerok.ru" />
              <FI label="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </>
          ) : (
            <FI label="Worker Key" value={workerKey} onChange={(e) => setWorkerKey(e.target.value)} placeholder="worker-xxxxx" />
          )}

          {error && <div className="error-box">{error}</div>}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CalcPage({ products, playerokRate }) {
  const [sp, setSp] = useState("");
  const [bu, setBu] = useState("");
  const [pr, setPr] = useState(playerokRate);
  const [saleCommission, setSaleCommission] = useState(10);
  const [ws, setWs] = useState(50);
  const [bm, setBm] = useState(0);
  const [pid, setPid] = useState("");

  useEffect(() => {
    setPr(playerokRate);
  }, [playerokRate]);

  const sale = Number(sp) || 0;
  const buy = Number(bu) || 0;
  const rate = Number(pr) || playerokRate;
  const commissionPercent = Number(saleCommission) === 20 ? 20 : 10;
  const commAmt = Math.round((sale * commissionPercent) / 100);
  const buyRub = Math.round(buy * rate);
  const tariff = getTariffByPrice(sale, saleCommission);
  const gross = sale - commAmt - buyRub;
  const net = gross - bm;
  const workerAmount = ws > 0 ? Math.round((net * ws) / 100) : 0;
  const adminAmount = net - workerAmount;

  const row = (l, v, c) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text3)", fontSize: 12 }}>{l}</span>
      <span style={{ color: c || "var(--text)", fontWeight: 700, fontSize: 12 }}>{v}</span>
    </div>
  );

  return (
    <div className="pa" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 860 }}>
      <div className="card">
        <div className="block-title">Параметры</div>

        <FS
          label="Быстрый выбор"
          value={pid}
          onChange={(e) => {
            const value = e.target.value;
            setPid(value);
            const p = products.find((x) => Number(x.id) === Number(value));
            if (p) {
              setSp(p.sale_price_rub);
              setBu(p.purchase_usd);
              setSaleCommission(p.sale_commission || 10);
              setBm(getTariffByPrice(p.sale_price_rub, p.sale_commission).bump);
            }
          }}
          options={[
            { value: "", label: "— выберите товар —" },
            ...products.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          <FI label="Цена продажи (₽)" type="number" value={sp} onChange={(e) => setSp(e.target.value)} placeholder="0" />
          <FI label="Закупка ($)" type="number" value={bu} onChange={(e) => setBu(e.target.value)} placeholder="0" />
          <FI label="Курс Playerok" type="number" value={pr} onChange={(e) => setPr(e.target.value)} />
          <FS
            label="Комиссия с продажи"
            value={saleCommission}
            onChange={(e) => setSaleCommission(Number(e.target.value))}
            options={[
              { value: 10, label: "10%" },
              { value: 20, label: "20%" },
            ]}
          />
          <FI label="Доля воркера (%)" type="number" value={ws} onChange={(e) => setWs(Number(e.target.value) || 0)} />
          <FI label="Поднятия (₽)" type="number" value={bm} onChange={(e) => setBm(Number(e.target.value) || 0)} />
        </div>

        <div className="note-box" style={{ marginTop: 10 }}>
          Выставление по тарифу: <b>{fmt(tariff.listing)} ₽</b> · Поднятие по тарифу: <b>{fmt(tariff.bump)} ₽</b>
        </div>
      </div>

      <div className="card">
        <div className="block-title">Расчёт</div>
        {row("Цена продажи", `${fmt(sale)} ₽`)}
        {row(`Комиссия ${commissionPercent}%`, `−${fmt(commAmt)} ₽`, "var(--danger)")}
        {row("Закупка по курсу", `−${fmt(buyRub)} ₽`, "var(--danger)")}
        {row("Выставление по тарифу", `−${fmt(tariff.listing)} ₽`, "var(--warning)")}
        {row("Поднятия", bm ? `−${fmt(bm)} ₽` : "0 ₽", bm ? "var(--warning)" : undefined)}
        {row("Валовый профит", `${gross >= 0 ? "+" : ""}${fmt(gross)} ₽`, gross >= 0 ? "var(--success)" : "var(--danger)")}
        <div style={{ height: 1, background: "var(--border)", margin: "9px 0" }} />
        {ws > 0 && row(`Профит воркера (${ws}%)`, `+${fmt(workerAmount)} ₽`, "var(--text2)")}
        {row("Профит Admin", `${adminAmount >= 0 ? "+" : ""}${fmt(adminAmount)} ₽`, adminAmount >= 0 ? "var(--success)" : "var(--danger)")}

        <div className="note-box" style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Итого Admin</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: adminAmount >= 0 ? "var(--success)" : "var(--danger)" }}>
            {adminAmount >= 0 ? "+" : ""}{fmt(adminAmount)} ₽
          </span>
        </div>
      </div>
    </div>
  );
}

function CatalogPage({
  products,
  setProducts,
  categories,
  setCategories,
  playerokRate,
  isAdmin,
  openM,
  setEditTarget,
  showToast,
}) {
  const [activeCat, setActiveCat] = useState("all");
  const filtered = activeCat === "all" ? products : products.filter((p) => Number(p.category_id) === Number(activeCat));

  return (
    <div className="pa">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ id: "all", name: "Все" }, ...categories].map((c) => (
            <button key={c.id} className={activeCat == c.id ? "chip active" : "chip"} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div style={{ display: "flex", gap: 7 }}>
            <button className="btn-g" onClick={() => openM("addCategory")}>
              <Icon name="folder" size={12} /> + Категория
            </button>
            <button className="btn-p" onClick={() => openM("addProduct")}>
              <Icon name="plus" size={12} color="#fff" /> + Товар
            </button>
          </div>
        )}
      </div>

      {isAdmin && categories.length > 0 && (
        <div className="card" style={{ padding: "11px 14px", marginBottom: 13 }}>
          <div className="section-caption">Управление категориями</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <div key={c.id} className="cat-pill">
                <Icon name="folder" size={11} color="#d8b4fe" />
                <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{c.name}</span>
                <button
                  className="btn-i d"
                  style={{ width: 18, height: 18, borderRadius: 4, marginLeft: 2 }}
                  onClick={async () => {
                    if (!window.confirm(`Удалить категорию "${c.name}"?`)) return;
                    if (supabase) await supabase.from("categories").delete().eq("id", c.id);
                    setCategories((prev) => prev.filter((x) => x.id !== c.id));
                    showToast("Категория удалена");
                  }}
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(235px,1fr))", gap: 12 }}>
        {filtered.map((p, i) => {
          const profit = Math.round(
            calcProfit({
              salePrice: p.sale_price_rub,
              buyUsd: p.purchase_usd,
              playerokRate,
              saleCommission: p.sale_commission,
            })
          );

          const tariff = getTariffByPrice(p.sale_price_rub, p.sale_commission);
          const category = categories.find((c) => Number(c.id) === Number(p.category_id));

          return (
            <div key={p.id} className="card soft-rise" style={{ padding: 15, animation: `fadeUp .25s ease ${i * 0.03}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, flex: 1, marginRight: 6 }}>
                  {p.name}
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", gap: 3 }}>
                    <button className="btn-i" style={{ width: 22, height: 22, borderRadius: 5 }} onClick={() => { setEditTarget(p); openM("editProduct"); }}>
                      <Icon name="edit" size={11} />
                    </button>
                    <button
                      className="btn-i d"
                      style={{ width: 22, height: 22, borderRadius: 5 }}
                      onClick={async () => {
                        if (!window.confirm("Удалить товар?")) return;
                        if (supabase) await supabase.from("products").delete().eq("id", p.id);
                        setProducts((prev) => prev.filter((x) => x.id !== p.id));
                        showToast("Товар удалён");
                      }}
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </div>
                )}
              </div>

              <div className="cat-tag">{category?.name || "Без категории"}</div>

              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{fmt(p.sale_price_rub)} ₽</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                Закуп: ${fmtF(p.purchase_usd)} · Комиссия: {p.sale_commission || 10}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                Выставление: {fmt(tariff.listing)} ₽ · Поднятие: {fmt(tariff.bump)} ₽
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: profit >= 0 ? "var(--success)" : "var(--danger)", marginTop: 6 }}>
                {profit >= 0 ? "+" : ""}{fmt(profit)} ₽ / ед
              </div>
              <div style={{ marginTop: 9 }}>
                <Badge status={p.status || "active"} />
              </div>
            </div>
          );
        })}

        {!filtered.length && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text3)" }}>Товаров нет</div>}
      </div>
    </div>
  );
}

function RatePage({ googleRate, setGR, playerokRate, setPR, isAdmin, showToast }) {
  const [pInput, setPInput] = useState(playerokRate);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setPInput(playerokRate);
  }, [playerokRate]);

  const doFetch = async () => {
    setFetching(true);
    const r = await fetchGoogleRateReal();
    if (r) {
      setGR(r);
      showToast(`Google курс: ${r} ₽/$`);
    } else {
      showToast("Не удалось получить курс", "err");
    }
    setFetching(false);
  };

  const block = (title, value, children) => (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 10, color: "var(--text)" }}>{value}</div>
      {children}
    </div>
  );

  return (
    <div className="pa" style={{ maxWidth: 520 }}>
      {block(
        "КУРС GOOGLE (1 USD → RUB)",
        `${fmtF(googleRate)} ₽`,
        <div>
          <button className="btn-g" onClick={doFetch} disabled={fetching}>
            <span style={{ display: "inline-block", animation: fetching ? "spin 1s linear infinite" : "none" }}>
              <Icon name="refresh" size={12} />
            </span>
            {fetching ? "Загружаем..." : "Обновить"}
          </button>
        </div>
      )}

      {block(
        "КУРС PLAYEROK (ручной)",
        `${fmtF(playerokRate)} ₽`,
        isAdmin ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={pInput} onChange={(e) => setPInput(e.target.value)} step="0.1" className="fi" style={{ width: 120 }} />
            <button
              className="btn-p"
              onClick={() => {
                const v = parseFloat(pInput);
                if (!Number.isNaN(v)) {
                  setPR(v);
                  showToast(`Курс Playerok: ${v} ₽`);
                }
              }}
            >
              Сохранить
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Устанавливается только admin</div>
        )
      )}
    </div>
  );
}

function WorkDaysPage({
  workDays,
  currentOpenDayId,
  openWorkDay,
  closeCurrentWorkDay,
  selectedWorkDayId,
  setSelectedWorkDayId,
  getWorkDayStats,
  products,
  categories,
}) {
  const selected = workDays.find((d) => d.id === selectedWorkDayId) || null;
  const selectedStats = selected ? getWorkDayStats(selected) : null;

  return (
    <div className="pa">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>
          История рабочих дней
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-p" onClick={openWorkDay}>
            <Icon name="plus" size={12} color="#fff" /> Открыть рабочий день
          </button>
          <button className="btn-g" onClick={closeCurrentWorkDay}>
            Закрыть рабочий день
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>
        <div className="card" style={{ padding: 12 }}>
          <div className="section-caption">Даты</div>
          <div style={{ display: "grid", gap: 8 }}>
            {workDays.map((d) => {
              const stats = getWorkDayStats(d);
              const isActive = d.id === selectedWorkDayId;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedWorkDayId(d.id)}
                  style={{
                    textAlign: "left",
                    padding: "11px 12px",
                    borderRadius: 12,
                    border: `1px solid ${isActive ? "rgba(168,85,247,.35)" : "var(--border)"}`,
                    background: isActive ? "rgba(168,85,247,.08)" : "#111",
                    color: "var(--text)",
                    cursor: "pointer",
                    transition: "all .15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>{toRuDate(d.date)}</div>
                    <Badge status={d.status} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                    {stats.qty} продаж · {stats.net >= 0 ? "+" : ""}{fmt(stats.net)} ₽
                  </div>
                </button>
              );
            })}
            {!workDays.length && <div style={{ color: "var(--text3)", fontSize: 12 }}>Рабочих дней пока нет</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          {!selected && <div style={{ color: "var(--text3)" }}>Выбери рабочий день слева</div>}

          {selected && selectedStats && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{toRuDate(selected.date)}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                    {selectedStats.qty} продаж · выставление {fmt(selectedStats.listing)} ₽ · поднятия {fmt(selectedStats.bumps)} ₽
                  </div>
                </div>
                <Badge status={selected.status} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
                <MetricCard label="Продажи" value={String(selectedStats.qty)} />
                <MetricCard label="Профит" value={`${selectedStats.net >= 0 ? "+" : ""}${fmt(selectedStats.net)} ₽`} />
                <MetricCard label="Оборот" value={`${fmt(selectedStats.revenue)} ₽`} />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Категория</th>
                      <th>Цена</th>
                      <th>Комиссия</th>
                      <th>Выставление</th>
                      <th>Поднятие</th>
                      <th>Профит</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.orders.map((o) => {
                      const p = products.find((x) => Number(x.id) === Number(o.product_id));
                      const c = categories.find((x) => Number(x.id) === Number(p?.category_id));
                      if (!p) return null;
                      const tariff = getTariffByPrice(o.sale_price, p.sale_commission);
                      const profit = calcProfit({
                        salePrice: o.sale_price,
                        buyUsd: p.purchase_usd,
                        playerokRate: selected.playerokRate,
                        saleCommission: p.sale_commission,
                      });
                      const net = profit - Number(o.bump_amount || 0) - tariff.listing;

                      return (
                        <tr key={o.id} className="tr">
                          <td style={{ fontWeight: 700 }}>{p.name}</td>
                          <td>{c?.name || "—"}</td>
                          <td>{fmt(o.sale_price)} ₽</td>
                          <td>{p.sale_commission}%</td>
                          <td>{fmt(tariff.listing)} ₽</td>
                          <td>{fmt(o.bump_amount || 0)} ₽</td>
                          <td style={{ fontWeight: 700 }}>{net >= 0 ? "+" : ""}{fmt(net)} ₽</td>
                        </tr>
                      );
                    })}
                    {!selected.orders.length && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "var(--text3)" }}>
                          Продаж нет
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddCategoryModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim() });
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить категорию">
      <FI label="Название" value={name} onChange={(e) => setName(e.target.value)} placeholder="Steam" />
      <MFoot onClose={onClose} onSubmit={submit} label="Добавить" />
    </Modal>
  );
}

function AddProductModal({ open, onClose, categories, onAdd }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [purchaseUsd, setPurchaseUsd] = useState("");
  const [saleCommission, setSaleCommission] = useState(10);

  useEffect(() => {
    if (open) {
      setName("");
      setCategoryId(categories[0]?.id || "");
      setSalePrice("");
      setPurchaseUsd("");
      setSaleCommission(10);
    }
  }, [open, categories]);

  const tariff = getTariffByPrice(Number(salePrice || 0), saleCommission);

  const submit = () => {
    if (!name.trim() || !categoryId || !salePrice) return;
    onAdd({
      name: name.trim(),
      category_id: Number(categoryId),
      sale_price_rub: Number(salePrice),
      purchase_usd: Number(purchaseUsd || 0),
      sale_commission: Number(saleCommission),
      status: "active",
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить товар">
      <FI label="Название" value={name} onChange={(e) => setName(e.target.value)} placeholder="Steam 20$" />
      <FS
        label="Категория"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={[
          { value: "", label: "— выберите —" },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ]}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <FI label="Цена товара (₽)" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
        <FI label="Закупка ($)" type="number" value={purchaseUsd} onChange={(e) => setPurchaseUsd(e.target.value)} />
      </div>
      <FS
        label="Комиссия с продажи"
        value={saleCommission}
        onChange={(e) => setSaleCommission(Number(e.target.value))}
        options={[
          { value: 10, label: "10%" },
          { value: 20, label: "20%" },
        ]}
      />
      <div className="note-box" style={{ marginTop: 10 }}>
        Выставление: <b>{fmt(tariff.listing)} ₽</b> · Поднятие: <b>{fmt(tariff.bump)} ₽</b>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} label="Добавить" />
    </Modal>
  );
}

function EditProductModal({ open, onClose, product, categories, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (product && open) {
      setForm({
        name: product.name || "",
        category_id: product.category_id || "",
        sale_price_rub: product.sale_price_rub || "",
        purchase_usd: product.purchase_usd || "",
        sale_commission: product.sale_commission || 10,
        status: product.status || "active",
      });
    }
  }, [product, open]);

  if (!form) return null;

  const tariff = getTariffByPrice(form.sale_price_rub, form.sale_commission);

  const submit = () => {
    onSave(product.id, {
      ...form,
      category_id: Number(form.category_id),
      sale_price_rub: Number(form.sale_price_rub),
      purchase_usd: Number(form.purchase_usd || 0),
      sale_commission: Number(form.sale_commission || 10),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать товар">
      <FI label="Название" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
      <FS
        label="Категория"
        value={form.category_id}
        onChange={(e) => setForm((s) => ({ ...s, category_id: e.target.value }))}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <FI label="Цена товара (₽)" type="number" value={form.sale_price_rub} onChange={(e) => setForm((s) => ({ ...s, sale_price_rub: e.target.value }))} />
        <FI label="Закупка ($)" type="number" value={form.purchase_usd} onChange={(e) => setForm((s) => ({ ...s, purchase_usd: e.target.value }))} />
      </div>
      <FS
        label="Комиссия с продажи"
        value={form.sale_commission}
        onChange={(e) => setForm((s) => ({ ...s, sale_commission: Number(e.target.value) }))}
        options={[
          { value: 10, label: "10%" },
          { value: 20, label: "20%" },
        ]}
      />
      <FS
        label="Статус"
        value={form.status}
        onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
        options={[
          { value: "active", label: "Активен" },
          { value: "inactive", label: "Неактивен" },
        ]}
      />
      <div className="note-box" style={{ marginTop: 10 }}>
        Выставление: <b>{fmt(tariff.listing)} ₽</b> · Поднятие: <b>{fmt(tariff.bump)} ₽</b>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} label="Сохранить" />
    </Modal>
  );
}

function AddWorkerModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [share, setShare] = useState(50);
  const [keyValue, setKeyValue] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setShare(50);
      setKeyValue(`worker-${Math.random().toString(36).slice(2, 8)}`);
    }
  }, [open]);

  const submit = () => {
    if (!name.trim() || !keyValue.trim()) return;
    onAdd({
      name: name.trim(),
      share: Number(share) || 50,
      key: keyValue.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить воркера">
      <FI label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
      <FI label="Доля (%)" type="number" value={share} onChange={(e) => setShare(e.target.value)} />
      <FI label="Ключ" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} />
      <MFoot onClose={onClose} onSubmit={submit} label="Создать" />
    </Modal>
  );
}

const GLOBAL_STYLES = `
:root{
  --bg:#07050a;
  --bg2:#0d0913;
  --bg3:#140f1d;
  --card:rgba(18,12,24,.96);
  --border:rgba(168,85,247,.12);
  --border2:rgba(168,85,247,.24);
  --text:#f5ebff;
  --text2:#dccff3;
  --text3:#9f91b9;
  --accent:#a855f7;
  --accent2:#7e22ce;
  --success:#f2e7ff;
  --danger:#cbbad9;
  --warning:#d8b4fe;
  --r:12px;
  --r2:18px;
}
*{box-sizing:border-box}
html,body,#root{margin:0;min-height:100%;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
body{
  background:
  radial-gradient(circle at top left, rgba(168,85,247,.08), transparent 28%),
  radial-gradient(circle at bottom right, rgba(126,34,206,.08), transparent 26%),
  #07050a
}
.pa{animation:fadeIn .22s ease}
.card{
  background:linear-gradient(180deg, rgba(24,16,31,.96), rgba(16,10,22,.96));
  border:1px solid var(--border);
  border-radius:var(--r2);
  padding:16px;
  box-shadow:0 12px 34px rgba(0,0,0,.32);
  backdrop-filter:blur(8px);
}
.soft-rise{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.soft-rise:hover{transform:translateY(-2px);border-color:var(--border2);box-shadow:0 18px 42px rgba(0,0,0,.36)}
.fi{
  width:100%;
  background:#110d17;
  border:1px solid rgba(168,85,247,.16);
  border-radius:12px;
  color:var(--text);
  padding:11px 12px;
  outline:none;
  font-size:13px;
  transition:border-color .16s ease, box-shadow .16s ease;
}
.fi:focus{
  border-color:rgba(168,85,247,.5);
  box-shadow:0 0 0 4px rgba(168,85,247,.12);
}
.btn-p,.btn-g,.btn-i,.cnt,.chip,.switcher-btn,.auth-submit{
  border:none;
  font-family:inherit;
}
.btn-p{
  background:linear-gradient(135deg,#a855f7,#7e22ce);
  color:#fff;
  border-radius:10px;
  padding:9px 13px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:7px;
  transition:transform .12s ease, opacity .12s ease;
  box-shadow:0 8px 26px rgba(168,85,247,.22);
}
.btn-p:hover{transform:translateY(-1px)}
.btn-p:active{transform:scale(.97)}
.btn-g{
  background:#140f1d;
  color:var(--text);
  border:1px solid var(--border);
  border-radius:10px;
  padding:9px 13px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:7px;
  transition:transform .12s ease,border-color .16s ease,background .16s ease;
}
.btn-g:hover{transform:translateY(-1px);border-color:var(--border2);background:#181221}
.btn-i{
  width:26px;
  height:26px;
  border-radius:8px;
  background:#130f1b;
  color:var(--text2);
  border:1px solid var(--border);
  display:grid;
  place-items:center;
  cursor:pointer;
  transition:all .14s ease;
}
.btn-i:hover{border-color:var(--border2);color:#fff;transform:translateY(-1px)}
.btn-i.d:hover{background:#1a1323}
.badge{
  display:inline-flex;
  align-items:center;
  gap:6px;
  border-radius:999px;
  padding:4px 9px;
  font-size:10.5px;
  font-weight:700;
  letter-spacing:.03em;
}
.cnt{
  width:26px;
  height:26px;
  border-radius:8px;
  background:#130f1b;
  color:#fff;
  border:1px solid var(--border);
  cursor:pointer;
  transition:all .14s ease;
}
.cnt:hover{border-color:var(--border2);transform:translateY(-1px)}
.nav-item{
  display:flex;
  align-items:center;
  gap:10px;
  padding:11px 12px;
  margin-bottom:4px;
  border-radius:12px;
  color:var(--text3);
  font-size:13px;
  font-weight:700;
  cursor:pointer;
  transition:all .14s ease;
}
.nav-item:hover{background:#171120;color:var(--text)}
.nav-item.active{
  background:linear-gradient(180deg, rgba(168,85,247,.16), rgba(168,85,247,.08));
  color:#fff;
  border:1px solid rgba(168,85,247,.28);
}
table{width:100%;border-collapse:collapse}
th{
  text-align:left;
  padding:12px 14px;
  font-size:10.5px;
  color:var(--text3);
  text-transform:uppercase;
  letter-spacing:.08em;
  border-bottom:1px solid var(--border);
  white-space:nowrap;
}
td{
  padding:12px 14px;
  border-bottom:1px solid rgba(168,85,247,.08);
  font-size:12px;
}
.tr:hover{background:rgba(168,85,247,.04)}
.block-title{
  font-size:13px;
  font-weight:800;
  color:var(--text);
  margin-bottom:14px;
  padding-bottom:12px;
  border-bottom:1px solid var(--border);
}
.note-box{
  padding:13px 14px;
  background:rgba(168,85,247,.06);
  border:1px solid rgba(168,85,247,.14);
  border-radius:12px;
  color:var(--text2);
  font-size:12px;
}
.section-caption{
  font-size:10.5px;
  color:var(--text3);
  text-transform:uppercase;
  letter-spacing:.08em;
  font-weight:700;
  margin-bottom:8px;
}
.chip{
  padding:6px 12px;
  border-radius:999px;
  background:#140f1d;
  color:var(--text2);
  border:1px solid var(--border);
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  transition:all .14s ease;
}
.chip.active{background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;border-color:#a855f7}
.cat-pill{
  display:flex;
  align-items:center;
  gap:5px;
  padding:5px 9px;
  background:#140f1d;
  border-radius:9px;
  border:1px solid var(--border);
}
.cat-tag{
  font-size:11px;
  color:#f3e8ff;
  background:rgba(168,85,247,.12);
  display:inline-block;
  padding:3px 8px;
  border-radius:7px;
  margin-bottom:9px;
  border:1px solid rgba(168,85,247,.18);
}
.mini-stat{
  text-align:center;
  background:#130f1b;
  border-radius:12px;
  border:1px solid var(--border);
  padding:12px 6px;
}
.error-box{
  font-size:12px;
  color:#f3e8ff;
  padding:9px 11px;
  background:rgba(168,85,247,.08);
  border-radius:10px;
  margin-bottom:12px;
  border:1px solid rgba(168,85,247,.18);
}
.auth-wrap{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  overflow:hidden;
  background:#07050a;
}
.auth-glow{
  position:fixed;
  inset:0;
  background:
   radial-gradient(circle at 20% 20%, rgba(168,85,247,.09), transparent 26%),
   radial-gradient(circle at 80% 80%, rgba(126,34,206,.08), transparent 28%);
  pointer-events:none;
}
.auth-card{
  width:390px;
  max-width:94vw;
  background:rgba(18,12,24,.96);
  border:1px solid rgba(168,85,247,.16);
  border-radius:22px;
  padding:34px 32px;
  box-shadow:0 40px 100px rgba(0,0,0,.6);
  animation:scaleIn .3s ease;
  position:relative;
  z-index:1;
}
.logo-box{
  width:46px;
  height:46px;
  border-radius:14px;
  background:linear-gradient(135deg,#a855f7,#7e22ce);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:20px;
  margin:0 auto 12px;
  box-shadow:0 10px 30px rgba(168,85,247,.18);
}
.switcher{
  display:flex;
  background:#110d17;
  border-radius:12px;
  padding:3px;
  margin-bottom:20px;
  gap:3px;
  border:1px solid var(--border);
}
.switcher-btn{
  flex:1;
  padding:8px 0;
  border-radius:9px;
  cursor:pointer;
  font-weight:700;
  font-size:13px;
  transition:all .16s ease;
  background:transparent;
  color:var(--text3);
}
.switcher-btn.active{
  background:linear-gradient(135deg,#a855f7,#7e22ce);
  color:#fff;
}
.auth-submit{
  width:100%;
  padding:11px;
  border-radius:12px;
  background:linear-gradient(135deg,#a855f7,#7e22ce);
  color:#fff;
  font-size:14px;
  font-weight:800;
  cursor:pointer;
  transition:transform .12s ease, opacity .12s ease;
}
.auth-submit:hover{transform:translateY(-1px)}
.auth-submit:active{transform:scale(.98)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideR{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@media (max-width: 1100px){
  .grid-3{grid-template-columns:repeat(2,1fr)!important}
}
@media (max-width: 900px){
  .mobile-stack{grid-template-columns:1fr!important}
}
`;

export default function App() {
  const [auth, setAuth] = useState(null);
  const [page, setPage] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [googleRate, _setGR] = useState(() => ls(LS.googleRate, 91.4));
  const [playerokRate, _setPR] = useState(() => ls(LS.playerokRate, 88.0));
  const [workerShares, setWorkerShares] = useState(() => ls(LS.workerShares, {}));
  const [dailyCounts, setDailyCounts] = useState(() => ls(LS.dailyCounts, {}));
  const [workDays, setWorkDays] = useState(() => ls(LS.workDays, []));

  const [selectedWorkDayId, setSelectedWorkDayId] = useState(null);

  const [playerokStats, setPlayerokStats] = useState({
  reviews: 0,
  rating: 0,
  balance_total: 0,
  balance_available: 0,
  balance_frozen: 0,
  balance_withdrawable: 0,
  pending_income: 0,
  pending_orders: 0,
  completed_today: 0,
  last_sync_at: null,
  sync_ok: false,
 });

  const [playerokOrders, setPlayerokOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [statsLoading, setStatsLoading] = useState(false);
  const [modals, setModals] = useState({});
  const [editTarget, setEditTarget] = useState(null);

  const { toast, show: showToast } = useToast();

  const setGR = (v) => {
    _setGR(v);
    lsSet(LS.googleRate, v);
  };

  const setPR = (v) => {
    _setPR(v);
    lsSet(LS.playerokRate, v);
  };

  const openM = (name) => setModals((m) => ({ ...m, [name]: true }));
  const closeM = (name) => setModals((m) => ({ ...m, [name]: false }));

  const loadPlayerokStats = useCallback(async () => {
  if (!BACKEND_URL) return;

  try {
    setStatsLoading(true);
    const res = await fetch(`${BACKEND_URL}/stats`);
    if (!res.ok) throw new Error("Не удалось загрузить stats");
    const data = await res.json();
    setPlayerokStats(data);
  } catch (e) {
    console.error("Ошибка загрузки Playerok stats:", e);
  } finally {
    setStatsLoading(false);
  }
}, []);

  const loadPlayerokOrders = useCallback(async () => {
  if (!BACKEND_URL) return;

  try {
    setOrdersLoading(true);
    const res = await fetch(`${BACKEND_URL}/orders`);
    if (!res.ok) throw new Error("Не удалось загрузить orders");
    const data = await res.json();
    setPlayerokOrders(Array.isArray(data.orders) ? data.orders : []);
  } catch (e) {
    console.error("Ошибка загрузки Playerok orders:", e);
  } finally {
    setOrdersLoading(false);
  }
}, []);
  useEffect(() => {
    lsSet(LS.workDays, workDays);
  }, [workDays]);

  useEffect(() => {
    lsSet(LS.workerShares, workerShares);
  }, [workerShares]);

  useEffect(() => {
    lsSet(LS.dailyCounts, dailyCounts);
  }, [dailyCounts]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data: p }) => {
        setAuth({ user: session.user, role: p?.role || "admin", session });
      });
    });
  }, []);

  useEffect(() => {
    if (auth) loadData();
  }, [auth]);
  useEffect(() => {
  if (!BACKEND_URL) return;

  loadPlayerokStats();

  const timer = setInterval(() => {
    loadPlayerokStats();
  }, 30000);

  return () => clearInterval(timer);
 }, [loadPlayerokStats]);
 
 useEffect(() => {
  if (!BACKEND_URL) return;

  loadPlayerokOrders();

  const timer = setInterval(() => {
    loadPlayerokOrders();
  }, 15000);

  return () => clearInterval(timer);
 }, [loadPlayerokOrders]);

  const loadDemo = () => {
    setCategories([
      { id: 1, name: "Steam" },
      { id: 2, name: "Valorant" },
      { id: 3, name: "Roblox" },
    ]);

    setProducts([
      { id: 1, name: "Steam 10$", category_id: 1, category: "Steam", sale_price_rub: 1050, purchase_usd: 10, sale_commission: 10, status: "active" },
      { id: 2, name: "Steam 20$", category_id: 1, category: "Steam", sale_price_rub: 2050, purchase_usd: 20, sale_commission: 10, status: "active" },
      { id: 3, name: "Valorant 1000VP", category_id: 2, category: "Valorant", sale_price_rub: 750, purchase_usd: 7.5, sale_commission: 20, status: "active" },
      { id: 4, name: "Roblox 400R$", category_id: 3, category: "Roblox", sale_price_rub: 350, purchase_usd: 3.5, sale_commission: 10, status: "active" },
    ]);

    setWorkers([{ id: 1, name: "Артём", key: "worker-demo", share: 50 }]);

    const demoDays = ls(LS.workDays, []);
    if (!demoDays.length) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yIso = yesterday.toISOString().slice(0, 10);
      const tIso = todayKey();

      const sample = [
        {
          id: 1001,
          date: yIso,
          status: "closed",
          playerokRate: 88,
          orders: [
            { id: 1, product_id: 1, sale_price: 1050, bump_amount: 9, created_at: new Date(yesterday).toISOString() },
            { id: 2, product_id: 2, sale_price: 2050, bump_amount: 25, created_at: new Date(yesterday).toISOString() },
          ],
        },
        {
          id: 1002,
          date: tIso,
          status: "open",
          playerokRate: 88,
          orders: [],
        },
      ];
      setWorkDays(sample);
      setSelectedWorkDayId(sample[0].id);
    } else {
      setSelectedWorkDayId(demoDays[0]?.id || null);
    }
  };

  const loadData = async () => {
    if (!supabase) {
      loadDemo();
      return;
    }

    const isAdmin = auth?.role === "admin";

    const [cats, prods, wks] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*, categories(name)").order("name"),
      isAdmin ? supabase.from("worker_keys").select("*") : Promise.resolve({ data: [] }),
    ]);

    setCategories(cats.data || []);
    setProducts((prods.data || []).map((p) => ({ ...p, category: p.categories?.name || "" })));
    setWorkers(wks.data || []);
    setSelectedWorkDayId((prev) => prev ?? ls(LS.workDays, [])[0]?.id ?? null);
  };

  const getWorkDayStats = useCallback((day) => {
    if (!day) return { qty: 0, revenue: 0, listing: 0, bumps: 0, gross: 0, net: 0 };

    const totals = day.orders.reduce(
      (acc, o) => {
        const p = products.find((x) => Number(x.id) === Number(o.product_id));
        if (!p) return acc;
        const tariff = getTariffByPrice(o.sale_price, p.sale_commission);
        const gross = calcProfit({
          salePrice: o.sale_price,
          buyUsd: p.purchase_usd,
          playerokRate: day.playerokRate || playerokRate,
          saleCommission: p.sale_commission,
        });
        acc.qty += 1;
        acc.revenue += Number(o.sale_price || 0);
        acc.listing += tariff.listing;
        acc.bumps += Number(o.bump_amount || 0);
        acc.gross += gross;
        acc.net += gross - tariff.listing - Number(o.bump_amount || 0);
        return acc;
      },
      { qty: 0, revenue: 0, listing: 0, bumps: 0, gross: 0, net: 0 }
    );

    return {
      qty: Math.round(totals.qty),
      revenue: Math.round(totals.revenue),
      listing: Math.round(totals.listing),
      bumps: Math.round(totals.bumps),
      gross: Math.round(totals.gross),
      net: Math.round(totals.net),
    };
  }, [products, playerokRate]);

  const currentOpenDay = workDays.find((d) => d.status === "open") || null;
  const currentOpenDayId = currentOpenDay?.id || null;
  const currentOpenStats = currentOpenDay ? getWorkDayStats(currentOpenDay) : null;

  const openWorkDay = () => {
    const existing = workDays.find((d) => d.status === "open");
    if (existing) {
      showToast("Рабочий день уже открыт", "err");
      setSelectedWorkDayId(existing.id);
      return;
    }

    const day = {
      id: Date.now(),
      date: todayKey(),
      status: "open",
      playerokRate,
      orders: [],
    };

    const next = [day, ...workDays];
    setWorkDays(next);
    setSelectedWorkDayId(day.id);
    showToast("Рабочий день открыт");
  };

  const closeCurrentWorkDay = () => {
    const existing = workDays.find((d) => d.status === "open");
    if (!existing) {
      showToast("Нет открытого рабочего дня", "err");
      return;
    }

    const next = workDays.map((d) =>
      d.id === existing.id
        ? { ...d, status: "closed", playerokRate: existing.playerokRate || playerokRate }
        : d
    );
    setWorkDays(next);
    showToast("Рабочий день закрыт");
  };

  const addOrderToCurrentDay = (productId, salePrice, bumpAmount = 0) => {
    const openDay = workDays.find((d) => d.status === "open");
    if (!openDay) {
      showToast("Сначала открой рабочий день", "err");
      return false;
    }

    const newOrder = {
      id: Date.now(),
      product_id: Number(productId),
      sale_price: Number(salePrice),
      bump_amount: Number(bumpAmount || 0),
      created_at: new Date().toISOString(),
    };

    const next = workDays.map((d) =>
      d.id === openDay.id ? { ...d, orders: [...d.orders, newOrder] } : d
    );

    setWorkDays(next);
    setSelectedWorkDayId(openDay.id);
    return true;
  };

  const dk = todayKey();
  const dayEntry = dailyCounts[dk] || {};

  const updateDay = (productId, field, delta) => {
    const prev = dailyCounts[dk]?.[productId] || { qty: 0, bumps: 0 };
    const next = { ...prev, [field]: Math.max(0, Number(prev[field] || 0) + Number(delta || 0)) };
    const upd = { ...dailyCounts, [dk]: { ...(dailyCounts[dk] || {}), [productId]: next } };
    setDailyCounts(upd);
  };

  const totalQtyToday = Object.values(dayEntry).reduce((s, e) => s + Number(e.qty || 0), 0);
  const totalBumpsToday = Object.values(dayEntry).reduce((s, e) => s + Number(e.bumps || 0), 0);

  const grossToday = products.reduce((sum, p) => {
    const e = dayEntry[p.id] || { qty: 0 };
    return sum + Math.round(calcProfit({
      salePrice: p.sale_price_rub,
      buyUsd: p.purchase_usd,
      playerokRate,
      saleCommission: p.sale_commission,
    })) * Number(e.qty || 0);
  }, 0);

  const netToday = grossToday - totalBumpsToday;

  const closedDaysProfit = workDays
    .filter((d) => d.status === "closed")
    .reduce((s, d) => s + getWorkDayStats(d).net, 0);

  const openDayProfit = currentOpenDay ? getWorkDayStats(currentOpenDay).net : 0;
  const totalProfit = closedDaysProfit + openDayProfit;

  const chartData = workDays
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-7)
    .map((d) => ({
      l: toRuDate(d.date).slice(0, 5),
      v: Math.max(0, getWorkDayStats(d).net),
    }));

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setAuth(null);
  };

  if (!auth) return <AuthScreen onLogin={setAuth} />;

  const isAdmin = auth.role === "admin";

  const navItems = [
    { id: "dashboard", label: "Панель", icon: "dashboard" },
    { id: "workdays", label: "Рабочие дни", icon: "workdays" },
    { id: "calc", label: "Калькулятор", icon: "calc" },
    { id: "catalog", label: "Каталог", icon: "catalog" },
    { id: "rate", label: "Курс", icon: "rate" },
    ...(isAdmin ? [{ id: "admin", label: "Админка", icon: "admin" }] : []),
  ];

  const sortedTradeProducts = products
    .filter((p) => p.status === "active")
    .sort((a, b) => {
      const aQty = Number(dayEntry[a.id]?.qty || 0);
      const bQty = Number(dayEntry[b.id]?.qty || 0);
      return bQty - aQty;
    });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <style>{GLOBAL_STYLES}</style>

      <aside
        style={{
          width: 215,
          background: "rgba(13,9,19,.95)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ padding: "18px 14px 12px", display: "flex", alignItems: "center", gap: 9 }}>
          <div className="logo-box" style={{ width: 34, height: 34, margin: 0, fontSize: 15 }}>
            ◼
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)" }}>Playerok</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>Tracker</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "4px 8px" }}>
          {navItems.map((item) => (
            <div key={item.id} className={`nav-item${page === item.id ? " active" : ""}`} onClick={() => setPage(item.id)}>
              <Icon name={item.icon} size={14} color={page === item.id ? "#fff" : "currentColor"} />
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: 8, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 9px", borderRadius: 12, background: "#140f1d", border: "1px solid var(--border)" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#a855f7,#7e22ce)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {isAdmin ? "A" : auth.workerData?.name?.[0] || "W"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isAdmin ? "Admin" : auth.workerData?.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>
                {isAdmin ? "Управляющий" : "Воркер"}
              </div>
            </div>
            <button className="btn-i" onClick={logout}>
              <Icon name="logout" size={12} />
            </button>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: 215, flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: 56,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            background: "rgba(13,9,19,.88)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
            {navItems.find((n) => n.id === page)?.label}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              onClick={() => setPage("rate")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 10,
                background: "#140f1d",
                border: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--text2)",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: "fadeIn 1.2s infinite alternate" }} />
              {fmtF(googleRate)} ₽/$
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "18px 22px", overflowY: "auto" }}>
          {page === "dashboard" && (
            
            <div className="pa">
              <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11, marginBottom: 16 }}>
                <MetricCard
                  label="Профит сегодня"
                  value={`${(currentOpenStats?.net || netToday) >= 0 ? "+" : ""}${fmt(currentOpenStats?.net || netToday)} ₽`}
                  sub={currentOpenDay ? `${toRuDate(currentOpenDay.date)} · открыт` : "день не открыт"}
                  delay={0}
                />
                <MetricCard
                  label="Общий профит"
                  value={`${totalProfit >= 0 ? "+" : ""}${fmt(totalProfit)} ₽`}
                  sub={`${workDays.filter((d) => d.status === "closed").length} закрытых дней`}
                  delay={0.05}
                />
                <MetricCard
                  label="Продажи сегодня"
                  value={String(currentOpenStats?.qty || totalQtyToday)}
                  sub={`${currentOpenStats?.revenue ? fmt(currentOpenStats.revenue) + " ₽ оборот" : "нет продаж"}`}
                  delay={0.1}
                />
              </div>
              
 <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 16,
  }}
 >
  <MetricCard
    label="Отзывы"
    value={String(playerokStats.reviews || 0)}
    sub={playerokStats.sync_ok ? `Рейтинг ${playerokStats.rating || 0}` : "нет синхронизации"}
  />
  <MetricCard
    label="Баланс"
    value={`${rub(playerokStats.balance_total)} ₽`}
    sub={`К выводу ${rub(playerokStats.balance_available)} ₽`}
  />
  <MetricCard
    label="В ожидании"
    value={String(playerokStats.pending_orders || 0)}
    sub={`Pending income ${rub(playerokStats.pending_income)} ₽`}
  />
  <MetricCard
    label="Выполнено за день"
    value={String(playerokStats.completed_today || 0)}
    sub={
      statsLoading
        ? "обновляем..."
        : playerokStats.sync_ok
        ? "синхронизировано"
        : "нет синхронизации"
    }
  />
 </div>
              <div
  className="mobile-stack"
  style={{
    display: "grid",
    gridTemplateColumns: "220px 320px 1fr",
    gap: 12,
    marginBottom: 16,
    alignItems: "start",
  }}
>
  <div className="card" style={{ padding: "14px 16px", minHeight: 150 }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
      Профит по дням
    </div>
    <MiniBar data={chartData.length ? chartData : [{ l: "—", v: 0 }]} />
  </div>

  <div className="card" style={{ padding: "14px 16px", minHeight: 150 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
        Live покупки
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)" }}>
        {ordersLoading ? "..." : playerokOrders.length}
      </div>
    </div>

    <div style={{ display: "grid", gap: 8 }}>
      {playerokOrders.slice(0, 4).map((order) => {
        const price = order.item?.price || order.item?.raw_price || 0;

        return (
          <div
            key={order.id}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(168,85,247,.05)",
              border: "1px solid rgba(168,85,247,.12)",
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: 4,
              }}
            >
              {order.item?.name || "Без названия"}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 11, color: "var(--text2)" }}>
                {rub(price)} ₽
              </span>

              <Badge
                status={
                  order.status === "CONFIRMED" || order.status === "CONFIRMED_AUTOMATICALLY"
                    ? "sold"
                    : "open"
                }
              />
            </div>
          </div>
        );
      })}

      {!playerokOrders.length && (
        <div style={{ color: "var(--text3)", fontSize: 12 }}>
          Пока нет данных
        </div>
      )}
    </div>
  </div>

  <div className="card" style={{ padding: "14px 16px", minHeight: 150 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
        Рабочий день
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-p" onClick={openWorkDay}>
          Открыть рабочий день
        </button>
        <button className="btn-g" onClick={closeCurrentWorkDay}>
          Закрыть рабочий день
        </button>
      </div>
    </div>

    <div className="note-box">
      {currentOpenDay ? (
        <>
          Открыт день <b>{toRuDate(currentOpenDay.date)}</b> · продаж{" "}
          <b>{currentOpenStats?.qty || 0}</b> · профит{" "}
          <b>
            {(currentOpenStats?.net || 0) >= 0 ? "+" : ""}
            {fmt(currentOpenStats?.net || 0)} ₽
          </b>
        </>
      ) : (
        <>Сейчас нет открытого рабочего дня</>
      )}
    </div>
  </div>
 </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                    Торговая таблица · {new Date().toLocaleDateString("ru-RU")}
                  </span>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      Сортировка по количеству продаж
                    </span>
                    <button
                      className="btn-g"
                      style={{ fontSize: 11, padding: "4px 9px" }}
                      onClick={() => {
                        if (!window.confirm("Сбросить счётчики сегодня?")) return;
                        const upd = { ...dailyCounts };
                        delete upd[dk];
                        setDailyCounts(upd);
                        showToast("Счётчики сброшены");
                      }}
                    >
                      Сбросить
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Лот</th>
                        <th>Категория</th>
                        <th>Цена товара</th>
                        <th>Закуп / ед</th>
                        <th>Профит / ед</th>
                        <th>Количество</th>
                        <th>Поднятия</th>
                        <th>Итог</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTradeProducts.map((p) => {
                        const e = dayEntry[p.id] || { qty: 0, bumps: 0 };
                        const pp = Math.round(
                          calcProfit({
                            salePrice: p.sale_price_rub,
                            buyUsd: p.purchase_usd,
                            playerokRate,
                            saleCommission: p.sale_commission,
                          })
                        );
                        const tariff = getTariffByPrice(p.sale_price_rub, p.sale_commission);
                        const bumpStep = tariff.bump;
                        const total = pp * Number(e.qty || 0) - Number(e.bumps || 0);
                        const category = categories.find((c) => Number(c.id) === Number(p.category_id));

                        return (
                          <tr key={p.id} className="tr">
                            <td style={{ fontWeight: 700, color: "var(--text)", fontSize: 13 }}>{p.name}</td>
                            <td>
                              <span className="cat-tag" style={{ marginBottom: 0 }}>
                                {category?.name || "—"}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: "var(--text)" }}>{fmt(p.sale_price_rub)} ₽</td>
                            <td style={{ color: "var(--text3)" }}>${fmtF(p.purchase_usd)}</td>
                            <td style={{ fontWeight: 800, color: pp >= 0 ? "var(--success)" : "var(--danger)" }}>
                              {pp >= 0 ? "+" : ""}{fmt(pp)} ₽
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button className="cnt" onClick={() => updateDay(p.id, "qty", -1)}>−</button>
                                <span style={{ fontWeight: 800, color: "var(--text)", fontSize: 15, minWidth: 22, textAlign: "center" }}>
                                  {e.qty || 0}
                                </span>
                                <button className="cnt" onClick={() => updateDay(p.id, "qty", 1)}>+</button>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <button className="cnt" onClick={() => updateDay(p.id, "bumps", -bumpStep)}>−</button>
                                  <span style={{ fontWeight: 700, color: Number(e.bumps || 0) > 0 ? "var(--warning)" : "var(--text3)", fontSize: 12, minWidth: 48, textAlign: "center" }}>
                                    {Number(e.bumps || 0) > 0 ? `−${fmt(e.bumps)} ₽` : "0"}
                                  </span>
                                  <button className="cnt" onClick={() => updateDay(p.id, "bumps", bumpStep)}>+</button>
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text3)" }}>шаг: {fmt(bumpStep)} ₽</div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 800, fontSize: 13, color: Number(e.qty || 0) > 0 || Number(e.bumps || 0) > 0 ? total >= 0 ? "var(--success)" : "var(--danger)" : "var(--text3)" }}>
                              {Number(e.qty || 0) > 0 || Number(e.bumps || 0) > 0 ? `${total >= 0 ? "+" : ""}${fmt(total)} ₽` : "—"}
                            </td>
                          </tr>
                        );
                      })}

                      {!sortedTradeProducts.length && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text3)" }}>
                            Товаров нет — добавь в Каталоге
                          </td>
                        </tr>
                      )}

                      <tr style={{ background: "rgba(168,85,247,.05)" }}>
                        <td colSpan={5} style={{ fontWeight: 800, color: "var(--text)", fontSize: 12, borderTop: "1px solid var(--border2)" }}>
                          ИТОГО
                        </td>
                        <td style={{ fontWeight: 800, color: "var(--text)", borderTop: "1px solid var(--border2)" }}>
                          {totalQtyToday}
                        </td>
                        <td style={{ color: totalBumpsToday > 0 ? "var(--warning)" : "var(--text3)", fontWeight: 700, borderTop: "1px solid var(--border2)" }}>
                          {totalBumpsToday > 0 ? `−${fmt(totalBumpsToday)} ₽` : "—"}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: 14, color: netToday >= 0 ? "var(--success)" : "var(--danger)", borderTop: "1px solid var(--border2)" }}>
                          {netToday >= 0 ? "+" : ""}{fmt(netToday)} ₽
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {page === "workdays" && (
            <WorkDaysPage
              workDays={workDays}
              currentOpenDayId={currentOpenDayId}
              openWorkDay={openWorkDay}
              closeCurrentWorkDay={closeCurrentWorkDay}
              selectedWorkDayId={selectedWorkDayId}
              setSelectedWorkDayId={setSelectedWorkDayId}
              getWorkDayStats={getWorkDayStats}
              products={products}
              categories={categories}
            />
          )}

          {page === "calc" && <CalcPage products={products} playerokRate={playerokRate} />}

          {page === "catalog" && (
            <CatalogPage
              products={products}
              setProducts={setProducts}
              categories={categories}
              setCategories={setCategories}
              playerokRate={playerokRate}
              isAdmin={isAdmin}
              openM={openM}
              setEditTarget={setEditTarget}
              showToast={showToast}
            />
          )}

          {page === "rate" && (
            <RatePage
              googleRate={googleRate}
              setGR={setGR}
              playerokRate={playerokRate}
              setPR={setPR}
              isAdmin={isAdmin}
              showToast={showToast}
            />
          )}

          {page === "admin" && isAdmin && (
            <div className="pa">
              <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 12 }}>
                <div className="card">
                  <div className="block-title">Воркеры</div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <button className="btn-p" onClick={() => openM("addWorker")}>
                      <Icon name="plus" size={12} color="#fff" /> Добавить воркера
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {workers.map((wk) => {
                      const workerProfit = workDays.reduce((sum, day) => {
                        const stats = getWorkDayStats(day);
                        const share = workerShares[day.id] ?? wk.share ?? 50;
                        return sum + Math.round(stats.net * (share / 100));
                      }, 0);

                      return (
                        <div key={wk.id} className="card" style={{ padding: 12, background: "#140f1d" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#7e22ce)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                              {wk.name?.[0] || "W"}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{wk.name}</div>
                              <div style={{ fontSize: 10, color: "var(--text3)" }}>{wk.share}%</div>
                              <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text2)", background: "rgba(168,85,247,.08)", padding: "1px 5px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>
                                {wk.key}
                              </div>
                            </div>

                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--success)", whiteSpace: "nowrap" }}>
                              +{fmt(workerProfit)} ₽
                            </div>

                            <button
                              className="btn-i d"
                              onClick={async () => {
                                if (!window.confirm("Удалить воркера?")) return;
                                if (supabase) await supabase.from("worker_keys").delete().eq("id", wk.id);
                                setWorkers((prev) => prev.filter((x) => x.id !== wk.id));
                                showToast("Воркер удалён");
                              }}
                            >
                              <Icon name="x" size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {!workers.length && <div style={{ color: "var(--text3)", fontSize: 12 }}>Воркеров пока нет</div>}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div className="card">
                    <div className="block-title">Настройки</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn-g"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify({ workDays, workers, products, categories }, null, 2)], {
                            type: "application/json",
                          });
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = "playerok-backup.json";
                          a.click();
                          showToast("Экспорт готов");
                        }}
                      >
                        ↓ Экспорт JSON
                      </button>

                      <button className="btn-g" onClick={loadData}>
                        <Icon name="refresh" size={12} /> Обновить данные
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="block-title">Статистика</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div className="mini-stat">
                        <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Товаров</div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{products.length}</div>
                      </div>
                      <div className="mini-stat">
                        <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Категорий</div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{categories.length}</div>
                      </div>
                      <div className="mini-stat">
                        <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Рабочих дней</div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{workDays.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AddCategoryModal
        open={!!modals.addCategory}
        onClose={() => closeM("addCategory")}
        onAdd={async ({ name }) => {
          if (supabase) {
            const { data } = await supabase.from("categories").insert([{ name }]).select().single();
            setCategories((prev) => [...prev, data]);
          } else {
            setCategories((prev) => [...prev, { id: Date.now(), name }]);
          }
          showToast("Категория добавлена");
          closeM("addCategory");
        }}
      />

      <AddProductModal
        open={!!modals.addProduct}
        onClose={() => closeM("addProduct")}
        categories={categories}
        onAdd={async (p) => {
          if (supabase) {
            const { data } = await supabase.from("products").insert([p]).select("*, categories(name)").single();
            setProducts((prev) => [...prev, { ...data, category: data.categories?.name || "" }]);
          } else {
            setProducts((prev) => [...prev, {
              ...p,
              id: Date.now(),
              category: categories.find((c) => Number(c.id) === Number(p.category_id))?.name || "",
            }]);
          }
          showToast("Товар добавлен");
          closeM("addProduct");
        }}
      />

      {editTarget && (
        <EditProductModal
          open={!!modals.editProduct}
          onClose={() => {
            closeM("editProduct");
            setEditTarget(null);
          }}
          product={editTarget}
          categories={categories}
          onSave={async (id, upd) => {
            if (supabase) await supabase.from("products").update(upd).eq("id", id);
            setProducts((prev) =>
              prev.map((x) =>
                x.id === id
                  ? {
                      ...x,
                      ...upd,
                      category: categories.find((c) => Number(c.id) === Number(upd.category_id))?.name || x.category,
                    }
                  : x
              )
            );
            showToast("Товар обновлён");
            closeM("editProduct");
            setEditTarget(null);
          }}
        />
      )}

      <AddWorkerModal
        open={!!modals.addWorker}
        onClose={() => closeM("addWorker")}
        onAdd={async (worker) => {
          if (supabase) {
            const { data } = await supabase.from("worker_keys").insert([worker]).select().single();
            setWorkers((prev) => [...prev, data]);
          } else {
            setWorkers((prev) => [...prev, { ...worker, id: Date.now() }]);
          }
          showToast("Воркер добавлен");
          closeM("addWorker");
        }}
      />

      <Toast toast={toast} />
    </div>
  );
}
