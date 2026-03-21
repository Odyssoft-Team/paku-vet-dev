// ── Tipos ────────────────────────────────────────────────────────────────────

export interface AllyLocationPoint {
  lat: number;
  lng: number;
  accuracy_m: number | null;
  recorded_at: string | null;
}

export interface TrackingCurrent {
  order_id: string;
  order_status: string;
  ally_location: AllyLocationPoint | null;
  destination: AllyLocationPoint | null;
  staleness_seconds: number;
}

export interface TrackingRoute {
  order_id: string;
  ally_location: AllyLocationPoint | null;
  destination: AllyLocationPoint | null;
  eta_seconds: number | null;
  eta_display: string | null;
  polyline: string | null;
  distance_meters: number | null;
}
