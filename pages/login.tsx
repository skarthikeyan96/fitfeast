import { FormEvent, useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseBrowserClient";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("feastfit_user_id");
    if (stored) setExistingUserId(stored);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabaseBrowser) {
      setError("Auth is not configured.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error: supaError } = await supabaseBrowser.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (supaError) {
        setError(supaError.message);
        return;
      }

      setMessage("Check your email for a login link.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            FeastFit
          </p>
          <h1 className="text-2xl font-bold">
            {existingUserId ? "You're signed in" : "Sign in to save your meals"}
          </h1>
          <p className="text-sm text-slate-300">
            {existingUserId
              ? "Your future logged meals will sync to this account. You can still log as a guest on this device."
              : "Use your email to receive a magic link. Once signed in, your logged meals will sync across devices."}
          </p>
        </header>

        {existingUserId ? (
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm">
            <p className="text-xs text-slate-400 break-all">
              User id: <span className="text-slate-200">{existingUserId}</span>
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/search"
                className="rounded-md bg-emerald-500 px-3 py-1.5 font-medium text-slate-950 hover:bg-emerald-400"
              >
                Go to search
              </Link>
              <Link
                href="/logs"
                className="rounded-md border border-slate-600 px-3 py-1.5 font-medium text-slate-100 hover:border-emerald-400"
              >
                View logs
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  window.localStorage.removeItem("feastfit_user_id");
                  setExistingUserId(null);
                }}
                className="rounded-md border border-red-500/60 px-3 py-1.5 font-medium text-red-200 hover:bg-red-900/40"
              >
                Sign out (demo)
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Email</span>
              <input
                type="email"
                required
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={loading || !email}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Sending magic link…" : "Send magic link"}
            </button>

            {error && <p className="text-xs text-red-300">{error}</p>}
            {message && <p className="text-xs text-emerald-300">{message}</p>}
          </form>
        )}

        <p className="text-xs text-slate-400">
          Or continue as a guest and log meals locally.{" "}
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            Back to FeastFit
          </Link>
        </p>
      </div>
    </main>
  );
}
