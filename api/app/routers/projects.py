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
from app.models.organisation import Organisation
from app.models.project import Project, ProjectStatus
from app.models.task import ClientVerdict, Task, TaskStatus
from app.models.user import User
from app.services import storage
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
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


def _project_rollup(session: Session, project: Project) -> dict:
    tasks = session.exec(select(Task).where(Task.project_id == project.id)).all()
    total = len(tasks)
    if not total:
        return {"task_count": 0, "done_count": 0, "progress": 0,
                "overdue_count": 0, "awaiting_client": 0}

    today = date.today()
    done = sum(1 for t in tasks if t.status is TaskStatus.DONE)
    overdue = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today and t.status is not TaskStatus.DONE
    )
    awaiting = sum(1 for t in tasks if t.verdict is ClientVerdict.AWAITING)
    return {
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
    return [
        ProjectOut.model_validate(p).model_copy(update=_project_rollup(session, p))
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

    project = Project(
        organisation_id=client_id,
        created_by_id=user.id,
        **body.model_dump(exclude_unset=True) | {"job_number": body.job_number.strip()},
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectOut.model_validate(project).model_copy(
        update=_project_rollup(session, project)
    )


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> ProjectOut:
    project = _scoped_project(session, user, project_id)
    return ProjectOut.model_validate(project).model_copy(
        update=_project_rollup(session, project)
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
    return ProjectOut.model_validate(project).model_copy(
        update=_project_rollup(session, project)
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
    return [
        TaskOut.model_validate(t).model_copy(update={
            "comment_count": comments.get(t.id, 0),
            "attachment_count": files.get(t.id, 0),
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
    session.commit()
    session.refresh(comment)
    return CommentOut.model_validate(comment).model_copy(
        update={"author_name": user.full_name}
    )
