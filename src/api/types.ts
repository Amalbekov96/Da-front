// Mirrors app/booking/check.py — BookingCheckResult / LaneHistoryEntry.
// `is_safe_to_book` is a @property on the backend dataclass, so it is NOT part of the
// JSON payload (FastAPI's jsonable_encoder only serializes dataclass fields). Derive it
// client-side in deriveSafeToBook() below, matching the same rule.

export interface LaneHistoryEntry {
  origin: string | null;
  destination: string | null;
  rate: number | null;
  pickup_date: string | null;
}

export interface BookingCheckResult {
  mc_number: string;
  broker_name: string | null;

  fmcsa_authority_status: string | null;
  fmcsa_safety_rating: string | null;
  fmcsa_found: boolean;

  is_dnu: boolean;
  is_bad_broker: boolean;
  dnu_reason: string | null;

  times_hauled: number;
  avg_rate: number | null;
  lane_history: LaneHistoryEntry[];

  warnings: string[];
}

export function deriveSafeToBook(result: BookingCheckResult): boolean {
  return !result.is_dnu && !result.is_bad_broker && result.warnings.length === 0;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  picture_url: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
