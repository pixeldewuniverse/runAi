export type Category =
  | "marketing_campaign"
  | "social_media"
  | "email_sequence"
  | "seo_content"
  | "ad_copy"
  | "content_calendar";

export interface GenerateRequest {
  prompt: string;
  category: Category;
}

export interface GeneratedOutput {
  strategy: string;
  copy: string;
  calendar: string;
  ads: string;
  seo: string;
  social: string;
}
