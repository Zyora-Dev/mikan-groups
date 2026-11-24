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

export interface MemberWorkload {
  projects_led: number;
  tasks_assigned: number;
  tasks_checking: number;
  tasks_overdue: number;
  clients: string[];
}

export interface MemberDetail extends TeamMember {
  workload: MemberWorkload;
}

export interface Assignable {
  id: string;
  full_name: string;
  role: UserRole;
  job_title: string | null;
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

// ---------------------------------------------------------------- projects

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type TaskStatus = "requested" | "todo" | "in_progress" | "in_review" | "submitted" | "done";
export type ClientVerdict = "none" | "awaiting" | "approved" | "changes_requested";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type AttachmentKind = "drawing" | "model" | "markup" | "reference" | "other";

export interface Project {
  id: string;
  organisation_id: string;
  job_number: string;
  title: string;
  description: string | null;
  discipline: string | null;
  standard: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_on: string | null;
  lead_engineer_id: string | null;
  lead_engineer_name: string | null;
  member_count: number;
  member_names: string[];
  status: ProjectStatus;
  created_at: string;
  task_count: number;
  done_count: number;
  progress: number;
  overdue_count: number;
  awaiting_client: number;
}

export type ProjectRole =
  | "lead" | "engineer" | "detailer" | "checker" | "coordinator" | "support";

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  lead: "Lead",
  engineer: "Engineer",
  detailer: "Detailer",
  checker: "Checker",
  coordinator: "Coordinator",
  support: "Support",
};

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  full_name: string;
  job_title: string | null;
  account_role: UserRole;
  role: ProjectRole;
  note: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  verdict: ClientVerdict;
  priority: TaskPriority;
  progress: number;
  due_date: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  checker_id: string | null;
  checker_name: string | null;
  raised_by_client: boolean;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  comment_count: number;
  attachment_count: number;
}

export interface Attachment {
  id: string;
  task_id: string;
  label: string;
  url: string | null;
  stored_path: string | null;
  filename: string | null;
  size_bytes: number | null;
  content_type: string | null;
  kind: AttachmentKind;
  revision: string | null;
  note: string | null;
  uploaded_by_id: string | null;
  from_client: boolean;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  body: string;
  author_id: string;
  author_name: string;
  from_client: boolean;
  is_verdict_note: boolean;
  created_at: string;
  edited_at: string | null;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  requested: "Requested",
  todo: "To do",
  in_progress: "In progress",
  in_review: "In check",
  submitted: "Submitted",
  done: "Done",
};

