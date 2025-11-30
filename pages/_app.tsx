import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Inter, Geist_Mono } from "next/font/google";
import { SearchHeader } from "./components/search-header";

// Load Google Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isHomePage = router.pathname === "/";

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

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${inter.variable} ${geistMono.variable} font-sans`}
    >
      {!isHomePage && <SearchHeader />}
      {children}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Shell>
      <Component {...pageProps} />
      {/* Vercel Analytics - uncomment if you want analytics */}
      {/* {process.env.NODE_ENV === "production" && <Analytics />} */}
    </Shell>
  );
}
