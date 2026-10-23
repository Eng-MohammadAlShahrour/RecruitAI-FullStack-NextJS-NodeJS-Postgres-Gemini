"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Shortlist = {
  id: string;
  name: string;
  created_at: string;
  shortlist_people: Array<{ person_id: string }>;
};

export default function ShortlistsPage() {
  const [lists, setLists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ shortlists: Shortlist[] }>("/api/shortlists");
      setLists(res.shortlists);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await apiFetch("/api/shortlists", { method: "POST", body: JSON.stringify({ name: newName }) });
    setNewName("");
    load();
  }

  async function rename(id: string) {
    if (!editingName.trim()) return;
    await apiFetch("/api/shortlists/" + id, { method: "PATCH", body: JSON.stringify({ name: editingName }) });
    setEditingId(null);
    load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await apiFetch("/api/shortlists/" + deleteId, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Shortlists</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Organize candidates into named lists.</p>

      <form onSubmit={create} className="row" style={{ gap: 10, marginBottom: 24 }}>
        <input type="text" placeholder="New shortlist name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" disabled={!newName.trim()}>Create</button>
      </form>

      {loading && <p className="muted">Loading...</p>}

      {!loading && lists.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>No shortlists yet</p>
          <p className="muted">Create one to start collecting candidates.</p>
        </div>
      )}

      <div className="col" style={{ gap: 12 }}>
        {lists.map((l) => (
          <div key={l.id} className="card">
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              {editingId === l.id ? (
                <div className="row" style={{ gap: 8, flex: 1 }}>
                  <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                  <button type="button" onClick={() => rename(l.id)}>Save</button>
                  <button type="button" className="ghost" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <Link href={"/shortlists/" + l.id} style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{l.name}</Link>
              )}

              <div className="row" style={{ gap: 8 }}>
                <span className="muted">{l.shortlist_people?.length ?? 0} people</span>
                {editingId !== l.id && (
                  <>
                    <button type="button" className="ghost" onClick={() => { setEditingId(l.id); setEditingName(l.name); }}>Rename</button>
                    <button type="button" className="ghost danger" onClick={() => setDeleteId(l.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete shortlist?"
        message="This will remove the list and its members. This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}