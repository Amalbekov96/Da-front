import { useCallback, useEffect, useRef, useState } from "react";
import { createSearch, deleteSearch, listLoads, listMcs, listSearches, listSources } from "../api/client";
import { ApiError } from "../api/client";
import { EQUIPMENT_LABELS, EQUIPMENT_TYPES, type LoadRow, type Mc, type Search, type Source } from "../api/types";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";

const POLL_INTERVAL_MS = 7000;
const HIGHLIGHT_MS = 6000;
const MAX_ACTIVE_SEARCHES = 4;

function formatRate(rate: string | null): string {
  if (!rate) return "—";
  const n = Number(rate);
  return Number.isFinite(n) ? `$${n.toFixed(0)}` : "—";
}

function searchLabel(s: Search): string {
  return `${s.name} (${s.origin_filter || "Any"} → ${s.destination_filter || "Any"})`;
}

function renderPostedBy(load: LoadRow) {
  if (!load.posted_by) return "—";
  // Prefer a public username (works as a plain web link); fall back to the numeric
  // user id via the tg:// scheme, which only opens if a Telegram app is installed.
  const href = load.posted_by_username
    ? `https://t.me/${load.posted_by_username}`
    : load.posted_by_user_id
      ? `tg://user?id=${load.posted_by_user_id}`
      : null;
  if (!href) return load.posted_by;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="posted-by-link">
      {load.posted_by}
    </a>
  );
}

interface SearchFormState {
  name: string;
  origin: string;
  destination: string;
  origin_deadhead: string;
  destination_deadhead: string;
  equipment_type: string;
  date_from: string;
  date_to: string;
  mc_id: string;
  source_ids: number[];
}

const emptyForm: SearchFormState = {
  name: "",
  origin: "",
  destination: "",
  origin_deadhead: "",
  destination_deadhead: "",
  equipment_type: "",
  date_from: "",
  date_to: "",
  mc_id: "",
  source_ids: [],
};

