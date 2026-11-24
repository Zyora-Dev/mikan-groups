"""Projects, tasks, attachments and comments.

Both the team and clients reach these routes. Every lookup goes through
`_scoped_project` / `_scoped_task`, which reject anything outside the
caller's organisation — a client can never read another client's work.
"""

from datetime import date, datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status,
)
from fastapi.responses import FileResponse
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.deps import CurrentUser, InternalUser
from app.models.attachment import Attachment
from app.models.comment import Comment
from app.models.membership import ProjectMember, ProjectRole
from app.models.organisation import Organisation
from app.models.project import Project, ProjectStatus
from app.models.task import ClientVerdict, Task, TaskStatus
from app.models.user import INTERNAL_ROLES, User
from app.models.audit import AuditAction
from app.services import notify, storage
from app.services.audit import record
from app.schemas.project import (
    ProjectCreate,
    ProjectMemberAdd,
    ProjectMemberOut,
    ProjectOut,
    ProjectUpdate,
)
from app.schemas.task import (
    AttachmentCreate,
    AttachmentOut,
    CommentCreate,
    CommentOut,
    TaskCreate,
    TaskOut,
    TaskUpdate,
    VerdictUpdate,
)

router = APIRouter(tags=["projects"])

# Statuses a client may set; anything else is the team's to decide.
CLIENT_VERDICTS = {ClientVerdict.APPROVED, ClientVerdict.CHANGES_REQUESTED}


def _scoped_project(session: Session, user: User, project_id: UUID) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    # Internal staff see every tenant; clients see only their own.
    if not user.is_internal and project.organisation_id != user.organisation_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def _scoped_task(session: Session, user: User, task_id: UUID) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    if not user.is_internal and task.organisation_id != user.organisation_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task


def _staff_names(session: Session) -> dict[UUID, str]:
    return {
        u.id: u.full_name
        for u in session.exec(select(User).where(User.role.in_(INTERNAL_ROLES))).all()  # type: ignore[attr-defined]
    }


def _check_staff(session: Session, user: User, *ids: UUID | None) -> None:
    """Assignee and checker must be active Mikan staff."""
    for uid in ids:
        if uid is None:
            continue
        staff = session.get(User, uid)
        if not staff or staff.role not in INTERNAL_ROLES or not staff.is_active:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Tasks can only be assigned to active Mikan staff",
            )


def _project_team(session: Session, project_id: UUID) -> tuple[int, list[str]]:
    rows = session.exec(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    ).all()
    if not rows:
        return 0, []
    names = {
        u.id: u.full_name
        for u in session.exec(
            select(User).where(User.id.in_([r.user_id for r in rows]))  # type: ignore[attr-defined]
        ).all()
    }
    # Leads first, then alphabetical — the list is read as "who owns this".
    ordered = sorted(
        rows,
        key=lambda r: (r.role is not ProjectRole.LEAD, names.get(r.user_id, "")),
    )
    return len(rows), [names.get(r.user_id, "Unknown") for r in ordered]


def _sync_lead_membership(session: Session, project: Project, *, actor_id: UUID) -> None:
    """Make the membership rows agree with `project.lead_engineer_id`.

    Demotes whoever held LEAD, then promotes the new lead — creating their
    row if they were not on the project at all. Demotion runs first, so
    promoting an existing member cannot immediately undo itself.
    """
    rows = session.exec(
        select(ProjectMember).where(ProjectMember.project_id == project.id)
    ).all()

    for row in rows:
        if row.role is ProjectRole.LEAD and row.user_id != project.lead_engineer_id:
            row.role = ProjectRole.ENGINEER
            session.add(row)

    if not project.lead_engineer_id:
        return

    existing = next(
        (r for r in rows if r.user_id == project.lead_engineer_id), None
    )
    if existing:
        existing.role = ProjectRole.LEAD
        session.add(existing)
    else:
        session.add(ProjectMember(
            project_id=project.id,
            user_id=project.lead_engineer_id,
            role=ProjectRole.LEAD,
            added_by_id=actor_id,
        ))


