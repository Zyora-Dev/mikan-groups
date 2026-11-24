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

export type ClientType =
  | "main_contractor" | "fabricator" | "epc"
  | "developer" | "consultancy" | "authority" | "other";

export type ContractingEntity = "singapore" | "ireland" | "india";
export type ClientStatus = "prospect" | "active" | "dormant" | "archived";

export interface ClientSummary {
  id: string;
  name: string;
  trading_name: string | null;
  slug: string;
  client_type: ClientType;
  country: string | null;
  contracting_entity: ContractingEntity;
  status: ClientStatus;
  sector: string | null;
  nda_signed: boolean;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

export interface ClientDetail extends ClientSummary {
  registration_no: string | null;
  tax_no: string | null;
  website: string | null;
  default_standard: string | null;
  city: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postcode: string | null;
  timezone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  account_manager_id: string | null;
  nda_signed_on: string | null;
  onboarded_on: string | null;
  notes: string | null;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  full_name: string;
  email: string;
  role: "client_admin" | "client";
  job_title: string | null;
  phone: string | null;
  is_active: boolean;
  must_change_password: boolean;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface NewClientUser {
  full_name: string;
  email: string;
  password: string;
  role: "client_admin" | "client";
  job_title?: string;
  phone?: string;
}

export interface NewClient {
  name: string;
  client_type: ClientType;
  country: string;
  contracting_entity: ContractingEntity;
  contact_email?: string;
  default_standard?: string;
}

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  main_contractor: "Main contractor",
  fabricator: "Fabricator",
  epc: "EPC contractor",
  developer: "Developer",
  consultancy: "Consultancy",
  authority: "Authority",
  other: "Other",
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  dormant: "Dormant",
  archived: "Archived",
};

export const ENTITY_LABELS: Record<ContractingEntity, string> = {
  singapore: "Singapore",
  ireland: "Ireland",
  india: "India",
};

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

  clients: {
    list: (params?: { search?: string; status?: ClientStatus }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.status) q.set("status", params.status);
      const qs = q.toString();
      return request<ClientSummary[]>(`/clients${qs ? `?${qs}` : ""}`);
    },

    create: (body: NewClient) =>
      request<ClientSummary>("/clients", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    get: (id: string) => request<ClientDetail>(`/clients/${id}`),

    update: (id: string, body: Record<string, unknown>) =>
      request<ClientDetail>(`/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    remove: (id: string) =>
      request<void>(`/clients/${id}`, { method: "DELETE" }),

    users: {
      list: (clientId: string) =>
        request<ClientUser[]>(`/clients/${clientId}/users`),

      create: (clientId: string, body: NewClientUser) =>
        request<ClientUser>(`/clients/${clientId}/users`, {
          method: "POST",
          body: JSON.stringify(body),
        }),

      update: (
        clientId: string,
        userId: string,
        body: Partial<{ is_active: boolean; role: "client_admin" | "client"; full_name: string; job_title: string }>,
      ) =>
        request<ClientUser>(`/clients/${clientId}/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),

      resetPassword: (clientId: string, userId: string, new_password: string) =>
        request<void>(`/clients/${clientId}/users/${userId}/password`, {
          method: "POST",
          body: JSON.stringify({ new_password }),
        }),

      remove: (clientId: string, userId: string) =>
        request<void>(`/clients/${clientId}/users/${userId}`, { method: "DELETE" }),
    },
  },
};
