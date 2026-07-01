export interface CustomerCredits {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
}

export interface Customer {
  id: string;
  access_code: string;
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  company: string | null;
  city: string | null;
  notes: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  last_active_at: string | null;
  session_count: number;
  credits: CustomerCredits;
}

export interface CreditHistoryEntry {
  id: string;
  amount: number;
  note: string | null;
  granted_by: string | null;
  created_at: string;
}

export interface VisualizationHistoryEntry {
  id: string;
  fabric_name: string;
  fabric_category: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface ActivitySummary {
  areas_selected: number;
  fabrics_selected: number;
  visualizations_generated: number;
  images_uploaded: number;
  images_downloaded: number;
}

export interface DuplicateGroup {
  group_id: string;
  customers: Customer[];
}

export interface CustomerStats {
  customer: Pick<Customer, 'id' | 'access_code' | 'full_name' | 'company' | 'city'>;
  credits: CustomerCredits;
  credit_history: CreditHistoryEntry[];
  visualization_history: VisualizationHistoryEntry[];
  activity_summary: ActivitySummary;
}
