"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { SaveSearchButton } from "@/components/SaveSearchButton";

type Filters = {
  role?: string;
  seniority?: string;
  locations?: string[];
  min_years?: number;
  max_years?: number;
  skills?: string[];
  worked_at_startup?: boolean;
  studied_at?: string;
  degree?: string;
  open_to_work?: boolean;
};

type Candidate = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string;
  role: string;
  seniority: string;
  years_experience: number;
  location_city: string;
  location_state?: string;
  open_to_work: boolean;
  skills: string[];
};

type SearchResponse = {
  search_id: string;
  filters: Filters;
  total: number;
  results: Candidate[];
  searches_remaining: number | null;
};

export default function SearchPage() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<Candidate[] | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const qp = searchParams.get("brief");
    if (qp && !data && !loading) {
      setBrief(qp);
      runSearch(qp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function runSearch(b: string) {
    if (!b.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setPage(1);
    setPageData(null);

    try {
      const res = await apiFetch<SearchResponse>("/api/search", {
        method: "POST",
        body: JSON.stringify({ brief: b }),
      });
      setData(res);
    } catch (e: unknown) {
      const err = e as { status?: number; body?: { error?: string } };
      if (err.status === 402) {
        setError("You have used your 1 free search. Upgrade to keep searching.");
      } else {
        setError(err.body?.error ?? "Search failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPage(n: number) {
    if (!data) return;
    setPageLoading(true);
    try {
      const res = await apiFetch<{ results: Candidate[]; page: number }>(
        "/api/search/" + data.search_id + "?page=" + n
      );
      setPageData(res.results);
      setPage(n);
    } catch {
      setError("Failed to load page");
    } finally {
      setPageLoading(false);
    }
  }

  const results = pageData ?? data?.results ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Find candidates</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Describe who you&apos;re looking for in plain English.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(brief);
        }}
        className="row"
        style={{ gap: 10, marginBottom: 16 }}
      >
        <input
          type="text"
          placeholder="e.g. senior React engineers in New York who have worked at a startup"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !brief.trim()}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {!data && !loading && !error && (
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <span className="muted" style={{ marginRight: 4 }}>Try:</span>
          {[
            "senior React engineers in New York who have worked at a startup",
            "data scientists with a PhD",
            "staff full stack engineers in Seattle",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              className="ghost"
              style={{ fontSize: 13, padding: "4px 10px" }}
              onClick={() => { setBrief(ex); runSearch(ex); }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="card" style={{ marginTop: 24, borderColor: "#fca5a5", background: "#fef2f2" }}>
          <p style={{ color: "var(--danger)", fontWeight: 500 }}>{error}</p>
          {error.includes("Upgrade") && (
            <p className="muted" style={{ marginTop: 8 }}>Contact sales@mohammadalshahrour.com to upgrade.</p>
          )}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p className="muted">Understanding your brief and searching...</p>
        </div>
      )}

      {data && (
        <>
          <div className="card" style={{ marginTop: 24 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontWeight: 600 }}>
                {data.total} candidate{data.total === 1 ? "" : "s"} found
              </p>
              <div className="row" style={{ gap: 8 }}>
                <SaveSearchButton brief={brief} filters={data.filters} />
                <span className="muted" style={{ alignSelf: "center" }}>
                  {data.searches_remaining === null
                    ? "Unlimited"
                    : data.searches_remaining + " search" + (data.searches_remaining === 1 ? "" : "es") + " left"}
                </span>
              </div>
            </div>

            <p className="muted" style={{ marginBottom: 8 }}>Filters understood:</p>
            {Object.keys(data.filters).length === 0 ? (
              <p className="muted" style={{ fontStyle: "italic" }}>
                No filters - the brief couldn&apos;t be mapped to structured filters.
              </p>
            ) : (
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                {Object.entries(data.filters).map(([k, v]) => (
                  <span key={k} className="chip">
                    <strong>{k}:</strong> {Array.isArray(v) ? v.join(", ") : String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {data.total === 0 && (
            <div className="card" style={{ marginTop: 20, textAlign: "center" }}>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>No candidates found</p>
              <p className="muted">Try adjusting your brief.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="col" style={{ marginTop: 20, gap: 12 }}>
              {results.map((c) => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="row pagination" style={{ justifyContent: "center", marginTop: 24, gap: 8 }}>
              <button
                type="button"
                className="secondary"
                disabled={page === 1 || pageLoading}
                onClick={() => loadPage(page - 1)}
              >
                Prev
              </button>
              <span style={{ padding: "8px 14px", fontSize: 14 }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="secondary"
                disabled={page === totalPages || pageLoading}
                onClick={() => loadPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [imgError, setImgError] = useState(false);
  const initials = candidate.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <Link
      href={"/people/" + candidate.id}
      className="card"
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
        {candidate.avatar_url && !imgError ? (
          <img
            src={candidate.avatar_url}
            alt={candidate.full_name}
            className="avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="avatar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e0e7ff",
              color: "#4338ca",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{candidate.full_name}</h3>
            {candidate.open_to_work && (
              <span style={{ fontSize: 11, padding: "2px 8px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontWeight: 500 }}>
                Open to work
              </span>
            )}
          </div>

          <p className="muted" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {candidate.headline}
          </p>

          <div className="row" style={{ gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 13 }}>
            <span className="muted">{candidate.location_city}{candidate.location_state ? ", " + candidate.location_state : ""}</span>
            <span className="muted">{candidate.years_experience} yrs</span>
            <span className="muted">{candidate.seniority}</span>
          </div>

          {candidate.skills.length > 0 && (
            <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {candidate.skills.slice(0, 5).map((s) => (
                <span key={s} style={{ fontSize: 12, padding: "2px 8px", background: "#f3f4f6", borderRadius: 6, color: "#4b5563" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}