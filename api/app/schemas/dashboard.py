from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectStatus
from app.models.task import ClientVerdict, TaskPriority, TaskStatus


class StatBlock(BaseModel):
    clients_active: int = 0
    clients_total: int = 0
    projects_active: int = 0
    projects_total: int = 0
    tasks_open: int = 0
    tasks_overdue: int = 0
    awaiting_client: int = 0
    due_this_week: int = 0
    team_size: int = 0
    portal_users: int = 0


class TaskRow(BaseModel):
    """A task flattened with the names a dashboard needs."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    status: TaskStatus
    verdict: ClientVerdict
    priority: TaskPriority
    progress: int
    due_date: date | None
    project_id: UUID
    project_title: str = ""
    job_number: str = ""
    client_id: UUID
    client_name: str = ""
    raised_by_client: bool = False


class ProjectRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_number: str
    title: str
    status: ProjectStatus
    target_date: date | None
    client_id: UUID
    client_name: str = ""
    task_count: int = 0
    done_count: int = 0
    progress: int = 0
    overdue_count: int = 0


class ActivityRow(BaseModel):
    kind: str          # comment | verdict | attachment
    task_id: UUID
    task_title: str
    client_name: str
    actor: str
    from_client: bool
    summary: str
    at: datetime


class TrendPoint(BaseModel):
    """One week of throughput."""

    label: str          # "W/C 17 Nov"
    created: int = 0
    completed: int = 0


class Slice(BaseModel):
    key: str
    label: str
    value: int


class DeadlineBand(BaseModel):
    overdue: int = 0
    today: int = 0
    this_week: int = 0
    later: int = 0
    none_set: int = 0


class DashboardOut(BaseModel):
    role: str
    stats: StatBlock
    my_tasks: list[TaskRow] = []        # assigned to me
    checking: list[TaskRow] = []        # I am the checker
    overdue: list[TaskRow] = []
    awaiting_client: list[TaskRow] = []
    client_requests: list[TaskRow] = [] # raised by clients, not yet accepted
    projects: list[ProjectRow] = []
    activity: list[ActivityRow] = []

    # charts
    trend: list[TrendPoint] = []
    status_mix: list[Slice] = []
    deadlines: DeadlineBand = DeadlineBand()
    has_history: bool = False


# --------------------------------------------------------------- client side


class PortalStats(BaseModel):
    """Counts a client cares about — their own work only."""

    projects_active: int = 0
    projects_total: int = 0
    tasks_open: int = 0
    tasks_done: int = 0
    awaiting_you: int = 0        # submitted, waiting on the client's verdict
    changes_requested: int = 0
    requests_pending: int = 0    # raised by the client, not yet accepted
    overdue: int = 0
    due_this_week: int = 0
    files_shared: int = 0


class PortalFile(BaseModel):
    """A deliverable surfaced on its own, outside the task it hangs off."""

    id: UUID
    label: str
    filename: str | None = None
    url: str | None = None
    has_file: bool = False
    kind: str
    revision: str | None = None
    size_bytes: int | None = None
    from_client: bool = False
    task_id: UUID
    task_title: str = ""
    project_id: UUID
    project_title: str = ""
    job_number: str = ""
    created_at: datetime


class PortalOut(BaseModel):
    organisation: str
    user_name: str
    role: str
    stats: PortalStats
    awaiting_you: list[TaskRow] = []     # needs the client's decision
    in_progress: list[TaskRow] = []      # Mikan is working on these
    changes_requested: list[TaskRow] = []
    my_requests: list[TaskRow] = []      # raised by this client
    projects: list[ProjectRow] = []
    recent_files: list[PortalFile] = []
    activity: list[ActivityRow] = []
    trend: list[TrendPoint] = []
    status_mix: list[Slice] = []
    deadlines: DeadlineBand = DeadlineBand()
    has_history: bool = False
