"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type SavedBrief = {
  id: string;
  brief: string;
  filters: Record<string, unknown>;
  created_at: string;
};

export default function SavedPage() {
  const [briefs, setBriefs] = useState<SavedBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ saved_briefs: SavedBrief[] }>("/api/saved-briefs");
      setBriefs(res.saved_briefs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function rerun(brief: string) {
    router.push("/search?brief=" + encodeURIComponent(brief));
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await apiFetch("/api/saved-briefs/" + deleteId, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Saved searches</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Re-run any brief later.</p>

      {loading && <p className="muted">Loading...</p>}

      {!loading && briefs.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>No saved searches</p>
          <p className="muted">Save a search from the search page to see it here.</p>
        </div>
      )}

      <div className="col" style={{ gap: 12 }}>
        {briefs.map((b) => (
          <div key={b.id} className="card">
            <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <p style={{ fontWeight: 500, flex: 1, minWidth: 200 }}>{b.brief}</p>
              <div className="row" style={{ gap: 8 }}>
                <button type="button" onClick={() => rerun(b.brief)} style={{ fontSize: 13 }}>
                  Re-run
                </button>
                <button type="button" className="ghost danger" onClick={() => setDeleteId(b.id)}>
                  Delete
                </button>
              </div>
            </div>

            <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {Object.entries(b.filters).map(([k, v]) => (
                <span key={k} className="chip">
                  {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete saved search?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}