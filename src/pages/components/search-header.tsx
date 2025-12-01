import Link from "next/link";
import { Utensils } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SearchHeader() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setHasUser(!!window.localStorage.getItem("feastfit_user_id"));
    }
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search" },
    { label: "Logs", href: "/logs" },
    { label: "Coach", href: "/coach" },
    { label: hasUser ? "Account" : "Login", href: "/login" },
  ];

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary">FeastFit</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
