import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, createDriver, deleteDriver, listDrivers, listMcs, updateDriver } from "../api/client";
import type { Driver, Mc } from "../api/types";

function formatRpm(rpm: number | null): string {
  return rpm === null ? "—" : `$${rpm.toFixed(2)}/mi`;
}

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [carriers, setCarriers] = useState<Mc[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [carrierId, setCarrierId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [truck, setTruck] = useState("");
  const [trailer, setTrailer] = useState("");

  async function refresh(q?: string) {
    setDrivers(await listDrivers({ q: q || undefined }));
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load drivers"));
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
      await createDriver({
        carrier_id: Number(carrierId),
        name,
        phone: phone || undefined,
        truck_number: truck || undefined,
        trailer_number: trailer || undefined,
      });
      setName("");
      setPhone("");
      setTruck("");
      setTrailer("");
      await refresh(query);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create driver");
    }
  }

  async function handleFieldChange(driver: Driver, field: "name" | "phone" | "truck_number" | "trailer_number" | "notes", value: string) {
    await updateDriver(driver.id, {
      carrier_id: driver.carrier_id,
      name: field === "name" ? value : driver.name,
      phone: field === "phone" ? value : driver.phone,
      truck_number: field === "truck_number" ? value : driver.truck_number,
      trailer_number: field === "trailer_number" ? value : driver.trailer_number,
      notes: field === "notes" ? value : driver.notes,
    });
    await refresh(query);
  }

  async function handleCarrierChange(driver: Driver, newCarrierId: string) {
    if (!newCarrierId) return;
    await updateDriver(driver.id, {
      carrier_id: Number(newCarrierId),
      name: driver.name,
      phone: driver.phone,
      truck_number: driver.truck_number,
      trailer_number: driver.trailer_number,
      notes: driver.notes,
    });
    await refresh(query);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this driver?")) return;
    try {
      await deleteDriver(id);
      await refresh(query);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't delete driver");
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Add Driver</h2>
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
          <input placeholder="Truck #" value={truck} onChange={(e) => setTruck(e.target.value)} />
          <input placeholder="Trailer #" value={trailer} onChange={(e) => setTrailer(e.target.value)} />
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
              <th>Truck #</th>
              <th>Trailer #</th>
              <th>Notes</th>
              <th>Loads</th>
              <th>Avg RPM (7d)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
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
                    defaultValue={d.truck_number ?? ""}
                    onBlur={(e) => e.target.value !== (d.truck_number ?? "") && handleFieldChange(d, "truck_number", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={d.trailer_number ?? ""}
                    onBlur={(e) => e.target.value !== (d.trailer_number ?? "") && handleFieldChange(d, "trailer_number", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    defaultValue={d.notes ?? ""}
                    onBlur={(e) => e.target.value !== (d.notes ?? "") && handleFieldChange(d, "notes", e.target.value)}
                  />
                </td>
                <td>{d.load_count > 0 ? <Link to={`/loads-history?driver_id=${d.id}`}>{d.load_count}</Link> : d.load_count}</td>
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
