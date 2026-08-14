import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, createDispatcher, deleteDispatcher, listDispatchers, listMcs, updateDispatcher } from "../api/client";
import type { Dispatcher, Mc } from "../api/types";

function formatRpm(rpm: number | null): string {
  return rpm === null ? "—" : `$${rpm.toFixed(2)}/mi`;
}

export function DispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [carriers, setCarriers] = useState<Mc[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [carrierId, setCarrierId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [extension, setExtension] = useState("");
  const [email, setEmail] = useState("");

  async function refresh(q?: string) {
    setDispatchers(await listDispatchers({ q: q || undefined }));
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load dispatchers"));
    listMcs()
      .then(setCarriers)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => refresh(query).catch(() => undefined), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createDispatcher({
        carrier_id: Number(carrierId),
        name,
        phone: phone || undefined,
        extension: extension || undefined,
        email: email || undefined,
      });
      setName("");
      setPhone("");
      setExtension("");
      setEmail("");
      await refresh(query);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create dispatcher");
    }
  }

  async function handleFieldChange(dispatcher: Dispatcher, field: "name" | "phone" | "extension" | "email", value: string) {
    await updateDispatcher(dispatcher.id, {
      carrier_id: dispatcher.carrier_id,
      name: field === "name" ? value : dispatcher.name,
      phone: field === "phone" ? value : dispatcher.phone,
      extension: field === "extension" ? value : dispatcher.extension,
      email: field === "email" ? value : dispatcher.email,
    });
    await refresh(query);
  }

  async function handleCarrierChange(dispatcher: Dispatcher, newCarrierId: string) {
    if (!newCarrierId) return;
    await updateDispatcher(dispatcher.id, {
      carrier_id: Number(newCarrierId),
      name: dispatcher.name,
      phone: dispatcher.phone,
      extension: dispatcher.extension,
      email: dispatcher.email,
    });
    await refresh(query);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this dispatcher?")) return;
    try {
      await deleteDispatcher(id);
      await refresh(query);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't delete dispatcher");
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Add Dispatcher</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <select required value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
            <option value="">Carrier…</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.mc_number}
              </option>
            ))}
          </select>
          <input placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input placeholder="Extension" value={extension} onChange={(e) => setExtension(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="primary-button">
            Add
          </button>
        </form>
        <input
          className="search-input"
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Carrier</th>
              <th>Phone</th>
              <th>Extension</th>
              <th>Email</th>
              <th>Loads</th>
              <th>Avg RPM (7d)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dispatchers.map((d) => (
              <tr key={d.id}>
                <td>
                  <input
                    defaultValue={d.name}
                    onBlur={(e) => e.target.value !== d.name && handleFieldChange(d, "name", e.target.value)}
                  />
                </td>
                <td>
                  <select value={d.carrier_id ?? ""} onChange={(e) => handleCarrierChange(d, e.target.value)}>
                    <option value="" disabled>
                      Unassigned
                    </option>
                    {carriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? c.mc_number}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    defaultValue={d.phone ?? ""}
                    onBlur={(e) => e.target.value !== (d.phone ?? "") && handleFieldChange(d, "phone", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={d.extension ?? ""}
                    onBlur={(e) => e.target.value !== (d.extension ?? "") && handleFieldChange(d, "extension", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={d.email ?? ""}
                    onBlur={(e) => e.target.value !== (d.email ?? "") && handleFieldChange(d, "email", e.target.value)}
                  />
                </td>
                <td>{d.load_count > 0 ? <Link to={`/loads-history?dispatcher_id=${d.id}`}>{d.load_count}</Link> : d.load_count}</td>
                <td>{formatRpm(d.avg_rpm_7d)}</td>
                <td className="row-actions">
                  <button type="button" className="link-button danger" onClick={() => handleDelete(d.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
