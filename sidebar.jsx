// sidebar.jsx — left sidebar + hash-route hook
// Visual style adapted from ai-contact-bun/ui (dark sectioned sidebar).
// No build step — runs via CDN Babel like the rest of snow-dessert.

const { useState: useSidebarState, useEffect: useSidebarEffect } = React;

const DEFAULT_ROUTE = "app/kitchen-agent";

const NAV = [
  { type: "header", label: "App" },
  { type: "item", id: "app/kitchen-agent",   label: "Kitchen Agent" },
  { type: "item", id: "app/inventory-agent", label: "Inventory Agent" },
];

function getRouteFromHash() {
  return (window.location.hash || "#" + DEFAULT_ROUTE).slice(1);
}

function useHashRoute() {
  const [route, setRoute] = useSidebarState(getRouteFromHash());
  useSidebarEffect(() => {
    const handler = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}

function findNavItem(routeId) {
  return NAV.find((n) => n.type === "item" && n.id === routeId) || null;
}

function Sidebar() {
  const route = useHashRoute();
  return (
    <aside className="fm-sidebar">
      <div className="fm-brand">
        <div className="fm-brand-mark">A</div>
        <div>
          <div className="fm-brand-name">AAA</div>
          <div className="fm-brand-sub">Agentic AI · Prototype</div>
        </div>
      </div>
      <nav className="fm-nav">
        {NAV.map((n, i) => {
          if (n.type === "header") return <div key={i} className="fm-section-header">{n.label}</div>;
          if (n.type === "subheader") return <div key={i} className="fm-section-sub">{n.label}</div>;
          const cls = "fm-item" + (route === n.id ? " active" : "");
          return <a key={i} href={"#" + n.id} className={cls}>{n.label}</a>;
        })}
      </nav>
    </aside>
  );
}

// ── Mobile-only nav drawer ─────────────────────────────────────
// Slides in from left when the dashboard hamburger is tapped. Same NAV
// items as the desktop Sidebar. Tapping a link navigates via hash;
// app.jsx auto-closes on route change.
function MobileNav({ open, onClose }) {
  const route = useHashRoute();
  return (
    <React.Fragment>
      <div
        onClick={onClose}
        className="fm-mnav-backdrop"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <aside
        className="fm-mnav"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
        aria-hidden={!open}
      >
        <div className="fm-brand">
          <div className="fm-brand-mark">A</div>
          <div>
            <div className="fm-brand-name">AAA</div>
            <div className="fm-brand-sub">Agentic AI · Prototype</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="fm-mnav-close"
          >×</button>
        </div>
        <nav className="fm-nav">
          {NAV.map((n, i) => {
            if (n.type === "header") return <div key={i} className="fm-section-header">{n.label}</div>;
            if (n.type === "subheader") return <div key={i} className="fm-section-sub">{n.label}</div>;
            const cls = "fm-item" + (route === n.id ? " active" : "");
            return <a key={i} href={"#" + n.id} className={cls} onClick={onClose}>{n.label}</a>;
          })}
        </nav>
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, { Sidebar, MobileNav, useHashRoute, findNavItem, NAV, DEFAULT_ROUTE });
