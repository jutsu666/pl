import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

const LS = {
  googleRate: "playerok_googleRate",
  playerokRate: "playerok_playerokRate",
  closedSnaps: "playerok_closedSheetSnapshots",
  workerShares: "playerok_workerSheetShares",
  dailyCounts: "playerok_dailyCounts",
};

const ls = (k, fb = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const fmt = n => Math.round(n).toLocaleString("ru-RU");
const fmtF = (n, d = 2) => Number(n).toFixed(d);
const todayStr = () => new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
const todayKey = () => new Date().toISOString().slice(0, 10);

function calcProfit({ salePrice, buyUsd, playerokRate, commType }) {
  const commRate = commType === "premium" ? 0.04 : 0.05;
  return salePrice - salePrice * commRate - buyUsd * (playerokRate || 88);
}

const P = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  sheets: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
  calc: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  rate: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  catalog: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
  admin: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  x: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  refresh: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  folder: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
};
const Icon = ({ name, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={P[name] || P.dashboard} />
  </svg>
);

// ── SHARED UI ──────────────────────────────────────────────────────────────
const Lbl = ({ children }) => (
  <label style={{ display: "block", fontSize: 10.5, color: "var(--text3)", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".065em" }}>{children}</label>
);
const Field = ({ label, children }) => <div style={{ marginBottom: 13 }}><Lbl>{label}</Lbl>{children}</div>;
const FI = ({ label, ...p }) => <Field label={label}><input className="fi" {...p} /></Field>;
const FS = ({ label, options, ...p }) => (
  <Field label={label}>
    <select className="fi" style={{ cursor: "pointer" }} {...p}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </Field>
);

function Badge({ status }) {
  const M = {
    sold: ["Продано", "#34d399", "rgba(52,211,153,.1)"],
    pending: ["Ожидание", "#fbbf24", "rgba(251,191,36,.1)"],
    cancelled: ["Отменено", "#f87171", "rgba(248,113,113,.1)"],
    open: ["Открыт", "#38bdf8", "rgba(56,189,248,.1)"],
    closed: ["Закрыт", "#50507a", "rgba(80,80,122,.15)"],
    active: ["Активен", "#34d399", "rgba(52,211,153,.1)"],
    inactive: ["Неактивен", "#50507a", "rgba(80,80,122,.15)"],
  };
  const [l, c, bg] = M[status] || [status, "#8888aa", "rgba(136,136,170,.1)"];
  return <span className="badge" style={{ color: c, background: bg }}>{l}</span>;
}

function Modal({ open, onClose, title, children, width = 440 }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, backdropFilter: "blur(10px)", animation: "fadeIn .18s ease" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border2)", borderRadius: 18, padding: "24px 26px", width, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", animation: "scaleIn .2s ease", boxShadow: "0 30px 90px rgba(0,0,0,.7)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{title}</span>
          <button className="btn-i" onClick={onClose}><Icon name="x" size={13} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const MFoot = ({ onClose, onSubmit, label = "Сохранить" }) => (
  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
    <button className="btn-g" onClick={onClose}>Отмена</button>
    <button className="btn-p" onClick={onSubmit}>{label}</button>
  </div>
);

function useToast() {
  const [t, setT] = useState(null);
  const r = useRef();
  const show = useCallback((msg, type = "ok") => {
    setT({ msg, type });
    clearTimeout(r.current);
    r.current = setTimeout(() => setT(null), 2700);
  }, []);
  return { toast: t, show };
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 22, right: 22, background: "var(--card)", border: `1px solid ${toast.type === "err" ? "rgba(248,113,113,.4)" : "rgba(124,92,252,.4)"}`, borderRadius: 11, padding: "10px 16px", fontSize: 13, color: "var(--text)", zIndex: 9999, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 36px rgba(0,0,0,.5)", animation: "slideR .22s ease" }}>
      {toast.type === "err" ? "✕" : "✓"} {toast.msg}
    </div>
  );
}

