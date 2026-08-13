import { useEffect, useState } from "react";
import { ApiError, createMc, deleteMc, listMcs, updateMc } from "../api/client";
import type { Mc } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../permissions";

export function McsPage() {
  const { user: me } = useAuth();
  const [mcs, setMcs] = useState<Mc[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [mcNumber, setMcNumber] = useState("");
  const [name, setName] = useState("");
  const [dotNumber, setDotNumber] = useState("");

  const canEdit = me ? hasPermission(me.role, "mcs.edit") : false;
  const canDelete = me ? hasPermission(me.role, "mcs.delete") : false;

  async function refresh() {
    setMcs(await listMcs());
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load MCs"));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMc({ mc_number: mcNumber, name: name || undefined, dot_number: dotNumber || undefined });
      setMcNumber("");
      setName("");
      setDotNumber("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create MC");
    }
  }

  async function handleFieldChange(mc: Mc, field: "name" | "dot_number", value: string) {
    await updateMc(mc.id, { mc_number: mc.mc_number, name: field === "name" ? value : mc.name ?? undefined, dot_number: field === "dot_number" ? value : mc.dot_number ?? undefined });
    await refresh();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this MC? Any users assigned to it will lose the assignment.")) return;
    await deleteMc(id);
    await refresh();
  }

  return (
    <div>
      <section className="panel">
        <h2>Add MC</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="MC number" required value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} />
          <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="DOT number" value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} />
          <button type="submit" className="primary-button">
            Add
          </button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>MC number</th>
              <th>Company</th>
              <th>DOT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mcs.map((mc) => (
              <tr key={mc.id}>
                <td>{mc.mc_number}</td>
                <td>
                  {canEdit ? (
                    <input
                      defaultValue={mc.name ?? ""}
                      onBlur={(e) => e.target.value !== (mc.name ?? "") && handleFieldChange(mc, "name", e.target.value)}
                    />
                  ) : (
                    mc.name ?? "—"
                  )}
                </td>
                <td>
                  {canEdit ? (
                    <input
                      defaultValue={mc.dot_number ?? ""}
                      onBlur={(e) => e.target.value !== (mc.dot_number ?? "") && handleFieldChange(mc, "dot_number", e.target.value)}
                    />
                  ) : (
                    mc.dot_number ?? "—"
                  )}
                </td>
                <td className="row-actions">
                  {canDelete && (
                    <button type="button" className="link-button danger" onClick={() => handleDelete(mc.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
