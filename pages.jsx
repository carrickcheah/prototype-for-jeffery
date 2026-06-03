// pages.jsx — Installer Agent dashboard.
// Reusable KPI cards + bar chart + activity feed, plus the chat-bubble
// verification agent. No backend — the install "DB" and logic run client-side.

const { useState: usePageState, useEffect: usePageEffect, useRef: usePageRef } = React;

// ─── KPI card grid + chart + activity feed ──────────────────────

// Small inline icon set — stroke-based, scale to currentColor.
const KPI_ICONS = {
  ticket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V8z"/><path d="M13 6v2M13 11v2M13 16v2"/></svg>,
  clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>,
  queue:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12M8 4v6l-4 7h16l-4-7V4"/></svg>,
  pkg:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></svg>,
  alert:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l10 17H2L12 4z"/><path d="M12 10v5M12 18v.5"/></svg>,
  truck:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>,
  off:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>,
};

function TrendDelta({ trend }) {
  if (!trend) return null;
  const dir = trend.dir || "flat";
  const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→";
  const good = (trend.good !== undefined) ? trend.good : (dir === "up");
  const cls = "fm-kpi-trend " + (dir === "flat" ? "flat" : (good ? "good" : "bad"));
  return (
    <div className={cls}>
      <span className="fm-kpi-trend-arrow">{arrow}</span>
      <span>{trend.delta}</span>
      {trend.vs && <span className="fm-kpi-trend-vs">{trend.vs}</span>}
    </div>
  );
}

function KPI({ icon, value, label, tone, trend }) {
  return (
    <div className={"fm-kpi" + (tone ? " " + tone : "")}>
      {icon && KPI_ICONS[icon] && (
        <div className="fm-kpi-icon">{KPI_ICONS[icon]}</div>
      )}
      <div className="fm-kpi-main">
        <div className={"fm-kpi-value" + (tone ? " " + tone : "")}>{value}</div>
        <div className="fm-kpi-label">{label}</div>
        <TrendDelta trend={trend} />
      </div>
    </div>
  );
}

const CHART_PX = 130;   // max bar height in pixels — keeps bars visible regardless of container layout

function barTone(v, scale) {
  // For 0–100 scales: <25 = red, 25–50 = amber, >50 = healthy. For other scales,
  // fall back to "neutral" so the chart stays orange-brand by default.
  if (!scale || scale !== "percent") return "neutral";
  if (v < 25) return "low";
  if (v < 50) return "mid";
  return "ok";
}