export const VERDICT_LABELS: Record<ClientVerdict, string> = {
  none: "—",
  awaiting: "Awaiting client",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const ATTACHMENT_KIND_LABELS: Record<AttachmentKind, string> = {
  drawing: "Drawing",
  model: "Model",
  markup: "Markup",
  reference: "Reference",
  other: "Other",
};

export interface DashboardStats {
  clients_active: number; clients_total: number;
  projects_active: number; projects_total: number;
  tasks_open: number; tasks_overdue: number;
  awaiting_client: number; due_this_week: number;
  team_size: number; portal_users: number;
}

export interface DashTask {
  id: string; title: string;
  status: TaskStatus; verdict: ClientVerdict; priority: TaskPriority;
  progress: number; due_date: string | null;
  project_id: string; project_title: string; job_number: string;
  client_id: string; client_name: string;
  raised_by_client: boolean;
}

export interface DashProject {
  id: string; job_number: string; title: string;
  status: ProjectStatus; target_date: string | null;
  client_id: string; client_name: string;
  task_count: number; done_count: number; progress: number; overdue_count: number;
}

export interface Activity {
  kind: "comment" | "verdict" | "attachment";
  task_id: string; task_title: string; client_name: string;
  actor: string; from_client: boolean; summary: string; at: string;
}

export interface TrendPoint { label: string; created: number; completed: number }
export interface Slice { key: string; label: string; value: number }
export interface DeadlineBand {
  overdue: number; today: number; this_week: number; later: number; none_set: number;
}

export interface Dashboard {
  role: UserRole;
  stats: DashboardStats;
  my_tasks: DashTask[];
  checking: DashTask[];
  overdue: DashTask[];
  awaiting_client: DashTask[];
  client_requests: DashTask[];
  projects: DashProject[];
  activity: Activity[];
  trend: TrendPoint[];
  status_mix: Slice[];
  deadlines: DeadlineBand;
  has_history: boolean;
}

// ------------------------------------------------------------ client portal

export interface PortalStats {
  projects_active: number; projects_total: number;
  tasks_open: number; tasks_done: number;
  awaiting_you: number; changes_requested: number;
  requests_pending: number; overdue: number;
  due_this_week: number; files_shared: number;
}

export interface PortalFile {
  id: string;
  label: string;
  filename: string | null;
  url: string | null;
  has_file: boolean;
  kind: AttachmentKind;
  revision: string | null;
  size_bytes: number | null;
  from_client: boolean;
  task_id: string;
  task_title: string;
  project_id: string;
  project_title: string;
  job_number: string;
  created_at: string;
}

export interface PortalDashboard {
  organisation: string;
  user_name: string;
  role: UserRole;
  stats: PortalStats;
  awaiting_you: DashTask[];
  in_progress: DashTask[];
  changes_requested: DashTask[];
  my_requests: DashTask[];
  projects: DashProject[];
  recent_files: PortalFile[];
  activity: Activity[];
  trend: TrendPoint[];
  status_mix: Slice[];
  deadlines: DeadlineBand;
  has_history: boolean;
}

// ------------------------------------------------- notifications & audit

export interface EmailSettings {
  provider: string;
  enabled: boolean;
  api_url: string;
  api_key_set: boolean;
  from_email: string | null;
  from_name: string;
  reply_to: string | null;
  notify_on_submit: boolean;
  notify_on_verdict: boolean;
  notify_on_comment: boolean;
  notify_on_assignment: boolean;
  notify_on_task_created: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_error: string | null;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  entity_type: string;
  entity_id: string | null;
  project_id: string | null;
  link: string | null;
  read_at: string | null;
  emailed_at: string | null;
  created_at: string;
}

export type AuditAction =
  | "created" | "updated" | "deleted" | "status_changed" | "submitted"
  | "approved" | "changes_requested" | "assigned" | "member_added"
  | "member_removed" | "file_added" | "file_removed" | "commented"
  | "signed_in" | "access_granted" | "access_revoked" | "password_reset";

export interface AuditEntry {
  id: string;
  actor_name: string;
  actor_is_client: boolean;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  entity_label: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  detail: string | null;
  organisation_id: string | null;
  client_name: string | null;
  project_id: string | null;
  created_at: string;
}

export const AUDIT_LABELS: Record<AuditAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  status_changed: "Status changed",
  submitted: "Submitted",
  approved: "Approved",
  changes_requested: "Changes requested",
  assigned: "Assigned",
  member_added: "Member added",
  member_removed: "Member removed",
  file_added: "File added",
  file_removed: "File removed",
  commented: "Commented",
  signed_in: "Signed in",
  access_granted: "Access granted",
  access_revoked: "Access revoked",
  password_reset: "Password reset",
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

  dashboard: () => request<Dashboard>("/dashboard"),

  portal: {
    dashboard: () => request<PortalDashboard>("/portal/dashboard"),
    files: (projectId?: string) =>
      request<PortalFile[]>(
        `/portal/files${projectId ? `?project_id=${projectId}` : ""}`,
      ),
  },

  notifications: {
    list: (unreadOnly = false) =>
      request<AppNotification[]>(`/notifications${unreadOnly ? "?unread_only=true" : ""}`),
    count: () => request<{ unread: number }>("/notifications/count"),
    markRead: (id: string) =>
      request<void>(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () =>
      request<void>("/notifications/read-all", { method: "POST" }),
  },

  audit: (params?: { client_id?: string; project_id?: string; entity_id?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.client_id) q.set("client_id", params.client_id);
    if (params?.project_id) q.set("project_id", params.project_id);
    if (params?.entity_id) q.set("entity_id", params.entity_id);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<AuditEntry[]>(`/audit${qs ? `?${qs}` : ""}`);
  },

  emailSettings: {
    get: () => request<EmailSettings>("/settings/email"),
    update: (body: Record<string, unknown>) =>
      request<EmailSettings>("/settings/email", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    test: (to_email: string) =>
      request<EmailSettings>("/settings/email/test", {
        method: "POST",
        body: JSON.stringify({ to_email }),
      }),
  },

  changePassword: (current_password: string, new_password: string) =>
    request<void>("/auth/password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),

  team: {
    list: () => request<TeamMember[]>("/team/members"),

    /** Staff who can own or check work. Readable by any internal user. */
    assignable: () => request<Assignable[]>("/team/members/assignable"),

    get: (id: string) => request<MemberDetail>(`/team/members/${id}`),

    remove: (id: string) =>
      request<void>(`/team/members/${id}`, { method: "DELETE" }),

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

  projects: {
    list: (params?: { client_id?: string; status?: ProjectStatus }) => {
      const q = new URLSearchParams();
      if (params?.client_id) q.set("client_id", params.client_id);
      if (params?.status) q.set("status", params.status);
      const qs = q.toString();
      return request<Project[]>(`/projects${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) => request<Project>(`/projects/${id}`),

    create: (clientId: string, body: Record<string, unknown>) =>
      request<Project>(`/clients/${clientId}/projects`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: string, body: Record<string, unknown>) =>
      request<Project>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    remove: (id: string) => request<void>(`/projects/${id}`, { method: "DELETE" }),

    members: {
      list: (projectId: string) =>
        request<ProjectMember[]>(`/projects/${projectId}/members`),

      add: (projectId: string, user_id: string, role: ProjectRole, note?: string) =>
        request<ProjectMember>(`/projects/${projectId}/members`, {
          method: "POST",
          body: JSON.stringify({ user_id, role, note }),
        }),

      remove: (projectId: string, memberId: string) =>
        request<void>(`/projects/${projectId}/members/${memberId}`, {
          method: "DELETE",
        }),
    },
  },

  tasks: {
    list: (projectId: string) => request<Task[]>(`/projects/${projectId}/tasks`),

    create: (projectId: string, body: Record<string, unknown>) =>
      request<Task>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: string, body: Record<string, unknown>) =>
      request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    setVerdict: (id: string, verdict: ClientVerdict, note?: string) =>
      request<Task>(`/tasks/${id}/verdict`, {
        method: "POST",
        body: JSON.stringify({ verdict, note }),
      }),

    remove: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),

    attachments: {
      list: (taskId: string) => request<Attachment[]>(`/tasks/${taskId}/attachments`),
      add: (taskId: string, body: Record<string, unknown>) =>
        request<Attachment>(`/tasks/${taskId}/attachments`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      /** Multipart upload — bypasses the JSON request helper. */
      upload: async (taskId: string, form: FormData) => {
        const res = await fetch(`${API_BASE}/tasks/${taskId}/files`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) {
          let detail = "Upload failed.";
          try {
            const body = await res.json();
            if (typeof body.detail === "string") detail = body.detail;
          } catch { /* non-JSON */ }
          throw new ApiError(detail, res.status);
        }
        return (await res.json()) as Attachment;
      },

      downloadUrl: (id: string) => `${API_BASE}/attachments/${id}/download`,

      remove: (id: string) =>
        request<void>(`/attachments/${id}`, { method: "DELETE" }),
    },

    comments: {
      list: (taskId: string) => request<TaskComment[]>(`/tasks/${taskId}/comments`),
      add: (taskId: string, body: string) =>
        request<TaskComment>(`/tasks/${taskId}/comments`, {
          method: "POST",
          body: JSON.stringify({ body }),
        }),
    },
  },
};
