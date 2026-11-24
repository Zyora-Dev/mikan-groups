"""Client portal.

Everything here is scoped to the signed-in user's own organisation, taken
from the session rather than the request, so one client can never read
another's work. Mikan staff are refused outright — they have the ERP.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import CurrentUser
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.organisation import Organisation
from app.models.project import Project, ProjectStatus
from app.models.task import ClientVerdict, Task, TaskStatus
from app.models.user import User
from app.schemas.dashboard import (
    ActivityRow,
    DeadlineBand,
    PortalFile,
    PortalOut,
    PortalStats,
    ProjectRow,
    Slice,
    TaskRow,
    TrendPoint,
)

router = APIRouter(prefix="/portal", tags=["portal"])

OPEN_STATUSES = {
    TaskStatus.REQUESTED, TaskStatus.TODO,
    TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.SUBMITTED,
}

# What the client is shown as "being worked on". `requested` is excluded —
# that sits under their own requests until Mikan accepts it.
WORKING_STATUSES = {TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW}


def client_user(user: CurrentUser) -> User:
    """Portal routes are for client accounts only."""
    if user.is_internal:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Staff accounts use the internal application.",
        )
    return user


ClientUserDep = Annotated[User, Depends(client_user)]


@router.get("/dashboard", response_model=PortalOut)
def portal_dashboard(
    user: ClientUserDep,
    session: Annotated[Session, Depends(get_session)],
) -> PortalOut:
    org_id = user.organisation_id          # from the session, never the request
    today = date.today()
    week_out = today + timedelta(days=7)

    org = session.get(Organisation, org_id)
    if not org or not org.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Organisation is not active")

    projects = {
        p.id: p
        for p in session.exec(
            select(Project).where(Project.organisation_id == org_id)
        ).all()
    }
    tasks = list(
        session.exec(select(Task).where(Task.organisation_id == org_id)).all()
    )
    names = {org_id: org.name}

    def row(t: Task) -> TaskRow:
        p = projects.get(t.project_id)
        return TaskRow(
            id=t.id, title=t.title, status=t.status, verdict=t.verdict,
            priority=t.priority, progress=t.progress, due_date=t.due_date,
            project_id=t.project_id,
            project_title=p.title if p else "",
            job_number=p.job_number if p else "",
            client_id=org_id, client_name=org.name,
            raised_by_client=t.raised_by_client,
        )

    def rows(items: list[Task], limit: int = 8) -> list[TaskRow]:
        ordered = sorted(items, key=lambda t: (t.due_date or date.max, t.created_at))
        return [row(t) for t in ordered[:limit]]

    open_tasks = [t for t in tasks if t.status in OPEN_STATUSES]
    awaiting = [
        t for t in tasks
        if t.status is TaskStatus.SUBMITTED and t.verdict is ClientVerdict.AWAITING
    ]
    changes = [t for t in tasks if t.verdict is ClientVerdict.CHANGES_REQUESTED]
    requests = [
        t for t in tasks
        if t.raised_by_client and t.status is TaskStatus.REQUESTED
    ]
    working = [t for t in tasks if t.status in WORKING_STATUSES]

    attachments = list(
        session.exec(
            select(Attachment).where(Attachment.organisation_id == org_id)
        ).all()
    )

    stats = PortalStats(
        projects_active=sum(
            1 for p in projects.values() if p.status is ProjectStatus.ACTIVE
        ),
        projects_total=len(projects),
        tasks_open=len(open_tasks),
        tasks_done=sum(1 for t in tasks if t.status is TaskStatus.DONE),
        awaiting_you=len(awaiting),
        changes_requested=len(changes),
        requests_pending=len(requests),
        overdue=sum(1 for t in open_tasks if t.due_date and t.due_date < today),
        due_this_week=sum(
            1 for t in open_tasks if t.due_date and today <= t.due_date <= week_out
        ),
        files_shared=sum(1 for a in attachments if not a.from_client),
    )

    # ---- projects ----
    project_rows: list[ProjectRow] = []
    for p in sorted(projects.values(), key=lambda x: (x.target_date or date.max)):
        pt = [t for t in tasks if t.project_id == p.id]
        project_rows.append(ProjectRow(
            id=p.id, job_number=p.job_number, title=p.title,
            status=p.status, target_date=p.target_date,
            client_id=org_id, client_name=org.name,
            task_count=len(pt),
            done_count=sum(1 for t in pt if t.status is TaskStatus.DONE),
            progress=round(sum(t.progress for t in pt) / len(pt)) if pt else 0,
            overdue_count=sum(
                1 for t in pt
                if t.due_date and t.due_date < today and t.status is not TaskStatus.DONE
            ),
        ))

    # ---- files ----
    task_by_id = {t.id: t for t in tasks}
    recent_files: list[PortalFile] = []
    for a in sorted(attachments, key=lambda x: x.created_at, reverse=True)[:10]:
        t = task_by_id.get(a.task_id)
        p = projects.get(t.project_id) if t else None
        recent_files.append(PortalFile(
            id=a.id, label=a.label, filename=a.filename, url=a.url,
            has_file=bool(a.stored_path), kind=a.kind.value,
            revision=a.revision, size_bytes=a.size_bytes,
            from_client=a.from_client,
            task_id=a.task_id, task_title=t.title if t else "",
            project_id=t.project_id if t else UUID(int=0),
            project_title=p.title if p else "",
            job_number=p.job_number if p else "",
            created_at=a.created_at,
        ))

    # ---- activity ----
    authors = {u.id: u.full_name for u in session.exec(select(User)).all()}
    our_task_ids = set(task_by_id)
    activity: list[ActivityRow] = []

    for c in session.exec(
        select(Comment).order_by(Comment.created_at.desc()).limit(60)  # type: ignore[attr-defined]
    ).all():
        if c.task_id not in our_task_ids:
            continue
        t = task_by_id[c.task_id]
        activity.append(ActivityRow(
            kind="verdict" if c.is_verdict_note else "comment",
            task_id=t.id, task_title=t.title, client_name=org.name,
            actor=authors.get(c.author_id, "Unknown"),
            from_client=c.from_client, summary=c.body[:140], at=c.created_at,
        ))

    for a in sorted(attachments, key=lambda x: x.created_at, reverse=True)[:15]:
        t = task_by_id.get(a.task_id)
        if not t:
            continue
        activity.append(ActivityRow(
            kind="attachment", task_id=t.id, task_title=t.title,
            client_name=org.name,
            actor=authors.get(a.uploaded_by_id, "Unknown") if a.uploaded_by_id else "Unknown",
            from_client=a.from_client, summary=a.label, at=a.created_at,
        ))

    activity.sort(key=lambda x: x.at, reverse=True)

    # ---- charts ----
    monday = today - timedelta(days=today.weekday())
    trend = [
        TrendPoint(
            label=(monday - timedelta(weeks=back)).strftime("%-d %b"),
            created=sum(
                1 for t in tasks
                if (monday - timedelta(weeks=back))
                <= t.created_at.date()
                < (monday - timedelta(weeks=back - 1))
            ),
            completed=sum(
                1 for t in tasks
                if t.completed_at
                and (monday - timedelta(weeks=back))
                <= t.completed_at.date()
                < (monday - timedelta(weeks=back - 1))
            ),
        )
        for back in range(7, -1, -1)
    ]

    status_mix = [
        Slice(key=st.value, label=st.value.replace("_", " ").title(),
              value=sum(1 for t in tasks if t.status is st))
        for st in TaskStatus
    ]

    deadlines = DeadlineBand(
        overdue=sum(1 for t in open_tasks if t.due_date and t.due_date < today),
        today=sum(1 for t in open_tasks if t.due_date == today),
        this_week=sum(
            1 for t in open_tasks if t.due_date and today < t.due_date <= week_out
        ),
        later=sum(1 for t in open_tasks if t.due_date and t.due_date > week_out),
        none_set=sum(1 for t in open_tasks if not t.due_date),
    )

    return PortalOut(
        organisation=org.name,
        user_name=user.full_name,
        role=user.role.value,
        stats=stats,
        awaiting_you=rows(awaiting),
        in_progress=rows(working),
        changes_requested=rows(changes),
        my_requests=rows(requests, 6),
        projects=project_rows,
        recent_files=recent_files,
        activity=activity[:12],
        trend=trend,
        status_mix=[s for s in status_mix if s.value > 0],
        deadlines=deadlines,
        has_history=len(tasks) >= 4,
    )


@router.get("/files", response_model=list[PortalFile])
def portal_files(
    user: ClientUserDep,
    session: Annotated[Session, Depends(get_session)],
    project_id: UUID | None = None,
) -> list[PortalFile]:
    """Every file across the client's projects, newest first."""
    org_id = user.organisation_id

    projects = {
        p.id: p
        for p in session.exec(
            select(Project).where(Project.organisation_id == org_id)
        ).all()
    }
    if project_id is not None and project_id not in projects:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    tasks = {
        t.id: t
        for t in session.exec(select(Task).where(Task.organisation_id == org_id)).all()
    }
    rows = session.exec(
        select(Attachment)
        .where(Attachment.organisation_id == org_id)
        .order_by(Attachment.created_at.desc())  # type: ignore[attr-defined]
    ).all()

    out: list[PortalFile] = []
    for a in rows:
        t = tasks.get(a.task_id)
        if not t:
            continue
        if project_id is not None and t.project_id != project_id:
            continue
        p = projects.get(t.project_id)
        out.append(PortalFile(
            id=a.id, label=a.label, filename=a.filename, url=a.url,
            has_file=bool(a.stored_path), kind=a.kind.value,
            revision=a.revision, size_bytes=a.size_bytes,
            from_client=a.from_client,
            task_id=a.task_id, task_title=t.title,
            project_id=t.project_id,
            project_title=p.title if p else "",
            job_number=p.job_number if p else "",
            created_at=a.created_at,
        ))
    return out
