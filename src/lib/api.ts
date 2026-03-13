import type { Scheme } from "@/components/SchemeCard";
import { clearSession, getAccessToken, getRefreshToken, setSession, updateSessionUser } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const authHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function tryRefreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    clearSession();
    return false;
  }

  const data = await res.json();
  setSession(data.access_token, data.refresh_token, data.user);
  return true;
}

async function parseJsonResponse(res: Response): Promise<any> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }
  return data;
}

async function fetchWithAuthRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, init);
  if (response.status !== 401) return response;

  const refreshed = await tryRefreshSession();
  if (!refreshed) return response;

  const headers = new Headers(init?.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  response = await fetch(input, { ...init, headers });
  return response;
}

type BackendScheme = {
  id: string;
  scheme_name: string;
  description: string;
  eligibility: string;
  benefits: string;
  category: string;
  state: string;
  official_link: string;
  official_department: string;
  application_mode: string;
  guidance: string;
  helpline: string;
  required_documents: string[];
  score?: number;
  confidence_score?: number;
  why_matched?: string[];
  why_not_matched?: string[];
  source_name?: string;
  source_last_verified_at?: string;
  source_freshness_days?: number;
  source_freshness_status?: string;
  duplicate_of?: string;
  link_status?: string;
  approval_status?: string;
  deadline?: string;
};

const toUIScheme = (item: BackendScheme): Scheme => ({
  id: item.id,
  name: item.scheme_name,
  description: item.description,
  eligibility: item.eligibility,
  benefits: item.benefits,
  documents: item.required_documents || [],
  applyLink: item.official_link,
  matchScore: item.score !== undefined ? Math.round(item.score) : undefined,
  confidenceScore: item.confidence_score,
  whyMatched: item.why_matched || [],
  whyNotMatched: item.why_not_matched || [],
  sourceName: item.source_name,
  sourceLastVerifiedAt: item.source_last_verified_at,
  sourceFreshnessDays: item.source_freshness_days,
  sourceFreshnessStatus: item.source_freshness_status,
  duplicateOf: item.duplicate_of,
  linkStatus: item.link_status,
  approvalStatus: item.approval_status,
  deadline: item.deadline,
  category: item.category,
  state: item.state,
  officialDepartment: item.official_department,
  applicationMode: item.application_mode,
  guidance: item.guidance,
  helpline: item.helpline,
});

export async function chatQuery(query: string): Promise<{ response: string; recommended_schemes: Scheme[] }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ query }),
  });
  const data = await parseJsonResponse(res);
  return {
    response: data.response,
    recommended_schemes: (data.recommended_schemes || []).map(toUIScheme),
  };
}

export async function getSchemes(params: {
  page?: number;
  limit?: number;
  category?: string;
  state?: string;
  search?: string;
}): Promise<{ page: number; limit: number; total: number; items: Scheme[] }> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.category && params.category !== "All") searchParams.set("category", params.category);
  if (params.state && params.state !== "All") searchParams.set("state", params.state);
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`${API_BASE}/schemes?${searchParams.toString()}`);
  const data = await parseJsonResponse(res);

  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    items: (data.items || []).map(toUIScheme),
  };
}

export async function getSchemeById(id: string): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/schemes/${id}`);
  const data = await parseJsonResponse(res);
  return toUIScheme(data);
}

export async function checkEligibility(payload: {
  age: number;
  gender: string;
  occupation: string;
  income: number;
  state: string;
  district?: string;
  education_level?: string;
  social_category?: string;
  residence_type?: string;
  marital_status?: string;
  disability_status?: string;
  minority_status?: string;
}): Promise<Scheme[]> {
  const res = await fetch(`${API_BASE}/eligibility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res);
  return (data.eligible_schemes || []).map(toUIScheme);
}

export async function runHeroSimulation(payload: {
  profile: {
    age: number;
    gender: string;
    occupation: string;
    income: number;
    state: string;
    district?: string;
    education_level?: string;
    social_category?: string;
    residence_type?: string;
    marital_status?: string;
    disability_status?: string;
    minority_status?: string;
  };
  what_if: {
    age: number;
    gender: string;
    occupation: string;
    income: number;
    state: string;
    district?: string;
    education_level?: string;
    social_category?: string;
    residence_type?: string;
    marital_status?: string;
    disability_status?: string;
    minority_status?: string;
  };
}): Promise<{
  baseline_top_schemes: Scheme[];
  simulated_top_schemes: Array<{
    scheme: Scheme;
    base_score: number;
    simulated_score: number;
    score_delta: number;
    success_probability: number;
    missing_documents: string[];
    action_plan: string[];
  }>;
  summary: string;
}> {
  const res = await fetch(`${API_BASE}/eligibility/hero`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res);
  return {
    baseline_top_schemes: (data.baseline_top_schemes || []).map(toUIScheme),
    simulated_top_schemes: (data.simulated_top_schemes || []).map((item: any) => ({
      ...item,
      scheme: toUIScheme(item.scheme),
    })),
    summary: data.summary || "",
  };
}

