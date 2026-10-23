"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

export function SaveSearchButton({
  brief,
  filters,
}: {
  brief: string;
  filters: Record<string, unknown>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/saved-briefs", {
        method: "POST",
        body: JSON.stringify({ brief, filters }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" className="secondary" onClick={save} disabled={saving || saved} style={{ fontSize: 13 }}>
      {saved ? "✓ Saved" : saving ? "Saving..." : "Save search"}
    </button>
  );
}