export function LoadBoardPage() {
  const [searches, setSearches] = useState<Search[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [mcs, setMcs] = useState<Mc[]>([]);
  const [selectedSearchId, setSelectedSearchId] = useState<number | null>(null);

  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const lastSeenIdRef = useRef<number>(0);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SearchFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadsError, setLoadsError] = useState<string | null>(null);

  const activeSearches = searches.filter((s) => s.active);

  const refreshMeta = useCallback(async () => {
    const [s, src, m] = await Promise.all([listSearches(), listSources(), listMcs()]);
    setSearches(s);
    setSources(src);
    setMcs(m);
  }, []);

  const fetchLoads = useCallback(
    async (reset: boolean) => {
      try {
        const rows = await listLoads({
          search_id: selectedSearchId ?? undefined,
          since_id: reset ? undefined : lastSeenIdRef.current || undefined,
        });
        if (rows.length === 0) return;

        const maxId = Math.max(...rows.map((r) => r.id), lastSeenIdRef.current);
        lastSeenIdRef.current = maxId;
        setLoadsError(null);

        if (reset) {
          setLoads(rows);
        } else {
          setLoads((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const fresh = rows.filter((r) => !existingIds.has(r.id));
            if (fresh.length === 0) return prev;
            setHighlighted((h) => new Set([...h, ...fresh.map((r) => r.id)]));
            setTimeout(() => {
              setHighlighted((h) => {
                const next = new Set(h);
                fresh.forEach((r) => next.delete(r.id));
                return next;
              });
            }, HIGHLIGHT_MS);
            return [...fresh, ...prev];
          });
        }
      } catch (err) {
        setLoadsError(err instanceof ApiError ? err.message : "Couldn't load the board");
      }
    },
    [selectedSearchId],
  );

  useEffect(() => {
    refreshMeta().catch(() => undefined);
  }, [refreshMeta]);

  useEffect(() => {
    lastSeenIdRef.current = 0;
    setLoads([]);
    fetchLoads(true);
    const id = setInterval(() => fetchLoads(false), POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSearchId]);

  async function handleCreateSearch(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await createSearch({
        name: form.name || `${form.origin || "Any"} → ${form.destination || "Any"}`,
        origin_filter: form.origin || null,
        destination_filter: form.destination || null,
        origin_deadhead_miles: form.origin_deadhead ? Number(form.origin_deadhead) : null,
        destination_deadhead_miles: form.destination_deadhead ? Number(form.destination_deadhead) : null,
        equipment_type: form.equipment_type || null,
        pickup_date_from: form.date_from || null,
        pickup_date_to: form.date_to || null,
        mc_id: form.mc_id ? Number(form.mc_id) : null,
        source_ids: form.source_ids,
      });
      setForm(emptyForm);
      setShowForm(false);
      await refreshMeta();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create the search");
    }
  }

  async function handleCloseSearch(id: number) {
    // Closing a search permanently deletes it (and any board loads that were only
    // there because of it) — there's no separate "closed but kept" state anymore.
    await deleteSearch(id);
    if (selectedSearchId === id) setSelectedSearchId(null);
    await refreshMeta();
  }

  return (
    <div className="load-board">
      <section className="panel searches-panel">
        <div className="searches-row">
          {activeSearches.map((s) => (
            <div key={s.id} className={`search-pill${selectedSearchId === s.id ? " active" : ""}`}>
              <button type="button" onClick={() => setSelectedSearchId(s.id)}>
                {searchLabel(s)}
              </button>
              <button
                type="button"
                className="search-pill-close"
                title="Delete this search and its board results"
                onClick={() => handleCloseSearch(s.id)}
              >
                ×
              </button>
            </div>
          ))}
          {selectedSearchId !== null && (
            <button type="button" className="search-pill" onClick={() => setSelectedSearchId(null)}>
              All my searches
            </button>
          )}
          <button
            type="button"
            className="new-search-button"
            disabled={activeSearches.length >= MAX_ACTIVE_SEARCHES}
            onClick={() => setShowForm((v) => !v)}
            title={activeSearches.length >= MAX_ACTIVE_SEARCHES ? "Max 4 active searches — close one first" : undefined}
          >
            + New search
          </button>
        </div>

        {showForm && (
          <form className="search-form" onSubmit={handleCreateSearch}>
            <div className="search-form-row">
              <input placeholder="Search name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Origin (e.g. UT)" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
              <input
                type="number"
                min="0"
                placeholder="± mi"
                className="deadhead-input"
                title="Deadhead radius around the origin, in miles"
                value={form.origin_deadhead}
                onChange={(e) => setForm({ ...form, origin_deadhead: e.target.value })}
              />
              <input
                placeholder="Destination (e.g. TX)"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder="± mi"
                className="deadhead-input"
                title="Deadhead radius around the destination, in miles"
                value={form.destination_deadhead}
                onChange={(e) => setForm({ ...form, destination_deadhead: e.target.value })}
              />
            </div>
            <div className="search-form-row">
              <label className="date-field">
                From
                <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
              </label>
              <label className="date-field">
                To
                <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
              </label>
              <select value={form.mc_id} onChange={(e) => setForm({ ...form, mc_id: e.target.value })}>
                <option value="">No MC filter</option>
                {mcs.map((mc) => (
                  <option key={mc.id} value={mc.id}>
                    {mc.name ?? mc.mc_number}
                  </option>
                ))}
              </select>
              <MultiSelectDropdown
                label="Sources"
                options={sources.map((s) => ({ id: s.id, label: s.name }))}
                selectedIds={form.source_ids}
                onChange={(ids) => setForm((f) => ({ ...f, source_ids: ids }))}
              />
            </div>

            <div className="equipment-picker">
              {EQUIPMENT_TYPES.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  className={`equipment-chip${form.equipment_type === eq ? " active" : ""}`}
                  onClick={() => setForm({ ...form, equipment_type: form.equipment_type === eq ? "" : eq })}
                >
                  {EQUIPMENT_LABELS[eq]}
                </button>
              ))}
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}
            <button type="submit" className="primary-button search-submit-button">
              Save search
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        {loadsError && <div className="alert alert-error">{loadsError}</div>}
        {loads.length === 0 ? (
          <p className="muted">No loads yet. Matches will appear here as they come in from Telegram.</p>
        ) : (
          <table className="load-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Rate</th>
                <th>Equipment</th>
                <th>Weight</th>
                <th>Source</th>
                <th>Posted by</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <tr key={load.id} className={highlighted.has(load.id) ? "load-row-new" : ""}>
                  <td>
                    {load.match_quality === "full" && <span className="match-badge match-full">100%</span>}
                    {load.match_quality === "origin_only" && <span className="match-badge match-partial">Origin</span>}
                  </td>
                  <td>{load.origin ?? "—"}</td>
                  <td>{load.destination ?? "—"}</td>
                  <td>{formatRate(load.rate)}</td>
                  <td>{load.equipment_type ? EQUIPMENT_LABELS[load.equipment_type as keyof typeof EQUIPMENT_LABELS] ?? load.equipment_type : "—"}</td>
                  <td>{load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : "—"}</td>
                  <td>{load.source_name ?? "—"}</td>
                  <td>{renderPostedBy(load)}</td>
                  <td>{new Date(load.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </div>
  );
}
