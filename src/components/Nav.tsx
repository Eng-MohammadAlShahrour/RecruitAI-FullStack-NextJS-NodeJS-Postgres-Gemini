"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function BrandIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }}
    >
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#brandGrad)" />
      <circle cx="26" cy="26" r="13" fill="none" stroke="#ffffff" strokeWidth="4.5" />
      <circle cx="26" cy="23" r="3.2" fill="#ffffff" />
      <path d="M20 32.5 Q20 27.5 26 27.5 Q32 27.5 32 32.5 Z" fill="#ffffff" />
      <path d="M36 36 L50 50" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = [
    { href: "/search", label: "Search" },
    { href: "/shortlists", label: "Shortlists" },
    { href: "/saved", label: "Saved" },
  ];

  return (
    <nav className="nav-root">
      <div className="nav-inner">
        <div className="nav-left">
          <Link
            href="/search"
            className="nav-brand"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <BrandIcon />
            RecruitAI
          </Link>
          <div className="nav-links">
            {links.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={"nav-link" + (active ? " active" : "")}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="nav-right">
          <button type="button" className="ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}