function BarChart({ title, values, labels, scale }) {
  const max = Math.max(...values, 1);
  return (
    <div className="fm-card">
      <div className="fm-card-title">{title}</div>
      <div className="fm-chart-bars">
        {values.map((v, i) => {
          const tone = barTone(v, scale);
          const px = Math.max(4, Math.round((v / max) * CHART_PX));
          return (
            <div key={i} className="fm-chart-col">
              <div className="fm-chart-value">{v}{scale === "percent" ? "%" : ""}</div>
              <div className={"fm-chart-bar fm-chart-bar-" + tone} style={{ height: px + "px" }} />
              <div className="fm-chart-label">{labels[i]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed({ title, rows }) {
  return (
    <div className="fm-card">
      <div className="fm-card-title">{title}</div>
      <div className="fm-activity">
        {rows.map((r, i) => (
          <div key={i} className="fm-activity-row">
            <span className="fm-activity-time">{r.time}</span>
            {r.status && (
              <span className={"fm-activity-status fm-status-" + r.status.toLowerCase().replace(/[._]/g, "-")}>
                {r.status}
              </span>
            )}
            <span className="fm-activity-id">{r.id}</span>
            <span className="fm-activity-text">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Installer Agent (aircond install verification) ─────────────
// Real working logic — no backend needed. The "DB" is a client-side map:
//   serial → { installed: 0|1, customer, model }
//   installed 0 = not yet verified (installer is finishing the job now)
//   installed 1 = already marked installed (a second submit is a duplicate)
const AIRCOND_SEED = {
  "se123456789": { installed: 0, customer: "012-888 1234",  model: "Daikin 1.5HP FTKF35A" },
  "se987654321": { installed: 1, customer: "017-333 9090",  model: "Panasonic 1.0HP CS-PU" },
  "se555000111": { installed: 0, customer: "011-2233 4455", model: "Midea 2.0HP Xtreme" },
  "se444222888": { installed: 1, customer: "013-777 1212",  model: "Daikin 2.5HP FTKM" },
  "se321321321": { installed: 0, customer: "012-555 6789",  model: "Acson 1.5HP A5MS" },
};

const INSTALLER_DATA = {
  agent: "Installer Agent (Aircond Field Verification)",
  tagline: "Installer submits serial + customer contact after a job → agent checks the install DB, marks it done, and notifies the customer",
  status: { label: "Live", since: "real-time" },
  chart: {
    title: "Installs verified per hour",
    labels: ["9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p"],
    values: [1, 2, 2, 3, 4, 2, 3, 1, 0, 0],
  },
  activity: [
    { time: "14:32", id: "se771200345", text: "Daikin 1.5HP · 012-410 2231",     status: "VERIFIED" },
    { time: "14:18", id: "se889100002", text: "Midea 2.0HP · 017-882 7781",       status: "VERIFIED" },
    { time: "13:55", id: "se987654321", text: "dup attempt · 011-200 1199",       status: "DUPLICATE" },
    { time: "13:40", id: "se640221890", text: "Panasonic 1.0HP · 013-552 8890",   status: "VERIFIED" },
    { time: "13:12", id: "se551200781", text: "Acson 2.5HP · awaiting installer", status: "PENDING" },
  ],
};

function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Chat-bubble interaction: the installer "sends" the serial + customer
// contact, and the agent replies in-thread with the verification result.
// verify(text) → reply string.
function InstallerChatBar({ verify }) {
  const [input, setInput] = usePageState("");
  const [messages, setMessages] = usePageState([]);
  const [open, setOpen] = usePageState(false);
  const threadRef = usePageRef(null);
  const inputRef = usePageRef(null);

  usePageEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  // Example "submissions" an installer might send — one per outcome.
  const CHIPS = [
    { label: "se123456789 (new)",       text: "se123456789 012-888 1234" },
    { label: "se987654321 (installed)", text: "se987654321 011-200 1199" },
    { label: "Unknown serial",          text: "se000000000" },
  ];

  const send = (overrideText) => {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if (!text) return;
    setInput("");
    const reply = verify(text);
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: reply }]);
    setOpen(true);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const chips = (
    <div className="fm-chatbar-faq">
      {CHIPS.map((q) => (
        <button key={q.label} type="button" className="fm-chatbar-chip" onClick={() => send(q.text)}>
          {q.label}
        </button>
      ))}
    </div>
  );

  return (
    <React.Fragment>
      {open && messages.length > 0 && (
        <div className="fm-chatpop">
          <div className="fm-chatpop-head">
            <span className="fm-chatpop-title">Installer Agent</span>
            <div className="fm-chatpop-actions">
              <button className="fm-chatpop-btn" aria-label="Minimize chat" title="Minimize" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button className="fm-chatpop-btn" aria-label="Close chat (clears thread)" title="Close (clears thread)" onClick={() => { setOpen(false); setMessages([]); }}>×</button>
            </div>
          </div>
          <div className="fm-chatpop-thread" ref={threadRef}>
            {messages.map((m, i) => (
              m.role === "user"
                ? <div key={i} className="fm-chatpop-user">{m.text}</div>
                : <div key={i} className="fm-chatpop-asst">{m.text}</div>
            ))}
            <div className="fm-chatpop-faq">{chips}</div>
          </div>
        </div>
      )}
      {chips}
      <div className="fm-chatbar">
        <input
          ref={inputRef}
          className="fm-chatbar-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => { if (messages.length > 0) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Send serial + customer contact, e.g. se123456789 012-888 1234"
        />
        <button
          className={"fm-chatbar-send" + (input.trim() ? " active" : "")}
          onClick={() => send()}
          disabled={!input.trim()}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 17V8.5L19 12L9 15.5V17z" fill="currentColor"/>
            <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </React.Fragment>
  );
}

function InstallerAgentPage() {
  // Mutable per-session copy of the DB so a verify can flip installed 0 → 1.
  const dbRef = usePageRef(null);
  if (!dbRef.current) dbRef.current = JSON.parse(JSON.stringify(AIRCOND_SEED));

  const [feed, setFeed] = usePageState(INSTALLER_DATA.activity);
  const [verified, setVerified] = usePageState(18);
  const [pending, setPending] = usePageState(5);
  const [dupes, setDupes] = usePageState(2);

  // Parse a chat message → run the install-DB check → return the agent's reply.
  const runVerify = (text) => {
    const serialMatch = text.match(/se\d{6,}/i);
    const key = serialMatch ? serialMatch[0].toLowerCase() : "";
    const phoneMatch = text.replace(/se\d{6,}/ig, " ").match(/\d[\d\s-]{6,}\d/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    if (!key) return "Please include the aircond serial number — e.g. “se123456789 012-888 1234”.";

    const unit = dbRef.current[key];
    if (!unit) return `Serial ${key} is not in our system. Please double-check the serial number.`;

    if (unit.installed === 1) {
      // already installed by someone else → reject the duplicate
      setDupes((n) => n + 1);
      setFeed((f) => [{ time: nowHHMM(), id: key, text: `dup attempt · ${phone || unit.customer}`, status: "DUPLICATE" }, ...f]);
      return `⚠️ This aircond (${key}) is already installed by another installer. Please double-check the serial number.`;
    }
    // installed === 0 → mark done, confirm, notify customer
    unit.installed = 1;
    setVerified((n) => n + 1);
    setPending((n) => Math.max(0, n - 1));
    setFeed((f) => [{ time: nowHHMM(), id: key, text: `${unit.model} · ${phone || unit.customer}`, status: "VERIFIED" }, ...f]);
    return `✅ Good job! Serial ${key} is verified and marked installed. We've updated the database and are notifying the customer at ${phone || unit.customer} now.`;
  };

  const kpis = [
    { icon: "check", value: String(verified), label: "verified today",  trend: { delta: "+20%", dir: "up", vs: "vs yesterday" } },
    { icon: "queue", value: String(pending),  label: "pending verify",  tone: "warn", trend: { delta: "in field", dir: "flat" } },
    { icon: "alert", value: String(dupes),    label: "duplicate flags", tone: dupes > 0 ? "warn" : undefined, trend: { delta: "double-install guard", dir: "flat" } },
    { icon: "clock", value: "97%",            label: "first-time-fix",  trend: { delta: "+3pp", dir: "up", vs: "vs last wk" } },
  ];

  return (
    <div className="fm-dashboard">
      <div className="fm-dash-head">
        <div className="fm-dash-head-text">
          <h1 className="fm-dash-title">{INSTALLER_DATA.agent}</h1>
          <div className="fm-dash-tagline">{INSTALLER_DATA.tagline}</div>
        </div>
        <div className="fm-dash-status">
          <span className="fm-dash-status-dot" />
          <div>
            <div className="fm-dash-status-label">{INSTALLER_DATA.status.label}</div>
            <div className="fm-dash-status-since">{INSTALLER_DATA.status.since}</div>
          </div>
        </div>
      </div>

      <div className="fm-kpi-grid">
        {kpis.map((k, i) => <KPI key={i} {...k} />)}
      </div>

      <BarChart {...INSTALLER_DATA.chart} />

      <ActivityFeed title="Recent verifications" rows={feed} />

      <InstallerChatBar verify={runVerify} />
    </div>
  );
}

Object.assign(window, {
  InstallerAgentPage,
});
