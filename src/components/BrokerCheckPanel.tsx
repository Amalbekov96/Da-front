import { useState, type FormEvent } from "react";
import { ApiError, checkBroker } from "../api/client";
import { deriveSafeToBook, type BookingCheckResult } from "../api/types";

function formatRate(rate: number | null): string {
  return rate == null ? "—" : `$${rate.toFixed(2)}`;
}

export function BrokerCheckPanel() {
  const [mcNumber, setMcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingCheckResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mcNumber.trim()) return;

    setLoading(true);
    setError(null);
    try {
      setResult(await checkBroker(mcNumber));
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <form className="broker-form" onSubmit={handleSubmit}>
        <label htmlFor="mc-number">MC number</label>
        <div className="broker-form-row">
          <input
            id="mc-number"
            placeholder="e.g. 123456"
            value={mcNumber}
            onChange={(e) => setMcNumber(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading || !mcNumber.trim()}>
            {loading ? "Checking…" : "Check broker"}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {result && <BrokerCheckResultView result={result} />}
    </section>
  );
}

function BrokerCheckResultView({ result }: { result: BookingCheckResult }) {
  const safe = deriveSafeToBook(result);

  return (
    <div className="result">
      <div className="result-header">
        <div>
          <h2>{result.broker_name ?? `MC ${result.mc_number}`}</h2>
          {result.broker_name && <span className="muted">MC {result.mc_number}</span>}
        </div>
        <span className={`badge ${safe ? "badge-safe" : "badge-unsafe"}`}>
          {safe ? "Safe to book" : "Do not book"}
        </span>
      </div>

      {result.warnings.length > 0 && (
        <ul className="warnings">
          {result.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">FMCSA authority</span>
          <span className="stat-value">
            {result.fmcsa_found ? (result.fmcsa_authority_status ?? "Unknown") : "Not found"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">FMCSA safety rating</span>
          <span className="stat-value">{result.fmcsa_safety_rating ?? "—"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Times hauled</span>
          <span className="stat-value">{result.times_hauled}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Average rate</span>
          <span className="stat-value">{formatRate(result.avg_rate)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className="stat-value">{result.status ?? "—"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Factoring grade</span>
          <span className="stat-value">
            {result.factoring_grade ?? "—"}
            {!result.rts_checked_at && <span className="muted"> (not checked via RTS yet)</span>}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Loads made (RTS)</span>
          <span className="stat-value">{result.loads_made_count ?? "—"}</span>
        </div>
      </div>

      {result.notes && (
        <p className="muted">
          <strong>Notes:</strong> {result.notes}
        </p>
      )}

      <h3>Lane history</h3>
      {result.lane_history.length === 0 ? (
        <p className="muted">No rate-con history with this broker yet.</p>
      ) : (
        <table className="lane-table">
          <thead>
            <tr>
              <th>Origin</th>
              <th>Destination</th>
              <th>Rate</th>
              <th>Pickup date</th>
            </tr>
          </thead>
          <tbody>
            {result.lane_history.map((lane, i) => (
              <tr key={i}>
                <td>{lane.origin ?? "—"}</td>
                <td>{lane.destination ?? "—"}</td>
                <td>{formatRate(lane.rate)}</td>
                <td>{lane.pickup_date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
