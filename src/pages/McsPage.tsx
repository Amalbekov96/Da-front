import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, createMc, deleteMc, listMcs, updateMc } from "../api/client";
import type { Mc } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../permissions";

function formatRpm(rpm: number | null): string {
  return rpm === null ? "—" : `$${rpm.toFixed(2)}/mi`;
}

export function McsPage() {
  const { user: me } = useAuth();
  const [mcs, setMcs] = useState<Mc[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [mcNumber, setMcNumber] = useState("");
  const [name, setName] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const canEdit = me ? hasPermission(me.role, "mcs.edit") : false;
  const canDelete = me ? hasPermission(me.role, "mcs.delete") : false;

  async function refresh() {
    setMcs(await listMcs());
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load carriers"));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMc({
        mc_number: mcNumber,
        name: name || undefined,
        dot_number: dotNumber || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      setMcNumber("");
      setName("");
      setDotNumber("");
      setPhone("");
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create carrier");
    }
  }

  async function handleFieldChange(mc: Mc, field: "name" | "dot_number" | "phone" | "email" | "notes", value: string) {
    await updateMc(mc.id, {
      mc_number: mc.mc_number,
      name: field === "name" ? value : mc.name ?? undefined,
      dot_number: field === "dot_number" ? value : mc.dot_number ?? undefined,
      phone: field === "phone" ? value : mc.phone ?? undefined,
      email: field === "email" ? value : mc.email ?? undefined,
      notes: field === "notes" ? value : mc.notes ?? undefined,
    });
    await refresh();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this carrier? Any users assigned to it will lose the assignment.")) return;
    try {
      await deleteMc(id);
      await refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't delete carrier");
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Add Carrier</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="MC number" required value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} />
          <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="DOT number" value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <th>Phone</th>
              <th>Email</th>
              <th>Notes</th>
              <th>Loads</th>
              <th>Avg RPM (7d)</th>
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
                <td>
                  {canEdit ? (
                    <input
                      defaultValue={mc.phone ?? ""}
                      onBlur={(e) => e.target.value !== (mc.phone ?? "") && handleFieldChange(mc, "phone", e.target.value)}
                    />
                  ) : (
                    mc.phone ?? "—"
                  )}
                </td>
                <td>
                  {canEdit ? (
                    <input
                      defaultValue={mc.email ?? ""}
                      onBlur={(e) => e.target.value !== (mc.email ?? "") && handleFieldChange(mc, "email", e.target.value)}
                    />
                  ) : (
                    mc.email ?? "—"
                  )}
                </td>
                <td>
                  {canEdit ? (
                    <input
                      defaultValue={mc.notes ?? ""}
                      onBlur={(e) => e.target.value !== (mc.notes ?? "") && handleFieldChange(mc, "notes", e.target.value)}
                    />
                  ) : (
                    mc.notes ?? "—"
                  )}
                </td>
                <td>
                  {mc.load_count > 0 ? <Link to={`/loads-history?carrier_id=${mc.id}`}>{mc.load_count}</Link> : mc.load_count}
                </td>
                <td>{formatRpm(mc.avg_rpm_7d)}</td>
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
