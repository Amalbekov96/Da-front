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

// Mirrors app/db/models.py:ROLES
export type Role = "user" | "manager" | "admin";

export interface Mc {
  id: number;
  mc_number: string;
  name: string | null;
  dot_number: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  picture_url: string | null;
  role: Role;
  active: boolean;
  mcs: Mc[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Mirrors app/db/models.py Source
export type SourceType = "telegram_group" | "broker_api";

export interface Source {
  id: number;
  name: string;
  type: SourceType;
  active: boolean;
}

// Mirrors app/booking/constants.py:EQUIPMENT_TYPES — the "popular truck types"
export const EQUIPMENT_TYPES = ["van", "reefer", "flatbed", "step_deck", "power_only", "box_truck", "hotshot"] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  van: "Dry Van",
  reefer: "Reefer",
  flatbed: "Flatbed",
  step_deck: "Step Deck",
  power_only: "Power Only",
  box_truck: "Box Truck",
  hotshot: "Hotshot",
};

export interface Search {
  id: number;
  user_id: number;
  mc_id: number | null;
  name: string;
  origin_filter: string | null;
  destination_filter: string | null;
  equipment_type: string | null;
  pickup_date_from: string | null;
  pickup_date_to: string | null;
  origin_deadhead_miles: number | null;
  destination_deadhead_miles: number | null;
  active: boolean;
  source_ids: number[];
  created_at: string;
}

export interface SearchRequest {
  name: string;
  origin_filter?: string | null;
  destination_filter?: string | null;
  equipment_type?: string | null;
  pickup_date_from?: string | null;
  pickup_date_to?: string | null;
  origin_deadhead_miles?: number | null;
  destination_deadhead_miles?: number | null;
  mc_id?: number | null;
  source_ids?: number[];
}

export interface LoadRow {
  id: number;
  source: string;
  source_name: string | null;
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  equipment_type: string | null;
  weight_lbs: number | null;
  rate: string | null;
  miles: number | null;
  raw_text: string | null;
  posted_by: string | null;
  created_at: string;
  match_quality: "full" | "origin_only" | null;
}

export interface LoadFilters {
  origin?: string;
  destination?: string;
  equipment_type?: string;
  date_from?: string;
  date_to?: string;
  source?: string;
  mc_id?: number;
  search_id?: number;
  since_id?: number;
}
