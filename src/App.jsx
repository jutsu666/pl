import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

// ─── LOCAL STORAGE KEYS ──────────────────────────────────────────────────────
const LS = {
  googleRate: "playerok_googleRate",
  playerokRate: "playerok_playerokRate",
  googleRateDate: "playerok_googleRateUpdatedAt",
  closedSnaps: "playerok_closedSheetSnapshots",
  workerSnaps: "playerok_workerClosedSheetSnapshots",
  workerShares: "playerok_workerSheetShares",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const ls = (key, fallback = null) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const lsSet = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
const fmtF = (n, d = 2) => Number(n).toFixed(d);
const today = () => new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

function calcProfit({ salePrice, buyUsd, playerokRate, commType, premiumEnabled, purchasePercentEnabled, purchasePercent }) {
  const rate = playerokRate || 88;
  const commRate = commType === "premium" || premiumEnabled ? 0.04 : 0.05;
  const commAmt = salePrice * commRate;
  let buyCost;
  if (purchasePercentEnabled && purchasePercent) {
    buyCost = salePrice * (purchasePercent / 100);
  } else {
    buyCost = buyUsd * rate;
  }
  return salePrice - commAmt - buyCost;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    sheets: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
    calc: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z",
    rate: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
    catalog: "M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.12 15.88 0 13.3 0c-1.4 0-2.56.6-3.36 1.5L9 3l-.94-1.5C7.26.6 6.1 0 4.7 0 2.12 0 0 2.12 0 4.7c0 .44.11.86.18 1.3H0v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z",
    admin: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    x: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
    logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    refresh: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
    chart: "M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z",
    workers: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    key: "M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
    eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
    lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z",
    trend_up: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z",
    close: "M8 7v3L4 6.5 8 3v3h4c3.31 0 6 2.69 6 6 0 2.97-2.17 5.43-5 5.91V16.3c1.72-.45 3-2 3-3.8 0-2.21-1.79-4-4-4H8z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d={icons[name] || icons.dashboard} />
    </svg>
  );
};

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("admin"); // 'admin' | 'worker'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerKey, setWorkerKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdmin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (supabase) {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      onLogin({ user: data.user, role: profile?.role || "admin", session: data.session });
    } else {
      if (email === "admin@playerok.ru" && password === "admin123") {
        onLogin({ user: { id: "admin-demo", email }, role: "admin", session: null });
      } else { setError("Неверные данные. Демо: admin@playerok.ru / admin123"); }
    }
    setLoading(false);
  };

  const handleWorker = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (supabase) {
      const { data: wk, error: err } = await supabase.from("worker_keys").select("*").eq("key", workerKey).single();
      if (err || !wk) { setError("Неверный ключ воркера"); setLoading(false); return; }
      const workerEmail = `worker_${wk.id}@playerok.internal`;
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: workerEmail, password: wk.key });
      if (authErr) { setError("Ошибка авторизации воркера"); setLoading(false); return; }
      onLogin({ user: data.user, role: "worker", workerData: wk, session: data.session });
    } else {
      if (workerKey === "worker-demo") {
        onLogin({ user: { id: "worker-demo" }, role: "worker", workerData: { id: 1, name: "Артём", key: "worker-demo", share: 50 }, session: null });
      } else { setError("Неверный ключ. Демо: worker-demo"); }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font)" }}>
      <div style={{ width: 400, padding: "40px 36px", background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>🎮</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>Playerok Tracker</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Учёт продаж и доходов</div>
        </div>

        <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 10, padding: 3, marginBottom: 24, gap: 3 }}>
          {["admin", "worker"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === m ? "var(--card)" : "transparent", color: mode === m ? "var(--text)" : "var(--muted)", fontWeight: mode === m ? 600 : 400, fontSize: 13, cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font)" }}>
              {m === "admin" ? "👑 Admin" : "🔧 Worker"}
            </button>
          ))}
        </div>

        <form onSubmit={mode === "admin" ? handleAdmin : handleWorker}>
          {mode === "admin" ? (
            <>
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@playerok.ru" />
              <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </>
          ) : (
            <Input label="Worker Key" value={workerKey} onChange={e => setWorkerKey(e.target.value)} placeholder="worker-key-xxxxx" icon="key" />
          )}
          {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", fontFamily: "var(--font)", letterSpacing: "0.01em" }}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── INPUT COMPONENT ─────────────────────────────────────────────────────────
function Input({ label, type = "text", value, onChange, placeholder, icon }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><Icon name={icon} size={15} /></span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", padding: icon ? "9px 12px 9px 34px" : "9px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontFamily: "var(--font)", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
      </div>
    </div>
  );
}

// ─── SELECT COMPONENT ─────────────────────────────────────────────────────────
function Select({ label, value, onChange, options, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ width: "100%", padding: "9px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontFamily: "var(--font)", outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, change, accent, icon, delay = 0 }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden", animation: `fadeUp 0.4s ease ${delay}s both`, cursor: "default", transition: "transform 0.2s, border-color 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = accent; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: accent, opacity: 0.08 }} />
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>{value}</div>
      {(sub || change) && (
        <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          {change && <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: change > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: change > 0 ? "var(--success)" : "var(--danger)" }}>{change > 0 ? "+" : ""}{fmt(change)} ₽</span>}
          {sub}
        </div>
      )}
      {icon && <div style={{ position: "absolute", top: 18, right: 18, opacity: 0.2, fontSize: 26 }}>{icon}</div>}
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, show };
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: "var(--card)", border: `1px solid ${toast.type === "error" ? "var(--danger)" : "var(--success)"}`, borderRadius: 12, padding: "12px 20px", fontSize: 13, color: "var(--text)", zIndex: 9999, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", animation: "slideInRight 0.3s ease" }}>
      <span>{toast.type === "error" ? "❌" : "✅"}</span> {toast.msg}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 440 }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(6px)", animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 30px", width, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto", animation: "scaleIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</div>
          <button onClick={onClose} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon name="x" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── BAR CHART ───────────────────────────────────────────────────────────────
