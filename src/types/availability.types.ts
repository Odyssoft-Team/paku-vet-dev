export interface DayAvailability {
  date: string;
  capacity: number;
  available: number;
}

export interface GetAvailabilityParams {
  service_id: string;
  date_from?: string;
  days?: number;
}
