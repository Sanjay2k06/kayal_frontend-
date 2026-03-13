import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clearSession, getSessionUser, isAuthenticated } from "@/lib/auth";
import { logoutUser } from "@/lib/api";
import { useUIPreferences } from "@/lib/ui-preferences";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [blobStyle, setBlobStyle] = useState<React.CSSProperties>({});
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const { language, setLanguage, highContrast, setHighContrast } = useUIPreferences();

  const navItems = [
    { label: language === "hi" ? "होम" : "Home", path: "/" },
    ...(authed
      ? [
          { label: language === "hi" ? "सहायक" : "Assistant", path: "/assistant" },
          { label: language === "hi" ? "पात्रता" : "Eligibility", path: "/eligibility" },
          { label: language === "hi" ? "योजनाएं" : "Schemes", path: "/schemes" },
          { label: language === "hi" ? "तुलना" : "Compare", path: "/schemes/compare" },
          { label: language === "hi" ? "प्रोफाइल" : "Profile", path: "/profile" },
          { label: language === "hi" ? "डैशबोर्ड" : "Dashboard", path: "/dashboard" },
          ...(isAdmin ? [{ label: language === "hi" ? "एडमिन" : "Admin", path: "/admin" }] : []),
        ]
      : []),
  ];

  // Update gooey blob position
  useEffect(() => {
    setAuthed(isAuthenticated());
    const sessionUser = getSessionUser();
    setEmail(sessionUser?.email || null);
    setIsAdmin(Boolean(sessionUser?.is_admin));
  }, [location.pathname]);

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.path === location.pathname);
    const el = itemRefs.current[activeIndex];
    const container = navRef.current;
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setBlobStyle({
        left: elRect.left - containerRect.left,
        width: elRect.width,
        height: elRect.height,
        top: elRect.top - containerRect.top,
      });
    }
  }, [location.pathname]);

  return (
    <>
      {/* SVG filter for gooey effect */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b bg-card/70 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-[4.25rem] items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-transform duration-300 group-hover:scale-105">
              <span className="font-display text-base font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              CiviX
            </span>
          </Link>

          {/* Desktop nav with gooey blob */}
          <div ref={navRef} className="relative hidden items-center gap-0.5 md:flex">
            {/* Animated blob background */}
            {blobStyle.width && (
              <motion.div
                className="absolute rounded-lg bg-primary gooey-filter"
                animate={{
                  left: blobStyle.left as number,
                  width: blobStyle.width as number,
                  height: blobStyle.height as number,
                  top: blobStyle.top as number,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{ position: "absolute", zIndex: 0 }}
              />
            )}
            {navItems.map((item, i) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* CTA button */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="rounded-lg border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              aria-label="Toggle language"
            >
              {language === "en" ? "हिं" : "EN"}
            </button>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className="rounded-lg border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              aria-pressed={highContrast}
              aria-label="Toggle high contrast mode"
            >
              {language === "hi" ? "कॉन्ट्रास्ट" : "Contrast"}
            </button>
            {authed ? (
              <>
                <span className="text-xs text-muted-foreground">{email}</span>
                <button
                  onClick={async () => {
                    try {
                      await logoutUser();
                    } catch {
                      clearSession();
                    }
                    setAuthed(false);
                    setIsAdmin(false);
                    setEmail(null);
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {language === "hi" ? "लॉगआउट" : "Logout"}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:shadow-elevated"
              >
                {language === "hi" ? "साइन इन" : "Sign In"}
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-50 rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:hidden"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t bg-card md:hidden"
            >
              <div className="space-y-1 px-6 py-4">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/70 hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;
