import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loginUser, registerUser } from "@/lib/api";
import { isProfileComplete, setSession } from "@/lib/auth";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const completeLogin = (login: { access_token: string; refresh_token: string; user: any }) => {
    setSession(login.access_token, login.refresh_token, login.user);
    const destination = isProfileComplete(login.user) ? (location.state?.from || "/dashboard") : "/onboarding";
    navigate(destination, { replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        await registerUser({ name, email, password });
      }

      const login = await loginUser({ email, password });
      completeLogin(login);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = "demo@civixapp.com";
      const demoPassword = "Demo@12345";
      setEmail(demoEmail);
      setPassword(demoPassword);
      const login = await loginUser({ email: demoEmail, password: demoPassword });
      completeLogin(login);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-6 py-16">
        <div className="mx-auto max-w-md rounded-xl border bg-card p-6 shadow-card">
          <h1 className="font-display text-2xl font-bold text-foreground">Login / Sign Up</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access saved schemes, profile, and conversation history.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-md border bg-background p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 rounded-md border bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mockup Account (all profile details prefilled)</p>
            <p className="mt-1 text-xs text-muted-foreground">demo@civixapp.com / Demo@12345</p>
            <button
              type="button"
              onClick={loginWithDemo}
              disabled={loading}
              className="mt-3 w-full rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              Use Demo Account
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === "login" ? "register" : "login"));
              setError(null);
            }}
            className="mt-4 text-sm text-accent hover:underline"
          >
            {mode === "login" ? "New user? Switch to Sign Up" : "Already have an account? Switch to Login"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
