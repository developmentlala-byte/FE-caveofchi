export type StudioStatus = "active" | "inactive" | "maintenance";

export interface Studio {
  id: number;
  name: string;
  slug: string;
  code: string;
  status: StudioStatus;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  cover_image_url: string | null;
  max_capacity: number;
  images_count: number;
  modtime: string | null;
}

export interface StudioImage {
  id: number;
  studio_id: number;
  image_path: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface StudioFormValues {
  name: string;
  status: StudioStatus;
  description: string;
  short_description: string;
  max_capacity: number;
  cover_image: File | null;
  gallery_images: File[];
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