function MetricCard({ label, value, sub, accent = "#7c5cfc", delay = 0 }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "16px 18px", position: "relative", overflow: "hidden", animation: `fadeUp .3s ease ${delay}s both`, transition: "border-color .2s, transform .2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = accent + "55"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: accent, opacity: .07 }} />
      <div style={{ fontSize: 10.5, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ width: "100%", height: `${Math.max((d.v / max) * 62, 2)}px`, background: i === data.length - 1 ? "var(--accent)" : "rgba(124,92,252,.28)", borderRadius: "3px 3px 0 0", minHeight: 2 }} title={d.l + ": " + fmt(d.v) + " ₽"} />
          <div style={{ fontSize: 9.5, color: "var(--text3)" }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
}

async function fetchGoogleRateReal() {
  try {
    const r = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
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

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerKey, setWorkerKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdmin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    if (supabase) {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      onLogin({ user: data.user, role: prof?.role || "admin", session: data.session });
    } else {
      if (email === "admin@playerok.ru" && password === "admin123") onLogin({ user: { id: "demo" }, role: "admin" });
      else setError("Демо: admin@playerok.ru / admin123");
    }
    setLoading(false);
  };

  const handleWorker = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    if (supabase) {
      const { data: wk, error: err } = await supabase.from("worker_keys").select("*").eq("key", workerKey).single();
      if (err || !wk) { setError("Неверный ключ воркера"); setLoading(false); return; }
      onLogin({ user: { id: "w-" + wk.id }, role: "worker", workerData: wk });
    } else {
      if (workerKey === "worker-demo") onLogin({ user: { id: "wd" }, role: "worker", workerData: { id: 1, name: "Артём", key: "worker-demo", share: 50 } });
      else setError("Демо ключ: worker-demo");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0b0f", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 25% 25%, rgba(124,92,252,.09) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(92,139,252,.07) 0%, transparent 55%)", pointerEvents: "none" }} />
      <div style={{ width: 390, background: "#141420", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 20, padding: "34px 32px", boxShadow: "0 40px 100px rgba(0,0,0,.6)", animation: "scaleIn .3s ease", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#7c5cfc,#5c8bfc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(124,92,252,.4)" }}>🎮</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#dde0f0", letterSpacing: "-.02em" }}>Playerok Tracker</div>
          <div style={{ fontSize: 12, color: "#505070", marginTop: 3 }}>Учёт продаж · Доходы · Аналитика</div>
        </div>
        <div style={{ display: "flex", background: "#111118", borderRadius: 10, padding: 3, marginBottom: 20, gap: 3 }}>
          {[["admin", "👑 Admin"], ["worker", "🔧 Worker"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all .2s", background: mode === m ? "#7c5cfc" : "transparent", color: mode === m ? "#fff" : "#505070", fontFamily: "inherit" }}>
              {l}
            </button>
          ))}
        </div>
        <form onSubmit={mode === "admin" ? handleAdmin : handleWorker}>
          {mode === "admin" ? (
            <>
              <FI label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@playerok.ru" />
              <FI label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </>
          ) : (
            <FI label="Worker Key" value={workerKey} onChange={e => setWorkerKey(e.target.value)} placeholder="worker-xxxxx" />
          )}
          {error && <div style={{ fontSize: 12, color: "#f87171", padding: "8px 11px", background: "rgba(248,113,113,.07)", borderRadius: 8, marginBottom: 12, border: "1px solid rgba(248,113,113,.18)" }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#7c5cfc,#5c8bfc)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1, boxShadow: "0 4px 18px rgba(124,92,252,.35)", fontFamily: "inherit" }}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── PAGE COMPONENTS ────────────────────────────────────────────────────────────

function CalcPage({ products, playerokRate }) {
  const [sp, setSp] = useState("");
  const [bu, setBu] = useState("");
  const [pr, setPr] = useState(playerokRate);
  const [ct, setCt] = useState("standard");
  const [ws, setWs] = useState(50);
  const [bm, setBm] = useState(0);
  const [pid, setPid] = useState("");

  useEffect(() => { setPr(playerokRate); }, [playerokRate]);

  const sale = +sp || 0, buy = +bu || 0, rate = +pr || playerokRate;
  const commRate = ct === "premium" ? 0.04 : 0.05;
  const commAmt = Math.round(sale * commRate);
  const buyRub = Math.round(buy * rate);
  const gross = sale - commAmt - buyRub;
  const net = gross - bm;
  const wAmt = ws > 0 ? Math.round(net * ws / 100) : 0;
  const aAmt = net - wAmt;

  const row = (l, v, c) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text3)", fontSize: 12 }}>{l}</span>
      <span style={{ fontWeight: 600, color: c || "var(--text)", fontSize: 12 }}>{v}</span>
    </div>
  );

  return (
    <div className="pa" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 820 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>Параметры</div>
        <FS label="Быстрый выбор" value={pid} onChange={e => {
          setPid(e.target.value);
          const p = products.find(x => x.id == e.target.value);
          if (p) { setSp(p.sale_price_rub); setBu(p.purchase_usd); setCt(p.commission_type); }
        }} options={[{ value: "", label: "— выберите товар —" }, ...products.map(p => ({ value: p.id, label: p.name }))]} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          <FI label="Цена продажи (₽)" type="number" value={sp} onChange={e => setSp(e.target.value)} placeholder="0" />
          <FI label="Закупка ($)" type="number" value={bu} onChange={e => setBu(e.target.value)} placeholder="0" />
          <FI label="Курс Playerok" type="number" value={pr} onChange={e => setPr(e.target.value)} />
          <FS label="Комиссия" value={ct} onChange={e => setCt(e.target.value)} options={[{ value: "standard", label: "5% Standard" }, { value: "premium", label: "4% Premium" }]} />
          <FI label="Доля воркера (%)" type="number" value={ws} onChange={e => setWs(+e.target.value || 0)} placeholder="50" />
          <FI label="Поднятия (₽)" type="number" value={bm} onChange={e => setBm(+e.target.value || 0)} placeholder="0" />
        </div>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>Расчёт</div>
        {row("Цена продажи", fmt(sale) + " ₽")}
        {row("Комиссия " + Math.round(commRate * 100) + "%", "−" + fmt(commAmt) + " ₽", "var(--danger)")}
        {row("Закупка по курсу", "−" + fmt(buyRub) + " ₽", "var(--danger)")}
        {row("Поднятия", bm ? "−" + fmt(bm) + " ₽" : "0 ₽", bm ? "var(--warning)" : undefined)}
        {row("Валовый профит", (gross >= 0 ? "+" : "") + fmt(gross) + " ₽", gross >= 0 ? "var(--success)" : "var(--danger)")}
        <div style={{ height: 1, background: "var(--border)", margin: "9px 0" }} />
        {ws > 0 && row("Профит воркера (" + ws + "%)", "+" + fmt(wAmt) + " ₽", "var(--text2)")}
        {row("Профит Admin", "+" + fmt(aAmt) + " ₽", "var(--success)")}
        <div style={{ marginTop: 14, padding: "13px 15px", background: "rgba(124,92,252,.07)", border: "1px solid rgba(124,92,252,.18)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Итого Admin</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: aAmt >= 0 ? "var(--success)" : "var(--danger)", letterSpacing: "-.02em" }}>{aAmt >= 0 ? "+" : ""}{fmt(aAmt)} ₽</span>
        </div>
      </div>
    </div>
  );
}

function CatalogPage({ products, setProducts, categories, setCategories, playerokRate, isAdmin, openM, setEditTarget, showToast }) {
  const [activeCat, setActiveCat] = useState("all");
  const filtered = activeCat === "all" ? products : products.filter(p => p.category_id == activeCat);

  return (
    <div className="pa">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ id: "all", name: "Все" }, ...categories].map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              style={{ padding: "5px 12px", borderRadius: 18, fontSize: 12, fontWeight: 500, border: "1px solid", borderColor: activeCat == c.id ? "var(--accent)" : "var(--border)", background: activeCat == c.id ? "rgba(124,92,252,.1)" : "var(--bg3)", color: activeCat == c.id ? "#a78bfa" : "var(--text2)", cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}>
              {c.name}
            </button>
          ))}
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 7 }}>
            <button className="btn-g" onClick={() => openM("addCategory")}><Icon name="folder" size={12} /> + Категория</button>
            <button className="btn-p" onClick={() => openM("addProduct")}><Icon name="plus" size={12} color="#fff" /> + Товар</button>
          </div>
        )}
      </div>

      {isAdmin && categories.length > 0 && (
        <div className="card" style={{ padding: "11px 14px", marginBottom: 13 }}>
          <div style={{ fontSize: 10.5, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600, marginBottom: 8 }}>Управление категориями</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {categories.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", background: "var(--bg3)", borderRadius: 7, border: "1px solid var(--border)" }}>
                <Icon name="folder" size={11} color="#a78bfa" />
                <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{c.name}</span>
                <button className="btn-i d" style={{ width: 18, height: 18, borderRadius: 4, marginLeft: 2 }} onClick={async () => {
                  if (!window.confirm(`Удалить категорию "${c.name}"?`)) return;
                  if (supabase) await supabase.from("categories").delete().eq("id", c.id);
                  setCategories(prev => prev.filter(x => x.id !== c.id));
                  showToast("Категория удалена");
                }}><Icon name="x" size={10} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 11 }}>
        {filtered.map((p, i) => {
          const profit = Math.round(calcProfit({ salePrice: p.sale_price_rub, buyUsd: p.purchase_usd, playerokRate, commType: p.commission_type }));
          return (
            <div key={p.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 15, animation: `fadeUp .25s ease ${i * .03}s both`, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,.32)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, flex: 1, marginRight: 6 }}>{p.name}</div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 3 }}>
                    <button className="btn-i" style={{ width: 22, height: 22, borderRadius: 5 }} onClick={() => { setEditTarget(p); openM("editProduct"); }}><Icon name="edit" size={11} /></button>
                    <button className="btn-i d" style={{ width: 22, height: 22, borderRadius: 5 }} onClick={async () => {
                      if (!window.confirm("Удалить товар?")) return;
                      if (supabase) await supabase.from("products").delete().eq("id", p.id);
                      setProducts(prev => prev.filter(x => x.id !== p.id));
                      showToast("Товар удалён");
                    }}><Icon name="x" size={11} /></button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#a78bfa", background: "rgba(124,92,252,.08)", display: "inline-block", padding: "2px 7px", borderRadius: 5, marginBottom: 9 }}>{p.category || "Без категории"}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{fmt(p.sale_price_rub)} ₽</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Закуп: ${fmtF(p.purchase_usd)} · {p.commission_type === "premium" ? "4%" : "5%"}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: profit >= 0 ? "var(--success)" : "var(--danger)", marginTop: 5 }}>{profit >= 0 ? "+" : ""}{fmt(profit)} ₽ / ед</div>
              <div style={{ marginTop: 9 }}><Badge status={p.status || "active"} /></div>
            </div>
          );
        })}
        {!filtered.length && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "var(--text3)" }}>Товаров нет</div>}
      </div>
    </div>
  );
}

