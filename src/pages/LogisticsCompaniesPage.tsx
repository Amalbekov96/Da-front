import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, listLogisticsCompanies, updateLogisticsCompany } from "../api/client";
import type { LogisticsCompany } from "../api/types";

function formatRpm(rpm: number | null): string {
  return rpm === null ? "—" : `$${rpm.toFixed(2)}/mi`;
}

export function LogisticsCompaniesPage() {
  const [companies, setCompanies] = useState<LogisticsCompany[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh(q?: string) {
    setCompanies(await listLogisticsCompanies(q || undefined));
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load logistics companies"));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => refresh(query).catch(() => undefined), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleFieldChange(company: LogisticsCompany, field: "name" | "mc_number" | "phone" | "email" | "address" | "notes", value: string) {
    await updateLogisticsCompany(company.id, { [field]: value });
    await refresh(query);
  }

  async function handleStatusChange(company: LogisticsCompany, status: string) {
    await updateLogisticsCompany(company.id, { status: status || undefined });
    await refresh(query);
  }

  async function handleToggleFlag(company: LogisticsCompany, field: "is_dnu" | "is_bad_broker") {
    await updateLogisticsCompany(company.id, { [field]: !company[field] });
    await refresh(query);
  }

  return (
    <div>
      <section className="panel">
        <h2>Logistics Companies</h2>
        <p className="muted">
          The companies that send loads and rate confirmations — safety-checked via Broker Check, and enriched here
          as rate-cons come in.
        </p>
        <input
          className="search-input"
          placeholder="Search by name or MC"
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
              <th>MC</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Notes</th>
              <th>Loads</th>
              <th>Avg RPM (7d)</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    defaultValue={c.name ?? ""}
                    onBlur={(e) => e.target.value !== (c.name ?? "") && handleFieldChange(c, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={c.mc_number ?? ""}
                    onBlur={(e) => e.target.value !== (c.mc_number ?? "") && handleFieldChange(c, "mc_number", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={c.phone ?? ""}
                    onBlur={(e) => e.target.value !== (c.phone ?? "") && handleFieldChange(c, "phone", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={c.email ?? ""}
                    onBlur={(e) => e.target.value !== (c.email ?? "") && handleFieldChange(c, "email", e.target.value)}
                  />
                </td>
                <td>
                  <select defaultValue={c.status ?? ""} onChange={(e) => handleStatusChange(c, e.target.value)}>
                    <option value="">—</option>
                    <option value="good">Good</option>
                    <option value="generous">Generous</option>
                    <option value="professional">Professional</option>
                    <option value="bad">Bad</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className={`link-button${c.is_dnu ? " danger" : ""}`}
                    onClick={() => handleToggleFlag(c, "is_dnu")}
                  >
                    {c.is_dnu ? "DNU ✓" : "Mark DNU"}
                  </button>
                  {" · "}
                  <button
                    type="button"
                    className={`link-button${c.is_bad_broker ? " danger" : ""}`}
                    onClick={() => handleToggleFlag(c, "is_bad_broker")}
                  >
                    {c.is_bad_broker ? "Bad ✓" : "Mark bad"}
                  </button>
                </td>
                <td>
                  <input
                    defaultValue={c.notes ?? ""}
                    onBlur={(e) => e.target.value !== (c.notes ?? "") && handleFieldChange(c, "notes", e.target.value)}
                  />
                </td>
                <td>{c.load_count > 0 ? <Link to={`/loads-history?broker_id=${c.id}`}>{c.load_count}</Link> : c.load_count}</td>
                <td>{formatRpm(c.avg_rpm_7d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
