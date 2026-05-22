import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-glass bg-black/60 border-b border-brand-border">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="shrink-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
              RunAI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Link href="/generate">
            <Button variant="primary" size="md">
              Start for Free
            </Button>
          </Link>
        </div>
      </Container>
    </nav>
  );
}
