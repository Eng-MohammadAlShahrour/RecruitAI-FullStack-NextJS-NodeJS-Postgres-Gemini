"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Candidate = {
  id: string;
  full_name: string;
  headline: string;
  years_experience: number;
  location_city: string;
  seniority: string;
};

export default function ShortlistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const lists = await apiFetch<{ shortlists: Array<{ id: string; name: string; shortlist_people: Array<{ person_id: string }> }> }>("/api/shortlists");
      const list = lists.shortlists.find((l) => l.id === id);
      if (!list) return;
      setName(list.name);

      const ids = list.shortlist_people.map((p) => p.person_id);
      if (ids.length === 0) { setCandidates([]); return; }

      const people = await Promise.all(
        ids.map((pid) => apiFetch<Candidate>("/api/people/" + pid).catch(() => null))
      );
      setCandidates(people.filter((p): p is Candidate => p !== null));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function confirmRemove() {
    if (!removeId) return;
    await apiFetch("/api/shortlists/" + id + "/people/" + removeId, { method: "DELETE" });
    setRemoveId(null);
    load();
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <Link href="/shortlists" style={{ fontSize: 14, display: "inline-block", marginBottom: 20 }}>Back to all shortlists</Link>

      <h1 style={{ fontSize: 28, marginBottom: 4 }}>{name}</h1>
      <p className="muted" style={{ marginBottom: 24 }}>{candidates.length} candidate{candidates.length === 1 ? "" : "s"}</p>

      {loading && <p className="muted">Loading...</p>}

      {!loading && candidates.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>No one here yet</p>
          <p className="muted">Add candidates from their profile page.</p>
        </div>
      )}

      <div className="col" style={{ gap: 12 }}>
        {candidates.map((c) => (
          <div key={c.id} className="card">
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <Link href={"/people/" + c.id} style={{ color: "var(--text)", flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{c.full_name}</p>
                <p className="muted" style={{ fontSize: 13 }}>{c.headline}</p>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{c.location_city} - {c.years_experience} yrs - {c.seniority}</p>
              </Link>
              <button type="button" className="ghost danger" onClick={() => setRemoveId(c.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={removeId !== null}
        title="Remove from shortlist?"
        message="The candidate stays in your database, just removed from this list."
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}