def _project_rollup(session: Session, project: Project) -> dict:
    tasks = session.exec(select(Task).where(Task.project_id == project.id)).all()
    count, names = _project_team(session, project.id)
    base = {"member_count": count, "member_names": names}
    total = len(tasks)
    if not total:
        return base | {"task_count": 0, "done_count": 0, "progress": 0,
                       "overdue_count": 0, "awaiting_client": 0}

    today = date.today()
    done = sum(1 for t in tasks if t.status is TaskStatus.DONE)
    overdue = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today and t.status is not TaskStatus.DONE
    )
    awaiting = sum(1 for t in tasks if t.verdict is ClientVerdict.AWAITING)
    return base | {
        "task_count": total,
        "done_count": done,
        "progress": round(sum(t.progress for t in tasks) / total),
        "overdue_count": overdue,
        "awaiting_client": awaiting,
    }


# ------------------------------------------------------------------ projects


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
    client_id: UUID | None = None,
    status_filter: Annotated[ProjectStatus | None, Query(alias="status")] = None,
) -> list[ProjectOut]:
    stmt = select(Project)

    if user.is_internal:
        if client_id:
            stmt = stmt.where(Project.organisation_id == client_id)
    else:
        # A client's own organisation, never a value from the query string.
        stmt = stmt.where(Project.organisation_id == user.organisation_id)

    if status_filter:
        stmt = stmt.where(Project.status == status_filter)

    projects = session.exec(stmt.order_by(Project.created_at.desc())).all()  # type: ignore[attr-defined]
    names = _staff_names(session)
    return [
        ProjectOut.model_validate(p).model_copy(
            update=_project_rollup(session, p)
            | {"lead_engineer_name": names.get(p.lead_engineer_id)
               if p.lead_engineer_id else None}
        )
        for p in projects
    ]


@router.post("/clients/{client_id}/projects", response_model=ProjectOut,
             status_code=status.HTTP_201_CREATED)
