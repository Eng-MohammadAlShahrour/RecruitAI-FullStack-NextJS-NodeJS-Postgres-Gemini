"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { AddToShortlist } from "@/components/AddToShortlist";

type Candidate = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string;
  role: string;
  seniority: string;
  years_experience: number;
  location_city: string;
  location_state: string;
  open_to_work: boolean;
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    company_logo_url: string;
    company_type: string;
    start_year: number;
    end_year: number | null;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    graduation_year: number;
  }>;
};

export default function PersonPage() {
  const params = useParams();
  const id = params.id as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    apiFetch<Candidate>("/api/people/" + id)
      .then(setCandidate)
      .catch(() => setError("Candidate not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ paddingTop: 40 }}><p className="muted">Loading...</p></div>;
  if (error || !candidate) return <div className="container" style={{ paddingTop: 40 }}><p className="error">{error ?? "Not found"}</p><Link href="/search">← Back</Link></div>;

  const initials = candidate.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <Link href="/search" style={{ fontSize: 14, display: "inline-block", marginBottom: 20 }}>← Back to search</Link>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row" style={{ gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {candidate.avatar_url && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={candidate.avatar_url} alt={candidate.full_name} className="avatar avatar-lg" onError={() => setImgError(true)} />
          ) : (
            <div className="avatar avatar-lg" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#e0e7ff", color: "#4338ca", fontWeight: 600, fontSize: 28 }}>
              {initials}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h1 style={{ fontSize: 24 }}>{candidate.full_name}</h1>
              <AddToShortlist personId={candidate.id} />
            </div>

            <p className="muted" style={{ marginTop: 8 }}>{candidate.headline}</p>

            <div className="row" style={{ gap: 16, marginTop: 12, flexWrap: "wrap", fontSize: 14 }}>
              <span>📍 {candidate.location_city}{candidate.location_state ? ", " + candidate.location_state : ""}</span>
              <span>💼 {candidate.years_experience} years</span>
              <span>🎯 {candidate.seniority}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Skills</h2>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {candidate.skills.map((s) => (
            <span key={s} style={{ fontSize: 13, padding: "4px 10px", background: "#f3f4f6", borderRadius: 6, color: "#4b5563" }}>{s}</span>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Experience</h2>
        <div className="col" style={{ gap: 16 }}>
          {candidate.experiences.map((e, i) => (
            <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start" }}>
              {e.company_logo_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={e.company_logo_url} alt={e.company} style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
              )}
              <div>
                <p style={{ fontWeight: 600 }}>{e.title}</p>
                <p className="muted">{e.company} · {e.start_year} – {e.end_year ?? "Present"}{e.company_type === "startup" ? " · Startup" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Education</h2>
        <div className="col" style={{ gap: 12 }}>
          {candidate.education.map((e, i) => (
            <div key={i}>
              <p style={{ fontWeight: 600 }}>{e.school}</p>
              <p className="muted">{e.degree} in {e.field} · {e.graduation_year}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}