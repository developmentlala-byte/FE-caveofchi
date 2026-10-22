export interface DashboardOption {
  id: number;
  name: string;
}

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  format: "number" | "percent" | "rupiah";
  note: string;
  higherIsBetter?: boolean;
}

export interface DashboardData {
  filters: {
    studios: DashboardOption[];
    events: DashboardOption[];
  };
  kpis: DashboardKpi[];
  trend: {
    daily: number[];
    peak: { label: string; value: number };
    weeks: { label: string; bookings: number; revenue: number }[];
    stats: { label: string; value: number; unit: string }[];
    insight: string;
  };
  attention: {
    id: string;
    level: "urgent" | "action" | "info";
    title: string;
    detail: string;
  }[];
  event_performance: {
    id: number;
    name: string;
    sessions: number;
    bookings: number;
    capacity: number;
    revenue: number;
  }[];
  upcoming: {
    sessions: {
      id: number;
      when: string;
      event: string;
      studio: string;
      filled: number;
      quota: number;
    }[];
    moreCount: number;
    moreHref: string;
  };
  studio_utilization: {
    studios: {
      id: number;
      name: string;
      capacity: number;
      active: boolean;
      scheduledSessions: number;
      revenue: number;
    }[];
  };
  heatmap: {
    periods: { label: string; hours: string }[];
    days: { day: string; sessions: number[] }[];
    insight: string;
  };
  participants: {
    uniqueCount: number;
    singleBookingCount: number;
    returningCount: number;
    avgBookingsPerParticipant: number;
  };
  finance: {
    realized: { amount: number; bookings: number };
    pending: { amount: number; bookings: number };
    refund: { amount: number | null; bookings: number };
    statuses: { key: "paid" | "pending" | "cancelled" | "expired" | "review"; count: number }[];
    methods: { label: string; amount: number }[];
  };
}

export interface DashboardApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}
