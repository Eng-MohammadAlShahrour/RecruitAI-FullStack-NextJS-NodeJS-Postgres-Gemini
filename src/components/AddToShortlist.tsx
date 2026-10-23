"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Shortlist = { id: string; name: string };

export function AddToShortlist({ personId }: { personId: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<Shortlist[]>([]);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    apiFetch<{ shortlists: Shortlist[] }>("/api/shortlists").then((r) => setLists(r.shortlists));
  }, [open]);

  async function add(shortlistId: string) {
    try {
      await apiFetch("/api/shortlists/" + shortlistId + "/people/" + personId, { method: "POST" });
      setStatus("Added ✓");
      setTimeout(() => { setStatus(null); setOpen(false); }, 800);
    } catch {
      setStatus("Failed");
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await apiFetch<{ id: string }>("/api/shortlists", {
      method: "POST",
      body: JSON.stringify({ name: newName }),
    });
    await add(res.id);
  }

  return (
    <>
      <button type="button" className="secondary" onClick={() => setOpen(true)}>Add to shortlist</button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }} onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: 400, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Add to shortlist</h2>
            {status && <p className="muted" style={{ marginBottom: 8 }}>{status}</p>}

            {lists.length > 0 && (
              <div className="col" style={{ gap: 6, marginBottom: 16 }}>
                {lists.map((l) => (
                  <button key={l.id} type="button" className="secondary" onClick={() => add(l.id)} style={{ textAlign: "left" }}>{l.name}</button>
                ))}
              </div>
            )}

            <form onSubmit={createAndAdd} className="col" style={{ gap: 8 }}>
              <input type="text" placeholder="Or create new list" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <div className="row" style={{ gap: 8 }}>
                <button type="submit" disabled={!newName.trim()} style={{ flex: 1 }}>Create & add</button>
                <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}