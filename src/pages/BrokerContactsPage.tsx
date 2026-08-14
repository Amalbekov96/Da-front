import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, createBrokerContact, deleteBrokerContact, listBrokerContacts, listLogisticsCompanies, updateBrokerContact } from "../api/client";
import type { BrokerContact, LogisticsCompany } from "../api/types";

function formatRpm(rpm: number | null): string {
  return rpm === null ? "—" : `$${rpm.toFixed(2)}/mi`;
}

export function BrokerContactsPage() {
  const [contacts, setContacts] = useState<BrokerContact[]>([]);
  const [companies, setCompanies] = useState<LogisticsCompany[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [brokerId, setBrokerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [extension, setExtension] = useState("");
  const [email, setEmail] = useState("");

  async function refresh(q?: string) {
    setContacts(await listBrokerContacts({ q: q || undefined }));
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load brokers"));
    listLogisticsCompanies()
      .then(setCompanies)
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
      await createBrokerContact({
        broker_id: Number(brokerId),
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
      setError(err instanceof ApiError ? err.message : "Couldn't create broker");
    }
  }

  async function handleFieldChange(contact: BrokerContact, field: "name" | "phone" | "extension" | "email", value: string) {
    await updateBrokerContact(contact.id, {
      broker_id: contact.broker_id,
      name: field === "name" ? value : contact.name,
      phone: field === "phone" ? value : contact.phone,
      extension: field === "extension" ? value : contact.extension,
      email: field === "email" ? value : contact.email,
    });
    await refresh(query);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this broker?")) return;
    try {
      await deleteBrokerContact(id);
      await refresh(query);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't delete broker");
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Add Broker</h2>
        <p className="muted">The individual person at a logistics company — distinct from the company itself.</p>
        <form className="inline-form" onSubmit={handleCreate}>
          <select required value={brokerId} onChange={(e) => setBrokerId(e.target.value)}>
            <option value="">Logistics company…</option>
            {companies.map((c) => (
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
              <th>Logistics company</th>
              <th>Phone</th>
              <th>Extension</th>
              <th>Email</th>
              <th>Loads</th>
              <th>Avg RPM (7d)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    defaultValue={c.name}
                    onBlur={(e) => e.target.value !== c.name && handleFieldChange(c, "name", e.target.value)}
                  />
                </td>
                <td>{c.logistics_company_name ?? "—"}</td>
                <td>
                  <input
                    defaultValue={c.phone ?? ""}
                    onBlur={(e) => e.target.value !== (c.phone ?? "") && handleFieldChange(c, "phone", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={c.extension ?? ""}
                    onBlur={(e) => e.target.value !== (c.extension ?? "") && handleFieldChange(c, "extension", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={c.email ?? ""}
                    onBlur={(e) => e.target.value !== (c.email ?? "") && handleFieldChange(c, "email", e.target.value)}
                  />
                </td>
                <td>{c.load_count > 0 ? <Link to={`/loads-history?broker_contact_id=${c.id}`}>{c.load_count}</Link> : c.load_count}</td>
                <td>{formatRpm(c.avg_rpm_7d)}</td>
                <td className="row-actions">
                  <button type="button" className="link-button danger" onClick={() => handleDelete(c.id)}>
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
