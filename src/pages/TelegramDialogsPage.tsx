import { useEffect, useState } from "react";
import { ApiError, deleteTelegramDialog, fetchTelegramDialogs, listTelegramDialogs } from "../api/client";
import type { TelegramDialog } from "../api/types";

export function TelegramDialogsPage() {
  const [dialogs, setDialogs] = useState<TelegramDialog[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  async function refresh() {
    setDialogs(await listTelegramDialogs());
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load groups"));
  }, []);

  async function handleFetch() {
    setError(null);
    setFetching(true);
    try {
      setDialogs(await fetchTelegramDialogs());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't fetch groups from Telegram");
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Remove this from the saved list? This doesn't affect Telegram itself.")) return;
    await deleteTelegramDialog(id);
    await refresh();
  }

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? dialogs.filter(
        (d) =>
          (d.name ?? "").toLowerCase().includes(needle) ||
          (d.username ?? "").toLowerCase().includes(needle) ||
          String(d.chat_id).includes(needle),
      )
    : dialogs;

  return (
    <div>
      <section className="panel">
        <h2>Telegram Groups</h2>
        <p className="muted">
          Every chat, group, and channel the connected Telegram account belongs to — use this to find the id or
          username to put into a Source.
        </p>
        <div className="inline-form">
          <input placeholder="Search by name, username, or id" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="primary-button" onClick={handleFetch} disabled={fetching}>
            {fetching ? "Finding groups…" : "Find all groups info"}
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      <section className="panel">
        {dialogs.length === 0 ? (
          <p className="muted">Nothing saved yet — click "Find all groups info" to pull the current list from Telegram.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Username</th>
                <th>Chat ID</th>
                <th>Members</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>{d.name ?? "—"}</td>
                  <td>{d.kind === "channel" ? "Channel" : "Group"}</td>
                  <td>{d.username ? `@${d.username}` : "—"}</td>
                  <td>{d.chat_id}</td>
                  <td>{d.participants_count ?? "—"}</td>
                  <td className="row-actions">
                    <button type="button" className="link-button danger" onClick={() => handleDelete(d.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
