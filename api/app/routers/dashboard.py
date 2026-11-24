"""Internal dashboard.

Admins see the whole practice; engineers see the work that is theirs.
Both views are built from the same query set, filtered by role.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import InternalUser
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.organisation import ClientStatus, Organisation
from app.models.project import Project, ProjectStatus
from app.models.task import ClientVerdict, Task, TaskStatus
from app.models.user import INTERNAL_ROLES, User, UserRole
from app.schemas.dashboard import (
    ActivityRow,
    DashboardOut,
    DeadlineBand,
    ProjectRow,
    Slice,
    StatBlock,
    TaskRow,
    TrendPoint,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

OPEN_STATUSES = {
    TaskStatus.REQUESTED, TaskStatus.TODO,
    TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.SUBMITTED,
}


def _row(task: Task, projects: dict[UUID, Project], clients: dict[UUID, str]) -> TaskRow:
    project = projects.get(task.project_id)
    return TaskRow(
        id=task.id,
        title=task.title,
        status=task.status,
        verdict=task.verdict,
        priority=task.priority,
        progress=task.progress,
        due_date=task.due_date,
        project_id=task.project_id,
        project_title=project.title if project else "",
        job_number=project.job_number if project else "",
        client_id=task.organisation_id,
        client_name=clients.get(task.organisation_id, ""),
        raised_by_client=task.raised_by_client,
    )


@router.get("", response_model=DashboardOut)
def get_dashboard(
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> DashboardOut:
    is_admin = user.role is UserRole.ADMIN
    today = date.today()
    week_out = today + timedelta(days=7)

    clients = {
        o.id: o.name
        for o in session.exec(
            select(Organisation).where(Organisation.is_internal == False)  # noqa: E712
        ).all()
    }
    projects = {p.id: p for p in session.exec(select(Project)).all()}
    tasks = list(session.exec(select(Task)).all())

    # ---- stats ----
    client_rows = session.exec(
        select(Organisation).where(Organisation.is_internal == False)  # noqa: E712
    ).all()
    open_tasks = [t for t in tasks if t.status in OPEN_STATUSES]
    overdue = [t for t in open_tasks if t.due_date and t.due_date < today]
    awaiting = [t for t in tasks if t.verdict is ClientVerdict.AWAITING]

    stats = StatBlock(
        clients_active=sum(1 for c in client_rows if c.status is ClientStatus.ACTIVE),
        clients_total=len(client_rows),
        projects_active=sum(1 for p in projects.values() if p.status is ProjectStatus.ACTIVE),
        projects_total=len(projects),
        tasks_open=len(open_tasks),
        tasks_overdue=len(overdue),
        awaiting_client=len(awaiting),
        due_this_week=sum(
            1 for t in open_tasks if t.due_date and today <= t.due_date <= week_out
        ),
        team_size=sum(
            1 for u in session.exec(select(User)).all()
            if u.role in INTERNAL_ROLES and u.is_active
        ),
        portal_users=sum(
            1 for u in session.exec(select(User)).all() if u.role not in INTERNAL_ROLES
        ),
    )

    def rows(items: list[Task], limit: int = 8) -> list[TaskRow]:
        ordered = sorted(items, key=lambda t: (t.due_date or date.max, t.created_at))
        return [_row(t, projects, clients) for t in ordered[:limit]]

    # ---- personal lists ----
    mine = [t for t in open_tasks if t.assignee_id == user.id]
    checking = [
        t for t in tasks
        if t.checker_id == user.id and t.status is TaskStatus.IN_REVIEW
    ]

    # Engineers see only their own work; admins see everything.
    if is_admin:
        overdue_list, awaiting_list = overdue, awaiting
        requests = [t for t in tasks if t.status is TaskStatus.REQUESTED]
        visible_projects = list(projects.values())
    else:
        own_projects = {
            p.id for p in projects.values() if p.lead_engineer_id == user.id
        }
        own_task_projects = {t.project_id for t in mine} | {t.project_id for t in checking}
        scope = own_projects | own_task_projects
        overdue_list = [t for t in overdue if t.project_id in scope]
        awaiting_list = [t for t in awaiting if t.project_id in scope]
        requests = [
            t for t in tasks
            if t.status is TaskStatus.REQUESTED and t.project_id in scope
        ]
        visible_projects = [p for p in projects.values() if p.id in scope]

    project_rows: list[ProjectRow] = []
    for p in sorted(visible_projects, key=lambda x: (x.target_date or date.max)):
        pt = [t for t in tasks if t.project_id == p.id]
        done = sum(1 for t in pt if t.status is TaskStatus.DONE)
        project_rows.append(ProjectRow(
            id=p.id,
            job_number=p.job_number,
            title=p.title,
            status=p.status,
            target_date=p.target_date,
            client_id=p.organisation_id,
            client_name=clients.get(p.organisation_id, ""),
            task_count=len(pt),
            done_count=done,
            progress=round(sum(t.progress for t in pt) / len(pt)) if pt else 0,
            overdue_count=sum(
                1 for t in pt
                if t.due_date and t.due_date < today and t.status is not TaskStatus.DONE
            ),
        ))

    # ---- recent activity ----
    task_by_id = {t.id: t for t in tasks}
    scope_ids = (
        set(task_by_id)
        if is_admin
        else {t.id for t in tasks if t.project_id in {p.id for p in visible_projects}}
    )

    activity: list[ActivityRow] = []
    authors = {u.id: u.full_name for u in session.exec(select(User)).all()}

    for c in session.exec(
        select(Comment).order_by(Comment.created_at.desc()).limit(25)  # type: ignore[attr-defined]
    ).all():
        if c.task_id not in scope_ids:
            continue
        t = task_by_id[c.task_id]
        activity.append(ActivityRow(
            kind="verdict" if c.is_verdict_note else "comment",
            task_id=t.id,
            task_title=t.title,
            client_name=clients.get(t.organisation_id, ""),
            actor=authors.get(c.author_id, "Unknown"),
            from_client=c.from_client,
            summary=c.body[:140],
            at=c.created_at,
        ))

    for a in session.exec(
        select(Attachment).order_by(Attachment.created_at.desc()).limit(15)  # type: ignore[attr-defined]
    ).all():
        if a.task_id not in scope_ids:
            continue
        t = task_by_id[a.task_id]
        activity.append(ActivityRow(
            kind="attachment",
            task_id=t.id,
            task_title=t.title,
            client_name=clients.get(t.organisation_id, ""),
            actor=authors.get(a.uploaded_by_id, "Unknown") if a.uploaded_by_id else "Unknown",
            from_client=a.from_client,
            summary=a.label,
            at=a.created_at,
        ))

    activity.sort(key=lambda x: x.at, reverse=True)

    # ---- charts ----
    scoped_tasks = (
        tasks if is_admin
        else [t for t in tasks if t.project_id in {p.id for p in visible_projects}]
    )

    # Eight weeks of created vs completed.
    monday = today - timedelta(days=today.weekday())
    trend: list[TrendPoint] = []
    for back in range(7, -1, -1):
        start = monday - timedelta(weeks=back)
        end = start + timedelta(days=7)
        trend.append(TrendPoint(
            label=start.strftime("%-d %b"),
            created=sum(
                1 for t in scoped_tasks if start <= t.created_at.date() < end
            ),
            completed=sum(
                1 for t in scoped_tasks
                if t.completed_at and start <= t.completed_at.date() < end
            ),
        ))

    status_mix = [
        Slice(key=st.value, label=st.value.replace("_", " ").title(),
              value=sum(1 for t in scoped_tasks if t.status is st))
        for st in TaskStatus
    ]

    scoped_open = [t for t in scoped_tasks if t.status in OPEN_STATUSES]
    deadlines = DeadlineBand(
        overdue=sum(1 for t in scoped_open if t.due_date and t.due_date < today),
        today=sum(1 for t in scoped_open if t.due_date == today),
        this_week=sum(
            1 for t in scoped_open
            if t.due_date and today < t.due_date <= week_out
        ),
        later=sum(1 for t in scoped_open if t.due_date and t.due_date > week_out),
        none_set=sum(1 for t in scoped_open if not t.due_date),
    )

    return DashboardOut(
        role=user.role.value,
        trend=trend,
        status_mix=[s for s in status_mix if s.value > 0],
        deadlines=deadlines,
        # Charting two points looks worse than saying there isn't enough yet.
        has_history=len(scoped_tasks) >= 4,
        stats=stats,
        my_tasks=rows(mine),
        checking=rows(checking),
        overdue=rows(overdue_list),
        awaiting_client=rows(awaiting_list),
        client_requests=rows(requests, 6),
        projects=project_rows[:10],
        activity=activity[:12],
    )
