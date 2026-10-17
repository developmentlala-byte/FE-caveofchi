export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "expired"
  | "cancelled"
  | "payment_review";

export type BookingPaymentStatus = "pending" | "paid" | "failed" | "expired";
export type BookingPaymentMethod = "cash" | "midtrans";

export interface BookingEvent {
  id: number;
  name: string;
  code: string;
  status: string;
  cover_image_url: string | null;
}

export interface BookingStudio {
  id: number;
  name: string;
  code: string;
}

export interface BookingSession {
  id: number;
  event_id: number;
  studio_id: number;
  starts_at: string;
  ends_at: string;
  quota: number;
  reserved_count: number;
  available_slots: number;
  price: number;
  status: string;
  is_bookable: boolean;
  studio: BookingStudio;
}

export interface BookingPayment {
  id: number;
  provider: string;
  status: BookingPaymentStatus;
  provider_transaction_id?: string | null;
  provider_status?: string | null;
  provider_status_checked_at?: string | null;
  gross_amount?: number | null;
  currency?: string | null;
  redirect_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  payment_type?: string | null;
}

export interface EventBooking {
  id: number;
  booking_code: string;
  event_id: number;
  session_id: number;
  event_name_snapshot: string;
  session_studio_snapshot: string;
  session_starts_at_snapshot: string;
  session_ends_at_snapshot: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: BookingPaymentMethod;
  booking_status: BookingStatus;
  payment_status: BookingPaymentStatus;
  hold_expires_at: string | null;
  paid_at: string | null;
  cretime: string;
  event?: BookingEvent;
  session?: BookingSession;
  payments: BookingPayment[];
}

export interface BookingUpdateInput {
  session_id: number;
  customer_name: string;
  customer_phone: string;
  quantity: number;
  return_url: string;
  cancel_url: string;
}

export interface BookingPaginationMeta {
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
  meta: BookingPaginationMeta;
}
