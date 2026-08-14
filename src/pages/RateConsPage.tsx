import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, deleteRateCon, listRateCons, updateRateCon } from "../api/client";
import type { RateCon, RateConFilters } from "../api/types";

function formatRate(rate: string | null): string {
  if (!rate) return "—";
  const n = Number(rate);
  return Number.isFinite(n) ? `$${n.toFixed(0)}` : "—";
}

function formatRpm(rpm: string | null): string {
  if (!rpm) return "—";
  const n = Number(rpm);
  return Number.isFinite(n) ? `$${n.toFixed(2)}/mi` : "—";
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}

export function RateConsPage() {
  const [searchParams] = useSearchParams();
  const [ratecons, setRatecons] = useState<RateCon[]>([]);
  const [error, setError] = useState<string | null>(null);

  const idFilters: RateConFilters = {
    carrier_id: searchParams.get("carrier_id") ? Number(searchParams.get("carrier_id")) : undefined,
    broker_id: searchParams.get("broker_id") ? Number(searchParams.get("broker_id")) : undefined,
    driver_id: searchParams.get("driver_id") ? Number(searchParams.get("driver_id")) : undefined,
    dispatcher_id: searchParams.get("dispatcher_id") ? Number(searchParams.get("dispatcher_id")) : undefined,
    broker_contact_id: searchParams.get("broker_contact_id") ? Number(searchParams.get("broker_contact_id")) : undefined,
  };
  const hasIdFilter = Object.values(idFilters).some((v) => v !== undefined);

  const [logisticsCompany, setLogisticsCompany] = useState("");
  const [brokerContact, setBrokerContact] = useState("");
  const [dispatcher, setDispatcher] = useState("");
  const [driver, setDriver] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [trailerNumber, setTrailerNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const textFilters: RateConFilters = {
    logistics_company: logisticsCompany || undefined,
    broker_contact: brokerContact || undefined,
    dispatcher: dispatcher || undefined,
    driver: driver || undefined,
    truck_number: truckNumber || undefined,
    trailer_number: trailerNumber || undefined,
    carrier: carrier || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  async function refresh() {
    setRatecons(await listRateCons({ ...idFilters, ...textFilters }));
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load loads"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load loads");
    }
  }

  async function handleNotesChange(rc: RateCon, value: string) {
    await updateRateCon(rc.id, { notes: value });
    await refresh();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this load? The carrier, driver, dispatcher, and logistics company involved are not affected.")) return;
    try {
      await deleteRateCon(id);
      await refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't delete load");
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Loads</h2>
        {hasIdFilter && (
          <p className="muted">Filtered — clear the URL or navigate here from the sidebar to see everything.</p>
        )}
        <form className="search-form" onSubmit={handleFilterSubmit}>
          <div className="search-form-row">
            <input placeholder="Logistics company (name or MC)" value={logisticsCompany} onChange={(e) => setLogisticsCompany(e.target.value)} />
            <input placeholder="Broker (name or phone)" value={brokerContact} onChange={(e) => setBrokerContact(e.target.value)} />
            <input placeholder="Dispatcher (name or phone)" value={dispatcher} onChange={(e) => setDispatcher(e.target.value)} />
            <input placeholder="Driver (name or phone)" value={driver} onChange={(e) => setDriver(e.target.value)} />
          </div>
          <div className="search-form-row">
            <input placeholder="Carrier (name or MC)" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            <input placeholder="Truck #" value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} />
            <input placeholder="Trailer #" value={trailerNumber} onChange={(e) => setTrailerNumber(e.target.value)} />
            <label className="date-field">
              From
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="date-field">
              To
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="primary-button search-submit-button">
            Search
          </button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      <section className="panel">
        {ratecons.length === 0 ? (
          <p className="muted">No loads found.</p>
        ) : (
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Load #</th>
                <th>Carrier</th>
                <th>Logistics co.</th>
                <th>Driver</th>
                <th>Truck/Trailer</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Pickup</th>
                <th>Delivery</th>
                <th>Commodity</th>
                <th>Weight</th>
                <th>Rate</th>
                <th>Miles</th>
                <th>RPM</th>
                <th>Type</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ratecons.map((rc) => (
                <tr key={rc.id}>
                  <td>{rc.load_number ?? "—"}</td>
                  <td>{rc.carrier_name ?? "—"}</td>
                  <td>{rc.logistics_company_name ?? "—"}</td>
                  <td>{rc.driver_name ?? "—"}</td>
                  <td>
                    {rc.truck_number ?? "—"}
                    {rc.trailer_number ? ` / ${rc.trailer_number}` : ""}
                  </td>
                  <td>{rc.origin ?? "—"}</td>
                  <td>{rc.destination ?? "—"}</td>
                  <td>{formatDateTime(rc.pickup_date)}</td>
                  <td>{formatDateTime(rc.delivery_date)}</td>
                  <td>{rc.commodity ?? "—"}</td>
                  <td>{rc.weight_lbs ? `${rc.weight_lbs.toLocaleString()} lbs` : "—"}</td>
                  <td>{formatRate(rc.rate)}</td>
                  <td>{rc.miles ?? "—"}</td>
                  <td>{formatRpm(rc.rate_per_mile)}</td>
                  <td>{rc.appointment_type ?? "—"}</td>
                  <td>
                    <input
                      defaultValue={rc.notes ?? ""}
                      onBlur={(e) => e.target.value !== (rc.notes ?? "") && handleNotesChange(rc, e.target.value)}
                    />
                  </td>
                  <td className="row-actions">
                    <button type="button" className="link-button danger" onClick={() => handleDelete(rc.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </div>
  );
}