export async function getWorkflowInsights(): Promise<{
  checklist: Array<{ id: string; label: string; done: boolean; scheme_id?: string }>;
  reminders: Array<{ scheme_id: string; scheme_name: string; deadline: string; days_left: number }>;
  missing_documents: string[];
}> {
  const res = await fetchWithAuthRetry(`${API_BASE}/workflow`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function toggleChecklistItem(itemId: string, done: boolean): Promise<void> {
  const res = await fetchWithAuthRetry(`${API_BASE}/workflow/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ item_id: itemId, done }),
  });
  await parseJsonResponse(res);
}

export async function submitVoiceQuery(audioBlob: Blob): Promise<{ query: string; response: string; recommended_schemes: Scheme[] }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice.webm");

  const res = await fetch(`${API_BASE}/voice-query`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  const data = await parseJsonResponse(res);
  return {
    query: data.query,
    response: data.response,
    recommended_schemes: (data.recommended_schemes || []).map(toUIScheme),
  };
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function loginUser(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function getMyProfile() {
  const res = await fetchWithAuthRetry(`${API_BASE}/me`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function updateMyProfile(payload: Record<string, unknown>) {
  const res = await fetchWithAuthRetry(`${API_BASE}/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res);
  updateSessionUser(data);
  return data;
}

export async function getBookmarks(): Promise<Scheme[]> {
  const res = await fetchWithAuthRetry(`${API_BASE}/bookmarks`, { headers: { ...authHeaders() } });
  const data = await parseJsonResponse(res);
  return (data.items || []).map(toUIScheme);
}

export async function addBookmark(schemeId: string): Promise<void> {
  const res = await fetchWithAuthRetry(`${API_BASE}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ scheme_id: schemeId }),
  });
  await parseJsonResponse(res);
}

export async function removeBookmark(schemeId: string): Promise<void> {
  const res = await fetchWithAuthRetry(`${API_BASE}/bookmarks/${schemeId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  await parseJsonResponse(res);
}

export async function getChatHistory(): Promise<Array<{ id: string; query: string; response: string; created_at: string }>> {
  const res = await fetchWithAuthRetry(`${API_BASE}/chat/history`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function getAdminStats() {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/stats`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function adminAddScheme(payload: {
  scheme_name: string;
  description: string;
  eligibility: string;
  benefits: string;
  category: string;
  state: string;
  official_link: string;
  official_department: string;
  application_mode: string;
  guidance: string;
  helpline: string;
  required_documents: string[];
}) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/add-scheme`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function adminUpdateScheme(schemeId: string, payload: Partial<{
  scheme_name: string;
  description: string;
  eligibility: string;
  benefits: string;
  category: string;
  state: string;
  official_link: string;
  official_department: string;
  application_mode: string;
  guidance: string;
  helpline: string;
  required_documents: string[];
}>) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/update-scheme/${schemeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function getPendingChanges() {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/pending-changes`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function previewSchemeDiff(schemeId: string, updates: Record<string, unknown>) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/preview-diff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ scheme_id: schemeId, updates }),
  });
  return parseJsonResponse(res);
}

export async function approveChange(changeId: string) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/approve-change/${changeId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return parseJsonResponse(res);
}

export async function rejectChange(changeId: string) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/reject-change/${changeId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return parseJsonResponse(res);
}

export async function rollbackScheme(schemeId: string) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/rollback/${schemeId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return parseJsonResponse(res);
}

export async function getDataTrustReport() {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/data-trust-report`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function runDataTrustScan() {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/scan-data-trust`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return parseJsonResponse(res);
}

export async function listAdminJobs() {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/jobs`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function getAdminWhatsAppStatus(): Promise<{
  status: string;
  webhook_path: string;
  twilio_configured: boolean;
  from_number?: string | null;
  default_to_number?: string | null;
  ngrok_running: boolean;
  ngrok_public_url?: string | null;
  webhook_url?: string | null;
  health_url?: string | null;
}> {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/whatsapp-status`, { headers: { ...authHeaders() } });
  return parseJsonResponse(res);
}

export async function adminDeleteScheme(schemeId: string) {
  const res = await fetchWithAuthRetry(`${API_BASE}/admin/delete-scheme/${schemeId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return parseJsonResponse(res);
}

export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken();
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok && res.status !== 401) {
    await parseJsonResponse(res);
  }
  clearSession();
}
