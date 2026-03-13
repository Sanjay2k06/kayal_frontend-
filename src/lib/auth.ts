export type AuthUser = {
  id: string;
  email: string;
  is_admin: boolean;
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  occupation?: string | null;
  income?: number | null;
  state?: string | null;
  district?: string | null;
  education_level?: string | null;
  social_category?: string | null;
  residence_type?: string | null;
  marital_status?: string | null;
  disability_status?: string | null;
  minority_status?: string | null;
};

const TOKEN_KEY = "civix_access_token";
const REFRESH_TOKEN_KEY = "civix_refresh_token";
const USER_KEY = "civix_user";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateSessionUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSessionUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function isProfileComplete(user: AuthUser | null): boolean {
  if (!user) return false;
  return Boolean(
    user.name &&
    user.age &&
    user.gender &&
    user.occupation &&
    user.income &&
    user.state &&
    user.district &&
    user.social_category
  );
}
