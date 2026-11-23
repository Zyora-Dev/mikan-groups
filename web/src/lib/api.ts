/** Base URL of the FastAPI service. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

export type UserRole = "admin" | "engineer" | "client_admin" | "client";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  job_title: string | null;
  role: UserRole;
  organisation_id: string;
  must_change_password: boolean;
  last_login_at: string | null;
}

export interface SessionOrg {
  id: string;
  name: string;
  slug: string;
  is_internal: boolean;
}

export interface Session {
  user: SessionUser;
  organisation: SessionOrg;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include", // auth cookies are httpOnly
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  job_title: string | null;
  phone: string | null;
  is_active: boolean;
  must_change_password: boolean;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface NewTeamMember {
  full_name: string;
  email: string;
  password: string;
  role: "admin" | "engineer";
  job_title?: string;
}

export const api = {
  /** `internal` restricts the attempt to Mikan staff accounts. */
  login: (email: string, password: string, internal = false) =>
    request<Session>(`/auth/login${internal ? "?internal=true" : ""}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<Session>("/auth/me"),

  changePassword: (current_password: string, new_password: string) =>
    request<void>("/auth/password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),

  team: {
    list: () => request<TeamMember[]>("/team/members"),

    create: (body: NewTeamMember) =>
      request<TeamMember>("/team/members", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (
      id: string,
      body: Partial<{ role: "admin" | "engineer"; is_active: boolean; full_name: string; job_title: string }>,
    ) =>
      request<TeamMember>(`/team/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    resetPassword: (id: string, new_password: string) =>
      request<void>(`/team/members/${id}/password`, {
        method: "POST",
        body: JSON.stringify({ new_password }),
      }),

    unlock: (id: string) =>
      request<void>(`/team/members/${id}/unlock`, { method: "POST" }),
  },
};
