import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useEffect, useState } from "react";

function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Register service worker for PWA support (minimal, network-first)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  const hasUser =
    mounted &&
    typeof window !== "undefined" &&
    !!window.localStorage.getItem("feastfit_user_id");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm">
          <Link
            href="/"
            className="font-semibold tracking-tight text-emerald-300"
          >
            FeastFit
          </Link>
          <nav className="flex items-center gap-4 text-xs text-slate-300">
            <Link href="/" className="hover:text-emerald-300">
              Home
            </Link>
            <Link href="/search" className="hover:text-emerald-300">
              Search
            </Link>
            <Link href="/logs" className="hover:text-emerald-300">
              Logs
            </Link>
            <Link href="/coach" className="hover:text-emerald-300">
              Coach
            </Link>

            <Link href="/login" className="hover:text-emerald-300">
              {hasUser ? "Account" : "Login"}
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Shell>
      <Component {...pageProps} />
    </Shell>
  );
}
