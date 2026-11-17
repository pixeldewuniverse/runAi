"use client";

import { Building2, Clapperboard, Lightbulb, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Kantor", icon: Building2 },
  { href: "/content", label: "Konten", icon: Clapperboard },
  { href: "/brainstorm", label: "Brainstorm", icon: Lightbulb },
  { href: "/settings", label: "Setelan", icon: Settings },
];

export function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      {/* mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active(href) ? "text-ink" : "text-mute"}`}
              >
                <Icon size={20} strokeWidth={active(href) ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* desktop: left rail */}
      <nav className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center gap-2 border-r border-line bg-paper py-6 md:flex">
        <Link href="/" className="mb-6 grid size-11 place-items-center rounded-xl bg-ink font-mono text-sm font-bold text-dew">
          rA
        </Link>
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2 text-[10px] transition ${active(href) ? "bg-ink text-paper" : "text-mute hover:bg-paper-2"}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
