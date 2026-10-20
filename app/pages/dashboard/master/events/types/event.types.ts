export type EventStatus = "draft" | "published" | "closed" | "archived";
export type EventCategory = "creative" | "wellness" | "social";
export type EventSessionStatus =
  | "draft"
  | "open"
  | "closed"
  | "cancelled"
  | "completed";

export interface Event {
  id: number;
  name: string;
  slug: string;
  code: string;
  category: EventCategory;
  status: EventStatus;
  short_description: string | null;
  description: string | null;
  terms: string | null;
  cover_image: string | null;
  cover_image_url: string | null;
  sessions_count: number;
  open_sessions_count: number;
}

export interface EventSession {
  id: number;
  event_id: number;
  studio_id: number;
  starts_at: string;
  ends_at: string;
  quota: number;
  reserved_count: number;
  available_slots: number;
  price: number;
  status: EventSessionStatus;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  notes: string | null;
  is_bookable: boolean;
  studio: Studio;
}

export interface EventImage {
  id: number;
  event_id: number;
  image_path: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Studio {
  id: number;
  name: string;
  code: string;
  status: "active" | "inactive" | "maintenance";
  cover_image_url: string | null;
  max_capacity: number;
}

export interface EventFormValues {
  name: string;
  category: EventCategory;
  short_description: string;
  description: string;
  terms: string;
  cover_image: File | null;
  first_session: EventSessionFormValues | null;
}

export interface EventSessionFormValues {
  studio_id: number | null;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string;
  registration_closes_at: string;
  quota: number;
  price: number;
  notes: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta: PaginationMeta;
}
