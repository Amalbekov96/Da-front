import { useEffect, useState } from "react";
import { ApiError, listSources, updateSource } from "../api/client";
import type { Source } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../permissions";

export function SourcesPage() {
  const { user: me } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canManage = me ? hasPermission(me.role, "sources.manage") : false;

  async function refresh() {
    setSources(await listSources());
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load sources"));
  }, []);

  async function handleToggle(source: Source) {
    await updateSource(source.id, { active: !source.active });
    await refresh();
  }

  return (
    <section className="panel">
      <h2>Sources</h2>
      <p className="muted">
        Deactivated sources won't appear in the source picker when anyone creates a search.
        {!canManage && " Only an admin can activate or deactivate a source."}
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.type === "telegram_group" ? "Telegram group" : "Broker board (future)"}</td>
              <td>
                {canManage ? (
                  <button type="button" className="link-button" onClick={() => handleToggle(s)}>
                    {s.active ? "active — click to disable" : "inactive — click to enable"}
                  </button>
                ) : (
                  <span className={s.active ? "status-active" : "status-inactive"}>{s.active ? "active" : "inactive"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
