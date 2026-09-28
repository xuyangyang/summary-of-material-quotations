const BASE = import.meta.env.VITE_API_BASE ?? "/api";

export interface Batch {
  id: number;
  file_name: string;
  file_hash: string;
  imported_at: string;
  source_rows: number;
  valid_rows: number;
  unclassified_rows: number;
  status: string;
}

export interface MaterialGroup {
  id: number;
  batch_id: number;
  group_no: number;
  material_name: string;
  spec: string;
  spec_key: string;
  categories: string;
  units: string;
  record_count: number;
  total_quantity: number;
  total_amount: number;
}

export interface MaterialRecord {
  id: number;
  batch_id: number;
  row_number: number;
  project: string;
  supplier: string;
  purchase_type: string;
  purchase_date: string;
  raw_material: string;
  raw_spec: string;
  category: string;
  unit: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number | null;
  material_name: string;
  spec: string;
  spec_key: string;
  group_id: number | null;
  issue_reason: string;
}

export interface PriceHistoryItem {
  purchase_date: string;
  supplier: string;
  project: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number | null;
}

export interface SupplierSummary {
  id: number;
  group_id: number;
  supplier: string;
  record_count: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  weighted_avg_price: number | null;
  latest_price: number | null;
  latest_date: string;
}

export interface SearchParams {
  project?: string;
  supplier?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  spec?: string;
  material_name?: string;
  match_mode?: "exact" | "fuzzy" | "ai";
}

export interface SearchResponse {
  records: MaterialRecord[];
  ai_matches: Array<{ name: string; score: number }>;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // keep fallback detail
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export function getBatches(): Promise<Batch[]> {
  return request<Batch[]>(`${BASE}/batches`);
}

export function uploadBatch(file: File): Promise<{ id: number }> {
  const form = new FormData();
  form.append("file", file);
  return request<{ id: number }>(`${BASE}/batches`, {
    method: "POST",
    body: form,
  });
}

export function deleteBatch(batchId: number): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`${BASE}/batches/${batchId}`, {
    method: "DELETE",
  });
}

export function getGroups(batchId: number): Promise<MaterialGroup[]> {
  return request<MaterialGroup[]>(`${BASE}/batches/${batchId}/groups`);
}

export function getGroupRecords(batchId: number, groupId: number): Promise<MaterialRecord[]> {
  return request<MaterialRecord[]>(`${BASE}/batches/${batchId}/groups/${groupId}/records`);
}

export function search(batchId: number, params: SearchParams): Promise<SearchResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return request<SearchResponse>(`${BASE}/batches/${batchId}/search?${query.toString()}`);
}

export function getPriceHistory(batchId: number, groupId: number): Promise<PriceHistoryItem[]> {
  return request<PriceHistoryItem[]>(`${BASE}/batches/${batchId}/groups/${groupId}/price-history`);
}

export function getSupplierSummary(batchId: number, groupId: number): Promise<SupplierSummary[]> {
  return request<SupplierSummary[]>(`${BASE}/batches/${batchId}/groups/${groupId}/suppliers`);
}

export function exportUrl(batchId: number, type: "materials" | "prices" | "suppliers"): string {
  return `${BASE}/batches/${batchId}/export/${type}`;
}