function BarChart({ data, color = "var(--accent)" }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, paddingTop: 16 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>{d.value >= 1000 ? (d.value / 1000).toFixed(1) + "к" : d.value || ""}</div>
          <div title={`${d.label}: ${fmt(d.value)} ₽`} style={{ width: "100%", height: `${Math.max((d.value / maxVal) * 140, 4)}px`, background: color, borderRadius: "5px 5px 0 0", opacity: 0.85, transition: "all 0.3s ease", cursor: "pointer", minHeight: 4 }}
            onMouseEnter={e => { e.target.style.opacity = "1"; e.target.style.transform = "scaleX(1.05)"; }}
            onMouseLeave={e => { e.target.style.opacity = "0.85"; e.target.style.transform = ""; }}
          />
          <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", whiteSpace: "nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
function DonutChart({ segments }) {
  const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let angle = -90;
  const cx = 80, cy = 80, r = 60;
  const paths = segments.map((seg, i) => {
    const pct = seg.value / total;
    const sweep = pct * 360;
    const a1 = angle * Math.PI / 180, a2 = (angle + sweep) * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = sweep > 180 ? 1 : 0;
    const path = <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={COLORS[i % COLORS.length]} opacity={0.9} />;
    angle += sweep;
    return { path, color: COLORS[i % COLORS.length], ...seg, pct: Math.round(pct * 100) };
  });
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {segments.length > 0 ? (
          <>{paths.map(p => p.path)}<circle cx={cx} cy={cy} r={36} fill="var(--card)" /></>
        ) : <circle cx={cx} cy={cy} r={60} fill="var(--bg2)" />}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {paths.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{p.value}</span>
            <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 30, textAlign: "right" }}>{p.pct}%</span>
          </div>
        ))}
        {!segments.length && <div style={{ fontSize: 12, color: "var(--muted)" }}>Нет данных</div>}
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = { sold: ["Продано", "var(--success)", "rgba(16,185,129,0.1)"], pending: ["Ожидание", "var(--warning)", "rgba(245,158,11,0.1)"], cancelled: ["Отменено", "var(--danger)", "rgba(239,68,68,0.1)"], open: ["Открыт", "#22d3ee", "rgba(6,182,212,0.1)"], closed: ["Закрыт", "var(--muted)", "rgba(90,90,112,0.15)"], active: ["Активен", "var(--success)", "rgba(16,185,129,0.1)"], inactive: ["Неактивен", "var(--muted)", "rgba(90,90,112,0.15)"] };
  const [label, color, bg] = map[status] || [status, "var(--muted)", "var(--bg2)"];
  return <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, color, background: bg }}>{label}</span>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null); // { user, role, workerData, session }
  const [page, setPage] = useState("dashboard");

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [sheetOrders, setSheetOrders] = useState([]);
  const [sheetBumps, setSheetBumps] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [profiles, setProfiles] = useState([]);

  // Rates
  const [googleRate, setGoogleRate] = useState(() => ls(LS.googleRate, 91.4));
  const [playerokRate, setPlayerokRate] = useState(() => ls(LS.playerokRate, 88.0));
  const [closedSnaps, setClosedSnaps] = useState(() => ls(LS.closedSnaps, {}));
  const [workerShares, setWorkerShares] = useState(() => ls(LS.workerShares, {}));

  // UI
  const [loading, setLoading] = useState(false);
  const { toast, show: showToast } = useToast();

  // Modals
  const [modals, setModals] = useState({});
  const openModal = (name) => setModals(m => ({ ...m, [name]: true }));
  const closeModal = (name) => setModals(m => ({ ...m, [name]: false }));

  // ─ CHECK AUTH SESSION
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data: profile }) => {
          setAuth({ user: session.user, role: profile?.role || "admin", session });
        });
      }
    });
  }, []);

  // ─ LOAD DATA
  useEffect(() => {
    if (!auth) return;
    loadData();
  }, [auth]);

  const loadData = async () => {
    setLoading(true);
    if (supabase) {
      const [cats, prods, daySheets, orders, bumps, wks, profs] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("products").select("*, categories(name)").eq("status", "active"),
        auth.role === "admin"
          ? supabase.from("day_sheets").select("*").order("created_at", { ascending: false })
          : supabase.from("day_sheets").select("*").eq("worker_id", auth.user.id).order("created_at", { ascending: false }),
        supabase.from("sheet_orders").select("*, products(name, category_id)"),
        supabase.from("sheet_bumps").select("*"),
        auth.role === "admin" ? supabase.from("worker_keys").select("*") : Promise.resolve({ data: [] }),
        auth.role === "admin" ? supabase.from("profiles").select("*") : Promise.resolve({ data: [] }),
      ]);
      setCategories(cats.data || []);
      setProducts(prods.data?.map(p => ({ ...p, category: p.categories?.name || "" })) || []);
      setSheets(daySheets.data || []);
      setSheetOrders(orders.data || []);
      setSheetBumps(bumps.data || []);
      setWorkers(wks.data || []);
      setProfiles(profs.data || []);
    } else {
      // Demo data
      const demoCats = [{ id: 1, name: "Steam" }, { id: 2, name: "Valorant" }, { id: 3, name: "Roblox" }];
      const demoProds = [
        { id: 1, name: "Steam 10$", category_id: 1, category: "Steam", sale_price_rub: 1050, purchase_usd: 10, commission_type: "standard", status: "active" },
        { id: 2, name: "Steam 20$", category_id: 1, category: "Steam", sale_price_rub: 2050, purchase_usd: 20, commission_type: "standard", status: "active" },
        { id: 3, name: "Valorant 1000 VP", category_id: 2, category: "Valorant", sale_price_rub: 750, purchase_usd: 7.5, commission_type: "premium", status: "active" },
        { id: 4, name: "Roblox 400 R$", category_id: 3, category: "Roblox", sale_price_rub: 350, purchase_usd: 3.5, commission_type: "standard", status: "active" },
      ];
      const demoSheets = [
        { id: 1, name: "20.04.2025", status: "open", worker_id: null, created_at: new Date().toISOString() },
        { id: 2, name: "19.04.2025", status: "closed", worker_id: "worker-demo", created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, name: "18.04.2025", status: "closed", worker_id: null, created_at: new Date(Date.now() - 172800000).toISOString() },
      ];
      const demoOrders = [
        { id: 1, sheet_id: 1, product_id: 1, sale_price: 1050, quantity: 1, status: "sold", created_at: new Date().toISOString(), products: { name: "Steam 10$", category_id: 1 } },
        { id: 2, sheet_id: 1, product_id: 3, sale_price: 750, quantity: 1, status: "sold", created_at: new Date().toISOString(), products: { name: "Valorant 1000 VP", category_id: 2 } },
        { id: 3, sheet_id: 2, product_id: 4, sale_price: 350, quantity: 1, status: "sold", created_at: new Date(Date.now() - 86400000).toISOString(), products: { name: "Roblox 400 R$", category_id: 3 } },
        { id: 4, sheet_id: 2, product_id: 2, sale_price: 2050, quantity: 1, status: "sold", created_at: new Date(Date.now() - 86400000).toISOString(), products: { name: "Steam 20$", category_id: 1 } },
        { id: 5, sheet_id: 3, product_id: 1, sale_price: 1050, quantity: 1, status: "sold", created_at: new Date(Date.now() - 172800000).toISOString(), products: { name: "Steam 10$", category_id: 1 } },
      ];
      const demoBumps = [
        { id: 1, sheet_id: 1, amount: 50, created_at: new Date().toISOString() },
        { id: 2, sheet_id: 2, amount: 100, created_at: new Date(Date.now() - 86400000).toISOString() },
      ];
      const demoWorkers = [{ id: 1, name: "Артём", key: "worker-demo", share: 50, created_at: new Date().toISOString() }];
      setCategories(demoCats);
      setProducts(demoProds);
      setSheets(demoSheets);
      setSheetOrders(demoOrders);
      setSheetBumps(demoBumps);
      setWorkers(demoWorkers);
    }
    setLoading(false);
  };

  // ─ PROFIT CALCULATIONS
  const getSheetProfit = useCallback((sheetId) => {
    const snap = closedSnaps[sheetId];
    if (snap) return snap;
    const orders = sheetOrders.filter(o => o.sheet_id === sheetId && o.status === "sold");
    const bumps = sheetBumps.filter(b => b.sheet_id === sheetId).reduce((s, b) => s + b.amount, 0);
    const gross = orders.reduce((s, o) => {
      const prod = products.find(p => p.id === o.product_id);
      if (!prod) return s;
      return s + calcProfit({ salePrice: o.sale_price, buyUsd: prod.purchase_usd, playerokRate, commType: prod.commission_type, premiumEnabled: prod.premium_enabled, purchasePercentEnabled: prod.purchase_percent_enabled, purchasePercent: prod.purchase_percent });
    }, 0);
    return { gross, bumps, net: gross - bumps };
  }, [sheetOrders, sheetBumps, products, playerokRate, closedSnaps]);

  // Admin's own profit (non-worker sheets)
  const mySheets = sheets.filter(s => !s.worker_id);
  const workerSheetsList = sheets.filter(s => s.worker_id);

  const myProfit = mySheets.reduce((s, sh) => {
    const { net } = getSheetProfit(sh.id);
    return s + net;
  }, 0);

  const workerProfit = workerSheetsList.reduce((s, sh) => {
    const { net } = getSheetProfit(sh.id);
    const share = workerShares[sh.id] ?? 50;
    return s + Math.round(net * (share / 100));
  }, 0);

  const totalProfit = myProfit + workerSheetsList.reduce((s, sh) => {
    const { net } = getSheetProfit(sh.id);
    const share = workerShares[sh.id] ?? 50;
    return s + Math.round(net * ((100 - share) / 100));
  }, 0);

  const todaySales = sheetOrders.filter(o => {
    const d = new Date(o.created_at);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth();
  }).length;

  // ─ LOGOUT
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setAuth(null);
    setPage("dashboard");
  };

  // ─ CLOSE SHEET (snapshot)
  const closeSheet = async (sheetId) => {
    const profit = getSheetProfit(sheetId);
    const newSnaps = { ...closedSnaps, [sheetId]: profit };
    setClosedSnaps(newSnaps);
    lsSet(LS.closedSnaps, newSnaps);
    if (supabase) {
      await supabase.from("day_sheets").update({ status: "closed" }).eq("id", sheetId);
    }
    setSheets(s => s.map(sh => sh.id === sheetId ? { ...sh, status: "closed" } : sh));
    showToast("Лист закрыт и зафиксирован");
  };

  // ─ DELETE SHEET
  const deleteSheet = async (sheetId) => {
    if (!window.confirm("Удалить лист и все его продажи?")) return;
    if (supabase) {
      await supabase.from("sheet_orders").delete().eq("sheet_id", sheetId);
      await supabase.from("sheet_bumps").delete().eq("sheet_id", sheetId);
      await supabase.from("day_sheets").delete().eq("id", sheetId);
    }
    setSheets(s => s.filter(sh => sh.id !== sheetId));
    setSheetOrders(o => o.filter(x => x.sheet_id !== sheetId));
    setSheetBumps(b => b.filter(x => x.sheet_id !== sheetId));
    const newSnaps = { ...closedSnaps };
    delete newSnaps[sheetId];
    setClosedSnaps(newSnaps);
    lsSet(LS.closedSnaps, newSnaps);
    showToast("Лист удалён");
  };

  if (!auth) return <AuthScreen onLogin={setAuth} />;

  const isAdmin = auth.role === "admin";
  const isWorker = auth.role === "worker";

  const navItems = [
    { id: "dashboard", label: "Панель", icon: "dashboard" },
    { id: "sheets", label: "Листы", icon: "sheets" },
    { id: "calc", label: "Калькулятор", icon: "calc" },
    { id: "catalog", label: "Каталог", icon: "catalog" },
    { id: "rate", label: "Курс", icon: "rate" },
    ...(isAdmin ? [{ id: "admin", label: "Админка", icon: "admin" }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 220, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: "22px 18px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎮</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>Playerok</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Tracker</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 10px" }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setPage(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2, fontSize: 13.5, fontWeight: page === item.id ? 600 : 400, color: page === item.id ? "#a78bfa" : "var(--muted)", background: page === item.id ? "rgba(124,58,237,0.12)" : "transparent", transition: "all 0.15s" }}
              onMouseEnter={e => { if (page !== item.id) { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; } }}
              onMouseLeave={e => { if (page !== item.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; } }}>
              <Icon name={item.icon} size={17} color={page === item.id ? "#a78bfa" : "currentColor"} />
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, background: "var(--bg2)" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: isAdmin ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "linear-gradient(135deg,#06b6d4,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {isAdmin ? "A" : (auth.workerData?.name?.[0] || "W")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isAdmin ? "Admin" : auth.workerData?.name || "Worker"}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{isAdmin ? "Управляющий" : "Воркер"}</div>
            </div>
            <button onClick={logout} title="Выйти" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 2 }}><Icon name="logout" size={15} /></button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOPBAR */}
        <div style={{ padding: "0 28px", height: 58, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
            {navItems.find(n => n.id === page)?.label || "Панель"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setPage("rate")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", animation: "pulse 2s infinite" }} />
              Google: {fmtF(googleRate)} ₽
            </div>
            {isAdmin && (
              <button onClick={() => openModal("addOrder")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = ""; }}>
                <Icon name="plus" size={15} color="#fff" /> Продажа
              </button>
            )}
          </div>
        </div>

        {/* PAGES */}
        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>

          {/* ─── DASHBOARD ─── */}
          {page === "dashboard" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              {isAdmin && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                  <MetricCard label="Чистый профит" value={fmt(myProfit) + " ₽"} sub="мои листы" accent="#7c3aed" icon="💰" delay={0.05} />
                  <MetricCard label="Профит воркеров" value={fmt(workerProfit) + " ₽"} sub="доля воркеров" accent="#06b6d4" icon="👥" delay={0.1} />
                  <MetricCard label="Общий профит" value={fmt(totalProfit) + " ₽"} sub="все источники" accent="#10b981" icon="📈" delay={0.15} />
                  <MetricCard label="Продаж сегодня" value={todaySales} sub={`${sheetOrders.length} всего`} accent="#f59e0b" icon="🛒" delay={0.2} />
                </div>
              )}
              {isWorker && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
                  {(() => {
                    const myWSheets = sheets.filter(s => s.worker_id === auth.user.id);
                    const wTotal = myWSheets.reduce((s, sh) => {
                      const { net } = getSheetProfit(sh.id);
                      const share = workerShares[sh.id] ?? auth.workerData?.share ?? 50;
                      return s + Math.round(net * (share / 100));
                    }, 0);
                    return (
                      <>
                        <MetricCard label="Мой профит" value={fmt(wTotal) + " ₽"} sub="за все листы" accent="#7c3aed" icon="💰" delay={0.05} />
                        <MetricCard label="Моих листов" value={myWSheets.length} sub={`${myWSheets.filter(s => s.status === "open").length} открыто`} accent="#06b6d4" icon="📋" delay={0.1} />
                        <MetricCard label="Продаж сегодня" value={todaySales} sub="сегодня" accent="#10b981" icon="🛒" delay={0.15} />
                      </>
                    );
                  })()}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, animation: "fadeUp 0.4s ease 0.1s both" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Продажи по дням</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Профит в рублях</div>
                    </div>
                  </div>
                  <BarChart color="var(--accent)" data={(() => {
                    const days = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(); d.setDate(d.getDate() - (6 - i));
                      return { date: d, label: d.getDate() + "." + String(d.getMonth() + 1).padStart(2, "0") };
                    });
                    return days.map(({ date, label }) => {
                      const dayOrders = sheetOrders.filter(o => {
                        const od = new Date(o.created_at);
                        return od.getDate() === date.getDate() && od.getMonth() === date.getMonth() && o.status === "sold";
                      });
                      const value = dayOrders.reduce((s, o) => {
                        const prod = products.find(p => p.id === o.product_id);
                        if (!prod) return s;
                        return s + calcProfit({ salePrice: o.sale_price, buyUsd: prod.purchase_usd, playerokRate, commType: prod.commission_type });
                      }, 0);
                      return { label, value: Math.max(0, Math.round(value)) };
                    });
                  })()} />
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, animation: "fadeUp 0.4s ease 0.15s both" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Категории</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Доля продаж</div>
                  <DonutChart segments={(() => {
                    const map = {};
                    sheetOrders.filter(o => o.status === "sold").forEach(o => {
                      const prod = products.find(p => p.id === o.product_id);
                      const cat = prod?.category || "Другое";
                      map[cat] = (map[cat] || 0) + 1;
                    });
                    return Object.entries(map).map(([label, value]) => ({ label, value }));
                  })()} />
                </div>
              </div>

              {/* RECENT ORDERS TABLE */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", animation: "fadeUp 0.4s ease 0.2s both" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Последние продажи</div>
                  <button onClick={() => setPage("sheets")} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)", fontWeight: 500 }}>Все листы →</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>{["Товар", "Цена продажи", "Профит", "Поднятия", "Статус", "Дата"].map(h => (
                        <th key={h} style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", fontWeight: 600, padding: "10px 18px", textAlign: "left", background: "var(--bg2)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[...sheetOrders].reverse().slice(0, 8).map(o => {
                        const prod = products.find(p => p.id === o.product_id);
                        const profit = prod ? Math.round(calcProfit({ salePrice: o.sale_price, buyUsd: prod.purchase_usd, playerokRate, commType: prod.commission_type })) : 0;
                        const sheetBumpAmt = sheetBumps.filter(b => b.sheet_id === o.sheet_id).reduce((s, b) => s + b.amount, 0);
                        return (
                          <tr key={o.id} onMouseEnter={e => e.currentTarget.style.background = "var(--bg2)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                            <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{o.products?.name || prod?.name || "—"}</td>
                            <td style={{ padding: "11px 18px", fontSize: 13, color: "var(--muted)" }}>{fmt(o.sale_price)} ₽</td>
                            <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 600, color: profit > 0 ? "var(--success)" : "var(--danger)" }}>{profit > 0 ? "+" : ""}{fmt(profit)} ₽</td>
                            <td style={{ padding: "11px 18px", fontSize: 13, color: "var(--muted)" }}>{sheetBumpAmt ? "-" + fmt(sheetBumpAmt) + " ₽" : "—"}</td>
                            <td style={{ padding: "11px 18px" }}><Badge status={o.status} /></td>
                            <td style={{ padding: "11px 18px", fontSize: 12, color: "var(--muted)" }}>{new Date(o.created_at).toLocaleDateString("ru-RU")}</td>
                          </tr>
                        );
                      })}
                      {!sheetOrders.length && (
                        <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Продаж пока нет</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── SHEETS ─── */}
          {page === "sheets" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{sheets.filter(s => s.status === "open").length} открытых · {sheets.filter(s => s.status === "closed").length} закрытых</div>
                {isAdmin && <button onClick={() => openModal("addSheet")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}><Icon name="plus" size={15} color="#fff" /> Новый лист</button>}
              </div>
              {!sheets.length && <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>📋 Листов пока нет</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {sheets.map((sh, i) => {
                  const { gross, bumps, net } = getSheetProfit(sh.id);
                  const orderCount = sheetOrders.filter(o => o.sheet_id === sh.id && o.status === "sold").length;
                  const share = workerShares[sh.id] ?? 50;
                  return (
                    <div key={sh.id} style={{ background: "var(--card)", border: `1px solid ${sh.status === "open" ? "rgba(6,182,212,0.35)" : "var(--border)"}`, borderRadius: 16, padding: 20, animation: `slideIn 0.3s ease ${i * 0.05}s both`, opacity: sh.status === "closed" ? 0.8 : 1, transition: "transform 0.2s, border-color 0.2s", position: "relative" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = ""}>
                      <div style={{ position: "absolute", top: 14, right: 14 }}><Badge status={sh.status} /></div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{sh.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{sh.worker_id ? (workers.find(w => w.id == sh.worker_id)?.name || "Воркер") : "Admin"}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[["Продаж", orderCount, ""], ["Профит", (net >= 0 ? "+" : "") + fmt(net) + " ₽", net >= 0 ? "var(--success)" : "var(--danger)"], ["Поднятия", bumps ? "-" + fmt(bumps) + " ₽" : "0 ₽", "var(--warning)"]].map(([l, v, c]) => (
                          <div key={l} style={{ textAlign: "center", background: "var(--bg2)", borderRadius: 9, padding: "9px 4px" }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: c || "var(--text)" }}>{v}</div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      {isAdmin && sh.worker_id && (
                        <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--bg2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--muted)", flex: 1 }}>Доля воркера</span>
                          <input type="number" min={0} max={100} value={share} onChange={e => {
                            const v = parseInt(e.target.value) || 0;
                            const ns = { ...workerShares, [sh.id]: v };
                            setWorkerShares(ns); lsSet(LS.workerShares, ns);
                          }} style={{ width: 50, padding: "3px 6px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 12, fontFamily: "var(--font)", textAlign: "center" }} />
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>%</span>
                        </div>
                      )}
                      {isAdmin && sh.status === "open" && (
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                          <button onClick={() => closeSheet(sh.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", fontWeight: 500, transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--success)"; e.currentTarget.style.color = "var(--success)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
                            ✓ Закрыть лист
                          </button>
                          <button onClick={() => deleteSheet(sh.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "var(--danger)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}>✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── CALCULATOR ─── */}
          {page === "calc" && <CalcPage products={products} googleRate={googleRate} playerokRate={playerokRate} />}

          {/* ─── CATALOG ─── */}
          {page === "catalog" && <CatalogPage products={products} categories={categories} playerokRate={playerokRate} isAdmin={isAdmin} onRefresh={loadData} showToast={showToast} openModal={openModal} />}

          {/* ─── RATE ─── */}
          {page === "rate" && (
            <RatePage googleRate={googleRate} setGoogleRate={v => { setGoogleRate(v); lsSet(LS.googleRate, v); }}
              playerokRate={playerokRate} setPlayerokRate={v => { setPlayerokRate(v); lsSet(LS.playerokRate, v); }}
              isAdmin={isAdmin} showToast={showToast} />
          )}

          {/* ─── ADMIN ─── */}
          {page === "admin" && isAdmin && <AdminPage workers={workers} sheets={sheets} sheetOrders={sheetOrders} products={products} playerokRate={playerokRate} workerShares={workerShares} openModal={openModal} showToast={showToast} onRefresh={loadData} />}

        </div>
      </main>

      {/* GLOBAL MODALS */}
      <AddOrderModal open={modals.addOrder} onClose={() => closeModal("addOrder")} products={products} sheets={sheets.filter(s => s.status === "open")} workers={workers} isAdmin={isAdmin} auth={auth} onAdd={async (order) => {
        if (supabase) {
          await supabase.from("sheet_orders").insert([order]);
          await loadData();
        } else {
          setSheetOrders(prev => [...prev, { ...order, id: Date.now(), created_at: new Date().toISOString(), products: { name: products.find(p => p.id === order.product_id)?.name } }]);
        }
        showToast("Продажа добавлена!");
        closeModal("addOrder");
      }} />

      <AddSheetModal open={modals.addSheet} onClose={() => closeModal("addSheet")} workers={workers} isAdmin={isAdmin} auth={auth} onAdd={async (sheet) => {
        if (supabase) {
          const { data } = await supabase.from("day_sheets").insert([sheet]).select().single();
          setSheets(prev => [data, ...prev]);
        } else {
          setSheets(prev => [{ ...sheet, id: Date.now(), created_at: new Date().toISOString() }, ...prev]);
        }
        showToast("Лист создан!");
        closeModal("addSheet");
      }} />

      <AddWorkerModal open={modals.addWorker} onClose={() => closeModal("addWorker")} onAdd={async (w) => {
        if (supabase) {
          await supabase.from("worker_keys").insert([w]);
          await loadData();
        } else {
          setWorkers(prev => [...prev, { ...w, id: Date.now(), created_at: new Date().toISOString() }]);
        }
        showToast("Воркер добавлен!");
        closeModal("addWorker");
      }} />

      <AddProductModal open={modals.addProduct} onClose={() => closeModal("addProduct")} categories={categories} onAdd={async (p) => {
        if (supabase) {
          await supabase.from("products").insert([p]);
          await loadData();
        } else {
          setProducts(prev => [...prev, { ...p, id: Date.now(), category: categories.find(c => c.id == p.category_id)?.name || "" }]);
        }
        showToast("Товар добавлен!");
        closeModal("addProduct");
      }} />

      <Toast toast={toast} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        :root {
          --bg: #0c0c10; --bg2: #141418; --card: #181820;
          --border: #27273a; --accent: #7c3aed; --accent2: #06b6d4;
          --text: #eeeef5; --muted: #7070a0; --success: #10b981;
          --danger: #ef4444; --warning: #f59e0b;
          --font: 'Sora', system-ui, sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); font-family: var(--font); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-16px) } to { opacity:1; transform:translateX(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width:5px; height:5px }
        ::-webkit-scrollbar-track { background: var(--bg) }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius:4px }
        input::placeholder, textarea::placeholder { color: var(--muted); opacity:0.7 }
        table tr { transition: background 0.15s }
      `}</style>
    </div>
  );
}

// ─── CALC PAGE ────────────────────────────────────────────────────────────────
function CalcPage({ products, googleRate, playerokRate }) {
  const [salePrice, setSalePrice] = useState("");
  const [buyUsd, setBuyUsd] = useState("");
  const [gRate, setGRate] = useState(googleRate);
  const [pRate, setPRate] = useState(playerokRate);
  const [commType, setCommType] = useState("standard");
  const [workerShare, setWorkerShare] = useState(50);
  const [bumps, setBumps] = useState(0);
  const [selectedProd, setSelectedProd] = useState("");

  useEffect(() => { setGRate(googleRate); setPRate(playerokRate); }, [googleRate, playerokRate]);

  const sale = parseFloat(salePrice) || 0;
  const buy = parseFloat(buyUsd) || 0;
  const commRate = commType === "premium" ? 0.04 : 0.05;
  const commAmt = Math.round(sale * commRate);
  const buyRub = Math.round(buy * pRate);
  const gross = sale - commAmt - buyRub;
  const net = gross - bumps;
  const workerAmt = workerShare > 0 ? Math.round(net * (workerShare / 100)) : 0;
  const adminAmt = net - workerAmt;

  const row = (label, val, color, large) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: large ? 20 : 13, fontWeight: large ? 800 : 600, color: color || "var(--text)", letterSpacing: large ? "-0.02em" : 0 }}>{val}</span>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.3s ease", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 820 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>Параметры</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Быстрый выбор товара</label>
          <select value={selectedProd} onChange={e => {
            setSelectedProd(e.target.value);
            const p = products.find(x => x.id == e.target.value);
            if (p) { setSalePrice(p.sale_price_rub || ""); setBuyUsd(p.purchase_usd || ""); setCommType(p.commission_type || "standard"); }
          }} style={{ width: "100%", padding: "9px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontFamily: "var(--font)" }}>
            <option value="">— выберите товар —</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Input label="Цена продажи (₽)" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0" />
        <Input label="Закупка ($)" type="number" value={buyUsd} onChange={e => setBuyUsd(e.target.value)} placeholder="0" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Курс Google" type="number" value={gRate} onChange={e => setGRate(e.target.value)} placeholder="91.4" />
          <Input label="Курс Playerok" type="number" value={pRate} onChange={e => setPRate(e.target.value)} placeholder="88.0" />
        </div>
        <Select label="Комиссия" value={commType} onChange={e => setCommType(e.target.value)} options={[{ value: "standard", label: "5% — Standard" }, { value: "premium", label: "4% — Premium" }]} />
        <Input label="Доля воркера (%)" type="number" value={workerShare} onChange={e => setWorkerShare(parseInt(e.target.value) || 0)} placeholder="50" />
        <Input label="Поднятия (₽)" type="number" value={bumps} onChange={e => setBumps(parseInt(e.target.value) || 0)} placeholder="0" />
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>Расчёт профита</div>
        {row("Цена продажи", fmt(sale) + " ₽")}
        {row("Комиссия Playerok " + (commRate * 100) + "%", "-" + fmt(commAmt) + " ₽", "var(--danger)")}
        {row("Закупка по курсу Playerok", "-" + fmt(buyRub) + " ₽", "var(--danger)")}
        {row("Поднятия", bumps ? "-" + fmt(bumps) + " ₽" : "0 ₽", bumps ? "var(--warning)" : "var(--muted)")}
        {row("Валовый профит", (gross >= 0 ? "+" : "") + fmt(gross) + " ₽", gross >= 0 ? "var(--success)" : "var(--danger)")}
        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
        {row("Профит воркера (" + workerShare + "%)", workerAmt ? "+" + fmt(workerAmt) + " ₽" : "—", "var(--muted)")}
        {row("Профит admin", "+" + fmt(adminAmt) + " ₽", "var(--success)")}
        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Итого Admin</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: adminAmt >= 0 ? "var(--success)" : "var(--danger)", letterSpacing: "-0.02em" }}>{adminAmt >= 0 ? "+" : ""}{fmt(adminAmt)} ₽</span>
        </div>
      </div>
    </div>
  );
}

// ─── CATALOG PAGE ─────────────────────────────────────────────────────────────
function CatalogPage({ products, categories, playerokRate, isAdmin, showToast, openModal }) {
  const [activeCat, setActiveCat] = useState("all");
  const filtered = activeCat === "all" ? products : products.filter(p => p.category === activeCat || p.category_id == activeCat);
  const cats = [...new Set(products.map(p => p.category))].filter(Boolean);

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", ...cats].map(c => (
            <button key={c} onClick={() => setActiveCat(c)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "1px solid", borderColor: activeCat === c ? "var(--accent)" : "var(--border)", background: activeCat === c ? "rgba(124,58,237,0.1)" : "var(--card)", color: activeCat === c ? "#a78bfa" : "var(--muted)", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font)" }}>
              {c === "all" ? "Все" : c}
            </button>
          ))}
        </div>
        {isAdmin && <button onClick={() => openModal("addProduct")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}><Icon name="plus" size={15} color="#fff" /> Добавить</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {filtered.map((p, i) => {
          const profit = Math.round(p.sale_price_rub * (1 - (p.commission_type === "premium" ? 0.04 : 0.05)) - p.purchase_usd * playerokRate);
          return (
            <div key={p.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 13, padding: 18, animation: `fadeUp 0.3s ease ${i * 0.03}s both`, transition: "all 0.2s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>{p.category || "Без категории"}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.01em" }}>{fmt(p.sale_price_rub)} ₽</div>
              <div style={{ fontSize: 11, color: profit >= 0 ? "var(--success)" : "var(--danger)", marginTop: 3 }}>Профит: {profit >= 0 ? "+" : ""}{fmt(profit)} ₽</div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Badge status={p.status || "active"} />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{(p.commission_type === "premium" ? "4%" : "5%")} комиссия</span>
              </div>
            </div>
          );
        })}
        {!filtered.length && <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)", gridColumn: "1/-1" }}>📦 Товаров нет</div>}
      </div>
    </div>
  );
}

// ─── RATE PAGE ────────────────────────────────────────────────────────────────
function RatePage({ googleRate, setGoogleRate, playerokRate, setPlayerokRate, isAdmin, showToast }) {
  const [pInput, setPInput] = useState(playerokRate);

  const fetchGoogle = async () => {
    showToast("Обновляем курс...");
    const simulated = googleRate + (Math.random() * 2 - 1) * 0.8;
    const rounded = Math.round(simulated * 100) / 100;
    setGoogleRate(rounded);
    showToast("Курс Google обновлён: " + rounded.toFixed(2) + " ₽");
  };

  const block = (title, value, color, children) => (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>{title}</div>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, background: color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 600, animation: "fadeUp 0.3s ease" }}>
      {block("🌐 Курс Google", fmtF(googleRate) + " ₽", "linear-gradient(135deg,#7c3aed,#06b6d4)",
        <button onClick={fetchGoogle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}>
          <Icon name="refresh" size={14} /> Обновить
        </button>
      )}
      {block("🎮 Курс Playerok", fmtF(playerokRate) + " ₽", "linear-gradient(135deg,#06b6d4,#10b981)",
        isAdmin ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="number" value={pInput} onChange={e => setPInput(e.target.value)} step="0.1"
              style={{ padding: "8px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontFamily: "var(--font)", width: 120 }} />
            <button onClick={() => { const v = parseFloat(pInput); if (!isNaN(v)) { setPlayerokRate(v); showToast("Курс Playerok обновлён"); } }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>
              Сохранить
            </button>
          </div>
        ) : <div style={{ fontSize: 12, color: "var(--muted)" }}>Курс устанавливает admin</div>
      )}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>📊 Сравнение</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[["Google", googleRate, "#7c3aed"], ["Playerok", playerokRate, "#06b6d4"], ["Разница", Math.abs(googleRate - playerokRate), "#f59e0b"]].map(([l, v, c]) => (
            <div key={l} style={{ flex: 1, textAlign: "center", background: "var(--bg2)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: "-0.02em" }}>{fmtF(v)} ₽</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage({ workers, sheets, sheetOrders, products, playerokRate, workerShares, openModal, showToast, onRefresh }) {
  const getWorkerProfit = (wk) => {
    const wSheets = sheets.filter(s => s.worker_id == wk.id || s.worker_id === wk.key);
    return wSheets.reduce((s, sh) => {
      const orders = sheetOrders.filter(o => o.sheet_id === sh.id && o.status === "sold");
      const gross = orders.reduce((acc, o) => {
        const prod = products.find(p => p.id === o.product_id);
        if (!prod) return acc;
        return acc + calcProfit({ salePrice: o.sale_price, buyUsd: prod.purchase_usd, playerokRate, commType: prod.commission_type });
      }, 0);
      const share = workerShares[sh.id] ?? wk.share ?? 50;
      return s + Math.round(gross * (share / 100));
    }, 0);
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Воркеры</div>
            <button onClick={() => openModal("addWorker")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}><Icon name="plus" size={13} /> Добавить</button>
          </div>
          {!workers.length && <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: 13 }}>👤 Нет воркеров</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workers.map(wk => {
              const profit = getWorkerProfit(wk);
              const wSheets = sheets.filter(s => s.worker_id == wk.id || s.worker_id === wk.key);
              return (
                <div key={wk.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#06b6d4,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{wk.name?.[0] || "W"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{wk.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{wSheets.length} листов · доля {wk.share}%</div>
                    <div style={{ fontSize: 10, padding: "1px 6px", background: "rgba(6,182,212,0.1)", color: "#22d3ee", borderRadius: 4, display: "inline-block", marginTop: 3, fontFamily: "monospace" }}>{wk.key}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--success)" }}>+{fmt(profit)} ₽</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Настройки</div>
          <Input label="Комиссия по умолчанию (%)" type="number" defaultValue={5} placeholder="5" />
          <Input label="Доля воркера по умолчанию (%)" type="number" defaultValue={50} placeholder="50" />
          <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Управление данными</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => { const d = JSON.stringify({ sheets, sheetOrders, workers }, null, 2); const b = new Blob([d], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "playerok-backup.json"; a.click(); showToast("Данные экспортированы"); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}>↓ Экспорт JSON</button>
            <button onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}><Icon name="refresh" size={13} /> Обновить данные</button>
          </div>
        </div>
      </div>

      {/* WORKER SHEETS BREAKDOWN */}
      {sheets.filter(s => s.worker_id).length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Листы воркеров</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Лист", "Воркер", "Продаж", "Валовый профит", "Доля воркера", "Профит воркера", "Профит admin", "Статус"].map(h => (
                  <th key={h} style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 600, padding: "9px 14px", textAlign: "left", background: "var(--bg2)", whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {sheets.filter(s => s.worker_id).map(sh => {
                  const wk = workers.find(w => w.id == sh.worker_id || w.key === sh.worker_id);
                  const orders = sheetOrders.filter(o => o.sheet_id === sh.id && o.status === "sold");
                  const gross = orders.reduce((s, o) => {
                    const prod = products.find(p => p.id === o.product_id);
                    return s + (prod ? calcProfit({ salePrice: o.sale_price, buyUsd: prod.purchase_usd, playerokRate, commType: prod.commission_type }) : 0);
                  }, 0);
                  const share = workerShares[sh.id] ?? wk?.share ?? 50;
                  const wProfit = Math.round(gross * (share / 100));
                  const aProfit = Math.round(gross * ((100 - share) / 100));
                  return (
                    <tr key={sh.id} onMouseEnter={e => e.currentTarget.style.background = "var(--bg2)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{sh.name}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--muted)" }}>{wk?.name || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text)" }}>{orders.length}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: gross >= 0 ? "var(--success)" : "var(--danger)" }}>{gross >= 0 ? "+" : ""}{fmt(gross)} ₽</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--muted)" }}>{share}%</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--muted)" }}>+{fmt(wProfit)} ₽</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "var(--success)" }}>+{fmt(aProfit)} ₽</td>
                      <td style={{ padding: "10px 14px" }}><Badge status={sh.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODAL COMPONENTS ─────────────────────────────────────────────────────────
function AddOrderModal({ open, onClose, products, sheets, workers, isAdmin, auth, onAdd }) {
  const [productId, setProductId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [bumps, setBumps] = useState(0);
  const [sheetId, setSheetId] = useState("");
  const [worker, setWorker] = useState("");

  const selectedProd = products.find(p => p.id == productId);
  useEffect(() => { if (selectedProd) setSalePrice(selectedProd.sale_price_rub || ""); }, [productId]);
  useEffect(() => { if (sheets.length) setSheetId(sheets[0]?.id || ""); }, [sheets]);

  const submit = () => {
    if (!productId || !salePrice || !sheetId) return;
    onAdd({ sheet_id: parseInt(sheetId), product_id: parseInt(productId), sale_price: parseFloat(salePrice), bumps: parseFloat(bumps) || 0, status: "sold", worker_id: worker || null });
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить продажу">
      <Select label="Товар" value={productId} onChange={e => setProductId(e.target.value)} options={[{ value: "", label: "— выберите товар —" }, ...products.map(p => ({ value: p.id, label: p.name }))]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Цена продажи (₽)" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0" />
        <Input label="Поднятия (₽)" type="number" value={bumps} onChange={e => setBumps(e.target.value)} placeholder="0" />
      </div>
      <Select label="Лист" value={sheetId} onChange={e => setSheetId(e.target.value)} options={sheets.map(s => ({ value: s.id, label: s.name }))} />
      {isAdmin && <Select label="Воркер" value={worker} onChange={e => setWorker(e.target.value)} options={[{ value: "", label: "Admin (я)" }, ...workers.map(w => ({ value: w.id, label: w.name }))]} />}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)" }}>Отмена</button>
        <button onClick={submit} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Добавить</button>
      </div>
    </Modal>
  );
}

function AddSheetModal({ open, onClose, workers, isAdmin, auth, onAdd }) {
  const [name, setName] = useState(today());
  const [workerId, setWorkerId] = useState("");
  const submit = () => { onAdd({ name, status: "open", worker_id: workerId || null }); setName(today()); setWorkerId(""); };
  return (
    <Modal open={open} onClose={onClose} title="Новый лист">
      <Input label="Название / Дата" value={name} onChange={e => setName(e.target.value)} placeholder="20.04.2025" />
      {isAdmin && <Select label="Воркер" value={workerId} onChange={e => setWorkerId(e.target.value)} options={[{ value: "", label: "Admin (я)" }, ...workers.map(w => ({ value: w.id, label: w.name }))]} />}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)" }}>Отмена</button>
        <button onClick={submit} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Создать</button>
      </div>
    </Modal>
  );
}

function AddWorkerModal({ open, onClose, onAdd }) {
  const [name, setName] = useState(""); const [key, setKey] = useState(""); const [share, setShare] = useState(50);
  const genKey = () => setKey("worker-" + Math.random().toString(36).slice(2, 10));
  const submit = () => { if (!name || !key) return; onAdd({ name, key, share: parseInt(share) }); setName(""); setKey(""); setShare(50); };
  return (
    <Modal open={open} onClose={onClose} title="Добавить воркера">
      <Input label="Имя" value={name} onChange={e => setName(e.target.value)} placeholder="Имя воркера" />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Worker Key</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="worker-key-xxxxx" style={{ flex: 1, padding: "9px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontFamily: "var(--font)" }} />
          <button onClick={genKey} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap" }}>Сгенерировать</button>
        </div>
      </div>
      <Input label="Доля (%)" type="number" value={share} onChange={e => setShare(e.target.value)} placeholder="50" />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)" }}>Отмена</button>
        <button onClick={submit} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Добавить</button>
      </div>
    </Modal>
  );
}

function AddProductModal({ open, onClose, categories, onAdd }) {
  const [name, setName] = useState(""); const [catId, setCatId] = useState(""); const [price, setPrice] = useState(""); const [buyUsd, setBuyUsd] = useState(""); const [commType, setCommType] = useState("standard");
  const submit = () => { if (!name || !price) return; onAdd({ name, category_id: catId || null, sale_price_rub: parseFloat(price), purchase_usd: parseFloat(buyUsd) || 0, commission_type: commType, status: "active" }); setName(""); setCatId(""); setPrice(""); setBuyUsd(""); };
  return (
    <Modal open={open} onClose={onClose} title="Добавить товар">
      <Input label="Название" value={name} onChange={e => setName(e.target.value)} placeholder="Название товара" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Категория" value={catId} onChange={e => setCatId(e.target.value)} options={[{ value: "", label: "— без категории —" }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
        <Input label="Цена продажи (₽)" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Закупка ($)" type="number" value={buyUsd} onChange={e => setBuyUsd(e.target.value)} placeholder="0" />
        <Select label="Комиссия" value={commType} onChange={e => setCommType(e.target.value)} options={[{ value: "standard", label: "5% Standard" }, { value: "premium", label: "4% Premium" }]} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)" }}>Отмена</button>
        <button onClick={submit} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Добавить</button>
      </div>
    </Modal>
  );
}
