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

  // Rate-confirmation tracking fields — status/notes are your own working tags;
  // factoring_grade/loads_made_count come from RTS once that's wired up, otherwise
  // just whatever's already saved on this logistics company.
  status: string | null;
  notes: string | null;
  factoring_grade: string | null;
  loads_made_count: number | null;
  rts_checked_at: string | null;

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

// Also "Carrier" in the rate-confirmation tracking feature — same entity.
export interface Mc {
  id: number;
  mc_number: string;
  name: string | null;
  dot_number: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  load_count: number;
  avg_rpm_7d: number | null;
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

// Mirrors app/db/models.py TelegramDialog
export interface TelegramDialog {
  id: number;
  chat_id: number;
  name: string | null;
  kind: "group" | "channel";
  username: string | null;
  participants_count: number | null;
  fetched_at: string;
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
  posted_by_username: string | null;
  posted_by_user_id: number | null;
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

// --- rate-confirmation tracking -------------------------------------------
// Mirrors app/api/schemas.py's LogisticsCompanyOut/DriverOut/DispatcherOut/
// BrokerContactOut/RateConOut. LogisticsCompanyOut wraps the `Broker` DB model
// (same entity as the safety-check flow above); BrokerContact is the individual
// person there, distinct from that.

export interface LogisticsCompany {
  id: number;
  mc_number: string | null;
  dot_number: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  fmcsa_authority_status: string | null;
  fmcsa_safety_rating: string | null;
  is_dnu: boolean;
  is_bad_broker: boolean;
  dnu_reason: string | null;
  status: string | null;
  notes: string | null;
  factoring_grade: string | null;
  loads_made_count: number | null;
  rts_checked_at: string | null;
  load_count: number;
  avg_rpm_7d: number | null;
  created_at: string;
}

export interface Driver {
  id: number;
  carrier_id: number | null;
  carrier_name: string | null;
  name: string;
  phone: string | null;
  truck_number: string | null;
  trailer_number: string | null;
  notes: string | null;
  load_count: number;
  avg_rpm_7d: number | null;
  created_at: string;
}

export interface Dispatcher {
  id: number;
  carrier_id: number | null;
  carrier_name: string | null;
  name: string;
  phone: string | null;
  extension: string | null;
  email: string | null;
  load_count: number;
  avg_rpm_7d: number | null;
  created_at: string;
}

export interface BrokerContact {
  id: number;
  broker_id: number;
  logistics_company_name: string | null;
  name: string;
  phone: string | null;
  extension: string | null;
  email: string | null;
  load_count: number;
  avg_rpm_7d: number | null;
  created_at: string;
}

// "Load" in the rate-confirmation tracking feature — wraps the `RateCon` DB model.
export interface RateCon {
  id: number;
  load_number: string | null;
  carrier_id: number | null;
  carrier_name: string | null;
  broker_id: number | null;
  logistics_company_name: string | null;
  driver_id: number | null;
  driver_name: string | null;
  dispatcher_id: number | null;
  dispatcher_name: string | null;
  broker_contact_id: number | null;
  broker_contact_name: string | null;
  truck_number: string | null;
  trailer_number: string | null;
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  commodity: string | null;
  weight_lbs: number | null;
  equipment_type: string | null;
  appointment_type: string | null;
  notes: string | null;
  rate: string | null;
  miles: number | null;
  rate_per_mile: string | null;
  source_filename: string | null;
  created_at: string;
}

export interface RateConFilters {
  logistics_company?: string;
  broker_contact?: string;
  dispatcher?: string;
  driver?: string;
  truck_number?: string;
  trailer_number?: string;
  carrier?: string;
  carrier_id?: number;
  broker_id?: number;
  driver_id?: number;
  dispatcher_id?: number;
  broker_contact_id?: number;
  date_from?: string;
  date_to?: string;
}