def create_project(
    client_id: UUID,
    body: ProjectCreate,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> ProjectOut:
    org = session.get(Organisation, client_id)
    if not org or org.is_internal:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    clash = session.exec(
        select(Project).where(
            Project.organisation_id == client_id,
            func.lower(Project.job_number) == body.job_number.strip().lower(),  # type: ignore[arg-type]
        )
    ).first()
    if clash:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Job number {body.job_number} is already used for this client",
        )

    _check_staff(session, user, body.lead_engineer_id)

    project = Project(
        organisation_id=client_id,
        created_by_id=user.id,
        **body.model_dump(exclude_unset=True) | {"job_number": body.job_number.strip()},
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    # The lead is a member too. Without this row they are named on the
    # project but absent from its team, and membership queries miss them.
    if project.lead_engineer_id:
        _sync_lead_membership(session, project, actor_id=user.id)
        session.commit()

    names = _staff_names(session)
    return ProjectOut.model_validate(project).model_copy(
        update=_project_rollup(session, project)
        | {"lead_engineer_name": names.get(project.lead_engineer_id)
           if project.lead_engineer_id else None}
    )


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> ProjectOut:
    project = _scoped_project(session, user, project_id)
    names = _staff_names(session)
    return ProjectOut.model_validate(project).model_copy(
        update=_project_rollup(session, project)
        | {"lead_engineer_name": names.get(project.lead_engineer_id)
           if project.lead_engineer_id else None}
    )


@router.patch("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> ProjectOut:
    project = _scoped_project(session, user, project_id)
    data = body.model_dump(exclude_unset=True)
    if "lead_engineer_id" in data:
        _check_staff(session, user, data["lead_engineer_id"])

    if data.get("status") is ProjectStatus.COMPLETED and not project.completed_on:
        data["completed_on"] = date.today()
    if data.get("status") and data["status"] is not ProjectStatus.COMPLETED:
        data["completed_on"] = None

    for field, value in data.items():
        setattr(project, field, value)
    project.updated_at = datetime.now(timezone.utc)

    session.add(project)
    session.commit()
    session.refresh(project)

    # Keep the membership table in step when the lead changes, so the project
    # team never disagrees with the lead named on the project.
    if "lead_engineer_id" in data:
        _sync_lead_membership(session, project, actor_id=user.id)
        session.commit()

    names = _staff_names(session)
    return ProjectOut.model_validate(project).model_copy(
        update=_project_rollup(session, project)
        | {"lead_engineer_name": names.get(project.lead_engineer_id)
           if project.lead_engineer_id else None}
    )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    project = _scoped_project(session, user, project_id)
    tasks = session.exec(select(Task).where(Task.project_id == project.id)).all()
    if tasks:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{project.title} has {len(tasks)} task(s). Cancel the project instead.",
        )

    # Membership rows reference the project, so they must go first or the
    # delete fails on the foreign key.
    for member in session.exec(
        select(ProjectMember).where(ProjectMember.project_id == project.id)
    ).all():
        session.delete(member)

    session.delete(project)
    session.commit()


# --------------------------------------------------------------------- tasks


def _task_counts(session: Session, task_ids: list[UUID]) -> tuple[dict, dict]:
    if not task_ids:
        return {}, {}
    comments = dict(session.exec(
        select(Comment.task_id, func.count(Comment.id))  # type: ignore[arg-type]
        .where(Comment.task_id.in_(task_ids))  # type: ignore[attr-defined]
        .group_by(Comment.task_id)
    ).all())
    files = dict(session.exec(
        select(Attachment.task_id, func.count(Attachment.id))  # type: ignore[arg-type]
        .where(Attachment.task_id.in_(task_ids))  # type: ignore[attr-defined]
        .group_by(Attachment.task_id)
    ).all())
    return comments, files


@router.get("/projects/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(
    project_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[TaskOut]:
    _scoped_project(session, user, project_id)
    tasks = session.exec(
        select(Task).where(Task.project_id == project_id).order_by(Task.created_at)  # type: ignore[arg-type]
    ).all()
    comments, files = _task_counts(session, [t.id for t in tasks])
    names = _staff_names(session)
    return [
        TaskOut.model_validate(t).model_copy(update={
            "comment_count": comments.get(t.id, 0),
            "attachment_count": files.get(t.id, 0),
            "assignee_name": names.get(t.assignee_id) if t.assignee_id else None,
            "checker_name": names.get(t.checker_id) if t.checker_id else None,
        })
        for t in tasks
    ]


@router.post("/projects/{project_id}/tasks", response_model=TaskOut,
             status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: UUID,
    body: TaskCreate,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> Task:
    project = _scoped_project(session, user, project_id)
    from_client = not user.is_internal
    if not from_client:
        _check_staff(session, user, body.assignee_id, body.checker_id)

    task = Task(
        project_id=project.id,
        organisation_id=project.organisation_id,
        created_by_id=user.id,
        raised_by_client=from_client,
        # A client raising work is a request until the team accepts it.
        status=TaskStatus.REQUESTED if from_client else TaskStatus.TODO,
        **body.model_dump(exclude_unset=True),
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    record(
        session, actor=user, action=AuditAction.CREATED,
        entity_type="task", entity_id=task.id, entity_label=task.title,
        organisation_id=task.organisation_id, project_id=project.id,
        detail="Raised by the client" if from_client else None,
    )
    if from_client:
        notify.task_requested(session, user, task, project)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: UUID,
    body: TaskUpdate,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> Task:
    task = _scoped_task(session, user, task_id)
    data = body.model_dump(exclude_unset=True)
    now = datetime.now(timezone.utc)
    if "assignee_id" in data or "checker_id" in data:
        _check_staff(session, user, data.get("assignee_id"), data.get("checker_id"))

    project = session.get(Project, task.project_id)
    previous_status = task.status
    previous_assignee = task.assignee_id

    new_status = data.get("status")
    if new_status is TaskStatus.SUBMITTED and task.status is not TaskStatus.SUBMITTED:
        data["submitted_at"] = now
        data["progress"] = 100
        task.verdict = ClientVerdict.AWAITING      # the client now owes a response
    if new_status is TaskStatus.DONE:
        data["completed_at"] = now
        data["progress"] = 100
    if new_status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS):
        data["completed_at"] = None

    for field, value in data.items():
        setattr(task, field, value)
    task.updated_at = now

    session.add(task)

    if new_status and new_status is not previous_status:
        record(
            session, actor=user, action=AuditAction.STATUS_CHANGED,
            entity_type="task", entity_id=task.id, entity_label=task.title,
            organisation_id=task.organisation_id, project_id=task.project_id,
            field="status", old_value=previous_status.value, new_value=new_status.value,
        )
        if new_status is TaskStatus.SUBMITTED and project:
            notify.task_submitted(session, user, task, project)

    if "assignee_id" in data and data["assignee_id"] != previous_assignee:
        assignee = session.get(User, data["assignee_id"]) if data["assignee_id"] else None
        record(
            session, actor=user, action=AuditAction.ASSIGNED,
            entity_type="task", entity_id=task.id, entity_label=task.title,
            organisation_id=task.organisation_id, project_id=task.project_id,
            field="assignee", new_value=assignee.full_name if assignee else "Unassigned",
        )
        if assignee and project:
            notify.task_assigned(session, user, task, project, assignee)

    session.commit()
    session.refresh(task)
    return task


@router.post("/tasks/{task_id}/verdict", response_model=TaskOut)
def set_verdict(
    task_id: UUID,
    body: VerdictUpdate,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> Task:
    """The client's call. Internal staff cannot approve their own work."""
    if user.is_internal:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Only the client can approve or request changes",
        )

    task = _scoped_task(session, user, task_id)

    if body.verdict not in CLIENT_VERDICTS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid verdict")
    if task.status is not TaskStatus.SUBMITTED:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This task has not been submitted for review yet",
        )

    now = datetime.now(timezone.utc)
    task.verdict = body.verdict

    if body.verdict is ClientVerdict.APPROVED:
        task.status = TaskStatus.DONE
        task.completed_at = now
    else:
        # Changes requested sends it back to the team.
        task.status = TaskStatus.IN_PROGRESS
        task.progress = min(task.progress, 90)

    task.updated_at = now
    session.add(task)

    if body.note:
        session.add(Comment(
            task_id=task.id,
            organisation_id=task.organisation_id,
            body=body.note,
            author_id=user.id,
            from_client=True,
            is_verdict_note=True,
        ))

    project = session.get(Project, task.project_id)
    approved = body.verdict is ClientVerdict.APPROVED
    record(
        session, actor=user,
        action=AuditAction.APPROVED if approved else AuditAction.CHANGES_REQUESTED,
        entity_type="task", entity_id=task.id, entity_label=task.title,
        organisation_id=task.organisation_id, project_id=task.project_id,
        field="verdict", new_value=body.verdict.value, detail=body.note,
    )
    if project:
        notify.verdict_given(session, user, task, project, approved, body.note)

    session.commit()
    session.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    task = _scoped_task(session, user, task_id)
    for model in (Comment, Attachment):
        for row in session.exec(select(model).where(model.task_id == task.id)).all():  # type: ignore[attr-defined]
            session.delete(row)
    session.delete(task)
    session.commit()


# --------------------------------------------------------- attachments


@router.get("/tasks/{task_id}/attachments", response_model=list[AttachmentOut])
def list_attachments(
    task_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[Attachment]:
    _scoped_task(session, user, task_id)
    return list(session.exec(
        select(Attachment).where(Attachment.task_id == task_id)
        .order_by(Attachment.created_at.desc())  # type: ignore[attr-defined]
    ).all())


@router.post("/tasks/{task_id}/attachments", response_model=AttachmentOut,
             status_code=status.HTTP_201_CREATED)
def add_attachment(
    task_id: UUID,
    body: AttachmentCreate,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> Attachment:
    task = _scoped_task(session, user, task_id)
    item = Attachment(
        task_id=task.id,
        organisation_id=task.organisation_id,
        uploaded_by_id=user.id,
        from_client=not user.is_internal,
        **body.model_dump(exclude_unset=True),
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.post("/tasks/{task_id}/files", response_model=AttachmentOut,
             status_code=status.HTTP_201_CREATED)
async def upload_file(
    task_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
    file: Annotated[UploadFile, File()],
    label: Annotated[str | None, Form()] = None,
    kind: Annotated[str, Form()] = "drawing",
    revision: Annotated[str | None, Form()] = None,
) -> Attachment:
    """Upload a file against a task. Stored on disk, not in the database."""
    task = _scoped_task(session, user, task_id)

    raw_name = file.filename or "file"
    suffix = ("." + raw_name.rsplit(".", 1)[-1].lower()) if "." in raw_name else ""
    if suffix not in storage.ALLOWED_SUFFIXES:
        allowed = ", ".join(sorted(s.lstrip(".") for s in storage.ALLOWED_SUFFIXES))
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"That file type isn't accepted. Allowed: {allowed}.",
        )

    data = await file.read()
    if len(data) > storage.MAX_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File is larger than {storage.MAX_BYTES // (1024 * 1024)}MB. "
            "Upload it to Mikan Cloud and paste the link instead.",
        )
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That file is empty")

    stored = storage.save(task.organisation_id, task.id, raw_name, data)

    item = Attachment(
        task_id=task.id,
        organisation_id=task.organisation_id,
        label=(label or raw_name).strip()[:250],
        stored_path=stored,
        filename=storage.safe_name(raw_name),
        size_bytes=len(data),
        content_type=file.content_type,
        kind=kind,  # type: ignore[arg-type]
        revision=revision,
        uploaded_by_id=user.id,
        from_client=not user.is_internal,
    )
    session.add(item)
    record(
        session, actor=user, action=AuditAction.FILE_ADDED,
        entity_type="task", entity_id=task.id, entity_label=task.title,
        organisation_id=task.organisation_id, project_id=task.project_id,
        field="file", new_value=item.label,
    )
    session.commit()
    session.refresh(item)
    return item


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> FileResponse:
    item = session.get(Attachment, attachment_id)
    if not item or not item.stored_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    # Clients may only download files on their own tasks.
    if not user.is_internal and item.organisation_id != user.organisation_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    path = storage.resolve(item.stored_path)
    if not path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File is no longer on disk")

    return FileResponse(
        path,
        filename=item.filename or "download",
        media_type=item.content_type or "application/octet-stream",
    )


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    item = session.get(Attachment, attachment_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Attachment not found")
    if not user.is_internal and item.organisation_id != user.organisation_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Attachment not found")
    # A client may only remove what they uploaded.
    if not user.is_internal and item.uploaded_by_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only remove your own files")
    if item.stored_path:
        storage.remove(item.stored_path)
    session.delete(item)
    session.commit()


# ------------------------------------------------------------- comments


@router.get("/tasks/{task_id}/comments", response_model=list[CommentOut])
def list_comments(
    task_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[CommentOut]:
    _scoped_task(session, user, task_id)
    rows = session.exec(
        select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)  # type: ignore[arg-type]
    ).all()

    names = {
        u.id: u.full_name
        for u in session.exec(
            select(User).where(User.id.in_([c.author_id for c in rows]))  # type: ignore[attr-defined]
        ).all()
    } if rows else {}

    return [
        CommentOut.model_validate(c).model_copy(
            update={"author_name": names.get(c.author_id, "Unknown")}
        )
        for c in rows
    ]


@router.post("/tasks/{task_id}/comments", response_model=CommentOut,
             status_code=status.HTTP_201_CREATED)
def add_comment(
    task_id: UUID,
    body: CommentCreate,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> CommentOut:
    task = _scoped_task(session, user, task_id)
    comment = Comment(
        task_id=task.id,
        organisation_id=task.organisation_id,
        body=body.body.strip(),
        author_id=user.id,
        from_client=not user.is_internal,
    )
    session.add(comment)

    project = session.get(Project, task.project_id)
    record(
        session, actor=user, action=AuditAction.COMMENTED,
        entity_type="task", entity_id=task.id, entity_label=task.title,
        organisation_id=task.organisation_id, project_id=task.project_id,
        detail=comment.body[:500],
    )
    if project:
        notify.comment_added(session, user, task, project, comment.body)

    session.commit()
    session.refresh(comment)
    return CommentOut.model_validate(comment).model_copy(
        update={"author_name": user.full_name}
    )


# --------------------------------------------------------- project team


@router.get("/projects/{project_id}/members", response_model=list[ProjectMemberOut])
def list_project_members(
    project_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[ProjectMemberOut]:
    _scoped_project(session, user, project_id)
    rows = session.exec(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    ).all()
    if not rows:
        return []

    staff = {
        u.id: u
        for u in session.exec(
            select(User).where(User.id.in_([r.user_id for r in rows]))  # type: ignore[attr-defined]
        ).all()
    }
    out = [
        ProjectMemberOut(
            id=r.id,
            project_id=r.project_id,
            user_id=r.user_id,
            full_name=staff[r.user_id].full_name if r.user_id in staff else "Unknown",
            job_title=staff[r.user_id].job_title if r.user_id in staff else None,
            account_role=staff[r.user_id].role.value if r.user_id in staff else "",
            role=r.role.value,
            note=r.note,
            created_at=r.created_at,
        )
        for r in rows
    ]
    out.sort(key=lambda m: (m.role != "lead", m.full_name))
    return out


@router.post("/projects/{project_id}/members", response_model=ProjectMemberOut,
             status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: UUID,
    body: ProjectMemberAdd,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> ProjectMemberOut:
    project = _scoped_project(session, user, project_id)

    staff = session.get(User, body.user_id)
    if not staff or staff.role not in INTERNAL_ROLES or not staff.is_active:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Only active Mikan staff can be added to a project",
        )

    already = session.exec(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == body.user_id,
        )
    ).first()
    if already:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"{staff.full_name} is already on this project"
        )

    try:
        role = ProjectRole(body.role)
    except ValueError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown project role"
        ) from None

    # One lead at a time. Demote any existing lead first — doing this after
    # adding the new row would immediately demote the row just created.
    if role is ProjectRole.LEAD:
        for other in session.exec(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.role == ProjectRole.LEAD,
            )
        ).all():
            other.role = ProjectRole.ENGINEER
            session.add(other)
        project.lead_engineer_id = body.user_id
        project.updated_at = datetime.now(timezone.utc)
        session.add(project)

    member = ProjectMember(
        project_id=project_id,
        user_id=body.user_id,
        role=role,
        note=body.note,
        added_by_id=user.id,
    )
    session.add(member)
    session.commit()
    session.refresh(member)

    return ProjectMemberOut(
        id=member.id,
        project_id=member.project_id,
        user_id=member.user_id,
        full_name=staff.full_name,
        job_title=staff.job_title,
        account_role=staff.role.value,
        role=member.role.value,
        note=member.note,
        created_at=member.created_at,
    )


@router.delete("/projects/{project_id}/members/{member_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: UUID,
    member_id: UUID,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    project = _scoped_project(session, user, project_id)
    member = session.get(ProjectMember, member_id)
    if not member or member.project_id != project_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not on this project")

    # Removing the lead clears the project's lead rather than leaving a
    # pointer at someone no longer on the team.
    if member.role is ProjectRole.LEAD and project.lead_engineer_id == member.user_id:
        project.lead_engineer_id = None
        project.updated_at = datetime.now(timezone.utc)
        session.add(project)

    session.delete(member)
    session.commit()
