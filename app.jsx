// AAA — agent dashboards (Kitchen + Inventory).
// Minimal shell: hash-routed sidebar + dashboard content.
// No build step — runs via CDN Babel like the rest of the app.

// ── responsive helper ─────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ── route → page (only the two agent dashboards) ──────────────
function renderPage(route) {
  if (route === "app/inventory-agent") return <window.InventoryAgentPage />;
  return <window.KitchenAgentPage />; // default + app/kitchen-agent
}

function App() {
  const [navOpen, setNavOpen] = React.useState(false);
  const route = window.useHashRoute();
  const isMobile = useIsMobile();

  // Close the mobile nav drawer whenever the route changes.
  React.useEffect(() => { setNavOpen(false); }, [route]);

  const navItem = window.findNavItem ? window.findNavItem(route) : null;
  const content = renderPage(route);

  // Mobile: hamburger header + dashboard body, slide-in nav drawer.
  if (isMobile) {
    return (
      <div className="fm-mobile">
        <div className="fm-mobile-scroll">
          <div className="fm-mobile-dash">
            <header className="fm-mobile-dash-head">
              <button
                className="fm-mobile-dash-ham"
                aria-label="Open menu"
                onClick={() => setNavOpen(true)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="#111" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="fm-mobile-dash-title">{navItem ? navItem.label : "AAA"}</span>
            </header>
            <div className="fm-mobile-dash-body">{content}</div>
          </div>
        </div>
        <window.MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
    );
  }

  // Desktop: sidebar + dashboard content.
  return (
    <div className="fm-desktop">
      <window.Sidebar />
      <main className="fm-main fm-main-dashboard">
        {content}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
