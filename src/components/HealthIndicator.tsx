import { useEffect, useState } from "react";
import { checkHealth } from "../api/client";

type Status = "checking" | "online" | "offline";

const POLL_INTERVAL_MS = 15_000;

export function HealthIndicator() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        await checkHealth();
        if (!cancelled) setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const label = { checking: "Checking API…", online: "API connected", offline: "API unreachable" }[status];

  return (
    <div className="health-indicator" data-status={status}>
      <span className="health-dot" aria-hidden="true" />
      {label}
    </div>
  );
}
