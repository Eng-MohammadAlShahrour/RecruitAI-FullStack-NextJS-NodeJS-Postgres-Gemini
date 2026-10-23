"use client";

import { createClient } from "@/lib/supabase/client";

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "unknown" }));
    throw Object.assign(new Error(err.error ?? "request failed"), {
      status: res.status,
      body: err,
    });
  }

  return res.json();
}