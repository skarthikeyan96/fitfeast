import { Github } from "lucide-react";

const links = [
  { label: "Home", href: "#" },
  { label: "Search", href: "#" },
  { label: "Logs", href: "#" },
  { label: "GitHub", href: "#", icon: Github },
  { label: "Privacy", href: "#" },
];

export default function Footer() {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                FF
              </span>
            </div>
            <span className="font-bold text-foreground">FeastFit</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">© 2025 FeastFit</p>
        </div>
      </div>
    </footer>
  );
}