function RatePage({ googleRate, setGR, playerokRate, setPR, isAdmin, showToast }) {
  const [pInput, setPInput] = useState(playerokRate);
  const [fetching, setFetching] = useState(false);

  useEffect(() => { setPInput(playerokRate); }, [playerokRate]);

  const doFetch = async () => {
    setFetching(true);
    const r = await fetchGoogleRateReal();
    if (r) { setGR(r); showToast("Google курс: " + r + " ₽/$"); }
    else showToast("Не удалось получить — используется кеш", "err");
    setFetching(false);
  };

  const block = (title, value, color, children) => (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 10, background: color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</div>
      {children}
    </div>
  );

  return (
    <div className="pa" style={{ maxWidth: 520 }}>
      {block("🌐 КУРС GOOGLE (1 USD → RUB)", fmtF(googleRate) + " ₽", "linear-gradient(135deg,#7c5cfc,#5c8bfc)",
        <div>
          <button className="btn-g" onClick={doFetch} disabled={fetching}>
            <span style={{ display: "inline-block", animation: fetching ? "spin 1s linear infinite" : "none" }}><Icon name="refresh" size={12} /></span>
            {fetching ? "Загружаем..." : "Обновить"}
          </button>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 7 }}>API: @fawazahmed0/currency-api</div>
        </div>
      )}
      {block("🎮 КУРС PLAYEROK (ручной)", fmtF(playerokRate) + " ₽", "linear-gradient(135deg,#38bdf8,#34d399)",
        isAdmin ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={pInput} onChange={e => setPInput(e.target.value)} step="0.1" className="fi" style={{ width: 120 }} />
            <button className="btn-p" onClick={() => { const v = parseFloat(pInput); if (!isNaN(v)) { setPR(v); showToast("Курс Playerok: " + v + " ₽"); } }}>Сохранить</button>
          </div>
        ) : <div style={{ fontSize: 12, color: "var(--text3)" }}>Устанавливается только admin</div>
      )}
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["Google", googleRate, "#a78bfa"], ["Playerok", playerokRate, "#38bdf8"], ["Разница", Math.abs(googleRate - playerokRate), "#fbbf24"]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center", background: "var(--bg3)", borderRadius: "var(--r)", padding: "12px 6px" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>{l}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: c }}>{fmtF(v)} ₽</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [sheetOrders, setSheetOrders] = useState([]);
  const [sheetBumps, setSheetBumps] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [googleRate, _setGR] = useState(() => ls(LS.googleRate, 91.4));
  const [playerokRate, _setPR] = useState(() => ls(LS.playerokRate, 88.0));
  const [closedSnaps, setClosedSnaps] = useState(() => ls(LS.closedSnaps, {}));
  const [workerShares, setWorkerShares] = useState(() => ls(LS.workerShares, {}));
  const [dailyCounts, setDailyCounts] = useState(() => ls(LS.dailyCounts, {}));
  const [modals, setModals] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const { toast, show: showToast } = useToast();

  const setGR = v => { _setGR(v); lsSet(LS.googleRate, v); };
  const setPR = v => { _setPR(v); lsSet(LS.playerokRate, v); };
  const openM = n => setModals(m => ({ ...m, [n]: true }));
  const closeM = n => setModals(m => ({ ...m, [n]: false }));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data: p }) => {
          setAuth({ user: session.user, role: p?.role || "admin", session });
        });
      }
    });
  }, []);

  useEffect(() => { if (auth) loadData(); }, [auth]);

  const loadData = async () => {
    if (!supabase) { loadDemo(); return; }
    const isAdmin = auth?.role === "admin";
    const [cats, prods, daySheets, orders, bumps, wks] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*, categories(name)").order("name"),
      isAdmin
        ? supabase.from("day_sheets").select("*").order("created_at", { ascending: false })
        : supabase.from("day_sheets").select("*").eq("worker_id", auth.workerData?.id).order("created_at", { ascending: false }),
      supabase.from("sheet_orders").select("*"),
      supabase.from("sheet_bumps").select("*"),
      isAdmin ? supabase.from("worker_keys").select("*") : Promise.resolve({ data: [] }),
    ]);
    setCategories(cats.data || []);
    setProducts((prods.data || []).map(p => ({ ...p, category: p.categories?.name || "" })));
    setSheets(daySheets.data || []);
    setSheetOrders(orders.data || []);
    setSheetBumps(bumps.data || []);
    setWorkers(wks.data || []);
  };

  const loadDemo = () => {
    setCategories([{ id: 1, name: "Steam" }, { id: 2, name: "Valorant" }, { id: 3, name: "Roblox" }]);
    setProducts([
      { id: 1, name: "Steam 10$", category_id: 1, category: "Steam", sale_price_rub: 1050, purchase_usd: 10, commission_type: "standard", status: "active" },
      { id: 2, name: "Steam 20$", category_id: 1, category: "Steam", sale_price_rub: 2050, purchase_usd: 20, commission_type: "standard", status: "active" },
      { id: 3, name: "Valorant 1000VP", category_id: 2, category: "Valorant", sale_price_rub: 750, purchase_usd: 7.5, commission_type: "premium", status: "active" },
      { id: 4, name: "Roblox 400R$", category_id: 3, category: "Roblox", sale_price_rub: 350, purchase_usd: 3.5, commission_type: "standard", status: "active" },
    ]);
    setSheets([
      { id: 1, name: "20.04.2025", status: "open", worker_id: null, created_at: new Date().toISOString() },
      { id: 2, name: "19.04.2025", status: "closed", worker_id: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
    ]);
    setSheetOrders([
      { id: 1, sheet_id: 1, product_id: 1, sale_price: 1050, status: "sold", created_at: new Date().toISOString() },
      { id: 2, sheet_id: 1, product_id: 3, sale_price: 750, status: "sold", created_at: new Date().toISOString() },
      { id: 3, sheet_id: 2, product_id: 2, sale_price: 2050, status: "sold", created_at: new Date(Date.now() - 86400000).toISOString() },
    ]);
    setSheetBumps([{ id: 1, sheet_id: 1, amount: 80, created_at: new Date().toISOString() }]);
    setWorkers([{ id: 1, name: "Артём", key: "worker-demo", share: 50 }]);
  };

  const getSheetProfit = useCallback((sheetId) => {
    if (closedSnaps[sheetId]) return closedSnaps[sheetId];
    const orders = sheetOrders.filter(o => o.sheet_id === sheetId && o.status === "sold");
    const bumpsAmt = sheetBumps.filter(b => b.sheet_id === sheetId).reduce((s, b) => s + b.amount, 0);
    const gross = orders.reduce((s, o) => {
      const p = products.find(x => x.id === o.product_id);
      return s + (p ? calcProfit({ salePrice: o.sale_price, buyUsd: p.purchase_usd, playerokRate, commType: p.commission_type }) : 0);
    }, 0);
    return { gross: Math.round(gross), bumps: Math.round(bumpsAmt), net: Math.round(gross - bumpsAmt) };
  }, [sheetOrders, sheetBumps, products, playerokRate, closedSnaps]);

  const mySheets = sheets.filter(s => !s.worker_id);
  const wSheets = sheets.filter(s => s.worker_id);
  const myProfit = mySheets.reduce((s, sh) => s + getSheetProfit(sh.id).net, 0);
  const workerProfit = wSheets.reduce((s, sh) => s + Math.round(getSheetProfit(sh.id).net * (workerShares[sh.id] ?? 50) / 100), 0);
  const adminFromW = wSheets.reduce((s, sh) => s + Math.round(getSheetProfit(sh.id).net * (100 - (workerShares[sh.id] ?? 50)) / 100), 0);

  const dk = todayKey();
  const dayEntry = dailyCounts[dk] || {};

  const updateDay = (productId, field, delta) => {
    const prev = dailyCounts[dk]?.[productId] || { qty: 0, bumps: 0 };
    const next = { ...prev, [field]: Math.max(0, (prev[field] || 0) + delta) };
    const upd = { ...dailyCounts, [dk]: { ...(dailyCounts[dk] || {}), [productId]: next } };
    setDailyCounts(upd);
    lsSet(LS.dailyCounts, upd);
  };

  const totalQtyToday = Object.values(dayEntry).reduce((s, e) => s + (e.qty || 0), 0);
  const totalBumpsToday = Object.values(dayEntry).reduce((s, e) => s + (e.bumps || 0), 0);
  const grossToday = products.reduce((s, p) => {
    const e = dayEntry[p.id] || { qty: 0 };
    return s + Math.round(calcProfit({ salePrice: p.sale_price_rub, buyUsd: p.purchase_usd, playerokRate, commType: p.commission_type })) * e.qty;
  }, 0);
  const netToday = grossToday - totalBumpsToday;

  const closeSheet = async id => {
    const snap = getSheetProfit(id);
    const ns = { ...closedSnaps, [id]: snap };
    setClosedSnaps(ns); lsSet(LS.closedSnaps, ns);
    if (supabase) await supabase.from("day_sheets").update({ status: "closed" }).eq("id", id);
    setSheets(s => s.map(x => x.id === id ? { ...x, status: "closed" } : x));
    showToast("Лист закрыт");
  };

  const deleteSheet = async id => {
    if (!window.confirm("Удалить лист?")) return;
    if (supabase) {
      await supabase.from("sheet_orders").delete().eq("sheet_id", id);
      await supabase.from("sheet_bumps").delete().eq("sheet_id", id);
      await supabase.from("day_sheets").delete().eq("id", id);
    }
    setSheets(s => s.filter(x => x.id !== id));
    setSheetOrders(o => o.filter(x => x.sheet_id !== id));
    setSheetBumps(b => b.filter(x => x.sheet_id !== id));
    showToast("Лист удалён");
  };

  const logout = async () => { if (supabase) await supabase.auth.signOut(); setAuth(null); };

  if (!auth) return <AuthScreen onLogin={setAuth} />;

  const isAdmin = auth.role === "admin";

  const navItems = [
    { id: "dashboard", label: "Панель", icon: "dashboard" },
    { id: "sheets", label: "Листы", icon: "sheets" },
    { id: "calc", label: "Калькулятор", icon: "calc" },
    { id: "catalog", label: "Каталог", icon: "catalog" },
    { id: "rate", label: "Курс", icon: "rate" },
    ...(isAdmin ? [{ id: "admin", label: "Админка", icon: "admin" }] : []),
  ];

  const catColors = ["#7c5cfc", "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");
    const v = sheetOrders
      .filter(o => { const od = new Date(o.created_at); return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status === "sold"; })
      .reduce((s, o) => { const p = products.find(x => x.id === o.product_id); return s + (p ? Math.round(calcProfit({ salePrice: o.sale_price, buyUsd: p.purchase_usd, playerokRate, commType: p.commission_type })) : 0); }, 0);
    return { l: label, v: Math.max(0, v) };
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 205, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: "18px 14px 12px", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#5c8bfc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 4px 14px rgba(124,92,252,.3)" }}>🎮</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)" }}>Playerok</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>Tracker</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "4px 8px" }}>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${page === item.id ? " active" : ""}`} onClick={() => setPage(item.id)}>
              <Icon name={item.icon} size={14} color={page === item.id ? "#a78bfa" : "currentColor"} />
              {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderRadius: 9, background: "var(--bg3)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: isAdmin ? "linear-gradient(135deg,#7c5cfc,#5c8bfc)" : "linear-gradient(135deg,#34d399,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {isAdmin ? "A" : (auth.workerData?.name?.[0] || "W")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isAdmin ? "Admin" : auth.workerData?.name}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>{isAdmin ? "Управляющий" : "Воркер"}</div>
            </div>
            <button className="btn-i" onClick={logout} style={{ width: 22, height: 22, borderRadius: 6 }}><Icon name="logout" size={12} /></button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 205, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOPBAR */}
        <div style={{ height: 52, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", background: "rgba(17,17,24,.95)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            {navItems.find(n => n.id === page)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div onClick={() => setPage("rate")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "var(--bg3)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text2)", cursor: "pointer" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", animation: "gp 2s infinite" }} />
              {fmtF(googleRate)} ₽/$
            </div>
            {isAdmin && <button className="btn-p" onClick={() => openM("addOrder")}><Icon name="plus" size={13} color="#fff" /> Продажа</button>}
          </div>
        </div>

        <div style={{ flex: 1, padding: "18px 22px", overflowY: "auto" }}>

          {/* DASHBOARD */}
          {page === "dashboard" && (
            <div className="pa">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 16 }}>
                <MetricCard label="Чистый профит" value={fmt(myProfit) + " ₽"} sub="мои листы" delay={0} />
                <MetricCard label="Профит воркеров" value={fmt(workerProfit) + " ₽"} sub="их доля" accent="#38bdf8" delay={.05} />
                <MetricCard label="Общий профит" value={fmt(myProfit + adminFromW) + " ₽"} sub="все источники" accent="#34d399" delay={.1} />
                <MetricCard label="Итог сегодня" value={fmt(netToday) + " ₽"} sub={totalQtyToday + " продаж · −" + fmt(totalBumpsToday) + " ₽"} accent="#fbbf24" delay={.15} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 11, marginBottom: 16 }}>
                <div className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Продажи 7 дней</div>
                  <MiniBar data={chartData} />
                </div>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "12px 15px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>Категории сегодня</div>
                  <div style={{ display: "flex" }}>
                    {categories.map((cat, i) => {
                      const cp = products.filter(p => p.category_id === cat.id);
                      const cq = cp.reduce((s, p) => s + (dayEntry[p.id]?.qty || 0), 0);
                      const cf = cp.reduce((s, p) => {
                        const e = dayEntry[p.id] || { qty: 0 };
                        return s + Math.round(calcProfit({ salePrice: p.sale_price_rub, buyUsd: p.purchase_usd, playerokRate, commType: p.commission_type })) * e.qty;
                      }, 0);
                      return (
                        <div key={cat.id} style={{ flex: 1, padding: "12px 14px", borderRight: i < categories.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <div style={{ fontSize: 10, color: catColors[i % catColors.length], textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 4 }}>{cat.name}</div>
                          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text)" }}>{cq}</div>
                          <div style={{ fontSize: 11, color: cf >= 0 ? "var(--success)" : "var(--danger)", marginTop: 2 }}>{cf >= 0 ? "+" : ""}{fmt(cf)} ₽</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* TRADING TABLE */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Торговая таблица · {new Date().toLocaleDateString("ru-RU")}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>+/− по 10 ₽ для поднятий</span>
                    <button className="btn-g" style={{ fontSize: 11, padding: "4px 9px" }} onClick={() => {
                      if (!window.confirm("Сбросить счётчики сегодня?")) return;
                      const u = { ...dailyCounts }; delete u[dk];
                      setDailyCounts(u); lsSet(LS.dailyCounts, u);
                      showToast("Счётчики сброшены");
                    }}>Сбросить</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr><th>Лот</th><th>Категория</th><th>Цена товара</th><th>Закуп / ед</th><th>Профит / ед</th><th>Количество</th><th>Поднятия</th><th>Итог</th></tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.status === "active").map(p => {
                        const e = dayEntry[p.id] || { qty: 0, bumps: 0 };
                        const pp = Math.round(calcProfit({ salePrice: p.sale_price_rub, buyUsd: p.purchase_usd, playerokRate, commType: p.commission_type }));
                        const итог = pp * e.qty - (e.bumps || 0);
                        return (
                          <tr key={p.id} className="tr">
                            <td style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{p.name}</td>
                            <td><span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: "rgba(124,92,252,.1)", color: "#a78bfa" }}>{p.category || "—"}</span></td>
                            <td style={{ fontWeight: 600, color: "var(--text)" }}>{fmt(p.sale_price_rub)} ₽</td>
                            <td style={{ color: "var(--text3)" }}>${fmtF(p.purchase_usd)}</td>
                            <td style={{ fontWeight: 700, color: pp >= 0 ? "var(--success)" : "var(--danger)" }}>{pp >= 0 ? "+" : ""}{fmt(pp)} ₽</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button className="cnt" onClick={() => updateDay(p.id, "qty", -1)}>−</button>
                                <span style={{ fontWeight: 800, color: "var(--text)", fontSize: 15, minWidth: 22, textAlign: "center" }}>{e.qty}</span>
                                <button className="cnt" onClick={() => updateDay(p.id, "qty", 1)}>+</button>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button className="cnt" onClick={() => updateDay(p.id, "bumps", -10)}>−</button>
                                <span style={{ fontWeight: 600, color: (e.bumps || 0) > 0 ? "var(--warning)" : "var(--text3)", fontSize: 12, minWidth: 36, textAlign: "center" }}>{(e.bumps || 0) > 0 ? "−" + fmt(e.bumps) : "0"}</span>
                                <button className="cnt" onClick={() => updateDay(p.id, "bumps", 10)}>+</button>
                              </div>
                            </td>
                            <td style={{ fontWeight: 800, fontSize: 13, color: (e.qty > 0 || (e.bumps || 0) > 0) ? (итог >= 0 ? "var(--success)" : "var(--danger)") : "var(--text3)" }}>
                              {(e.qty > 0 || (e.bumps || 0) > 0) ? (итог >= 0 ? "+" : "") + fmt(итог) + " ₽" : "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {!products.filter(p => p.status === "active").length && (
                        <tr><td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text3)" }}>Товаров нет — добавь в Каталоге</td></tr>
                      )}
                      <tr style={{ background: "rgba(124,92,252,.04)" }}>
                        <td colSpan={5} style={{ fontWeight: 700, color: "var(--text)", fontSize: 12, borderTop: "1px solid var(--border2)" }}>ИТОГО</td>
                        <td style={{ fontWeight: 800, color: "var(--text)", borderTop: "1px solid var(--border2)" }}>{totalQtyToday}</td>
                        <td style={{ color: totalBumpsToday > 0 ? "var(--warning)" : "var(--text3)", fontWeight: 700, borderTop: "1px solid var(--border2)" }}>{totalBumpsToday > 0 ? "−" + fmt(totalBumpsToday) + " ₽" : "—"}</td>
                        <td style={{ fontWeight: 800, fontSize: 14, color: netToday >= 0 ? "var(--success)" : "var(--danger)", borderTop: "1px solid var(--border2)" }}>{netToday >= 0 ? "+" : ""}{fmt(netToday)} ₽</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SHEETS */}
          {page === "sheets" && (
            <div className="pa">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>{sheets.filter(s => s.status === "open").length} открытых · {sheets.filter(s => s.status === "closed").length} закрытых</span>
                {isAdmin && <button className="btn-p" onClick={() => openM("addSheet")}><Icon name="plus" size={13} color="#fff" /> Новый лист</button>}
              </div>
              {!sheets.length && <div style={{ textAlign: "center", padding: "50px", color: "var(--text3)" }}>📋 Листов пока нет</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
                {sheets.map((sh, i) => {
                  const { net, bumps } = getSheetProfit(sh.id);
                  const cnt = sheetOrders.filter(o => o.sheet_id === sh.id && o.status === "sold").length;
                  const share = workerShares[sh.id] ?? 50;
                  const wk = workers.find(w => w.id == sh.worker_id);
                  return (
                    <div key={sh.id} style={{ background: "var(--card)", border: `1px solid ${sh.status === "open" ? "rgba(56,189,248,.22)" : "var(--border)"}`, borderRadius: "var(--r2)", padding: 16, animation: `fadeUp .28s ease ${i * .04}s both`, transition: "transform .2s", position: "relative" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = ""}>
                      <div style={{ position: "absolute", top: 13, right: 13 }}><Badge status={sh.status} /></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{sh.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>{wk?.name || "Admin"}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 11 }}>
                        {[
                          [cnt, "Продаж", "var(--text)"],
                          [(net >= 0 ? "+" : "") + fmt(net) + " ₽", "Профит", net >= 0 ? "var(--success)" : "var(--danger)"],
                          [bumps ? "−" + fmt(bumps) + " ₽" : "0", "Поднятия", "var(--warning)"]
                        ].map(([v, l, c], j) => (
                          <div key={j} style={{ textAlign: "center", background: "var(--bg3)", borderRadius: 7, padding: "7px 3px" }}>
                            <div style={{ fontSize: j === 0 ? 17 : 12, fontWeight: 800, color: c }}>{v}</div>
                            <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: 1 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      {isAdmin && sh.worker_id && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 9px", background: "var(--bg3)", borderRadius: 7, marginBottom: 9 }}>
                          <span style={{ fontSize: 11, color: "var(--text3)", flex: 1 }}>Доля воркера</span>
                          <input type="number" min={0} max={100} value={share}
                            onChange={e => { const ns = { ...workerShares, [sh.id]: +e.target.value }; setWorkerShares(ns); lsSet(LS.workerShares, ns); }}
                            style={{ width: 44, padding: "3px 5px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 12, textAlign: "center", fontFamily: "inherit" }} />
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>%</span>
                        </div>
                      )}
                      {isAdmin && sh.status === "open" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn-g" style={{ flex: 1, fontSize: 11, justifyContent: "center" }} onClick={() => closeSheet(sh.id)}>✓ Закрыть лист</button>
                          <button className="btn-i d" onClick={() => deleteSheet(sh.id)}><Icon name="x" size={12} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {page === "calc" && <CalcPage products={products} playerokRate={playerokRate} />}

          {page === "catalog" && (
            <CatalogPage
              products={products} setProducts={setProducts}
              categories={categories} setCategories={setCategories}
              playerokRate={playerokRate} isAdmin={isAdmin}
              openM={openM} setEditTarget={setEditTarget} showToast={showToast}
            />
          )}

          {page === "rate" && <RatePage googleRate={googleRate} setGR={setGR} playerokRate={playerokRate} setPR={setPR} isAdmin={isAdmin} showToast={showToast} />}

          {/* ADMIN */}
          {page === "admin" && isAdmin && (
            <div className="pa">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Воркеры</span>
                    <button className="btn-g" onClick={() => openM("addWorker")}><Icon name="plus" size={12} /> Добавить</button>
                  </div>
                  {!workers.length && <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 12 }}>Нет воркеров</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {workers.map(wk => {
                      const wkS = sheets.filter(s => s.worker_id == wk.id);
                      const wProfit = wkS.reduce((s, sh) => s + Math.round(getSheetProfit(sh.id).net * (workerShares[sh.id] ?? wk.share ?? 50) / 100), 0);
                      return (
                        <div key={wk.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: "var(--bg3)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#34d399,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{wk.name?.[0]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{wk.name}</div>
                            <div style={{ fontSize: 10, color: "var(--text3)" }}>{wkS.length} листов · {wk.share}%</div>
                            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#38bdf8", background: "rgba(56,189,248,.07)", padding: "1px 5px", borderRadius: 3, display: "inline-block", marginTop: 1 }}>{wk.key}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--success)", whiteSpace: "nowrap" }}>+{fmt(wProfit)} ₽</div>
                          <button className="btn-i d" onClick={async () => {
                            if (!window.confirm("Удалить воркера?")) return;
                            if (supabase) await supabase.from("worker_keys").delete().eq("id", wk.id);
                            setWorkers(prev => prev.filter(x => x.id !== wk.id));
                            showToast("Воркер удалён");
                          }}><Icon name="x" size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Настройки</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-g" onClick={() => {
                      const b = new Blob([JSON.stringify({ sheets, sheetOrders, workers, products, categories }, null, 2)], { type: "application/json" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "playerok-backup.json"; a.click();
                      showToast("Экспорт готов");
                    }}>↓ Экспорт JSON</button>
                    <button className="btn-g" onClick={loadData}><Icon name="refresh" size={12} /> Обновить данные</button>
                  </div>
                </div>
              </div>
              {wSheets.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Листы воркеров</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>{["Лист", "Воркер", "Продаж", "Профит", "Доля", "Воркер", "Admin", "Статус"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {wSheets.map(sh => {
                          const wk = workers.find(w => w.id == sh.worker_id);
                          const { net } = getSheetProfit(sh.id);
                          const share = workerShares[sh.id] ?? wk?.share ?? 50;
                          const wP = Math.round(net * share / 100);
                          const aP = Math.round(net * (100 - share) / 100);
                          const cnt = sheetOrders.filter(o => o.sheet_id === sh.id && o.status === "sold").length;
                          return (
                            <tr key={sh.id} className="tr">
                              <td style={{ fontWeight: 600, color: "var(--text)" }}>{sh.name}</td>
                              <td>{wk?.name || "—"}</td>
                              <td>{cnt}</td>
                              <td style={{ fontWeight: 600, color: net >= 0 ? "var(--success)" : "var(--danger)" }}>{net >= 0 ? "+" : ""}{fmt(net)} ₽</td>
                              <td style={{ color: "var(--text3)" }}>{share}%</td>
                              <td>+{fmt(wP)} ₽</td>
                              <td style={{ fontWeight: 700, color: "var(--success)" }}>+{fmt(aP)} ₽</td>
                              <td><Badge status={sh.status} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      <AddOrderModal open={!!modals.addOrder} onClose={() => closeM("addOrder")} products={products} sheets={sheets.filter(s => s.status === "open")} workers={workers} isAdmin={isAdmin} onAdd={async order => {
        if (supabase) { await supabase.from("sheet_orders").insert([order]); if (order.bumps > 0) await supabase.from("sheet_bumps").insert([{ sheet_id: order.sheet_id, amount: order.bumps }]); await loadData(); }
        else { setSheetOrders(prev => [...prev, { ...order, id: Date.now(), created_at: new Date().toISOString() }]); }
        showToast("Продажа добавлена"); closeM("addOrder");
      }} />

      <AddSheetModal open={!!modals.addSheet} onClose={() => closeM("addSheet")} workers={workers} isAdmin={isAdmin} onAdd={async s => {
        if (supabase) { const { data } = await supabase.from("day_sheets").insert([s]).select().single(); setSheets(prev => [data, ...prev]); }
        else setSheets(prev => [{ ...s, id: Date.now(), created_at: new Date().toISOString() }, ...prev]);
        showToast("Лист создан"); closeM("addSheet");
      }} />

      <AddWorkerModal open={!!modals.addWorker} onClose={() => closeM("addWorker")} onAdd={async w => {
        if (supabase) { await supabase.from("worker_keys").insert([w]); await loadData(); }
        else setWorkers(prev => [...prev, { ...w, id: Date.now() }]);
        showToast("Воркер добавлен"); closeM("addWorker");
      }} />

      <AddCategoryModal open={!!modals.addCategory} onClose={() => closeM("addCategory")} onAdd={async name => {
        if (supabase) { const { data } = await supabase.from("categories").insert([{ name }]).select().single(); setCategories(prev => [...prev, data]); }
        else setCategories(prev => [...prev, { id: Date.now(), name }]);
        showToast("Категория добавлена"); closeM("addCategory");
      }} />

      <AddProductModal open={!!modals.addProduct} onClose={() => closeM("addProduct")} categories={categories} onAdd={async p => {
        if (supabase) { const { data } = await supabase.from("products").insert([p]).select("*, categories(name)").single(); setProducts(prev => [...prev, { ...data, category: data.categories?.name || "" }]); }
        else setProducts(prev => [...prev, { ...p, id: Date.now(), category: categories.find(c => c.id == p.category_id)?.name || "" }]);
        showToast("Товар добавлен"); closeM("addProduct");
      }} />

      {editTarget && (
        <EditProductModal open={!!modals.editProduct} onClose={() => { closeM("editProduct"); setEditTarget(null); }} product={editTarget} categories={categories} onSave={async (id, upd) => {
          if (supabase) await supabase.from("products").update(upd).eq("id", id);
          setProducts(prev => prev.map(x => x.id === id ? { ...x, ...upd, category: categories.find(c => c.id == upd.category_id)?.name || x.category } : x));
          showToast("Товар обновлён"); closeM("editProduct"); setEditTarget(null);
        }} />
      )}

      <Toast toast={toast} />
    </div>
  );
}

// ── MODAL COMPONENTS ──────────────────────────────────────────────────────────

function AddOrderModal({ open, onClose, products, sheets, workers, isAdmin, onAdd }) {
  const [pid, setPid] = useState("");
  const [sp, setSp] = useState("");
  const [bm, setBm] = useState(0);
  const [sid, setSid] = useState("");
  const [wid, setWid] = useState("");

  useEffect(() => { if (sheets.length && open) setSid(sheets[0].id); }, [open]);
  useEffect(() => { const p = products.find(x => x.id == pid); if (p) setSp(p.sale_price_rub); }, [pid]);

  const submit = () => {
    if (!pid || !sp || !sid) return;
    onAdd({ sheet_id: +sid, product_id: +pid, sale_price: +sp, bumps: +bm || 0, status: "sold" });
  };
  return (
    <Modal open={open} onClose={onClose} title="Добавить продажу">
      <FS label="Товар" value={pid} onChange={e => setPid(e.target.value)} options={[{ value: "", label: "— выберите —" }, ...products.map(p => ({ value: p.id, label: p.name }))]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <FI label="Цена продажи (₽)" type="number" value={sp} onChange={e => setSp(e.target.value)} placeholder="0" />
        <FI label="Поднятия (₽)" type="number" value={bm} onChange={e => setBm(e.target.value)} placeholder="0" />
      </div>
      <FS label="Лист" value={sid} onChange={e => setSid(e.target.value)} options={sheets.map(s => ({ value: s.id, label: s.name }))} />
      {isAdmin && <FS label="Воркер" value={wid} onChange={e => setWid(e.target.value)} options={[{ value: "", label: "Admin (я)" }, ...workers.map(w => ({ value: w.id, label: w.name }))]} />}
      <MFoot onClose={onClose} onSubmit={submit} label="Добавить" />
    </Modal>
  );
}

function AddSheetModal({ open, onClose, workers, isAdmin, onAdd }) {
  const [name, setName] = useState(todayStr());
  const [wid, setWid] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Новый лист">
      <FI label="Название" value={name} onChange={e => setName(e.target.value)} placeholder={todayStr()} />
      {isAdmin && <FS label="Воркер" value={wid} onChange={e => setWid(e.target.value)} options={[{ value: "", label: "Admin (я)" }, ...workers.map(w => ({ value: w.id, label: w.name }))]} />}
      <MFoot onClose={onClose} onSubmit={() => onAdd({ name, status: "open", worker_id: wid || null })} label="Создать" />
    </Modal>
  );
}

function AddWorkerModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [share, setShare] = useState(50);
  return (
    <Modal open={open} onClose={onClose} title="Добавить воркера">
      <FI label="Имя" value={name} onChange={e => setName(e.target.value)} placeholder="Имя воркера" />
      <Field label="Worker Key">
        <div style={{ display: "flex", gap: 7 }}>
          <input className="fi" value={key} onChange={e => setKey(e.target.value)} placeholder="worker-xxxx" style={{ flex: 1 }} />
          <button className="btn-g" onClick={() => setKey("worker-" + Math.random().toString(36).slice(2, 10))}>Генерировать</button>
        </div>
      </Field>
      <FI label="Доля (%)" type="number" value={share} onChange={e => setShare(e.target.value)} placeholder="50" />
      <MFoot onClose={onClose} onSubmit={() => { if (!name || !key) return; onAdd({ name, key, share: +share }); }} label="Добавить" />
    </Modal>
  );
}

function AddCategoryModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Новая категория" width={360}>
      <FI label="Название" value={name} onChange={e => setName(e.target.value)} placeholder="Steam, Valorant..." />
      <MFoot onClose={onClose} onSubmit={() => { if (!name) return; onAdd(name); setName(""); }} label="Создать" />
    </Modal>
  );
}

function AddProductModal({ open, onClose, categories, onAdd }) {
  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");
  const [price, setPrice] = useState("");
  const [buyUsd, setBuyUsd] = useState("");
  const [ct, setCt] = useState("standard");
  return (
    <Modal open={open} onClose={onClose} title="Добавить товар">
      <FI label="Название" value={name} onChange={e => setName(e.target.value)} placeholder="Название товара" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <FS label="Категория" value={catId} onChange={e => setCatId(e.target.value)} options={[{ value: "", label: "Без категории" }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
        <FI label="Цена продажи (₽)" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
        <FI label="Закупка ($)" type="number" value={buyUsd} onChange={e => setBuyUsd(e.target.value)} placeholder="0" />
        <FS label="Комиссия" value={ct} onChange={e => setCt(e.target.value)} options={[{ value: "standard", label: "5% Standard" }, { value: "premium", label: "4% Premium" }]} />
      </div>
      <MFoot onClose={onClose} onSubmit={() => { if (!name || !price) return; onAdd({ name, category_id: catId || null, sale_price_rub: +price, purchase_usd: +buyUsd || 0, commission_type: ct, status: "active" }); }} label="Добавить" />
    </Modal>
  );
}

function EditProductModal({ open, onClose, product: p, categories, onSave }) {
  const [name, setName] = useState(p.name);
  const [catId, setCatId] = useState(p.category_id || "");
  const [price, setPrice] = useState(p.sale_price_rub);
  const [buyUsd, setBuyUsd] = useState(p.purchase_usd);
  const [ct, setCt] = useState(p.commission_type || "standard");
  const [status, setStatus] = useState(p.status || "active");
  return (
    <Modal open={open} onClose={onClose} title={"Редактировать: " + p.name}>
      <FI label="Название" value={name} onChange={e => setName(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <FS label="Категория" value={catId} onChange={e => setCatId(e.target.value)} options={[{ value: "", label: "Без категории" }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
        <FI label="Цена продажи (₽)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <FI label="Закупка ($)" type="number" value={buyUsd} onChange={e => setBuyUsd(e.target.value)} />
        <FS label="Комиссия" value={ct} onChange={e => setCt(e.target.value)} options={[{ value: "standard", label: "5% Standard" }, { value: "premium", label: "4% Premium" }]} />
        <FS label="Статус" value={status} onChange={e => setStatus(e.target.value)} options={[{ value: "active", label: "Активен" }, { value: "inactive", label: "Неактивен" }]} />
      </div>
      <MFoot onClose={onClose} onSubmit={() => onSave(p.id, { name, category_id: catId || null, sale_price_rub: +price, purchase_usd: +buyUsd || 0, commission_type: ct, status })} label="Сохранить" />
    </Modal>
  );
}
