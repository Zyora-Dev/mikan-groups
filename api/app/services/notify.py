"""Notifications.

One event produces an in-app row for each recipient, and an email where
the settings allow it. Email failure is recorded on the row and never
propagates — a notification that cannot be emailed is still a
notification.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.membership import ProjectMember
from app.models.organisation import Organisation
from app.models.project import Project
from app.models.settings import EmailSettings, Notification
from app.models.task import Task
from app.models.user import INTERNAL_ROLES, User
from app.services import email as email_service

WEB_BASE = "http://localhost:5188"


def _config(session: Session) -> EmailSettings:
    return email_service.get_settings_row(session)


def _project_team(session: Session, project_id: UUID) -> list[User]:
    rows = session.exec(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    ).all()
    if not rows:
        return []
    return list(session.exec(
        select(User).where(
            User.id.in_([r.user_id for r in rows]),  # type: ignore[attr-defined]
            User.is_active == True,  # noqa: E712
        )
    ).all())


def _client_users(session: Session, organisation_id: UUID) -> list[User]:
    return list(session.exec(
        select(User).where(
            User.organisation_id == organisation_id,
            User.role.notin_(INTERNAL_ROLES),  # type: ignore[attr-defined]
            User.is_active == True,  # noqa: E712
        )
    ).all())


def _admins(session: Session) -> list[User]:
    internal = session.exec(
        select(Organisation).where(Organisation.is_internal == True)  # noqa: E712
    ).first()
    if not internal:
        return []
    return list(session.exec(
        select(User).where(
            User.organisation_id == internal.id,
            User.role.in_(INTERNAL_ROLES),  # type: ignore[attr-defined]
            User.is_active == True,  # noqa: E712
        )
    ).all())


def dispatch(
    session: Session,
    *,
    recipients: list[User],
    actor: User,
    title: str,
    body: str,
    entity_type: str,
    entity_id: UUID | None = None,
    project_id: UUID | None = None,
    link: str | None = None,
    client_link: str | None = None,
    send_email: bool = True,
) -> None:
    """Create a notification per recipient, emailing where configured.

    The link is resolved per recipient: a client is never handed an
    internal route they cannot open, whatever the calling event passes.
    """
    config = _config(session) if send_email else None

    for person in recipients:
        if person.id == actor.id:
            continue  # nobody needs telling what they just did

        target = link if person.is_internal else (client_link or "/portal/overview")

        note = Notification(
            user_id=person.id,
            organisation_id=person.organisation_id,
            title=title,
            body=body,
            entity_type=entity_type,
            entity_id=entity_id,
            project_id=project_id,
            link=target,
        )

        if config and config.enabled and person.email:
            result = email_service.send(
                config,
                to_email=person.email,
                to_name=person.full_name,
                subject=title,
                html=email_service.render(
                    title, body, f"{WEB_BASE}{target}" if target else None
                ),
            )
            if result.ok:
                note.emailed_at = datetime.now(timezone.utc)
            else:
                note.email_error = (result.error or "Unknown error")[:300]

        session.add(note)


# ----------------------------------------------------------------- events


def task_submitted(session: Session, actor: User, task: Task, project: Project) -> None:
    config = _config(session)
    if not config.notify_on_submit:
        return
    client = session.get(Organisation, task.organisation_id)
    dispatch(
        session,
        recipients=_client_users(session, task.organisation_id),
        actor=actor,
        title=f"Ready for your review: {task.title}",
        body=(
            f"{actor.full_name} has submitted work on "
            f"{project.job_number} — {project.title}"
            f"{f' for {client.name}' if client else ''}. "
            "Approve it, or tell the team what needs to change."
        ),
        entity_type="task",
        entity_id=task.id,
        project_id=project.id,
        link=f"/internal/erp/team/clients/{task.organisation_id}?project={project.id}",
        client_link=f"/portal/projects/{project.id}",
    )


def verdict_given(
    session: Session, actor: User, task: Task, project: Project, approved: bool,
    note: str | None,
) -> None:
    config = _config(session)
    if not config.notify_on_verdict:
        return
    team = _project_team(session, project.id) or _admins(session)
    dispatch(
        session,
        recipients=team,
        actor=actor,
        title=(
            f"Approved: {task.title}" if approved
            else f"Changes requested: {task.title}"
        ),
        body=(
            f"{actor.full_name} "
            + ("approved this work" if approved else "has asked for changes")
            + f" on {project.job_number} — {project.title}."
            + (f' They wrote: "{note[:200]}"' if note else "")
        ),
        entity_type="task",
        entity_id=task.id,
        project_id=project.id,
        link=f"/internal/erp/team/clients/{task.organisation_id}?project={project.id}",
        client_link=f"/portal/projects/{project.id}",
    )


def comment_added(
    session: Session, actor: User, task: Task, project: Project, body: str,
) -> None:
    config = _config(session)
    if not config.notify_on_comment:
        return

    # A client comment reaches the team; a team comment reaches the client.
    recipients = (
        _project_team(session, project.id) or _admins(session)
        if not actor.is_internal
        else _client_users(session, task.organisation_id)
    )
    dispatch(
        session,
        recipients=recipients,
        actor=actor,
        title=f"New comment on {task.title}",
        body=f"{actor.full_name} wrote: \"{body[:220]}\"",
        entity_type="task",
        entity_id=task.id,
        project_id=project.id,
        link=f"/internal/erp/team/clients/{task.organisation_id}?project={project.id}",
        client_link=f"/portal/projects/{project.id}",
    )


def task_assigned(
    session: Session, actor: User, task: Task, project: Project, assignee: User,
) -> None:
    config = _config(session)
    if not config.notify_on_assignment:
        return
    dispatch(
        session,
        recipients=[assignee],
        actor=actor,
        title=f"Assigned to you: {task.title}",
        body=(
            f"{actor.full_name} assigned you this task on "
            f"{project.job_number} — {project.title}."
            + (f" It's due {task.due_date}." if task.due_date else "")
        ),
        entity_type="task",
        entity_id=task.id,
        project_id=project.id,
        link=f"/internal/erp/team/clients/{task.organisation_id}?project={project.id}",
        client_link=f"/portal/projects/{project.id}",
    )


def task_requested(session: Session, actor: User, task: Task, project: Project) -> None:
    """A client raised work — the team needs to accept or schedule it."""
    client = session.get(Organisation, task.organisation_id)
    dispatch(
        session,
        recipients=_project_team(session, project.id) or _admins(session),
        actor=actor,
        title=f"New request: {task.title}",
        body=(
            f"{actor.full_name}"
            f"{f' at {client.name}' if client else ''} has requested work on "
            f"{project.job_number} — {project.title}."
        ),
        entity_type="task",
        entity_id=task.id,
        project_id=project.id,
        link=f"/internal/erp/team/clients/{task.organisation_id}?project={project.id}",
        client_link=f"/portal/projects/{project.id}",
    )
