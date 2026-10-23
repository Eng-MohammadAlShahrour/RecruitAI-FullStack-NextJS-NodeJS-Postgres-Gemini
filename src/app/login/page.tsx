"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function BrandIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", marginRight: 10 }}
    >
      <defs>
        <linearGradient id="loginGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#loginGrad)" />
      <circle cx="26" cy="26" r="13" fill="none" stroke="#ffffff" strokeWidth="4.5" />
      <circle cx="26" cy="23" r="3.2" fill="#ffffff" />
      <path d="M20 32.5 Q20 27.5 26 27.5 Q32 27.5 32 32.5 Z" fill="#ffffff" />
      <path d="M36 36 L50 50" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("recruiter@acme.test");
  const [password, setPassword] = useState("demo-password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push("/search");
  }

  async function quickLogin(e: string) {
    setEmail(e);
    setPassword("demo-password");
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) form.requestSubmit();
    }, 100);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <BrandIcon />
          <h1 style={{ fontSize: 24 }}>RecruitAI</h1>
        </div>
        <p className="muted" style={{ marginBottom: 24 }}>
          Find candidates in plain English
        </p>

        <form onSubmit={handleLogin} className="col">
          <div>
            <label className="muted" style={{ display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="muted" style={{ display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <p className="muted" style={{ marginBottom: 10 }}>Quick sign in:</p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="secondary" onClick={() => quickLogin("recruiter@acme.test")}>Acme</button>
            <button type="button" className="secondary" onClick={() => quickLogin("recruiter@globex.test")}>Globex</button>
          </div>
        </div>
      </div>
    </div>
  );
}