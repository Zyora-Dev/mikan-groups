"""Create the Mikan organisation and a first admin.

    python seed.py admin@mikan-groups.com "Strong Password Here"
"""

import sys
from datetime import datetime, timezone

from sqlmodel import Session, SQLModel, select

from app.core.db import engine
from app.core.security import hash_password
from app.models.organisation import Organisation
from app.models.user import User, UserRole


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1

    email, password = sys.argv[1].lower(), sys.argv[2]
    if len(password) < 10:
        print("Password must be at least 10 characters.")
        return 1

    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        org = session.exec(
            select(Organisation).where(Organisation.is_internal == True)  # noqa: E712
        ).first()
        if not org:
            org = Organisation(
                name="Mikan Engineering & Construction",
                slug="mikan",
                is_internal=True,
                country="India",
            )
            session.add(org)
            session.commit()
            session.refresh(org)
            print(f"Created organisation: {org.name}")

        if session.exec(select(User).where(User.email == email)).first():
            print(f"User {email} already exists.")
            return 1

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name="Mikan Administrator",
            role=UserRole.ADMIN,
            organisation_id=org.id,
            must_change_password=False,
            created_at=datetime.now(timezone.utc),
        )
        session.add(user)
        session.commit()
        print(f"Created admin: {email}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
