export type UserRole = 'driver' | 'host' | 'both' | 'admin';

export type ConnectorType = 'nacs' | 'ccs' | 'chademo' | 'j1772' | 'other';
export type ChargingLevel = 'level_1' | 'level_2' | 'dc_fast';
export type PricingType = 'free' | 'per_kwh' | 'per_session' | 'per_hour';
export type ApprovalMode = 'manual' | 'automatic';
export type ParkingType = 'driveway' | 'garage' | 'parking_lot' | 'street_adjacent' | 'other';
export type ChargerStatus = 'active' | 'paused' | 'pending_review';

export type AvailabilityState =
  | 'available'
  | 'request_required'
  | 'pending_approval'
  | 'reserved'
  | 'charging'
  | 'temporarily_unavailable'
  | 'offline'
  | 'unknown';

export type BookingStatus =
  | 'requested'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'arriving'
  | 'checked_in'
  | 'charging'
  | 'interrupted'
  | 'completed'
  | 'no_show';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  email_verified: boolean;
  expo_push_token: string | null;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number | null;
  connector_types: ConnectorType[];
  battery_capacity_kwh: number | null;
  nickname: string | null;
}

export interface MapCharger {
  id: string;
  host_id: string | null;
  name: string;
  public_lat: number;
  public_lng: number;
  connector_type: ConnectorType;
  level: ChargingLevel;
  max_kw: number;
  pricing_type: PricingType;
  price_per_kwh: number | null;
  price_per_session: number | null;
  price_per_hour: number | null;
  approval_mode: ApprovalMode;
  parking_type: ParkingType;
  parking_instructions: string | null;
  photos: string[];
  availability_state: AvailabilityState;
  rating: number | null;
  completed_sessions: number;
  neighborhood: string | null;
  host_display_name: string | null;
  host_avatar_url: string | null;
  distance_m: number;
  source: 'residential' | 'public';
}

export interface ChargerDetail extends MapCharger {
  description?: string | null;
  exact_address?: string;
  private_lat?: number;
  private_lng?: number;
  arrival_instructions?: string | null;
  access_instructions_private?: string | null;
  booking_id?: string;
  booking_status?: BookingStatus;
  host?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  charger_brand?: string | null;
  charger_model?: string | null;
}

export interface Booking {
  id: string;
  charger_id: string;
  driver_id: string;
  vehicle_id: string | null;
  requested_start: string;
  requested_end: string;
  approved_start: string | null;
  approved_end: string | null;
  status: BookingStatus;
  requested_kwh: number | null;
  start_soc: number | null;
  target_soc: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  driver_message: string | null;
  host_response: string | null;
  suggested_start: string | null;
  suggested_end: string | null;
  created_at: string;
  charger?: ChargerDetail;
}

export interface ChargingSession {
  id: string;
  booking_id: string;
  started_at: string | null;
  ended_at: string | null;
  start_soc: number | null;
  end_soc: number | null;
  energy_kwh: number | null;
  peak_kw: number | null;
  average_kw: number | null;
  status: 'active' | 'completed' | 'interrupted';
  telemetry_source: string;
}

export interface ActivityEvent {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface StationSearchParams {
  lng: number;
  lat: number;
  radiusM?: number;
  residentialOnly?: boolean;
  availableOnly?: boolean;
}

export interface Connector {
  type: ConnectorType;
  powerKw?: number;
  quantity?: number;
  status?: AvailabilityState;
}

export interface Station {
  id: string;
  source: string;
  sourceId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  operator?: string;
  connectors: Connector[];
  maxPowerKw?: number;
  access: string;
  availability: AvailabilityState;
  pricing?: { summary?: string };
  lastUpdatedAt?: string;
}

export interface PricingInput {
  pricingType: PricingType;
  pricePerKwh?: number | null;
  pricePerSession?: number | null;
  pricePerHour?: number | null;
  requestedKwh?: number;
  durationHours?: number;
  platformFeeRate?: number;
}

export interface PricingResult {
  subtotal: number;
  platformFee: number;
  total: number;
  hostAmount: number;
}

export type MapFilter =
  | 'any'
  | 'residential'
  | 'public'
  | 'fast'
  | 'available';

export interface MapFilters {
  category: MapFilter;
  connector?: ConnectorType;
  maxPrice?: number;
  parkingType?: ParkingType;
  instantApproval?: boolean;
}
